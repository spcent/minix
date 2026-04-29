import type { RefreshTokenResponse } from "@minix/contracts";

import { resolveBearerToken } from "../../http/auth";
import { jsonError } from "../../http/response";
import { getRouteTraceId, loadRouteClientContext, parseRouteBody } from "../../http/route-context";
import { resolveClientId } from "../../rate-limit";
import { createAuthResponseFromSession } from "./session";
import type { RegisterAuthRoutesOptions } from "./routes";
import { logoutRequestSchema, refreshTokenRequestSchema } from "./schemas";
import {
  appendSecurityAuditEvent,
  getRecentSecurityAuditEvents,
  guardSecurityRateLimit,
  logAuthEvent,
  resolveRequestDeviceId,
  sanitizeUserKey,
  setAuthRateLimitHeaders,
} from "./security";

export function registerAuthSessionRoutes(
  options: Pick<RegisterAuthRoutesOptions, "app" | "resolveStore" | "authRateLimitConfig" | "authRateLimitStore">,
) {
  const { app, resolveStore, authRateLimitConfig, authRateLimitStore } = options;

  app.post("/auth/refresh", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, refreshTokenRequestSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { clientId } = loadRouteClientContext(c, resolveClientId, resolveRequestDeviceId);
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
    const body = await parseRouteBody(c, logoutRequestSchema);
    if (body instanceof Response) {
      return body;
    }
    await store.revokeSession({
      ...(token ? { accessToken: token } : {}),
      ...(body.refreshToken ? { refreshToken: body.refreshToken } : {}),
    });
    return c.json({ loggedOut: true });
  });
}
