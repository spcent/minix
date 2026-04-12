import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";

import { createHostWechatPageEntry } from "../registrations/page-entries";
import { createHostWechatRuntime } from "../manifest/app.manifest";

function createKernelStub(): AppKernel {
  return {
    env: {
      appId: "host-wechat",
      appName: "host-wechat",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "wechat",
      version: "1.0.0",
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
          pageSize: 20,
        } as T);
      },
      async post<T>() {
        return ok({
          userId: "u_1",
          accessToken: "token-1",
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
          identity: { userId: "u_1" },
          loggedIn: true,
          platform: "wechat",
          token: { accessToken: "token-1" },
        });
      },
      async login() {
        return ok({
          identity: { userId: "u_1" },
          loggedIn: true,
          platform: "wechat",
          token: { accessToken: "token-1" },
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
        return ok("/pages/login/index");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok(null);
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

test("host runtime creates page controllers on a shared kernel", () => {
  const kernel = createKernelStub();
  const runtime = createHostWechatRuntime(kernel);
  const expectedPages = [
    "login",
    "identityUpgrade",
    "identityBindPhone",
    "identityMerge",
    "overview",
    "items",
    "feed",
    "feedback",
    "messages",
    "mediaTools",
    "membership",
    "settings",
    "account",
  ];

  assert.equal(runtime.kernel, kernel);
  assert.deepEqual(Object.keys(runtime.registry), expectedPages);
  assert.deepEqual(Object.keys(runtime.pages), expectedPages);
});

test("page entries delegate to page controllers", async () => {
  const runtime = createHostWechatRuntime(createKernelStub());

  const loginEntry = createHostWechatPageEntry(runtime, "login");
  const overviewEntry = createHostWechatPageEntry(runtime, "overview");
  const itemsEntry = createHostWechatPageEntry(runtime, "items");
  const feedEntry = createHostWechatPageEntry(runtime, "feed");
  const feedbackEntry = createHostWechatPageEntry(runtime, "feedback");
  const messagesEntry = createHostWechatPageEntry(runtime, "messages");
  const mediaToolsEntry = createHostWechatPageEntry(runtime, "mediaTools");
  const membershipEntry = createHostWechatPageEntry(runtime, "membership");
  const settingsEntry = createHostWechatPageEntry(runtime, "settings");
  const accountEntry = createHostWechatPageEntry(runtime, "account");

  const loginResult = await loginEntry.onTapLogin();
  const overviewResult = await overviewEntry.onShow();
  const itemsResult = await itemsEntry.onShow();
  const feedResult = await feedEntry.onTapSettings();
  const feedbackResult = await feedbackEntry.onTapSettings();
  const messagesResult = await messagesEntry.onTapSettings();
  const mediaToolsResult = await mediaToolsEntry.onTapSettings();
  const membershipResult = await membershipEntry.onTapCatalog();
  const logoutResult = await settingsEntry.onTapLogout();
  const accountResult = await accountEntry.onTapSettings();

  assert.deepEqual(loginResult, { ok: true, value: undefined });
  assert.equal((overviewResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((itemsResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((feedResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((feedbackResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((messagesResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((mediaToolsResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((membershipResult as { ok?: boolean } | undefined)?.ok, true);
  assert.deepEqual(logoutResult, { ok: true, value: undefined });
  assert.equal((accountResult as { ok?: boolean } | undefined)?.ok, true);
});
