import assert from "node:assert/strict";
import test from "node:test";

import { ok, type AppKernel, type Result, type UserSession } from "@minix/core";

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
  let currentParams: Record<string, string> | undefined;
  let sessionValue: UserSession | null = createSession();
  let refreshResult: Result<UserSession> = ok(
    createSession({ token: { accessToken: "token_2", refreshToken: "refresh_1" } }),
  );
  let refreshCalls = 0;
  let clearCalls = 0;

  const kernel = {
    auth: {
      async login() {
        return ok(createSession());
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
      async clear() {
        sessionValue = null;
        clearCalls += 1;
        return ok(undefined);
      },
    },
    router: {
      async toRoute(routeId: string) {
        routeCalls.push(`to:${routeId}`);
        return ok(undefined);
      },
      async replaceRoute(routeId: string) {
        routeCalls.push(`replace:${routeId}`);
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
    setCurrentParams(params?: Record<string, string>) {
      currentParams = params;
    },
    setSession(nextSession: ReturnType<typeof createSession> | null) {
      sessionValue = nextSession;
    },
    setRefreshResult(nextResult: Result<UserSession>) {
      refreshResult = nextResult;
    },
    get refreshCalls() {
      return refreshCalls;
    },
    get clearCalls() {
      return clearCalls;
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
