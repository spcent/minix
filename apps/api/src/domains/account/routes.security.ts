import { jsonError } from "../../http/response";
import {
  ACCOUNT_CANCELLATION_COOLING_OFF_MS,
  ACCOUNT_OPERATION_COOLDOWN_MS,
  appendAccountOperationRecord,
  clearAccountOperationCooldown,
  hasFallbackCredential,
  setAccountOperationCooldown,
} from "./operations";
import { createCurrentUserResponse } from "./current-user";
import type { AccountRouteHelpers } from "./route-helpers";
import type { RegisterAccountRoutesOptions } from "./route-options";
import {
  accountCancellationSchema,
  accountProviderRevokeSchema,
  accountUnbindSchema,
} from "./schemas";
import { parseRouteBody } from "../../http/route-context";

export function registerAccountSecurityRoutes(
  options: RegisterAccountRoutesOptions,
  helpers: AccountRouteHelpers,
) {
  const {
    app,
    createOAuthProviderLabel,
    createOAuthCredentialRecord,
    ensureAuthSecurityState,
    loadOAuthCredentialLink,
    scheduleOperationalJobForUser,
  } = options;
  const {
    loadAccountActionContext,
    loadAvailableAccountOperation,
    createBlockedAccountOperationResponse,
    commitAccountSecurityOperation,
    runVerifiedAccountSecurityOperation,
  } = helpers;

  app.post("/account/unbind", async (c) => {
    const payload = await parseRouteBody(c, accountUnbindSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const actionContext = await loadAccountActionContext(c, { guardSecurity: true });
    if (actionContext instanceof Response) {
      return actionContext;
    }
    const { traceId, session, store, userState, clientId, deviceId } = actionContext;
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = await loadAvailableAccountOperation({
      c,
      operations: current.accountOperations,
      kind: "unbind_wechat",
      fallbackMessage: "WeChat unbinding is unavailable.",
      context: actionContext,
    });
    if (operation instanceof Response) {
      return operation;
    }

    if (payload.provider !== "wechat") {
      return jsonError(
        "INVALID_ARGUMENT",
        "Non-WeChat providers must use the provider unlink route.",
        400,
        traceId,
      );
    }

    return runVerifiedAccountSecurityOperation({
      c,
      context: actionContext,
      riskConfirmed: payload.riskConfirmed,
      riskMessage: "WeChat unbinding requires explicit risk confirmation.",
      verificationCode: payload.verificationCode,
      missingCredentialMessage:
        "WeChat unbinding requires a verified phone security credential.",
      missingCodeMessage: "WeChat unbinding requires a security verification code.",
      mutate: () => {
        userState.wechatBoundOverride = false;
        setAccountOperationCooldown(userState, {
          kind: "unbind_wechat",
          label:
            "WeChat binding changes are temporarily locked while device sign-in state settles.",
          durationMs: ACCOUNT_OPERATION_COOLDOWN_MS,
        });
        return appendAccountOperationRecord(userState, {
          kind: "unbind_wechat",
          status: "completed",
          actorLabel: "MiniX Account Center",
          message: "WeChat binding removed after fallback credential verification.",
          verificationPurpose: "account_security",
          notificationHookLabel: "notify:wechat_unbound",
        });
      },
      responseMessage: "WeChat binding removed.",
      audit: {
        action: "unbind_wechat",
        result: "allowed",
        message: "WeChat binding removed after fallback credential verification.",
      },
    });
  });

  app.post("/account/provider/unlink", async (c) => {
    const payload = await parseRouteBody(c, accountUnbindSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const actionContext = await loadAccountActionContext(c, { guardSecurity: true });
    if (actionContext instanceof Response) {
      return actionContext;
    }
    const { traceId, session, store, userState, clientId, deviceId } = actionContext;

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

    const providerUserId = payload.providerUserId;
    const linked = await loadOAuthCredentialLink(store, payload.provider, providerUserId);
    const linkedRecord = linked.record;
    if (
      !linkedRecord ||
      linkedRecord.userId !== session.userId ||
      linkedRecord.authorizationStatus === "unlinked"
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
      const response = await createBlockedAccountOperationResponse({
        userState,
        kind: "unlink_provider",
        message: `${providerLabel} cannot be unlinked because it is the last usable login method.`,
        session,
        requestUrl: c.req.url,
        traceId,
        store,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      return c.json(response, 409);
    }

    return runVerifiedAccountSecurityOperation({
      c,
      context: actionContext,
      riskConfirmed: payload.riskConfirmed,
      riskMessage: `${providerLabel} unlink requires explicit risk confirmation.`,
      verificationCode: payload.verificationCode,
      missingCredentialMessage:
        `${providerLabel} unlink requires a verified phone security credential.`,
      missingCodeMessage: `${providerLabel} unlink requires a security verification code.`,
      mutate: () => {
        const nextRecord = createOAuthCredentialRecord({
          provider: payload.provider,
          providerUserId,
          userId: session.userId,
          tokenHash: linkedRecord.tokenHash,
          now: Date.now(),
          authorizationStatus: "unlinked",
          revocationReason: "user_unlinked",
          existing: linkedRecord,
        });
        ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[linked.subject] =
          nextRecord;
        ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] =
          nextRecord;
        return appendAccountOperationRecord(userState, {
          kind: "unlink_provider",
          status: "completed",
          actorLabel: "MiniX Account Center",
          message: `${providerLabel} was unlinked after fallback credential verification.`,
          verificationPurpose: "account_security",
          notificationHookLabel: "notify:provider_unlinked",
        });
      },
      responseMessage: `${providerLabel} unlinked.`,
      audit: {
        action: "unlink_provider",
        result: "allowed",
        message: `${providerLabel} was unlinked from the current account.`,
      },
      save: async () => {
        await store.saveUserState(session.userId, userState);
        await store.saveUserState(linked.indexUserId, linked.indexState);
      },
    });
  });

  app.post("/account/provider/revoke", async (c) => {
    const payload = await parseRouteBody(c, accountProviderRevokeSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const actionContext = await loadAccountActionContext(c, { guardSecurity: true });
    if (actionContext instanceof Response) {
      return actionContext;
    }
    const { traceId, session, store, userState, clientId, deviceId } = actionContext;

    const linked = await loadOAuthCredentialLink(store, payload.provider, payload.providerUserId);
    const linkedRecord = linked.record;
    if (
      !linkedRecord ||
      linkedRecord.userId !== session.userId ||
      linkedRecord.authorizationStatus === "unlinked"
    ) {
      return jsonError(
        "NOT_FOUND",
        "Provider identity is not linked to the current account.",
        404,
        traceId,
      );
    }

    const providerLabel = createOAuthProviderLabel(payload.provider);
    const active = (linkedRecord.authorizationStatus ?? "active") === "active";
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
      const response = await createBlockedAccountOperationResponse({
        userState,
        kind: "revoke_provider",
        message: `${providerLabel} cannot be revoked because it is the last usable login method.`,
        session,
        requestUrl: c.req.url,
        traceId,
        store,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      return c.json(response, 409);
    }

    return runVerifiedAccountSecurityOperation({
      c,
      context: actionContext,
      riskConfirmed: payload.riskConfirmed,
      riskMessage: `${providerLabel} revoke requires explicit risk confirmation.`,
      verificationCode: payload.verificationCode,
      missingCredentialMessage:
        `${providerLabel} revoke requires a verified phone security credential.`,
      missingCodeMessage: `${providerLabel} revoke requires a security verification code.`,
      mutate: () => {
        const nextRecord = createOAuthCredentialRecord({
          provider: payload.provider,
          providerUserId: payload.providerUserId,
          userId: session.userId,
          tokenHash: linkedRecord.tokenHash,
          now: Date.now(),
          authorizationStatus: "revoked",
          revocationReason: payload.reason?.trim() || "user_revoked",
          existing: linkedRecord,
        });
        ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[linked.subject] =
          nextRecord;
        ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] =
          nextRecord;
        return appendAccountOperationRecord(userState, {
          kind: "revoke_provider",
          status: "completed",
          actorLabel: "MiniX Account Center",
          message: `${providerLabel} authorization was revoked for this account.`,
          verificationPurpose: "account_security",
          notificationHookLabel: "notify:provider_revoked",
        });
      },
      responseMessage: `${providerLabel} authorization revoked.`,
      audit: {
        action: "revoke_provider",
        result: "allowed",
        message: `${providerLabel} authorization was revoked.`,
      },
      save: async () => {
        await store.saveUserState(session.userId, userState);
        await store.saveUserState(linked.indexUserId, linked.indexState);
      },
    });
  });

  app.post("/account/cancellation", async (c) => {
    const payload = await parseRouteBody(c, accountCancellationSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const actionContext = await loadAccountActionContext(c, { guardSecurity: true });
    if (actionContext instanceof Response) {
      return actionContext;
    }
    const { traceId, session, store, userState, clientId, deviceId } = actionContext;
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const action = payload.action ?? "request";

    if (action === "revoke") {
      const operation = await loadAvailableAccountOperation({
        c,
        operations: current.accountOperations,
        kind: "revoke_cancellation",
        fallbackMessage: "Cancellation revoke is unavailable.",
        context: actionContext,
      });
      if (operation instanceof Response) {
        return operation;
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
      return commitAccountSecurityOperation({
        c,
        context: actionContext,
        operationRecord,
        responseMessage: "Cancellation request revoked.",
        audit: {
          action: "revoke_cancellation",
          result: "allowed",
          message: "Cancellation request revoked during the cooling-off window.",
        },
      });
    }

    const operation = await loadAvailableAccountOperation({
      c,
      operations: current.accountOperations,
      kind: "request_cancellation",
      fallbackMessage: "Cancellation is unavailable.",
      context: actionContext,
    });
    if (operation instanceof Response) {
      return operation;
    }

    let effectiveAt = "";
    return runVerifiedAccountSecurityOperation({
      c,
      context: actionContext,
      riskConfirmed: payload.riskConfirmed,
      riskMessage: "Cancellation requires explicit risk confirmation.",
      verificationCode: payload.verificationCode,
      missingCredentialMessage:
        "Cancellation requires a verified phone security credential.",
      missingCodeMessage: "Cancellation requires a security verification code.",
      mutate: () => {
        const requestedAt = new Date().toISOString();
        effectiveAt = new Date(
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
        return appendAccountOperationRecord(userState, {
          kind: "request_cancellation",
          status: "pending",
          actorLabel: "MiniX Account Center",
          message: `Cancellation requested and revocable until ${effectiveAt}.`,
          verificationPurpose: "account_security",
          notificationHookLabel: "notify:cancellation_requested",
        });
      },
      responseMessage: "Cancellation request submitted.",
      audit: {
        action: "request_cancellation",
        result: "review",
        message: "Cancellation request entered the cooling-off window.",
      },
      save: async () => {
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
      },
    });
  });
}
