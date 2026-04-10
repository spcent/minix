import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AuthAdapter, type Result } from "../index";
import type { StorageAdapter } from "../ports/storage";
import { createCacheService } from "../store/cache";

import type { RequestClient } from "./request";
import { createAuthService } from "./auth";
import { createSessionService } from "./session";

function createMemoryAdapter(): StorageAdapter {
  const store = new Map<string, unknown>();

  return {
    async get<T>(key: string) {
      return ok((store.get(key) as T | null) ?? null);
    },
    async set<T>(key: string, value: T) {
      store.set(key, value);
      return ok(undefined);
    },
    async remove(key: string) {
      store.delete(key);
      return ok(undefined);
    },
    async clear() {
      store.clear();
      return ok(undefined);
    },
  };
}

function createRequestStub(handler: (url: string, body?: unknown) => Result<unknown> | Promise<Result<unknown>>): RequestClient {
  return {
    async get() {
      throw new Error("not implemented");
    },
    async post<T>(url: string, body?: unknown) {
      return (await handler(url, body)) as Result<T>;
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
  };
}

test("ensureLogin returns active stored session without adapter login", async () => {
  const session = createSessionService(createCacheService(createMemoryAdapter(), "auth-test-1"));
  await session.set({
    identity: { userId: "u_1" },
    loggedIn: true,
    platform: "wechat",
    token: {
      accessToken: "token-1",
      expiresAt: Date.now() + 10_000,
    },
  });

  let adapterCalls = 0;
  const adapter: AuthAdapter = {
    async login() {
      adapterCalls += 1;
      return ok({
        platform: "wechat",
        credential: { code: "wx-code" },
      });
    },
  };

  const auth = createAuthService({
    adapter,
    request: createRequestStub(() => {
      throw new Error("request should not run");
    }),
    session,
    env: {
      appId: "host-wechat",
      appName: "host-wechat",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "wechat",
      version: "1.0.0",
    },
  });

  const result = await auth.ensureLogin();
  assert.equal(result.ok, true);
  assert.equal(adapterCalls, 0);
});

test("ensureLogin refreshes stale session through wechat login and token exchange", async () => {
  const session = createSessionService(createCacheService(createMemoryAdapter(), "auth-test-2"));
  await session.set({
    identity: { userId: "stale" },
    loggedIn: true,
    platform: "wechat",
    token: {
      accessToken: "expired-token",
      expiresAt: Date.now() - 10_000,
    },
  });

  const adapter: AuthAdapter = {
    async login() {
      return ok({
        platform: "wechat",
        credential: { code: "fresh-code" },
      });
    },
  };

  const auth = createAuthService({
    adapter,
    request: createRequestStub((url, body) => {
      assert.equal(url, "/auth/login");
      assert.deepEqual(body, {
        platform: "wechat",
        credential: { code: "fresh-code" },
      });

      return ok({
        userId: "u_2",
        accessToken: "fresh-token",
        expiresAt: Date.now() + 10_000,
      });
    }),
    session,
    env: {
      appId: "host-wechat",
      appName: "host-wechat",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "wechat",
      version: "1.0.0",
    },
  });

  const result = await auth.ensureLogin();
  assert.equal(result.ok, true);

  const stored = await session.get();
  assert.equal(stored.ok, true);
  if (stored.ok) {
    assert.equal(stored.value?.identity.userId, "u_2");
    assert.equal(stored.value?.token?.accessToken, "fresh-token");
  }
});

test("ensureLogin refreshes a stale session through /auth/refresh before falling back to adapter login", async () => {
  const session = createSessionService(createCacheService(createMemoryAdapter(), "auth-test-2b"));
  await session.set({
    identity: { userId: "stale-refresh" },
    loggedIn: true,
    platform: "wechat",
    token: {
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() - 10_000,
    },
  });

  let adapterCalls = 0;
  const adapter: AuthAdapter = {
    async login() {
      adapterCalls += 1;
      return ok({
        platform: "wechat",
        credential: { code: "fresh-code" },
      });
    },
  };

  const auth = createAuthService({
    adapter,
    request: createRequestStub((url, body) => {
      assert.equal(url, "/auth/refresh");
      assert.deepEqual(body, {
        platform: "wechat",
        refreshToken: "refresh-token",
      });

      return ok({
        userId: "u_2b",
        accessToken: "refreshed-token",
        refreshToken: "refresh-token-next",
        expiresAt: Date.now() + 10_000,
      });
    }),
    session,
    env: {
      appId: "host-wechat",
      appName: "host-wechat",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "wechat",
      version: "1.0.0",
    },
  });

  const result = await auth.ensureLogin();
  assert.equal(result.ok, true);
  assert.equal(adapterCalls, 0);

  const stored = await session.get();
  assert.equal(stored.ok, true);
  if (stored.ok) {
    assert.equal(stored.value?.token?.accessToken, "refreshed-token");
    assert.equal(stored.value?.token?.refreshToken, "refresh-token-next");
  }
});

test("login exchange forwards redirect targets to the backend", async () => {
  const session = createSessionService(createCacheService(createMemoryAdapter(), "auth-test-2d"));
  const adapter: AuthAdapter = {
    async login() {
      return ok({
        platform: "h5",
        credential: {
          method: "guest",
          anonymousId: "guest_redirect",
        },
      });
    },
  };

  const auth = createAuthService({
    adapter,
    request: createRequestStub((url, body) => {
      assert.equal(url, "/auth/login");
      assert.deepEqual(body, {
        platform: "h5",
        credential: {
          method: "guest",
          anonymousId: "guest_redirect",
        },
        redirectTarget: {
          routeId: "messages.index",
          path: "/inbox",
          params: {
            threadId: "support_1",
          },
          source: "messages",
          label: "Inbox",
          reason: "force-relogin",
          forceReauth: true,
        },
      });

      return ok({
        userId: "u_redirect",
        accessToken: "redirect-token",
        authStatus: "authenticated",
      });
    }),
    session,
    env: {
      appId: "host-h5",
      appName: "host-h5",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "h5",
      version: "1.0.0",
    },
  });

  const result = await auth.login({
    redirectTarget: {
      routeId: "messages.index",
      path: "/inbox",
      params: {
        threadId: "support_1",
      },
      source: "messages",
      label: "Inbox",
      reason: "force-relogin",
      forceReauth: true,
    },
  });

  assert.equal(result.ok, true);
});

test("ensureLogin falls back to adapter login when refresh returns token expired", async () => {
  const session = createSessionService(createCacheService(createMemoryAdapter(), "auth-test-2c"));
  await session.set({
    identity: { userId: "stale-refresh" },
    loggedIn: true,
    platform: "wechat",
    token: {
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() - 10_000,
    },
  });

  let adapterCalls = 0;
  const adapter: AuthAdapter = {
    async login() {
      adapterCalls += 1;
      return ok({
        platform: "wechat",
        credential: { code: "fresh-code" },
      });
    },
  };

  const auth = createAuthService({
    adapter,
    request: createRequestStub((url, body) => {
      if (url === "/auth/refresh") {
        assert.deepEqual(body, {
          platform: "wechat",
          refreshToken: "refresh-token",
        });

        return {
          ok: false as const,
          error: {
            code: "UNAUTHORIZED",
            message: "refresh expired",
            recoverable: true,
          },
        };
      }

      assert.equal(url, "/auth/login");
      assert.deepEqual(body, {
        platform: "wechat",
        credential: { code: "fresh-code" },
      });

      return ok({
        userId: "u_2c",
        accessToken: "fresh-token",
        expiresAt: Date.now() + 10_000,
      });
    }),
    session,
    env: {
      appId: "host-wechat",
      appName: "host-wechat",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "wechat",
      version: "1.0.0",
    },
  });

  const result = await auth.ensureLogin();
  assert.equal(result.ok, true);
  assert.equal(adapterCalls, 1);
});

test("logout clears session state", async () => {
  const session = createSessionService(createCacheService(createMemoryAdapter(), "auth-test-3"));
  await session.set({
    identity: { userId: "u_3" },
    loggedIn: true,
    platform: "wechat",
    token: {
      accessToken: "token-3",
    },
  });

  const auth = createAuthService({
    adapter: {
      async login() {
        return ok({
          platform: "wechat",
          credential: { code: "unused" },
        });
      },
    },
    request: createRequestStub(() => ok({})),
    session,
    env: {
      appId: "host-wechat",
      appName: "host-wechat",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "wechat",
      version: "1.0.0",
    },
  });

  const logout = await auth.logout();
  assert.deepEqual(logout, { ok: true, value: undefined });

  const loggedIn = await session.isLoggedIn();
  assert.deepEqual(loggedIn, { ok: true, value: false });
});
