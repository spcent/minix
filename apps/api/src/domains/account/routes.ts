import type {
  AccountOperationResponse,
  AuthCredentialProtection,
  AuthRateLimitState,
  AuthVerificationPurpose,
  ListUserAssetHistoryRequest,
  LoginPlatformKind,
  UserAssetHistoryResponse,
  UserRelationListResponse,
  UserRelationMutationResponse,
} from "@minix/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";

import { createUnauthorizedResponse, resolveBearerToken } from "../../http/auth";
import { parseJsonBody, parseQuery } from "../../http/parsing";
import { jsonError } from "../../http/response";
import type {
  ApiBindings,
  ApiStore,
  AuthOAuthCredentialRecord,
  AuthSecurityState,
  SessionRecord,
  UserState,
} from "../../types";
import {
  ACCOUNT_CANCELLATION_COOLING_OFF_MS,
  ACCOUNT_OPERATION_COOLDOWN_MS,
  appendAccountOperationRecord,
  clearAccountOperationCooldown,
  hasFallbackCredential,
  resolveAccountSecurityPhoneNumber,
  setAccountOperationCooldown,
} from "./operations";
import {
  applyAccountAvatarBinding,
  createAccountOperationResponse,
  createCurrentUserResponse,
  listUserAssetHistory,
} from "./current-user";
import { applyAccountProfileUpdate } from "./profile";
import { applyRelationAction, listUserRelations } from "./relations";
import {
  accountCancellationSchema,
  accountProviderRevokeSchema,
  accountUnbindSchema,
  assetHistoryQuerySchema,
  changeAccountPhoneSchema,
  relationActionSchema,
  relationListQuerySchema,
  updateAccountProfileSchema,
} from "./schemas";

export interface RegisterAccountRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  resolveClientId: (request: Request) => string;
  resolveRequestDeviceId: (c: Context<any>) => string | undefined;
  guardSecurityRateLimit: (input: {
    c: Context<any>;
    store: ApiStore;
    userId: string;
    userState: UserState;
    action: "account";
    scope: "account";
    platform: LoginPlatformKind;
    clientId: string;
    deviceId?: string;
    actorUserId: string;
    traceId: string;
  }) => Promise<
    | {
        allowed: true;
        clientId: string;
        nowIso: string;
        rateLimitState: AuthRateLimitState;
      }
    | {
        allowed: false;
        clientId: string;
        nowIso: string;
        rateLimitState: AuthRateLimitState;
        response: Response;
      }
  >;
  appendSecurityAuditEvent: (input: {
    userState: UserState;
    scope: "auth" | "account" | "payment" | "upload" | "feedback" | "messages" | "share";
    action: string;
    result: "allowed" | "blocked" | "review";
    message: string;
    createdAt: string;
    actorUserId?: string;
    deviceId?: string;
    clientId?: string;
    platform?: LoginPlatformKind;
    traceId?: string;
  }) => void;
  createOperationBlockedResponse: (input: {
    userState: UserState;
    kind:
      | "change_phone"
      | "unbind_wechat"
      | "unlink_provider"
      | "revoke_provider"
      | "request_cancellation"
      | "revoke_cancellation";
    actorLabel: string;
    message: string;
    session: SessionRecord;
    requestUrl: string;
    traceId: string;
    clientId?: string;
    deviceId?: string;
  }) => AccountOperationResponse;
  consumePhoneVerification: (input: {
    userState: UserState;
    phoneNumber: string;
    purpose: AuthVerificationPurpose;
    verificationCode: string;
    now: number;
  }) => Promise<
    | { ok: true }
    | {
        ok: false;
        status: number;
        message: string;
        protection?: AuthCredentialProtection;
      }
  >;
  createUserIdFromCredential: (input: {
    method: "phone_code" | "password" | "guest";
    phoneNumber?: string;
    anonymousId?: string;
    account?: string;
  }) => string;
  createOAuthProviderLabel: (provider: string) => string;
  createOAuthCredentialRecord: (input: {
    provider: string;
    providerUserId: string;
    userId: string;
    tokenHash: string;
    now: number;
    authorizationStatus?: "active" | "revoked" | "unlinked";
    revocationReason?: string;
    existing?: AuthOAuthCredentialRecord;
  }) => AuthOAuthCredentialRecord;
  ensureAuthSecurityState: (userState: UserState) => AuthSecurityState;
  loadOAuthCredentialLink: (
    store: ApiStore,
    provider: string,
    providerUserId: string,
  ) => Promise<{
    subject: string;
    indexUserId: string;
    indexState: UserState;
    record?: AuthOAuthCredentialRecord;
  }>;
  scheduleOperationalJobForUser: (
    store: ApiStore,
    input: {
      userId: string;
      userState: UserState;
      kind: "cancellation_expiry";
      dedupeKey: string;
      relatedRecordId?: string;
      scheduledAt: string;
      maxAttempts: number;
    },
  ) => Promise<unknown>;
}

export function registerAccountRoutes(options: RegisterAccountRoutesOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    resolveClientId,
    resolveRequestDeviceId,
    guardSecurityRateLimit,
    appendSecurityAuditEvent,
    createOperationBlockedResponse,
    consumePhoneVerification,
    createUserIdFromCredential,
    createOAuthProviderLabel,
    createOAuthCredentialRecord,
    ensureAuthSecurityState,
    loadOAuthCredentialLink,
    scheduleOperationalJobForUser,
  } = options;

  app.use("/account", requireSession);
  app.use("/account/*", requireSession);

  app.get("/me", async (c) => {
    const store = resolveStore(c.env);
    const token = resolveBearerToken(c.req.header("authorization"));
    if (!token) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    const session = await store.getSessionByAccessToken(token);
    if (!session) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    const userState = await store.getUserState(session.userId);
    return c.json(createCurrentUserResponse(session, userState, c.req.url));
  });

  app.post("/account/profile", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, updateAccountProfileSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "edit_profile");
    if (!operation?.available) {
      return jsonError(
        "FORBIDDEN",
        operation?.blockedReason ?? "Profile editing is unavailable.",
        409,
        traceId,
      );
    }

    applyAccountProfileUpdate(userState, payload);
    applyAccountAvatarBinding(session, userState, payload.avatarAssetId);
    await store.saveUserState(session.userId, userState);
    return c.json(
      createAccountOperationResponse(session, userState, c.req.url, "Profile updated."),
    );
  });

  app.post("/account/change-phone", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, changeAccountPhoneSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      actorUserId: session.userId,
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "change_phone");
    if (!operation?.available) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "change_phone",
        actorLabel: "MiniX Account Center",
        message: operation?.blockedReason ?? "Phone binding changes are unavailable.",
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (operation.riskPrompt && !payload.riskConfirmed) {
      return jsonError(
        "INVALID_ARGUMENT",
        "Phone change requires explicit risk confirmation.",
        400,
        traceId,
      );
    }

    const currentSecurityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (operation.verificationRequired) {
      if (!currentSecurityPhone) {
        return jsonError(
          "FORBIDDEN",
          "Phone change requires an existing verified phone security credential.",
          409,
          traceId,
        );
      }
      if (!payload.securityVerificationCode) {
        return jsonError(
          "INVALID_ARGUMENT",
          "Phone change requires the current phone security verification code.",
          400,
          traceId,
        );
      }
      const verifiedCurrentCredential = await consumePhoneVerification({
        userState,
        phoneNumber: currentSecurityPhone,
        purpose: "account_security",
        verificationCode: payload.securityVerificationCode,
        now: Date.now(),
      });
      if (!verifiedCurrentCredential.ok) {
        await store.saveUserState(session.userId, userState);
        c.status(verifiedCurrentCredential.status as 400 | 423);
        return c.json({
          code: "INVALID_ARGUMENT",
          message: verifiedCurrentCredential.message,
          credentialProtection: verifiedCurrentCredential.protection,
        });
      }
    }

    const targetUserId = createUserIdFromCredential({
      method: "phone_code",
      phoneNumber: payload.phoneNumber,
    });
    const targetState = await store.getUserState(targetUserId);
    const verified = await consumePhoneVerification({
      userState: targetState,
      phoneNumber: payload.phoneNumber,
      purpose: "change_phone",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    await store.saveUserState(targetUserId, targetState);
    if (!verified.ok) {
      await store.saveUserState(session.userId, userState);
      c.status(verified.status as 400 | 423);
      return c.json({
        code: "INVALID_ARGUMENT",
        message: verified.message,
        credentialProtection: verified.protection,
      });
    }

    userState.boundPhoneNumber = payload.phoneNumber;
    setAccountOperationCooldown(userState, {
      kind: "change_phone",
      label:
        "Phone changes are temporarily locked while the new credential propagates.",
      durationMs: ACCOUNT_OPERATION_COOLDOWN_MS,
    });
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "change_phone",
      status: "completed",
      actorLabel: "MiniX Account Center",
      message: `Bound phone updated to ${payload.phoneNumber.replace(/[^\d]/g, "").slice(0, 3)}****${payload.phoneNumber.replace(/[^\d]/g, "").slice(-4)}.`,
      verificationPurpose: currentSecurityPhone ? "account_security" : "change_phone",
      notificationHookLabel: "notify:phone_changed",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "change_phone",
      result: "allowed",
      message: "Bound phone updated after security verification.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(
      createAccountOperationResponse(
        session,
        userState,
        c.req.url,
        "Phone binding updated.",
        operationRecord,
      ),
    );
  });

  app.post("/account/unbind", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, accountUnbindSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      actorUserId: session.userId,
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "unbind_wechat");
    if (!operation?.available) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "unbind_wechat",
        actorLabel: "MiniX Account Center",
        message: operation?.blockedReason ?? "WeChat unbinding is unavailable.",
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (!payload.riskConfirmed) {
      return jsonError(
        "INVALID_ARGUMENT",
        "WeChat unbinding requires explicit risk confirmation.",
        400,
        traceId,
      );
    }

    if (payload.provider !== "wechat") {
      return jsonError(
        "INVALID_ARGUMENT",
        "Non-WeChat providers must use the provider unlink route.",
        400,
        traceId,
      );
    }

    const securityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (!securityPhone) {
      return jsonError(
        "FORBIDDEN",
        "WeChat unbinding requires a verified phone security credential.",
        409,
        traceId,
      );
    }
    if (!payload.verificationCode) {
      return jsonError(
        "INVALID_ARGUMENT",
        "WeChat unbinding requires a security verification code.",
        400,
        traceId,
      );
    }
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: securityPhone,
      purpose: "account_security",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(session.userId, userState);
      c.status(verified.status as 400 | 423);
      return c.json({
        code: "INVALID_ARGUMENT",
        message: verified.message,
        credentialProtection: verified.protection,
      });
    }

    userState.wechatBoundOverride = false;
    setAccountOperationCooldown(userState, {
      kind: "unbind_wechat",
      label:
        "WeChat binding changes are temporarily locked while device sign-in state settles.",
      durationMs: ACCOUNT_OPERATION_COOLDOWN_MS,
    });
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "unbind_wechat",
      status: "completed",
      actorLabel: "MiniX Account Center",
      message: "WeChat binding removed after fallback credential verification.",
      verificationPurpose: "account_security",
      notificationHookLabel: "notify:wechat_unbound",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "unbind_wechat",
      result: "allowed",
      message: "WeChat binding removed after fallback credential verification.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(
      createAccountOperationResponse(
        session,
        userState,
        c.req.url,
        "WeChat binding removed.",
        operationRecord,
      ),
    );
  });

  app.post("/account/provider/unlink", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, accountUnbindSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      actorUserId: session.userId,
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }

    if (payload.provider === "wechat") {
      return jsonError(
        "INVALID_ARGUMENT",
        "Native WeChat binding must use /account/unbind.",
        400,
        traceId,
      );
    }
    if (!payload.providerUserId) {
      return jsonError(
        "INVALID_ARGUMENT",
        "Provider unlink requires providerUserId.",
        400,
        traceId,
      );
    }

    const linked = await loadOAuthCredentialLink(store, payload.provider, payload.providerUserId);
    if (
      !linked.record ||
      linked.record.userId !== session.userId ||
      linked.record.authorizationStatus === "unlinked"
    ) {
      return jsonError(
        "NOT_FOUND",
        "Provider identity is not linked to the current account.",
        404,
        traceId,
      );
    }

    const providerLabel = createOAuthProviderLabel(payload.provider);
    const canUnlink = hasFallbackCredential(session, userState, {
      excludingProvider: {
        provider: payload.provider,
        providerUserId: payload.providerUserId,
      },
    });
    if (!canUnlink) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "unlink_provider",
        actorLabel: "MiniX Account Center",
        message: `${providerLabel} cannot be unlinked because it is the last usable login method.`,
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (!payload.riskConfirmed) {
      return jsonError(
        "INVALID_ARGUMENT",
        `${providerLabel} unlink requires explicit risk confirmation.`,
        400,
        traceId,
      );
    }
    const securityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (!securityPhone) {
      return jsonError(
        "FORBIDDEN",
        `${providerLabel} unlink requires a verified phone security credential.`,
        409,
        traceId,
      );
    }
    if (!payload.verificationCode) {
      return jsonError(
        "INVALID_ARGUMENT",
        `${providerLabel} unlink requires a security verification code.`,
        400,
        traceId,
      );
    }
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: securityPhone,
      purpose: "account_security",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(session.userId, userState);
      c.status(verified.status as 400 | 423);
      return c.json({
        code: "INVALID_ARGUMENT",
        message: verified.message,
        credentialProtection: verified.protection,
      });
    }

    const nextRecord = createOAuthCredentialRecord({
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      userId: session.userId,
      tokenHash: linked.record.tokenHash,
      now: Date.now(),
      authorizationStatus: "unlinked",
      revocationReason: "user_unlinked",
      existing: linked.record,
    });
    ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[linked.subject] =
      nextRecord;
    ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] =
      nextRecord;
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "unlink_provider",
      status: "completed",
      actorLabel: "MiniX Account Center",
      message: `${providerLabel} was unlinked after fallback credential verification.`,
      verificationPurpose: "account_security",
      notificationHookLabel: "notify:provider_unlinked",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "unlink_provider",
      result: "allowed",
      message: `${providerLabel} was unlinked from the current account.`,
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    await store.saveUserState(linked.indexUserId, linked.indexState);
    return c.json(
      createAccountOperationResponse(
        session,
        userState,
        c.req.url,
        `${providerLabel} unlinked.`,
        operationRecord,
      ),
    );
  });

  app.post("/account/provider/revoke", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, accountProviderRevokeSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      actorUserId: session.userId,
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }

    const linked = await loadOAuthCredentialLink(store, payload.provider, payload.providerUserId);
    if (
      !linked.record ||
      linked.record.userId !== session.userId ||
      linked.record.authorizationStatus === "unlinked"
    ) {
      return jsonError(
        "NOT_FOUND",
        "Provider identity is not linked to the current account.",
        404,
        traceId,
      );
    }

    const providerLabel = createOAuthProviderLabel(payload.provider);
    const active = (linked.record.authorizationStatus ?? "active") === "active";
    if (!active) {
      return jsonError(
        "INVALID_ARGUMENT",
        `${providerLabel} authorization is already inactive.`,
        409,
        traceId,
      );
    }
    const canRevoke = hasFallbackCredential(session, userState, {
      excludingProvider: {
        provider: payload.provider,
        providerUserId: payload.providerUserId,
      },
    });
    if (!canRevoke) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "revoke_provider",
        actorLabel: "MiniX Account Center",
        message: `${providerLabel} cannot be revoked because it is the last usable login method.`,
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (!payload.riskConfirmed) {
      return jsonError(
        "INVALID_ARGUMENT",
        `${providerLabel} revoke requires explicit risk confirmation.`,
        400,
        traceId,
      );
    }
    const securityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (!securityPhone) {
      return jsonError(
        "FORBIDDEN",
        `${providerLabel} revoke requires a verified phone security credential.`,
        409,
        traceId,
      );
    }
    if (!payload.verificationCode) {
      return jsonError(
        "INVALID_ARGUMENT",
        `${providerLabel} revoke requires a security verification code.`,
        400,
        traceId,
      );
    }
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: securityPhone,
      purpose: "account_security",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(session.userId, userState);
      c.status(verified.status as 400 | 423);
      return c.json({
        code: "INVALID_ARGUMENT",
        message: verified.message,
        credentialProtection: verified.protection,
      });
    }

    const nextRecord = createOAuthCredentialRecord({
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      userId: session.userId,
      tokenHash: linked.record.tokenHash,
      now: Date.now(),
      authorizationStatus: "revoked",
      revocationReason: payload.reason?.trim() || "user_revoked",
      existing: linked.record,
    });
    ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[linked.subject] =
      nextRecord;
    ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] =
      nextRecord;
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "revoke_provider",
      status: "completed",
      actorLabel: "MiniX Account Center",
      message: `${providerLabel} authorization was revoked for this account.`,
      verificationPurpose: "account_security",
      notificationHookLabel: "notify:provider_revoked",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "revoke_provider",
      result: "allowed",
      message: `${providerLabel} authorization was revoked.`,
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    await store.saveUserState(linked.indexUserId, linked.indexState);
    return c.json(
      createAccountOperationResponse(
        session,
        userState,
        c.req.url,
        `${providerLabel} authorization revoked.`,
        operationRecord,
      ),
    );
  });

  app.post("/account/cancellation", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, accountCancellationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
      actorUserId: session.userId,
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const action = payload.action ?? "request";

    if (action === "revoke") {
      const operation = current.accountOperations.find(
        (item) => item.kind === "revoke_cancellation",
      );
      if (!operation?.available) {
        const response = createOperationBlockedResponse({
          userState,
          kind: "revoke_cancellation",
          actorLabel: "MiniX Account Center",
          message: operation?.blockedReason ?? "Cancellation revoke is unavailable.",
          session,
          requestUrl: c.req.url,
          traceId,
          clientId,
          ...(deviceId ? { deviceId } : {}),
        });
        await store.saveUserState(session.userId, userState);
        return c.json(response, 409);
      }

      userState.availabilityStatus = "enabled";
      delete userState.pendingCancellation;
      clearAccountOperationCooldown(userState, "request_cancellation");
      const operationRecord = appendAccountOperationRecord(userState, {
        kind: "revoke_cancellation",
        status: "revoked",
        actorLabel: "MiniX Account Center",
        message: "Cancellation request revoked during the cooling-off window.",
        notificationHookLabel: "notify:cancellation_revoked",
      });
      appendSecurityAuditEvent({
        userState,
        scope: "account",
        action: "revoke_cancellation",
        result: "allowed",
        message: "Cancellation request revoked during the cooling-off window.",
        createdAt: new Date().toISOString(),
        actorUserId: session.userId,
        ...(deviceId ? { deviceId } : {}),
        clientId,
        platform: session.platform,
        traceId,
      });
      await store.saveUserState(session.userId, userState);
      return c.json(
        createAccountOperationResponse(
          session,
          userState,
          c.req.url,
          "Cancellation request revoked.",
          operationRecord,
        ),
      );
    }

    const operation = current.accountOperations.find(
      (item) => item.kind === "request_cancellation",
    );
    if (!operation?.available) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "request_cancellation",
        actorLabel: "MiniX Account Center",
        message: operation?.blockedReason ?? "Cancellation is unavailable.",
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (!payload.riskConfirmed) {
      return jsonError(
        "INVALID_ARGUMENT",
        "Cancellation requires explicit risk confirmation.",
        400,
        traceId,
      );
    }
    const securityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (!securityPhone) {
      return jsonError(
        "FORBIDDEN",
        "Cancellation requires a verified phone security credential.",
        409,
        traceId,
      );
    }
    if (!payload.verificationCode) {
      return jsonError(
        "INVALID_ARGUMENT",
        "Cancellation requires a security verification code.",
        400,
        traceId,
      );
    }
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: securityPhone,
      purpose: "account_security",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(session.userId, userState);
      c.status(verified.status as 400 | 423);
      return c.json({
        code: "INVALID_ARGUMENT",
        message: verified.message,
        credentialProtection: verified.protection,
      });
    }

    const requestedAt = new Date().toISOString();
    const effectiveAt = new Date(
      Date.now() + ACCOUNT_CANCELLATION_COOLING_OFF_MS,
    ).toISOString();
    userState.availabilityStatus = "cancellation_pending";
    userState.pendingCancellation = {
      requestedAt,
      effectiveAt,
      revokeUntil: effectiveAt,
      ...(payload.reason ? { reason: payload.reason } : {}),
      ...(payload.details ? { details: payload.details } : {}),
    };
    setAccountOperationCooldown(userState, {
      kind: "request_cancellation",
      label:
        "Cancellation is in the cooling-off window and can still be revoked.",
      durationMs: ACCOUNT_CANCELLATION_COOLING_OFF_MS,
    });
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "request_cancellation",
      status: "pending",
      actorLabel: "MiniX Account Center",
      message: `Cancellation requested and revocable until ${effectiveAt}.`,
      verificationPurpose: "account_security",
      notificationHookLabel: "notify:cancellation_requested",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "request_cancellation",
      result: "review",
      message: "Cancellation request entered the cooling-off window.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await scheduleOperationalJobForUser(store, {
      userId: session.userId,
      userState,
      kind: "cancellation_expiry",
      dedupeKey: `cancellation_expiry:${session.userId}`,
      relatedRecordId: session.userId,
      scheduledAt: effectiveAt,
      maxAttempts: 1,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(
      createAccountOperationResponse(
        session,
        userState,
        c.req.url,
        "Cancellation request submitted.",
        operationRecord,
      ),
    );
  });

  app.get("/account/relations/list", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), relationListQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const response: UserRelationListResponse = {
      accountSummary: current.accountSummary,
      userStatus: current.userStatus,
      relationList: listUserRelations(userState, current.userStatus.availability, {
        kind: query.kind,
        ...(query.page ? { page: query.page } : {}),
        ...(query.pageSize ? { pageSize: query.pageSize } : {}),
        ...(query.keyword ? { keyword: query.keyword } : {}),
      }),
    };
    return c.json(response);
  });

  app.get("/account/assets/history", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), assetHistoryQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const response: UserAssetHistoryResponse = listUserAssetHistory(session, userState, {
      ...(query.page ? { page: query.page } : {}),
      ...(query.pageSize ? { pageSize: query.pageSize } : {}),
      ...(query.subject ? { subject: query.subject } : {}),
    } satisfies ListUserAssetHistoryRequest);
    return c.json(response);
  });

  app.post("/account/relations", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, relationActionSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const target =
      current.relationTargets.find((item) => item.targetUserId === payload.targetUserId) ??
      listUserRelations(userState, current.userStatus.availability, {
        kind: payload.listKind ?? "following",
        page: 1,
        pageSize: 100,
        ...(payload.keyword ? { keyword: payload.keyword } : {}),
      }).items.find((item) => item.targetUserId === payload.targetUserId);
    if (!target) {
      return jsonError("NOT_FOUND", "Relation target not found.", 404, traceId);
    }

    const action = target.actions.find((item) => item.kind === payload.action);
    if (!action?.available) {
      return jsonError(
        "FORBIDDEN",
        action?.blockedReason ?? "Relation action is unavailable.",
        409,
        traceId,
      );
    }
    if (payload.action === "set_remark" && !payload.remarkName) {
      return jsonError(
        "INVALID_ARGUMENT",
        "remark name is required when setting a remark",
        400,
        traceId,
      );
    }

    const transitionMessage = applyRelationAction(userState, {
      targetUserId: payload.targetUserId,
      action: payload.action,
      ...(payload.remarkName ? { remarkName: payload.remarkName } : {}),
    });
    if (!transitionMessage) {
      return jsonError("NOT_FOUND", "Relation target not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    const next = createCurrentUserResponse(session, userState, c.req.url);
    const response: UserRelationMutationResponse = {
      accountSummary: next.accountSummary,
      userStatus: next.userStatus,
      relationTargets: next.relationTargets,
      ...(payload.listKind
        ? {
            relationList: listUserRelations(userState, next.userStatus.availability, {
              kind: payload.listKind,
              ...(payload.page ? { page: payload.page } : {}),
              ...(payload.pageSize ? { pageSize: payload.pageSize } : {}),
              ...(payload.keyword ? { keyword: payload.keyword } : {}),
            }),
          }
        : {}),
      transitionMessage,
    };
    return c.json(response);
  });
}
