import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";

import { createHostH5PageEntry } from "../registrations/page-entries";
import { createHostH5Runtime } from "../manifest/app.manifest";

function createKernelStub(): AppKernel {
  return {
    env: {
      appId: "host-h5",
      appName: "host-h5",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "0.1.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {
      async get() {
        return ok(null);
      },
      async set() {
        return ok(undefined);
      },
      async remove() {
        return ok(undefined);
      },
      async clear() {
        return ok(undefined);
      },
    },
    session: {
      async get() {
        return ok(null);
      },
      async set() {
        return ok(undefined);
      },
      async clear() {
        return ok(undefined);
      },
      async isLoggedIn() {
        return ok(false);
      },
    },
    request: {
      async get<T>() {
        return ok({
          items: [],
          hasMore: false,
          page: 1,
          pageSize: 2,
        } as T);
      },
      async post<T>() {
        return ok({
          userId: "host-h5-user",
          accessToken: "mock-h5-access-token",
        } as T);
      },
      async put() {
        throw new Error("not implemented");
      },
      async patch() {
        throw new Error("not implemented");
      },
      async delete() {
        throw new Error("not implemented");
      },
    },
    auth: {
      async ensureLogin() {
        return ok({
          identity: { userId: "host-h5-user" },
          loggedIn: true,
          platform: "h5",
          token: { accessToken: "mock-h5-access-token" },
        });
      },
      async login() {
        return ok({
          identity: { userId: "host-h5-user" },
          loggedIn: true,
          platform: "h5",
          token: { accessToken: "mock-h5-access-token" },
        });
      },
      async logout() {
        return ok(undefined);
      },
      async exchangeToken() {
        throw new Error("not implemented");
      },
    },
    router: {
      async to() {
        return ok(undefined);
      },
      async replace() {
        return ok(undefined);
      },
      async toRoute() {
        return ok(undefined);
      },
      async replaceRoute() {
        return ok(undefined);
      },
      resolve() {
        return ok("/login");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok({ path: "/login" });
      },
    },
    ui: {
      async toast() {
        return ok(undefined);
      },
      async loading() {
        return ok(undefined);
      },
      async modal() {
        return ok(true);
      },
    },
  };
}

test("host h5 runtime creates page controllers on a shared kernel", () => {
  const kernel = createKernelStub();
  const runtime = createHostH5Runtime(kernel);

  assert.equal(runtime.kernel, kernel);
  assert.deepEqual(Object.keys(runtime.registry), ["login", "overview", "items", "settings"]);
  assert.deepEqual(Object.keys(runtime.pages), ["login", "overview", "items", "settings"]);
});

test("host h5 page entries delegate to runtime controllers", async () => {
  const runtime = createHostH5Runtime(createKernelStub());
  const loginEntry = createHostH5PageEntry(runtime, "login");
  const overviewEntry = createHostH5PageEntry(runtime, "overview");
  const itemsEntry = createHostH5PageEntry(runtime, "items");
  const settingsEntry = createHostH5PageEntry(runtime, "settings");

  const loginResult = await loginEntry.onTapLogin();
  const overviewResult = await overviewEntry.onShow();
  const itemsResult = await itemsEntry.onShow();
  const settingsResult = await settingsEntry.onTapLogout();

  assert.deepEqual(loginResult, { ok: true, value: undefined });
  assert.equal((overviewResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((itemsResult as { ok?: boolean } | undefined)?.ok, true);
  assert.deepEqual(settingsResult, { ok: true, value: undefined });
});
