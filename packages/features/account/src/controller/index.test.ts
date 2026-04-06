import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS } from "@minix/contracts";

import { createAccountController } from "./index";
import { createDefaultAccountState } from "../model";

function createKernelStub() {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const clipboardWrites: string[] = [];
  let requestMode: "success" | "unauthorized" = "success";

  const kernel: AppKernel = {
    env: {
      appId: "test",
      appName: "test",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "0.1.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {} as AppKernel["storage"],
    session: {
      async get() {
        return ok({
          loggedIn: true,
          platform: "h5",
          identity: { userId: "user-12345" },
          profile: {
            nickname: "Casey",
            avatarUrl: "https://img.test/avatar.png",
          },
          token: {
            accessToken: "token-1",
            refreshToken: "refresh-1",
            expiresAt: Date.now() + 60_000,
          },
        });
      },
      async set() {
        return ok(undefined);
      },
      async clear() {
        return ok(undefined);
      },
      async isLoggedIn() {
        return ok(true);
      },
    },
    request: {
      async get<T>() {
        if (requestMode === "unauthorized") {
          return {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Account session expired",
              recoverable: true,
            },
          } as const;
        }

        return ok({
          subtitle: "Member profile and recovery controls.",
          stats: [
            {
              key: "projects",
              label: "Projects",
              value: "12 active workspaces",
            },
          ],
          sections: [
            {
              key: "support",
              title: "Support",
              items: [
                {
                  key: "response-window",
                  label: "Response window",
                  value: "Reply within one business day",
                },
              ],
            },
          ],
        } as T);
      },
      async post<T>() {
        return ok({} as T);
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
    auth: {} as AppKernel["auth"],
    router: {
      async to() {
        return ok(undefined);
      },
      async replace() {
        return ok(undefined);
      },
      async toRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      async replaceRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      resolve() {
        return ok("/account");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok({ path: "/account" });
      },
    },
    ui: {} as AppKernel["ui"],
    capability: {
      status(capability) {
        return ok(capability === "clipboard");
      },
      async execute(input) {
        clipboardWrites.push(String((input.payload as { text?: unknown } | undefined)?.text ?? ""));
        return ok({
          capability: input.capability,
          action: input.action,
        });
      },
    },
  };

  return {
    kernel,
    routeCalls,
    clipboardWrites,
    setRequestMode(mode: "success" | "unauthorized") {
      requestMode = mode;
    },
  };
}

test("account controller loads session-backed account details and remote profile data", async () => {
  const { kernel } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    initialState: createDefaultAccountState(),
  });

  const result = await controller.loadInitial();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().authenticated, true);
  assert.equal(controller.store.getState().nickname, "Casey");
  assert.equal(controller.store.getState().subtitle, "Member profile and recovery controls.");
  assert.equal(controller.store.getState().stats[0]?.label, "Projects");
  assert.equal(controller.store.getState().sections[0]?.key, "support");
});

test("account controller redirects to login when the account request comes back unauthorized", async () => {
  const { kernel, routeCalls, setRequestMode } = createKernelStub();
  setRequestMode("unauthorized");
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  const result = await controller.loadInitial();

  assert.equal(result.ok, false);
  assert.equal(controller.store.getState().authenticated, false);
  assert.equal(controller.store.getState().errorText, "Your account session expired. Sign in again to continue.");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: "auth.login",
    params: {
      from: "account",
      reason: "auth-required",
    },
  });
});

test("account controller can copy the current user id through the clipboard capability", async () => {
  const { kernel, clipboardWrites } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  const result = await controller.copyUserId();

  assert.equal(result.ok, true);
  assert.deepEqual(clipboardWrites, ["user-12345"]);
  assert.equal(controller.store.getState().copyFeedback, "User ID copied for support and recovery.");
});

test("account controller can route into settings and overview when configured", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    settingsRouteId: APP_ROUTE_IDS.settings,
    overviewRouteId: APP_ROUTE_IDS.overview,
  });

  await controller.goToSettings();
  await controller.goToOverview();

  assert.deepEqual(routeCalls, [
    { routeId: APP_ROUTE_IDS.settings },
    { routeId: APP_ROUTE_IDS.overview },
  ]);
});
