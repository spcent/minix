import assert from "node:assert/strict";
import test from "node:test";

import { createAuthRedirectParams, ok, type AppKernel, type Result, type UserSession } from "@minix/core";
import type { ExchangeTokenInput } from "@minix/core";
import type { IdentityTransitionResponse } from "@minix/contracts";

import { createAuthController } from "./index";

function createSession(
  overrides: Partial<UserSession> & { token?: NonNullable<UserSession["token"]> } = {},
): UserSession {
  return {
    identity: { userId: "user_1" },
    loggedIn: true,
    platform: "h5" as const,
    token: {
      accessToken: "token_1",
      ...(overrides?.token ?? {}),
    },
    ...overrides,
  };
}

function createKernelStub() {
  const routeCalls: string[] = [];
  const requestCalls: Array<{ url: string; body: unknown }> = [];
  const exchangeCalls: ExchangeTokenInput[] = [];
  const loginCalls: Array<{ redirectTarget?: unknown } | undefined> = [];
  let currentParams: Record<string, string | number | boolean> | undefined;
  let sessionValue: UserSession | null = createSession();
  let refreshResult: Result<UserSession> = ok(
    createSession({ token: { accessToken: "token_2", refreshToken: "refresh_1" } }),
  );
  let refreshCalls = 0;
  let clearCalls = 0;
  let exchangeResult: Result<UserSession> = ok(
    createSession({
      identity: {
        userId: "guest_1",
        anonymous: true,
        loginMethod: "guest",
      },
      authStatus: "guest",
    }),
  );
  let transitionResult: Result<IdentityTransitionResponse> = ok({
    userId: "user_upgrade_1",
    accessToken: "token_upgrade_1",
    refreshToken: "refresh_upgrade_1",
    expiresAt: Date.now() + 60_000,
    session: {
      accessToken: "token_upgrade_1",
      refreshToken: "refresh_upgrade_1",
      expiresAt: Date.now() + 60_000,
      issuedAt: Date.now(),
      tokenType: "Bearer",
    },
    identity: {
      userId: "user_upgrade_1",
      phoneBound: true,
      loginMethod: "phone_code",
    },
    authStatus: "authenticated" as const,
    loginMethod: "phone_code" as const,
    identityWorkflow: {
      kind: "guest_upgrade" as const,
      status: "completed" as const,
      sourceUserId: "guest_1",
      targetUserId: "user_upgrade_1",
      message: "The guest session has been upgraded to a formal account.",
    },
  });

  const kernel = {
    env: {
      platform: "h5",
    },
    auth: {
      async login(input?: { redirectTarget?: unknown }) {
        loginCalls.push(input);
        return ok(createSession());
      },
      async exchangeToken(input: ExchangeTokenInput) {
        exchangeCalls.push(input);
        return exchangeResult;
      },
      async ensureLogin() {
        return ok(createSession());
      },
      async refreshSession() {
        refreshCalls += 1;
        return refreshResult;
      },
    },
    session: {
      async get() {
        return ok(sessionValue);
      },
      async set(nextSession: UserSession) {
        sessionValue = nextSession;
        return ok(undefined);
      },
      async clear() {
        sessionValue = null;
        clearCalls += 1;
        return ok(undefined);
      },
    },
    request: {
      async get<T>() {
        return ok({} as T);
      },
      async post<T>(url: string, body: unknown) {
        requestCalls.push({ url, body });
        return transitionResult as Result<T>;
      },
      async put<T>() {
        return ok({} as T);
      },
      async patch<T>() {
        return ok({} as T);
      },
      async delete<T>() {
        return ok({} as T);
      },
    },
    router: {
      async toRoute(routeId: string, params?: Record<string, string | number | boolean>) {
        routeCalls.push(params ? `to:${routeId}:${JSON.stringify(params)}` : `to:${routeId}`);
        return ok(undefined);
      },
      async to(path: string, params?: Record<string, string | number | boolean>) {
        routeCalls.push(params ? `path:${path}:${JSON.stringify(params)}` : `path:${path}`);
        return ok(undefined);
      },
      async replaceRoute(routeId: string, params?: Record<string, string | number | boolean>) {
        routeCalls.push(params ? `replace:${routeId}:${JSON.stringify(params)}` : `replace:${routeId}`);
        return ok(undefined);
      },
      current() {
        return ok(currentParams ? { path: "/", params: currentParams } : { path: "/" });
      },
    },
  } as unknown as AppKernel;

  return {
    kernel,
    routeCalls,
    setCurrentParams(params?: Record<string, string | number | boolean>) {
      currentParams = params;
    },
    setSession(nextSession: ReturnType<typeof createSession> | null) {
      sessionValue = nextSession;
    },
    setRefreshResult(nextResult: Result<UserSession>) {
      refreshResult = nextResult;
    },
    setExchangeResult(nextResult: Result<UserSession>) {
      exchangeResult = nextResult;
    },
    setTransitionResult(nextResult: Result<IdentityTransitionResponse>) {
      transitionResult = nextResult;
    },
    get refreshCalls() {
      return refreshCalls;
    },
    get clearCalls() {
      return clearCalls;
    },
    get requestCalls() {
      return requestCalls;
    },
    get exchangeCalls() {
      return exchangeCalls;
    },
    get loginCalls() {
      return loginCalls;
    },
  };
}

test("auth controller can stay on home after a successful login while updating authenticated state", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createAuthController({
    kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  controller.setLoginMethod("wechat_code");
  const result = await controller.submitLogin();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(controller.store.getState().authenticated, true);
  assert.equal(controller.store.getState().redirectTarget, null);
  assert.deepEqual(routeCalls, []);
});

test("auth controller shows a protected-page notice after redirecting back home", async () => {
  const runtime = createKernelStub();
  runtime.setCurrentParams({ from: "overview", reason: "auth-required" });
  runtime.setSession(null);
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  const result = await controller.restoreSession();

  assert.deepEqual(result, { ok: true, value: false });
  assert.equal(controller.store.getState().authenticated, false);
  assert.equal(controller.store.getState().noticeMessage, "Return to Home and sign in to open Overview.");
  assert.equal(controller.store.getState().redirectTarget, "overview");
  assert.equal(controller.store.getState().selectedLoginMethod, "wechat_code");
});

test("auth controller silently refreshes an expired session before routing to the protected destination", async () => {
  const runtime = createKernelStub();
  runtime.setCurrentParams({ from: "plan", reason: "auth-required" });
  runtime.setSession(
    createSession({
      token: {
        accessToken: "expired_token",
        refreshToken: "refresh_1",
        expiresAt: Date.now() - 10_000,
      },
    }),
  );
  runtime.setRefreshResult(
    ok(
      createSession({
        token: {
          accessToken: "token_2",
          refreshToken: "refresh_1",
          expiresAt: Date.now() + 10_000,
        },
      }),
    ),
  );
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "items.list",
  });

  const result = await controller.restoreSession();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(runtime.refreshCalls, 1);
  assert.deepEqual(runtime.routeCalls, ["replace:items.list"]);
  assert.equal(controller.store.getState().authenticated, true);
  assert.equal(controller.store.getState().authStatus, "authenticated");
  assert.equal(controller.store.getState().noticeMessage, null);
});

test("auth controller clears an expired session after refresh token expiry and keeps the sign-in notice", async () => {
  const runtime = createKernelStub();
  runtime.setCurrentParams({ from: "overview", reason: "auth-required" });
  runtime.setSession(
    createSession({
      token: {
        accessToken: "expired_token",
        refreshToken: "refresh_1",
        expiresAt: Date.now() - 10_000,
      },
    }),
  );
  runtime.setRefreshResult({
    ok: false,
    error: {
      code: "TOKEN_EXPIRED",
      message: "refresh expired",
      recoverable: true,
    },
  });
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  const result = await controller.restoreSession();

  assert.deepEqual(result, { ok: true, value: false });
  assert.equal(runtime.refreshCalls, 1);
  assert.equal(runtime.clearCalls, 1);
  assert.equal(controller.store.getState().authenticated, false);
  assert.equal(controller.store.getState().errorMessage, null);
  assert.equal(controller.store.getState().noticeMessage, "Return to Home and sign in to open Overview.");
});

test("auth controller validates phone-code credentials before submission", async () => {
  const { kernel } = createKernelStub();
  const controller = createAuthController({
    kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  controller.setLoginMethod("phone_code");
  const result = await controller.submitSelectedLogin();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(controller.store.getState().fieldErrors.phoneNumber, "Phone number is required.");
  assert.equal(controller.store.getState().fieldErrors.verificationCode, "Verification code is required.");
});

test("auth controller submits a phone-code login through exchangeToken", async () => {
  const runtime = createKernelStub();
  runtime.setExchangeResult(
    ok(
      createSession({
        identity: {
          userId: "user_phone_0001",
          phoneBound: true,
          loginMethod: "phone_code",
        },
        authStatus: "authenticated",
      }),
    ),
  );
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  controller.setLoginMethod("phone_code");
  controller.updateCredentials({
    phoneNumber: "13800000001",
    verificationCode: "123456",
  });
  const result = await controller.submitSelectedLogin();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(controller.store.getState().authenticated, true);
  assert.equal(controller.store.getState().authStatus, "authenticated");
  assert.equal(controller.store.getState().lastLoginMethod, "phone_code");
});

test("auth controller surfaces rate-limited login feedback from structured errors", async () => {
  const runtime = createKernelStub();
  runtime.setExchangeResult({
    ok: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many login attempts. Retry later.",
      recoverable: true,
      detail: {
        retryAfterSeconds: 60,
      },
    },
  });
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  controller.setLoginMethod("password");
  controller.updateCredentials({
    account: "minix-demo",
    password: "wrong-pass",
  });
  const result = await controller.submitSelectedLogin();

  assert.equal(result.ok, false);
  assert.equal(controller.store.getState().rateLimitMessage, "Too many login attempts. Retry in 60 seconds.");
  assert.equal(controller.store.getState().retryAfterSeconds, 60);
});

test("auth controller keeps abnormal-login prompts from successful credential login", async () => {
  const runtime = createKernelStub();
  runtime.setExchangeResult(
    ok(
      createSession({
        identity: {
          userId: "user_password_demo",
          phoneBound: true,
          loginMethod: "password",
        },
        authStatus: "authenticated",
        abnormalLoginPrompt: {
          title: "Unusual sign-in detected",
          message: "Review this sign-in before continuing.",
          severity: "warning",
          acknowledgeRequired: true,
        },
      }),
    ),
  );
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  controller.setLoginMethod("password");
  controller.updateCredentials({
    account: "minix-demo",
    password: "minix-demo-pass",
  });
  await controller.submitSelectedLogin();

  assert.equal(controller.store.getState().abnormalLoginPrompt?.title, "Unusual sign-in detected");
  controller.clearAbnormalLoginPrompt();
  assert.equal(controller.store.getState().abnormalLoginPrompt, null);
});

test("auth controller treats oauth as a credential-driven flow with callback state", async () => {
  const runtime = createKernelStub();
  runtime.setExchangeResult({
    ok: false,
    error: {
      code: "LOGIN_FAILED",
      message: "oauth state is invalid or expired",
      recoverable: true,
    },
  });
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  controller.setLoginMethod("oauth");
  controller.updateCredentials({
    provider: "wechat-open-platform",
    providerToken: "oauth-token-valid",
    providerUserId: "provider-user-1",
    oauthState: "oauth_state_1",
  });
  const result = await controller.submitSelectedLogin();

  assert.equal(result.ok, false);
  assert.equal(controller.store.getState().errorMessage, "oauth state is invalid or expired");
});

test("auth controller can route from home to overview, plan, and settings after login", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createAuthController({
    kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
    overviewRouteId: "overview.index",
    planRouteId: "items.list",
    settingsRouteId: "settings.index",
  });

  await controller.goToOverview();
  await controller.goToPlan();
  await controller.goToSettings();

  assert.deepEqual(routeCalls, ["to:overview.index", "to:items.list", "to:settings.index"]);
});

test("auth controller can continue to the protected destination after sign-in", async () => {
  const runtime = createKernelStub();
  runtime.setCurrentParams({ from: "plan", reason: "auth-required" });
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
    overviewRouteId: "overview.index",
    planRouteId: "items.list",
    settingsRouteId: "settings.index",
  });

  await controller.restoreSession();
  await controller.submitLogin();
  const result = await controller.goToRedirectTarget();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(runtime.routeCalls, ["to:items.list"]);
  assert.equal(controller.store.getState().redirectTarget, null);
});

test("auth controller preserves generic protected route ids and force-reauth metadata", async () => {
  const runtime = createKernelStub();
  runtime.setCurrentParams(
    createAuthRedirectParams({
      routeId: "messages.index",
      path: "/inbox",
      params: {
        threadId: "support_1",
        source: "push",
      },
      source: "messages",
      label: "Inbox",
      reason: "force-relogin",
      forceReauth: true,
    })!,
  );
  runtime.setSession(null);
  runtime.setExchangeResult(
    ok(
      createSession({
        identity: {
          userId: "user_phone_0001",
          phoneBound: true,
          loginMethod: "phone_code",
        },
        authStatus: "authenticated",
      }),
    ),
  );
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  await controller.restoreSession();
  controller.setLoginMethod("phone_code");
  controller.updateCredentials({
    phoneNumber: "13800000001",
    verificationCode: "123456",
  });
  await controller.submitSelectedLogin();
  const result = await controller.goToRedirectTarget();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(runtime.exchangeCalls[0]?.redirectTarget, {
    routeId: "messages.index",
    path: "/inbox",
    params: {
      threadId: "support_1",
      source: "push",
    },
    source: "messages",
    label: "Inbox",
    reason: "force-relogin",
    forceReauth: true,
  });
  assert.deepEqual(runtime.routeCalls, ['to:messages.index:{"threadId":"support_1","source":"push"}']);
  assert.equal(controller.store.getState().redirectTarget, null);
});

test("auth controller recovers share-entry path returns without a source-specific route map", async () => {
  const runtime = createKernelStub();
  runtime.setCurrentParams(
    createAuthRedirectParams({
      path: "/media-tools",
      params: {
        scenario: "invite",
        shareToken: "share_1",
      },
      source: "media-tools",
      label: "Media Tools",
      reason: "auth-required",
    })!,
  );
  runtime.setSession(null);
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "auth.login",
    stayOnSuccess: true,
  });

  await controller.restoreSession();
  const result = await controller.goToRedirectTarget();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(runtime.routeCalls, ['path:/media-tools:{"scenario":"invite","shareToken":"share_1"}']);
});

test("auth controller can upgrade a guest session into a formal account", async () => {
  const runtime = createKernelStub();
  runtime.setSession(
    createSession({
      identity: {
        userId: "guest_1",
        anonymous: true,
        loginMethod: "guest",
      },
      authStatus: "guest",
    }),
  );
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "items.list",
    stayOnSuccess: true,
  });

  controller.setLoginMethod("phone_code");
  controller.updateCredentials({
    phoneNumber: "13800000022",
    verificationCode: "123456",
  });
  const result = await controller.submitIdentityUpgrade();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(runtime.requestCalls[0]?.url, "/auth/identity/upgrade");
  assert.equal(controller.store.getState().authenticated, true);
  assert.equal(controller.store.getState().identityWorkflow?.status, "completed");
  assert.equal(controller.store.getState().lastLoginMethod, "phone_code");
});

test("auth controller keeps merge-required workflow state after an upgrade attempt", async () => {
  const runtime = createKernelStub();
  runtime.setSession(
    createSession({
      identity: {
        userId: "guest_1",
        anonymous: true,
        loginMethod: "guest",
      },
      authStatus: "guest",
    }),
  );
  runtime.setTransitionResult(
    ok({
      userId: "guest_1",
      accessToken: "token_guest_1",
      refreshToken: "refresh_guest_1",
      expiresAt: Date.now() + 60_000,
      session: {
        accessToken: "token_guest_1",
        refreshToken: "refresh_guest_1",
        expiresAt: Date.now() + 60_000,
        issuedAt: Date.now(),
        tokenType: "Bearer",
      },
      identity: {
        userId: "guest_1",
        anonymous: true,
        loginMethod: "guest",
      },
      authStatus: "guest" as const,
      identityWorkflow: {
        kind: "guest_upgrade" as const,
        status: "merge_required" as const,
        sourceUserId: "guest_1",
        targetUserId: "user_phone_0001",
        failureReason: "merge_confirmation_required" as const,
        message: "This identity is already linked to account user_phone_0001. Confirm the merge to continue.",
      },
    }),
  );
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "items.list",
    stayOnSuccess: true,
  });

  controller.setLoginMethod("phone_code");
  controller.updateCredentials({
    phoneNumber: "13800000001",
    verificationCode: "123456",
  });
  await controller.submitIdentityUpgrade();

  assert.equal(controller.store.getState().identityWorkflow?.status, "merge_required");
  assert.equal(controller.store.getState().identityFailureReason, "merge_confirmation_required");
  assert.deepEqual(runtime.routeCalls, []);
});

test("auth controller can confirm an identity merge from pending workflow state", async () => {
  const runtime = createKernelStub();
  runtime.setSession(
    createSession({
      identity: {
        userId: "guest_1",
        anonymous: true,
        loginMethod: "guest",
      },
      authStatus: "guest",
    }),
  );
  const controller = createAuthController({
    kernel: runtime.kernel,
    successRouteId: "items.list",
    stayOnSuccess: true,
  });

  controller.store.setState({
    identityWorkflow: {
      kind: "guest_upgrade",
      status: "merge_required",
      sourceUserId: "guest_1",
      targetUserId: "user_phone_0001",
      failureReason: "merge_confirmation_required",
      message: "This identity is already linked to account user_phone_0001. Confirm the merge to continue.",
    },
  });

  await controller.confirmIdentityMerge();

  assert.equal(runtime.requestCalls.at(-1)?.url, "/auth/identity/merge");
});
