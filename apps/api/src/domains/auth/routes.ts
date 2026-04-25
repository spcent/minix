import type {
  AuthOAuthAuthorizeResponse,
  AuthOAuthCallbackResponse,
  AuthPhoneVerificationResponse,
  IdentityTransitionResponse,
  LoginPlatformKind,
  LoginResponse,
  RefreshTokenResponse,
  ProviderPostureMode,
} from "@minix/contracts";
import type { Hono, MiddlewareHandler } from "hono";

import { jsonError } from "../../http/response";
import { parseJsonBody } from "../../http/parsing";
import { resolveBearerToken } from "../../http/auth";
import { resolveProviderPostureMode } from "../provider-posture";
import type { AuthOAuthProvider, AuthSmsDeliveryProvider } from "./provider";
import type { ApiBindings, ApiStore, SessionRecord, UserState } from "../../types";
import {
  createIdentityAuditRecord,
  createIdentityWorkflow,
  createMergePreview,
  createUserIdFromCredential,
  createUserIdFromLogin,
  createUserIdFromUpgradeRequest,
  isMergeSampleIdentity,
  mergeUserStates,
  resolveAuthStatus,
  resolveIdentity,
} from "./identity";
import {
  createAuthResponseFromSession,
  resolveAbnormalLoginPrompt,
  resolveLoginMethod,
  resolveRedirectTarget,
} from "./session";
import {
  appendSecurityAuditEvent,
  consumePhoneVerification,
  createCredentialSubject,
  createOAuthCredentialRecord,
  createOAuthIndexUserId,
  createOAuthProviderLabel,
  createOAuthSubject,
  createOperationBlockedResponse,
  createPhoneVerificationChallenge,
  createPhonePurposeKey,
  evaluateSecurityDecision,
  getRecentSecurityAuditEvents,
  guardSecurityRateLimit,
  hashSecret,
  loadOAuthCredentialLink,
  maskPhoneNumber,
  OAUTH_STATE_TTL_MS,
  PASSWORD_MAX_FAILED_ATTEMPTS,
  PHONE_VERIFICATION_MAX_ATTEMPTS,
  PHONE_VERIFICATION_RETRY_AFTER_SECONDS,
  registerPasswordCredential,
  resolveRequestDeviceId,
  sanitizeUserKey,
  setAuthRateLimitHeaders,
  logAuthEvent,
  verifyPasswordCredential,
  ensureAuthSecurityState,
} from "./security";
import {
  authRedirectTargetSchema,
  identityBindOAuthSchema,
  identityBindPhoneSchema,
  identityMergeSchema,
  identityUpgradeSchema,
  loginRequestSchema,
  oauthAuthorizeSchema,
  oauthCallbackSchema,
  passwordCredentialSchema,
  phoneVerificationRequestSchema,
  refreshTokenRequestSchema,
} from "./schemas";

export interface RegisterAuthRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  authRateLimitConfig?: import("../../rate-limit").AuthRateLimitConfig | Partial<import("../../rate-limit").AuthRateLimitConfig>;
  authRateLimitStore?: import("../../rate-limit").RateLimitCounterStore;
  authSmsProvider?: AuthSmsDeliveryProvider;
  authOAuthProvider?: AuthOAuthProvider;
}

function respondCredentialError(
  c: {
    status: (code: 400 | 423) => unknown;
    json: (payload: unknown) => Response;
  },
  code: "LOGIN_FAILED" | "INVALID_ARGUMENT",
  message: string,
  status: 400 | 423,
  credentialProtection: unknown,
) {
  c.status(status);
  return c.json({
    code,
    message,
    credentialProtection,
  });
}

export function registerAuthRoutes(options: RegisterAuthRoutesOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    authRateLimitConfig,
    authRateLimitStore,
    authSmsProvider,
    authOAuthProvider,
  } = options;

  function createProviderUnavailableResponse(
    c: {
      status: (code: 503) => unknown;
      json: (payload: unknown) => Response;
    },
    message: string,
    retryAfterSeconds?: number,
  ) {
    c.status(503);
    return c.json({
      code: "PROVIDER_UNAVAILABLE",
      message,
      credentialProtection: {
        failureReason: "provider_unavailable",
      },
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    });
  }

  function resolveSmsProviderMode(env: ApiBindings | undefined): ProviderPostureMode {
    return resolveProviderPostureMode(env?.MINIX_AUTH_SMS_PROVIDER_MODE);
  }

  function resolveOAuthProviderMode(env: ApiBindings | undefined): ProviderPostureMode {
    return resolveProviderPostureMode(env?.MINIX_AUTH_OAUTH_PROVIDER_MODE);
  }

  function createOAuthProviderFailureResponse(
    c: {
      status: (code: 400 | 503) => unknown;
      json: (payload: unknown) => Response;
    },
    error: {
      message: string;
      failureReason?: "provider_unavailable" | "oauth_token_invalid";
      retryAfterSeconds?: number;
    },
  ) {
    if (error.failureReason === "provider_unavailable") {
      return createProviderUnavailableResponse(c, error.message, error.retryAfterSeconds);
    }
    c.status(400);
    return c.json({
      code: "LOGIN_FAILED",
      message: error.message,
      credentialProtection: {
        failureReason: error.failureReason ?? "oauth_token_invalid",
      },
      ...(error.retryAfterSeconds !== undefined ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
    });
  }

  async function validateOAuthProviderCallback(input: {
    c: {
      status: (code: 400 | 503) => unknown;
      json: (payload: unknown) => Response;
      env: ApiBindings | undefined;
    };
    provider: string;
    purpose?: "login" | "bind";
    state: string;
    providerToken: string;
    providerUserId: string;
    platform: LoginPlatformKind;
  }): Promise<
    | {
        ok: true;
        value: {
          providerLabel: string;
          providerUserId: string;
        };
      }
    | {
        ok: false;
        response: Response;
      }
  > {
    if (authOAuthProvider) {
      const validated = await authOAuthProvider.validateCallback(
        {
          provider: input.provider,
          ...(input.purpose ? { purpose: input.purpose } : {}),
          state: input.state,
          providerToken: input.providerToken,
          providerUserId: input.providerUserId,
          platform: input.platform,
          ...(input.c.env?.MINIX_DEPLOY_ENV ? { deployEnv: input.c.env.MINIX_DEPLOY_ENV } : {}),
        },
        input.c.env,
      );
      if (!validated.ok) {
        return {
          ok: false,
          response: createOAuthProviderFailureResponse(input.c, validated.error),
        };
      }
      return {
        ok: true,
        value: {
          providerLabel: validated.value.providerLabel,
          providerUserId: validated.value.providerUserId,
        },
      };
    }

    if (resolveOAuthProviderMode(input.c.env) === "production") {
      return {
        ok: false,
        response: createProviderUnavailableResponse(input.c, "OAuth provider is not configured for production mode."),
      };
    }

    return {
      ok: true,
      value: {
        providerLabel: createOAuthProviderLabel(input.provider),
        providerUserId: input.providerUserId,
      },
    };
  }

  app.post("/auth/verification-code/request", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, phoneVerificationRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const store = resolveStore(c.env);
    const clientId = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    let userId = createUserIdFromCredential({
      method: "phone_code",
      phoneNumber: payload.phoneNumber,
    });
    let platform: LoginPlatformKind = "h5";
    if (payload.purpose === "account_security") {
      const accessToken = resolveBearerToken(c.req.header("authorization"));
      if (accessToken) {
        const session = await store.getSessionByAccessToken(accessToken);
        if (session) {
          userId = session.userId;
          platform = session.platform;
        }
      }
    }
    const userState = await store.getUserState(userId);
    const guard = await guardSecurityRateLimit({
      c,
      store,
      userId,
      userState,
      action: "verification",
      scope: "verification",
      platform,
      clientId,
      deviceId: payload.deviceId,
      traceId,
      ...(authRateLimitConfig ? { config: authRateLimitConfig } : {}),
      ...(authRateLimitStore ? { counterStore: authRateLimitStore } : {}),
      blockedAction: "verification_rate_limited",
      blockedMessage: "Too many verification requests. Retry later.",
      ...(payload.riskContext?.frequencyKey ? { frequencyKey: payload.riskContext.frequencyKey } : {}),
      ...(payload.riskContext?.scene ? { scene: payload.riskContext.scene } : {}),
    });
    const now = Date.now();
    const nowIso = guard.nowIso;
    const rateLimitState = guard.rateLimitState;
    const securityDecision = evaluateSecurityDecision({
      userState,
      platform,
      riskContext: payload.riskContext,
      scope: "verification",
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
    });
    const verificationAuditBase = {
      userState,
      scope: "verification" as const,
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      clientId,
      platform,
      ...(securityDecision.riskDecision.reason ? { reason: securityDecision.riskDecision.reason } : {}),
      ...(securityDecision.riskDecision.frequencyKey ? { frequencyKey: securityDecision.riskDecision.frequencyKey } : {}),
      ...(securityDecision.riskDecision.scene ? { scene: securityDecision.riskDecision.scene } : {}),
      traceId,
    };
    if (!guard.allowed) {
      return guard.response;
    }
    const challenge = await createPhoneVerificationChallenge({
      userState,
      phoneNumber: payload.phoneNumber,
      purpose: payload.purpose,
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      now,
    });
    const maskedTarget = maskPhoneNumber(payload.phoneNumber);
    const smsProviderMode = resolveSmsProviderMode(c.env);
    let delivery: AuthPhoneVerificationResponse["delivery"];
    if (authSmsProvider) {
      const delivered = await authSmsProvider(
        {
          phoneNumber: payload.phoneNumber,
          maskedTarget,
          purpose: payload.purpose,
          verificationId: challenge.verificationId,
          verificationCode: challenge.code,
          ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
          ...(c.env?.MINIX_DEPLOY_ENV ? { deployEnv: c.env.MINIX_DEPLOY_ENV } : {}),
        },
        c.env,
      );
      if (!delivered.ok) {
        const securityState = ensureAuthSecurityState(userState);
        delete securityState.phoneVerificationsById[challenge.verificationId];
        delete securityState.latestVerificationIdByPhonePurpose[
          createPhonePurposeKey(payload.phoneNumber, payload.purpose)
        ];
        appendSecurityAuditEvent({
          ...verificationAuditBase,
          action: "verification_provider_unavailable",
          result: "blocked",
          message: delivered.error.message,
          createdAt: nowIso,
        });
        await store.saveUserState(userId, userState);
        return createProviderUnavailableResponse(c, delivered.error.message, delivered.error.retryAfterSeconds);
      }
      delivery = {
        provider: delivered.value.provider,
        providerMode: delivered.value.providerMode,
        providerLabel: delivered.value.providerLabel,
        providerReference: delivered.value.providerReference,
        maskedTarget: delivered.value.maskedTarget,
        message: delivered.value.message,
      };
    } else if (smsProviderMode === "production") {
      const securityState = ensureAuthSecurityState(userState);
      delete securityState.phoneVerificationsById[challenge.verificationId];
      delete securityState.latestVerificationIdByPhonePurpose[
        createPhonePurposeKey(payload.phoneNumber, payload.purpose)
      ];
      appendSecurityAuditEvent({
        ...verificationAuditBase,
        action: "verification_provider_unavailable",
        result: "blocked",
        message: "SMS provider is not configured for production mode.",
        createdAt: nowIso,
      });
      await store.saveUserState(userId, userState);
      return createProviderUnavailableResponse(c, "SMS provider is not configured for production mode.");
    } else {
      delivery = {
        provider: "simulated",
        providerMode: "sample",
        providerLabel: "Built-in simulated SMS",
        providerReference: `sms_${challenge.verificationId}`,
        maskedTarget,
        debugCode: challenge.code,
        message: "Verification code issued by the built-in simulated SMS provider.",
      };
    }
    appendSecurityAuditEvent({
      ...verificationAuditBase,
      action: "verification_code_issued",
      result: securityDecision.riskDecision.level === "review" ? "review" : "allowed",
      message: `Verification code issued for ${payload.purpose}.`,
      createdAt: nowIso,
    });
    await store.saveUserState(userId, userState);
    const response: AuthPhoneVerificationResponse = {
      verificationId: challenge.verificationId,
      phoneNumberMasked: maskedTarget,
      purpose: payload.purpose,
      expiresAt: challenge.expiresAt,
      retryAfterSeconds: PHONE_VERIFICATION_RETRY_AFTER_SECONDS,
      maxAttempts: PHONE_VERIFICATION_MAX_ATTEMPTS,
      delivery,
      riskDecision: securityDecision.riskDecision,
      ...(securityDecision.deviceIdentity ? { deviceIdentity: securityDecision.deviceIdentity } : {}),
      rateLimitState,
      securityAuditEvents: getRecentSecurityAuditEvents(userState),
    };

    return c.json(response);
  });

  app.post("/auth/password/register", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, passwordCredentialSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const subject = createCredentialSubject(payload);
    if (!subject) {
      return jsonError(
        "INVALID_ARGUMENT",
        "password registration requires an account or phone number",
        400,
        traceId,
      );
    }

    const userId = createUserIdFromCredential({
      method: "password",
      ...(payload.account ? { account: payload.account } : {}),
      ...(payload.phoneNumber ? { phoneNumber: payload.phoneNumber } : {}),
    });
    const store = resolveStore(c.env);
    const userState = await store.getUserState(userId);
    if (payload.phoneNumber) {
      if (!payload.verificationCode) {
        return jsonError(
          "LOGIN_FAILED",
          "phone password registration requires a verification code",
          400,
          traceId,
        );
      }
      const verified = await consumePhoneVerification({
        userState,
        phoneNumber: payload.phoneNumber,
        purpose: "password_reset",
        verificationCode: payload.verificationCode,
        now: Date.now(),
      });
      if (!verified.ok) {
        await store.saveUserState(userId, userState);
        return respondCredentialError(
          c,
          "LOGIN_FAILED",
          verified.message,
          verified.status,
          verified.protection,
        );
      }
    }

    await registerPasswordCredential({
      userState,
      userId,
      subject,
      password: payload.password,
      now: Date.now(),
    });
    await store.saveUserState(userId, userState);

    return c.json({
      userId,
      subject,
      passwordConfigured: true,
      credentialProtection: { remainingAttempts: PASSWORD_MAX_FAILED_ATTEMPTS },
    });
  });

  app.post("/auth/password/reset", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, passwordCredentialSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    if (!payload.phoneNumber || !payload.verificationCode) {
      return jsonError(
        "INVALID_ARGUMENT",
        "password reset requires phone number and verification code",
        400,
        traceId,
      );
    }

    const subject = createCredentialSubject({ phoneNumber: payload.phoneNumber });
    if (!subject) {
      return jsonError("INVALID_ARGUMENT", "password reset requires a valid phone number", 400, traceId);
    }

    const userId = createUserIdFromCredential({
      method: "password",
      phoneNumber: payload.phoneNumber,
    });
    const store = resolveStore(c.env);
    const userState = await store.getUserState(userId);
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: payload.phoneNumber,
      purpose: "password_reset",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(userId, userState);
      return respondCredentialError(
        c,
        "LOGIN_FAILED",
        verified.message,
        verified.status,
        verified.protection,
      );
    }

    await registerPasswordCredential({
      userState,
      userId,
      subject,
      password: payload.password,
      now: Date.now(),
    });
    await store.saveUserState(userId, userState);
    return c.json({
      userId,
      subject,
      passwordConfigured: true,
      credentialProtection: { remainingAttempts: PASSWORD_MAX_FAILED_ATTEMPTS },
    });
  });

  app.post("/auth/oauth/authorize", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, oauthAuthorizeSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const providerKey = sanitizeUserKey(payload.provider.toLowerCase());
    const state = `oauth_state_${crypto.randomUUID()}`;
    const expiresAt = Date.now() + OAUTH_STATE_TTL_MS;
    const store = resolveStore(c.env);
    const stateUserId = `oauth_state_${providerKey}`;
    const stateStore = await store.getUserState(stateUserId);
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    ensureAuthSecurityState(stateStore).oauthStatesByState[state] = {
      provider: payload.provider,
      state,
      ...(payload.purpose ? { purpose: payload.purpose } : {}),
      ...(payload.purpose === "bind"
        ? (() => {
            const accessToken = resolveBearerToken(c.req.header("authorization"));
            return accessToken ? { ownerUserId: "__deferred__" } : {};
          })()
        : {}),
      expiresAt,
      createdAt: Date.now(),
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      ...(redirectTarget ? { redirectTarget } : {}),
    };
    if (payload.purpose === "bind") {
      const accessToken = resolveBearerToken(c.req.header("authorization"));
      if (accessToken) {
        const session = await store.getSessionByAccessToken(accessToken);
        if (session) {
          const pendingState = ensureAuthSecurityState(stateStore).oauthStatesByState[state];
          if (pendingState) {
            pendingState.ownerUserId = session.userId;
          }
        }
      }
    }
    let response: AuthOAuthAuthorizeResponse;
    if (authOAuthProvider) {
      const authorized = await authOAuthProvider.authorize(
        {
          provider: payload.provider,
          ...(payload.purpose ? { purpose: payload.purpose } : {}),
          state,
          expiresAt,
          ...(redirectTarget ? { redirectTarget } : {}),
          ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
          ...(c.env?.MINIX_DEPLOY_ENV ? { deployEnv: c.env.MINIX_DEPLOY_ENV } : {}),
        },
        c.env,
      );
      if (!authorized.ok) {
        delete ensureAuthSecurityState(stateStore).oauthStatesByState[state];
        await store.saveUserState(stateUserId, stateStore);
        return createOAuthProviderFailureResponse(c, {
          ...authorized.error,
          failureReason: authorized.error.failureReason ?? "provider_unavailable",
        });
      }
      response = {
        provider: payload.provider,
        ...(payload.purpose ? { purpose: payload.purpose } : {}),
        providerMode: authorized.value.providerMode,
        providerLabel: authorized.value.providerLabel,
        state,
        authorizationUrl: authorized.value.authorizationUrl,
        expiresAt,
        message: authorized.value.message,
      };
    } else if (resolveOAuthProviderMode(c.env) === "production") {
      delete ensureAuthSecurityState(stateStore).oauthStatesByState[state];
      await store.saveUserState(stateUserId, stateStore);
      return createProviderUnavailableResponse(c, "OAuth provider is not configured for production mode.");
    } else {
      response = {
        provider: payload.provider,
        ...(payload.purpose ? { purpose: payload.purpose } : {}),
        providerMode: "sample",
        providerLabel: createOAuthProviderLabel(payload.provider),
        state,
        authorizationUrl: `https://auth.example.test/${providerKey}/authorize?state=${encodeURIComponent(state)}`,
        expiresAt,
        message: "OAuth authorize URLs stay sample-backed until production provider credentials and callback domains are configured.",
      };
    }

    await store.saveUserState(stateUserId, stateStore);
    return c.json(response);
  });

  app.post("/auth/oauth/callback", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, oauthCallbackSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const providerKey = sanitizeUserKey(payload.provider.toLowerCase());
    const store = resolveStore(c.env);
    const stateUserId = `oauth_state_${providerKey}`;
    const stateStore = await store.getUserState(stateUserId);
    const stateRecord = ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    if (!stateRecord || stateRecord.provider !== payload.provider || stateRecord.expiresAt <= Date.now()) {
      c.status(400);
      return c.json({
        code: "LOGIN_FAILED",
        message: "oauth state is invalid or expired",
        credentialProtection: { failureReason: "oauth_state_invalid" },
      });
    }

    const validatedOAuth = await validateOAuthProviderCallback({
      c,
      provider: payload.provider,
      state: payload.state,
      providerToken: payload.providerToken,
      providerUserId: payload.providerUserId,
      platform: payload.platform,
    });
    if (!validatedOAuth.ok) {
      return validatedOAuth.response;
    }

    const now = Date.now();
    const providerUserId = validatedOAuth.value.providerUserId;
    const providerSubject = createOAuthSubject(payload.provider, providerUserId);
    const linked = await loadOAuthCredentialLink(store, payload.provider, providerUserId);
    const userId =
      linked.record && linked.record.authorizationStatus !== "unlinked"
        ? linked.record.userId
        : `user_oauth_${providerKey}_${sanitizeUserKey(providerUserId)}`;
    const userState = await store.getUserState(userId);
    const tokenHash = await hashSecret(payload.providerToken, payload.state);
    const record = createOAuthCredentialRecord({
      provider: payload.provider,
      providerUserId,
      userId,
      tokenHash,
      now,
      ...(linked.record ? { existing: linked.record } : {}),
    });
    ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[providerSubject] = record;
    ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[providerSubject] = record;
    delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    await store.saveUserState(stateUserId, stateStore);
    await store.saveUserState(linked.indexUserId, linked.indexState);
    await store.saveUserState(userId, userState);

    const session = await store.createSession({
      platform: payload.platform,
      userId,
      authStatus: "authenticated",
      identity: { userId },
      loginMethod: "oauth",
    });
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget ?? stateRecord.redirectTarget);
    const response: AuthOAuthCallbackResponse = createAuthResponseFromSession(session, c.req.url, {
      ...(redirectTarget ? { redirectTarget } : {}),
    });
    return c.json(response);
  });

  app.post("/auth/login", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, loginRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const clientId = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const loginMethod = resolveLoginMethod(payload);

    if (loginMethod === "wechat_code" && !payload.credential.code && !payload.credential.authCode) {
      logAuthEvent("login_failed", {
        clientId,
        platform: payload.platform,
        reason: "missing_platform_code",
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return jsonError("LOGIN_FAILED", "wechat login requires a platform code", 400, traceId);
    }

    if (loginMethod === "guest" && !payload.credential.anonymousId) {
      return jsonError("LOGIN_FAILED", "guest login requires an anonymous id", 400, traceId);
    }

    if (
      loginMethod === "phone_code" &&
      (!payload.credential.phoneNumber || !payload.credential.verificationCode)
    ) {
      return jsonError(
        "LOGIN_FAILED",
        "phone verification login requires both phone number and verification code",
        400,
        traceId,
      );
    }

    if (
      loginMethod === "password" &&
      (!(payload.credential.phoneNumber || payload.credential.account) ||
        !payload.credential.password)
    ) {
      return jsonError(
        "LOGIN_FAILED",
        "password login requires an account identifier and password",
        400,
        traceId,
      );
    }

    if (
      loginMethod === "oauth" &&
      (!payload.credential.provider ||
        !payload.credential.providerToken ||
        !payload.credential.providerUserId ||
        !payload.credential.oauthState)
    ) {
      return jsonError(
        "LOGIN_FAILED",
        "third-party login requires provider, provider user id, provider token, and oauth state",
        400,
        traceId,
      );
    }

    const store = resolveStore(c.env);
    let userId = createUserIdFromLogin(payload, loginMethod);
    let userState = await store.getUserState(userId);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId,
      userState,
      action: "login",
      scope: "auth",
      platform: payload.platform,
      clientId,
      deviceId: payload.credential.deviceId ?? payload.riskContext?.deviceId,
      traceId,
      ...(authRateLimitConfig ? { config: authRateLimitConfig } : {}),
      ...(authRateLimitStore ? { counterStore: authRateLimitStore } : {}),
      blockedAction: "login_rate_limited",
      blockedMessage: "Too many login attempts. Retry later.",
      ...(payload.riskContext?.frequencyKey ? { frequencyKey: payload.riskContext.frequencyKey } : {}),
      ...(payload.riskContext?.scene ? { scene: payload.riskContext.scene } : {}),
    });
    setAuthRateLimitHeaders(c, {
      limited: !rateLimitGuard.allowed,
      limit: rateLimitGuard.rateLimitState.limit,
      remaining: rateLimitGuard.rateLimitState.remaining,
      resetAt: rateLimitGuard.rateLimitState.resetAt,
      retryAfterSeconds: rateLimitGuard.rateLimitState.retryAfterSeconds,
    });
    if (!rateLimitGuard.allowed) {
      logAuthEvent("login_rate_limited", {
        clientId,
        platform: payload.platform,
        retryAfterSeconds: rateLimitGuard.rateLimitState.retryAfterSeconds,
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return rateLimitGuard.response;
    }
    const securityDecision = evaluateSecurityDecision({
      userState,
      platform: payload.platform,
      riskContext: payload.riskContext,
      scope: "auth",
      ...(payload.credential.deviceId ? { deviceId: payload.credential.deviceId } : {}),
    });
    let credentialProtection: import("@minix/contracts").AuthCredentialProtection | undefined;
    const loginAuditBase = {
      userState,
      scope: "auth" as const,
      actorUserId: userId,
      clientId,
      platform: payload.platform,
      ...(securityDecision.riskDecision.deviceId ? { deviceId: securityDecision.riskDecision.deviceId } : {}),
      ...(securityDecision.riskDecision.reason ? { reason: securityDecision.riskDecision.reason } : {}),
      ...(securityDecision.riskDecision.frequencyKey ? { frequencyKey: securityDecision.riskDecision.frequencyKey } : {}),
      ...(securityDecision.riskDecision.scene ? { scene: securityDecision.riskDecision.scene } : {}),
      traceId,
    };

    if (loginMethod === "phone_code") {
      const verified = await consumePhoneVerification({
        userState,
        phoneNumber: payload.credential.phoneNumber!,
        purpose: "login",
        verificationCode: payload.credential.verificationCode!,
        now: Date.now(),
      });
      if (!verified.ok) {
        appendSecurityAuditEvent({
          ...loginAuditBase,
          action: "phone_code_login",
          result: "blocked",
          message: verified.message,
          createdAt: new Date().toISOString(),
        });
        await store.saveUserState(userId, userState);
        return respondCredentialError(
          c,
          "LOGIN_FAILED",
          verified.message,
          verified.status,
          verified.protection,
        );
      }
    }

    if (loginMethod === "password") {
      const subject = createCredentialSubject(payload.credential);
      if (!subject) {
        return jsonError(
          "LOGIN_FAILED",
          "password login requires an account identifier and password",
          400,
          traceId,
        );
      }
      const verified = await verifyPasswordCredential({
        userState,
        subject,
        password: payload.credential.password!,
        now: Date.now(),
      });
      if (!verified.ok) {
        appendSecurityAuditEvent({
          ...loginAuditBase,
          action: "password_login",
          result: "blocked",
          message: verified.message,
          createdAt: new Date().toISOString(),
        });
        await store.saveUserState(userId, userState);
        return respondCredentialError(
          c,
          "LOGIN_FAILED",
          verified.message,
          verified.status,
          verified.protection,
        );
      }
      userId = verified.userId;
      credentialProtection = verified.protection;
      if (userId !== loginAuditBase.actorUserId) {
        userState = await store.getUserState(userId);
      }
    }

    if (loginMethod === "oauth") {
      const providerKey = sanitizeUserKey(payload.credential.provider!.toLowerCase());
      const stateStore = await store.getUserState(`oauth_state_${providerKey}`);
      const stateRecord = ensureAuthSecurityState(stateStore).oauthStatesByState[payload.credential.oauthState!];
      if (!stateRecord || stateRecord.provider !== payload.credential.provider || stateRecord.expiresAt <= Date.now()) {
        appendSecurityAuditEvent({
          ...loginAuditBase,
          action: "oauth_login",
          result: "blocked",
          message: "oauth state is invalid or expired",
          createdAt: new Date().toISOString(),
          reason: "oauth_state_invalid",
        });
        await store.saveUserState(userId, userState);
        c.status(400);
        return c.json({
          code: "LOGIN_FAILED",
          message: "oauth state is invalid or expired",
          credentialProtection: { failureReason: "oauth_state_invalid" },
        });
      }
      const validatedOAuth = await validateOAuthProviderCallback({
        c,
        provider: payload.credential.provider!,
        purpose: "login",
        state: payload.credential.oauthState!,
        providerToken: payload.credential.providerToken!,
        providerUserId: payload.credential.providerUserId!,
        platform: payload.platform,
      });
      if (!validatedOAuth.ok) {
        appendSecurityAuditEvent({
          ...loginAuditBase,
          action: "oauth_login",
          result: "blocked",
          message: "oauth provider validation failed",
          createdAt: new Date().toISOString(),
          reason: "oauth_token_invalid",
        });
        await store.saveUserState(userId, userState);
        return validatedOAuth.response;
      }
      const providerUserId = validatedOAuth.value.providerUserId;
      const now = Date.now();
      const providerSubject = createOAuthSubject(
        payload.credential.provider!,
        providerUserId,
      );
      const linked = await loadOAuthCredentialLink(
        store,
        payload.credential.provider!,
        providerUserId,
      );
      userId =
        linked.record && linked.record.authorizationStatus !== "unlinked"
          ? linked.record.userId
          : `user_oauth_${providerKey}_${sanitizeUserKey(providerUserId)}`;
      userState = await store.getUserState(userId);
      const tokenHash = await hashSecret(
        payload.credential.providerToken!,
        payload.credential.oauthState!,
      );
      const record = createOAuthCredentialRecord({
        provider: payload.credential.provider!,
        providerUserId,
        userId,
        tokenHash,
        now,
        ...(linked.record ? { existing: linked.record } : {}),
      });
      ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[providerSubject] = record;
      ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[providerSubject] = record;
      delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.credential.oauthState!];
      await store.saveUserState(`oauth_state_${providerKey}`, stateStore);
      await store.saveUserState(linked.indexUserId, linked.indexState);
    }

    const session = await store.createSession({
      platform: payload.platform,
      userId,
      authStatus: resolveAuthStatus(loginMethod),
      identity: resolveIdentity(payload, userId, loginMethod),
      loginMethod,
    });
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const abnormalLoginPrompt = securityDecision.prompt ?? resolveAbnormalLoginPrompt(payload, loginMethod);
    appendSecurityAuditEvent({
      userState,
      scope: "auth",
      action: `${loginMethod}_login`,
      result: securityDecision.riskDecision.level === "review" ? "review" : "allowed",
      message: `Login completed through ${loginMethod}.`,
      createdAt: new Date().toISOString(),
      actorUserId: userId,
      ...(securityDecision.riskDecision.deviceId ? { deviceId: securityDecision.riskDecision.deviceId } : {}),
      clientId,
      platform: payload.platform,
      ...(securityDecision.riskDecision.reason ? { reason: securityDecision.riskDecision.reason } : {}),
      ...(securityDecision.riskDecision.frequencyKey ? { frequencyKey: securityDecision.riskDecision.frequencyKey } : {}),
      ...(securityDecision.riskDecision.scene ? { scene: securityDecision.riskDecision.scene } : {}),
      traceId,
    });
    await store.saveUserState(userId, userState);
    const response: LoginResponse = createAuthResponseFromSession(session, c.req.url, {
      ...(abnormalLoginPrompt ? { abnormalLoginPrompt } : {}),
      ...(credentialProtection ? { credentialProtection } : {}),
      ...(redirectTarget ? { redirectTarget } : {}),
      ...(securityDecision.deviceIdentity ? { deviceIdentity: securityDecision.deviceIdentity } : {}),
      rateLimitState: rateLimitGuard.rateLimitState,
      riskDecision: securityDecision.riskDecision,
      securityAuditEvents: getRecentSecurityAuditEvents(userState),
    });

    return c.json(response);
  });

  app.post("/auth/refresh", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, refreshTokenRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const clientId = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const store = resolveStore(c.env);
    const refreshStateKey = `refresh_${sanitizeUserKey(clientId)}`;
    const refreshUserState = await store.getUserState(refreshStateKey);
    const refreshGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: refreshStateKey,
      userState: refreshUserState,
      action: "refresh",
      scope: "auth",
      platform: payload.platform,
      clientId,
      traceId,
      ...(authRateLimitConfig ? { config: authRateLimitConfig } : {}),
      ...(authRateLimitStore ? { counterStore: authRateLimitStore } : {}),
      blockedAction: "refresh_rate_limited",
      blockedMessage: "Too many refresh attempts. Retry later.",
    });
    setAuthRateLimitHeaders(c, {
      limited: !refreshGuard.allowed,
      limit: refreshGuard.rateLimitState.limit,
      remaining: refreshGuard.rateLimitState.remaining,
      resetAt: refreshGuard.rateLimitState.resetAt,
      retryAfterSeconds: refreshGuard.rateLimitState.retryAfterSeconds,
    });
    if (!refreshGuard.allowed) {
      logAuthEvent("refresh_rate_limited", {
        clientId,
        platform: payload.platform,
        retryAfterSeconds: refreshGuard.rateLimitState.retryAfterSeconds,
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return refreshGuard.response;
    }
    const session = await store.refreshSession(payload.platform, payload.refreshToken);
    if (!session) {
      logAuthEvent("refresh_failed", {
        clientId,
        platform: payload.platform,
        reason: "invalid_or_expired_refresh_token",
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return jsonError("UNAUTHORIZED", "Refresh token is invalid or expired.", 401, traceId);
    }
    const userState = await store.getUserState(session.userId);
    appendSecurityAuditEvent({
      userState,
      scope: "auth",
      action: "refresh_session",
      result: "allowed",
      message: "Session refresh completed.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);

    const response: RefreshTokenResponse = createAuthResponseFromSession(session, c.req.url, {
      rateLimitState: refreshGuard.rateLimitState,
      securityAuditEvents: getRecentSecurityAuditEvents(userState),
    });

    return c.json(response);
  });

  app.post("/auth/logout", async (c) => {
    const store = resolveStore(c.env);
    const token = resolveBearerToken(c.req.header("authorization"));
    const body = await c.req.json().catch(() => undefined);
    const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined;
    await store.revokeSession({
      ...(token ? { accessToken: token } : {}),
      ...(refreshToken ? { refreshToken } : {}),
    });
    return c.json({ loggedOut: true });
  });

  app.use("/auth/identity/*", requireSession);

  app.post("/auth/identity/upgrade", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, identityUpgradeSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    if (session.authStatus !== "guest" && !session.identity.anonymous) {
      const workflow = createIdentityWorkflow({
        kind: "guest_upgrade",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: resolveRedirectTarget(payload.redirectTarget),
        failureReason: "guest_session_required",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow }));
    }

    if (payload.credential.method === "phone_code") {
      if (!payload.credential.phoneNumber || !payload.credential.verificationCode) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with phone verification requires phone number and verification code", 400, traceId);
      }
    }

    if (payload.credential.method === "password") {
      if (!(payload.credential.account || payload.credential.phoneNumber) || !payload.credential.password) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with password requires an account identifier and password", 400, traceId);
      }
    }

    const store = resolveStore(c.env);
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const targetUserId = createUserIdFromUpgradeRequest(payload);
    const targetState = await store.getUserState(targetUserId);
    if (payload.credential.method === "phone_code") {
      const verified = await consumePhoneVerification({
        userState: targetState,
        phoneNumber: payload.credential.phoneNumber!,
        purpose: "guest_upgrade",
        verificationCode: payload.credential.verificationCode!,
        now: Date.now(),
      });
      await store.saveUserState(targetUserId, targetState);
      if (!verified.ok) {
        const workflow = createIdentityWorkflow({
          kind: "guest_upgrade",
          status: "blocked",
          sourceUserId: session.userId,
          continueTarget: redirectTarget,
          failureReason: "verification_code_invalid",
        });
        return c.json(
          createAuthResponseFromSession(session, c.req.url, {
            identityWorkflow: workflow,
            credentialProtection: verified.protection,
            redirectTarget,
          }),
        );
      }
    }

    if (payload.credential.method === "password") {
      const subject = createCredentialSubject(payload.credential);
      if (!subject) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with password requires an account identifier and password", 400, traceId);
      }
      const verified = await verifyPasswordCredential({
        userState: targetState,
        subject,
        password: payload.credential.password!,
        now: Date.now(),
      });
      await store.saveUserState(targetUserId, targetState);
      if (!verified.ok) {
        return respondCredentialError(c, "LOGIN_FAILED", verified.message, verified.status, verified.protection);
      }
    }
    const mergeCandidate = isMergeSampleIdentity(payload.credential);
    if (mergeCandidate && payload.mergeStrategy !== "merge") {
      const sourceState = await store.getUserState(session.userId);
      const workflowId = `identity_workflow_${crypto.randomUUID()}`;
      const targetLabel = `account ${targetUserId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId,
        targetLabel,
        sourceState,
        targetState,
      });
      const workflow = createIdentityWorkflow({
        kind: "guest_upgrade",
        status: "merge_required",
        workflowId,
        stage: "preview",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId,
        targetLabel,
        failureReason: "merge_confirmation_required",
        mergePreview,
        audit: [
          createIdentityAuditRecord({
            action: "preview_created",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId,
            message: "Guest upgrade merge preview created.",
          }),
          createIdentityAuditRecord({
            action: "merge_required",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId,
            message: "Guest upgrade requires explicit merge confirmation.",
          }),
        ],
      });
      sourceState.pendingIdentityWorkflow = workflow;
      sourceState.lastIdentityWorkflow = workflow;
      if (payload.credential.phoneNumber) {
        sourceState.boundPhoneNumber = payload.credential.phoneNumber;
      }
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }));
    }

    const sourceState = await store.getUserState(session.userId);
    const workflowId = sourceState.pendingIdentityWorkflow?.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
    const targetLabel = `account ${targetUserId}`;
    const mergePreview = createMergePreview({
      sourceUserId: session.userId,
      targetUserId,
      targetLabel,
      sourceState,
      targetState,
    });
    const workflow = createIdentityWorkflow({
      kind: "guest_upgrade",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId,
      targetLabel,
      mergePreview,
      audit: [
        ...(sourceState.pendingIdentityWorkflow?.audit ?? []),
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId,
          message: "Guest upgrade completed with rollback-safe state merge.",
        }),
      ],
    });
    const nextState = mergeUserStates(targetState, {
      ...sourceState,
      lastIdentityWorkflow: workflow,
      ...(payload.credential.phoneNumber ? { boundPhoneNumber: payload.credential.phoneNumber } : {}),
    });
    delete nextState.pendingIdentityWorkflow;
    nextState.lastIdentityWorkflow = workflow;
    if (payload.credential.phoneNumber) {
      nextState.boundPhoneNumber = payload.credential.phoneNumber;
    }
    await store.saveUserState(targetUserId, nextState);
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = workflow;
    await store.saveUserState(session.userId, sourceState);
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: targetUserId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        anonymous: false,
        phoneBound: Boolean(payload.credential.phoneNumber),
        wechatBound: session.platform === "wechat" || Boolean(session.identity.wechatBound),
      },
      loginMethod: payload.credential.method,
    });
    const response: IdentityTransitionResponse = {
      ...createAuthResponseFromSession(nextSession, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }),
      identityWorkflow: workflow,
    };
    return c.json(response);
  });

  app.post("/auth/identity/bind-phone", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, identityBindPhoneSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    if (!(session.identity.wechatBound || session.platform === "wechat")) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "wechat_binding_required",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    if (session.identity.phoneBound) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "conflict",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "phone_already_bound",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    const store = resolveStore(c.env);
    const targetUserId = createUserIdFromCredential({
      method: "phone_code",
      phoneNumber: payload.phoneNumber,
    });
    const targetState = await store.getUserState(targetUserId);
    const verified = await consumePhoneVerification({
      userState: targetState,
      phoneNumber: payload.phoneNumber,
      purpose: "phone_binding",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    await store.saveUserState(targetUserId, targetState);
    if (!verified.ok) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "verification_code_invalid",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, {
        identityWorkflow: workflow,
        credentialProtection: verified.protection,
        redirectTarget,
      }));
    }
    const mergeCandidate = isMergeSampleIdentity({ phoneNumber: payload.phoneNumber }) && targetUserId !== session.userId;
    if (mergeCandidate && payload.mergeStrategy !== "merge") {
      const sourceState = await store.getUserState(session.userId);
      const workflowId = `identity_workflow_${crypto.randomUUID()}`;
      const targetLabel = `account ${targetUserId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId,
        targetLabel,
        sourceState,
        targetState,
      });
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "merge_required",
        workflowId,
        stage: "preview",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId,
        targetLabel,
        failureReason: "merge_confirmation_required",
        mergePreview,
        audit: [
          createIdentityAuditRecord({
            action: "preview_created",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId,
            message: "Phone binding merge preview created.",
          }),
          createIdentityAuditRecord({
            action: "merge_required",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId,
            message: "Phone binding requires explicit merge confirmation.",
          }),
        ],
      });
      sourceState.pendingIdentityWorkflow = workflow;
      sourceState.lastIdentityWorkflow = workflow;
      sourceState.boundPhoneNumber = payload.phoneNumber;
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }));
    }

    const sourceState = await store.getUserState(session.userId);
    const workflowId = sourceState.pendingIdentityWorkflow?.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
    const targetLabel = `account ${session.userId}`;
    const mergePreview = createMergePreview({
      sourceUserId: session.userId,
      targetUserId: session.userId,
      targetLabel,
      sourceState,
      targetState: sourceState,
      requiresConfirmation: false,
      recoveryMessage:
        "Phone binding completed on the current account; no cross-account merge was required.",
    });
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = createIdentityWorkflow({
      kind: "phone_binding",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId: session.userId,
      targetLabel,
      mergePreview,
      audit: [
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: session.userId,
          message: "Phone binding completed without cross-account merge.",
        }),
      ],
    });
    sourceState.boundPhoneNumber = payload.phoneNumber;
    await store.saveUserState(session.userId, sourceState);
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: session.userId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        anonymous: false,
        phoneBound: true,
        wechatBound: true,
        ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
      },
      loginMethod: session.loginMethod ?? "wechat_code",
    });
    const workflow = sourceState.lastIdentityWorkflow;
    const response: IdentityTransitionResponse = {
      ...createAuthResponseFromSession(nextSession, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }),
      identityWorkflow: workflow,
    };
    return c.json(response);
  });

  app.post("/auth/identity/bind-oauth", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, identityBindOAuthSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const store = resolveStore(c.env);
    const providerKey = sanitizeUserKey(payload.provider.toLowerCase());
    const stateUserId = `oauth_state_${providerKey}`;
    const stateStore = await store.getUserState(stateUserId);
    const stateRecord = ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    if (!stateRecord || stateRecord.provider !== payload.provider || stateRecord.expiresAt <= Date.now()) {
      c.status(400);
      return c.json({
        code: "LOGIN_FAILED",
        message: "oauth state is invalid or expired",
        credentialProtection: { failureReason: "oauth_state_invalid" },
      });
    }

    if (stateRecord.purpose === "bind" && stateRecord.ownerUserId && stateRecord.ownerUserId !== session.userId) {
      return jsonError("FORBIDDEN", "oauth authorization state belongs to another account session", 403, traceId);
    }
    const validatedOAuth = await validateOAuthProviderCallback({
      c,
      provider: payload.provider,
      purpose: "bind",
      state: payload.state,
      providerToken: payload.providerToken,
      providerUserId: payload.providerUserId,
      platform: session.platform,
    });
    if (!validatedOAuth.ok) {
      return validatedOAuth.response;
    }
    const providerLabel = validatedOAuth.value.providerLabel;
    const providerUserId = validatedOAuth.value.providerUserId;
    const linked = await loadOAuthCredentialLink(store, payload.provider, providerUserId);
    const sourceState = await store.getUserState(session.userId);
    const tokenHash = await hashSecret(payload.providerToken, payload.state);
    if (linked.record && linked.record.userId !== session.userId && linked.record.authorizationStatus !== "unlinked") {
      const targetState = await store.getUserState(linked.record.userId);
      const workflowId = `identity_workflow_${crypto.randomUUID()}`;
      const targetLabel = `${providerLabel} account ${linked.record.userId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId: linked.record.userId,
        targetLabel,
        sourceState,
        targetState,
      });
      const workflow = createIdentityWorkflow({
        kind: "oauth_binding",
        status: payload.mergeStrategy === "merge" ? "completed" : "merge_required",
        workflowId,
        stage: payload.mergeStrategy === "merge" ? "completed" : "preview",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId: linked.record.userId,
        targetLabel,
        ...(payload.mergeStrategy === "merge" ? {} : { failureReason: "merge_confirmation_required" }),
        mergePreview,
        audit: [
          createIdentityAuditRecord({
            action: "preview_created",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: linked.record.userId,
            message: "OAuth provider binding merge preview created.",
          }),
          createIdentityAuditRecord({
            action: payload.mergeStrategy === "merge" ? "merge_completed" : "merge_required",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: linked.record.userId,
            message:
              payload.mergeStrategy === "merge"
                ? "OAuth provider binding completed through account merge."
                : "OAuth provider binding requires explicit merge confirmation.",
          }),
        ],
      });

      if (payload.mergeStrategy !== "merge") {
        sourceState.pendingIdentityWorkflow = workflow;
        sourceState.lastIdentityWorkflow = workflow;
        appendSecurityAuditEvent({
          userState: sourceState,
          scope: "auth",
          action: "oauth_bind_merge_required",
          result: "review",
          message: `${providerLabel} is already linked to another account and needs merge confirmation.`,
          createdAt: new Date().toISOString(),
          actorUserId: session.userId,
          platform: session.platform,
          traceId,
        });
        await store.saveUserState(session.userId, sourceState);
        return c.json(
          createAuthResponseFromSession(session, c.req.url, {
            identityWorkflow: workflow,
            redirectTarget,
          }),
        );
      }

      const nextState = mergeUserStates(targetState, {
        ...sourceState,
        lastIdentityWorkflow: workflow,
      });
      const record = createOAuthCredentialRecord({
        provider: payload.provider,
        providerUserId,
        userId: linked.record.userId,
        tokenHash,
        now: Date.now(),
        ...(linked.record ? { existing: linked.record } : {}),
      });
      ensureAuthSecurityState(nextState).oauthCredentialsByProviderSubject[linked.subject] = record;
      ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] = record;
      delete nextState.pendingIdentityWorkflow;
      nextState.lastIdentityWorkflow = workflow;
      appendSecurityAuditEvent({
        userState: nextState,
        scope: "auth",
        action: "oauth_bind_merge_completed",
        result: "allowed",
        message: `${providerLabel} binding completed through account merge.`,
        createdAt: new Date().toISOString(),
        actorUserId: linked.record.userId,
        platform: session.platform,
        traceId,
      });
      await store.saveUserState(linked.record.userId, nextState);
      await store.saveUserState(linked.indexUserId, linked.indexState);
      delete sourceState.pendingIdentityWorkflow;
      sourceState.lastIdentityWorkflow = workflow;
      await store.saveUserState(session.userId, sourceState);
      delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
      await store.saveUserState(stateUserId, stateStore);
      await store.revokeSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      const nextSession = await store.createSession({
        platform: session.platform,
        userId: linked.record.userId,
        profile: session.profile,
        authStatus: "authenticated",
        identity: {
          userId: linked.record.userId,
          ...(session.identity.phoneBound ? { phoneBound: true } : {}),
          ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
        },
        loginMethod: "oauth",
      });
      const response: IdentityTransitionResponse = {
        ...createAuthResponseFromSession(nextSession, c.req.url, {
          identityWorkflow: workflow,
          redirectTarget,
        }),
        identityWorkflow: workflow,
      };
      return c.json(response);
    }

    const workflowId = `identity_workflow_${crypto.randomUUID()}`;
    const workflow = createIdentityWorkflow({
      kind: "oauth_binding",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId: session.userId,
      targetLabel: `${providerLabel} linked`,
      audit: [
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: session.userId,
          message: "OAuth provider linked to the current account.",
        }),
      ],
    });
    const record = createOAuthCredentialRecord({
      provider: payload.provider,
      providerUserId,
      userId: session.userId,
      tokenHash,
      now: Date.now(),
      ...(linked.record ? { existing: linked.record } : {}),
    });
    ensureAuthSecurityState(sourceState).oauthCredentialsByProviderSubject[linked.subject] = record;
    ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] = record;
    delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    sourceState.lastIdentityWorkflow = workflow;
    appendSecurityAuditEvent({
      userState: sourceState,
      scope: "auth",
      action: "oauth_bind",
      result: "allowed",
      message: `${providerLabel} linked to the current account.`,
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, sourceState);
    await store.saveUserState(linked.indexUserId, linked.indexState);
    await store.saveUserState(stateUserId, stateStore);
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: session.userId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        userId: session.userId,
        ...(session.identity.phoneBound ? { phoneBound: true } : {}),
        ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
      },
      loginMethod: "oauth",
    });
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const response: IdentityTransitionResponse = {
      ...createAuthResponseFromSession(nextSession, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }),
      identityWorkflow: workflow,
    };
    return c.json(response);
  });

  app.post("/auth/identity/merge", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, identityMergeSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const store = resolveStore(c.env);
    const sourceState = await store.getUserState(session.userId);
    const pendingWorkflow = sourceState.pendingIdentityWorkflow;

    if (!payload.confirm) {
      const workflowId = pendingWorkflow?.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
      const workflow = createIdentityWorkflow({
        kind: payload.workflowKind ?? pendingWorkflow?.kind ?? "account_merge",
        status: "blocked",
        workflowId,
        stage: "failed",
        sourceUserId: session.userId,
        continueTarget: redirectTarget ?? pendingWorkflow?.continueTarget,
        targetUserId: payload.targetUserId,
        targetLabel: `account ${payload.targetUserId}`,
        failureReason: "merge_confirmation_required",
        ...(pendingWorkflow?.mergePreview ? { mergePreview: pendingWorkflow.mergePreview } : {}),
        audit: [
          ...(pendingWorkflow?.audit ?? []),
          createIdentityAuditRecord({
            action: "merge_blocked",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "Account merge was cancelled before explicit confirmation.",
          }),
          createIdentityAuditRecord({
            action: "rollback_safe_failure",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "No account data was changed because the merge was not confirmed.",
          }),
        ],
      });
      sourceState.lastIdentityWorkflow = workflow;
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    if (!pendingWorkflow || pendingWorkflow.targetUserId !== payload.targetUserId) {
      const targetState = await store.getUserState(payload.targetUserId);
      const workflowId = pendingWorkflow?.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
      const targetLabel = `account ${payload.targetUserId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId: payload.targetUserId,
        targetLabel,
        sourceState,
        targetState,
      });
      const workflow = createIdentityWorkflow({
        kind: payload.workflowKind ?? "account_merge",
        status: "blocked",
        workflowId,
        stage: "failed",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId: payload.targetUserId,
        targetLabel,
        failureReason: "merge_target_mismatch",
        mergePreview,
        audit: [
          ...(pendingWorkflow?.audit ?? []),
          createIdentityAuditRecord({
            action: "merge_blocked",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "Account merge target did not match the pending identity workflow.",
          }),
          createIdentityAuditRecord({
            action: "rollback_safe_failure",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "No account data was changed because the pending workflow target did not match.",
          }),
        ],
      });
      sourceState.lastIdentityWorkflow = workflow;
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    const targetState = await store.getUserState(payload.targetUserId);
    const workflowId = pendingWorkflow.workflowId ?? `identity_workflow_${crypto.randomUUID()}`;
    const targetLabel = `account ${payload.targetUserId}`;
    const mergePreview = pendingWorkflow.mergePreview ?? createMergePreview({
      sourceUserId: session.userId,
      targetUserId: payload.targetUserId,
      targetLabel,
      sourceState,
      targetState,
    });
    const workflow = createIdentityWorkflow({
      kind: pendingWorkflow.kind === "oauth_binding" ? "oauth_binding" : "account_merge",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget ?? pendingWorkflow.continueTarget,
      targetUserId: payload.targetUserId,
      targetLabel,
      mergePreview,
      audit: [
        ...(pendingWorkflow.audit ?? []),
        createIdentityAuditRecord({
          action: "merge_confirmed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: payload.targetUserId,
          message: "Account merge was explicitly confirmed by the source session.",
        }),
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: payload.targetUserId,
          message: "Account merge completed with rollback-safe target state persistence.",
        }),
      ],
    });
    const nextState = mergeUserStates(targetState, {
      ...sourceState,
      lastIdentityWorkflow: workflow,
    });
    delete nextState.pendingIdentityWorkflow;
    nextState.lastIdentityWorkflow = workflow;
    await store.saveUserState(payload.targetUserId, nextState);
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = workflow;
    await store.saveUserState(session.userId, sourceState);
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: payload.targetUserId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        anonymous: false,
        ...((Boolean(nextState.boundPhoneNumber) || session.identity.phoneBound !== undefined)
          ? { phoneBound: Boolean(nextState.boundPhoneNumber) || Boolean(session.identity.phoneBound) }
          : {}),
        wechatBound: Boolean(session.identity.wechatBound || session.platform === "wechat"),
        ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
        mergedUserId: session.userId,
      },
      loginMethod: session.loginMethod ?? "wechat_code",
    });
    const response: IdentityTransitionResponse = {
      ...createAuthResponseFromSession(nextSession, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget: redirectTarget ?? pendingWorkflow.continueTarget,
      }),
      identityWorkflow: workflow,
    };
    return c.json(response);
  });
}
