import type { AuthOAuthAuthorizeResponse, AuthOAuthCallbackResponse } from "@minix/contracts";

import { resolveBearerSession } from "../../http/auth";
import { getRouteTraceId, parseRouteBody } from "../../http/route-context";
import { resolveOAuthProviderMode, validateOAuthProviderCallback } from "./route-provider";
import { createOAuthProviderFailureResponse, createProviderUnavailableResponse } from "./route-responses";
import { createAuthResponseFromSession, resolveRedirectTarget } from "./session";
import type { RegisterAuthRoutesOptions } from "./routes";
import { oauthAuthorizeSchema, oauthCallbackSchema } from "./schemas";
import {
  createOAuthCredentialRecord,
  createOAuthProviderLabel,
  createOAuthSubject,
  ensureAuthSecurityState,
  hashSecret,
  loadOAuthCredentialLink,
  OAUTH_STATE_TTL_MS,
  sanitizeUserKey,
} from "./security";

export function registerAuthOAuthRoutes(
  options: Pick<RegisterAuthRoutesOptions, "app" | "resolveStore" | "authOAuthProvider">,
) {
  const { app, resolveStore, authOAuthProvider } = options;

  app.post("/auth/oauth/authorize", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, oauthAuthorizeSchema);
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
    const bindSession =
      payload.purpose === "bind"
        ? await resolveBearerSession(c.req.header("authorization"), store)
        : undefined;
    ensureAuthSecurityState(stateStore).oauthStatesByState[state] = {
      provider: payload.provider,
      state,
      ...(payload.purpose ? { purpose: payload.purpose } : {}),
      ...(bindSession?.accessToken
        ? { ownerUserId: bindSession.session?.userId ?? "__deferred__" }
        : {}),
      expiresAt,
      createdAt: Date.now(),
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      ...(redirectTarget ? { redirectTarget } : {}),
    };
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
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, oauthCallbackSchema);
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

    const validatedOAuth = await validateOAuthProviderCallback(
      {
        c,
        provider: payload.provider,
        state: payload.state,
        providerToken: payload.providerToken,
        providerUserId: payload.providerUserId,
        platform: payload.platform,
      },
      authOAuthProvider,
    );
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

}
