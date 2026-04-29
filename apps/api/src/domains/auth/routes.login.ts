import type { LoginResponse } from "@minix/contracts";

import { jsonError } from "../../http/response";
import { getRouteTraceId, loadRouteClientContext, parseRouteBody } from "../../http/route-context";
import { resolveClientId } from "../../rate-limit";
import { createUserIdFromLogin, resolveAuthStatus, resolveIdentity } from "./identity";
import { validateOAuthProviderCallback } from "./route-provider";
import { respondCredentialError } from "./route-responses";
import type { RegisterAuthRoutesOptions } from "./routes";
import { loginRequestSchema } from "./schemas";
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
  createOAuthSubject,
  ensureAuthSecurityState,
  evaluateSecurityDecision,
  getRecentSecurityAuditEvents,
  guardSecurityRateLimit,
  hashSecret,
  loadOAuthCredentialLink,
  logAuthEvent,
  resolveRequestDeviceId,
  sanitizeUserKey,
  setAuthRateLimitHeaders,
  verifyPasswordCredential,
} from "./security";

export function registerAuthLoginRoutes(
  options: Pick<
    RegisterAuthRoutesOptions,
    "app" | "resolveStore" | "authRateLimitConfig" | "authRateLimitStore" | "authOAuthProvider"
  >,
) {
  const { app, resolveStore, authRateLimitConfig, authRateLimitStore, authOAuthProvider } = options;

  app.post("/auth/login", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, loginRequestSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { clientId } = loadRouteClientContext(c, resolveClientId, resolveRequestDeviceId);
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
      const validatedOAuth = await validateOAuthProviderCallback(
        {
          c,
          provider: payload.credential.provider!,
          purpose: "login",
          state: payload.credential.oauthState!,
          providerToken: payload.credential.providerToken!,
          providerUserId: payload.credential.providerUserId!,
          platform: payload.platform,
        },
        authOAuthProvider,
      );
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

}
