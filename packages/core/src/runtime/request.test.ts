import test from "node:test";
import assert from "node:assert/strict";

import { ok } from "../error/index";
import type { RequestAdapter, RequestOptions, ResponseData } from "../ports/request";
import type { StorageAdapter } from "../ports/storage";
import { createCacheService } from "../store/cache";

import { appendRequestQuery, createRequestClient } from "./request";

test("appendRequestQuery appends defined query values to absolute and relative urls", () => {
  assert.equal(
    appendRequestQuery("https://api.example.com/items?sort=latest", {
      page: 2,
      active: true,
      empty: undefined,
    }),
    "https://api.example.com/items?sort=latest&page=2&active=true",
  );
  assert.equal(
    appendRequestQuery("/items", {
      page: 1,
      keyword: "novel",
    }),
    "/items?page=1&keyword=novel",
  );
});
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

function responseOk<T>(data: T, status = 200) {
  return ok<ResponseData<T>>({
    status,
    headers: {},
    data,
  });
}

test("request client omits Authorization header for /auth/login", async () => {
  const session = createSessionService(createCacheService(createMemoryAdapter(), "request-test-1"));
  await session.set({
    identity: { userId: "u_1" },
    loggedIn: true,
    platform: "wechat",
    token: { accessToken: "token-1" },
  });

  let receivedHeaders: Record<string, string> | undefined;
  const adapter: RequestAdapter = {
    async request() {
      throw new Error("unreachable");
    },
  };
  adapter.request = async <T = unknown>(options: RequestOptions) => {
    receivedHeaders = options.headers;
    return responseOk({ ok: true } as T);
  };

  const client = createRequestClient({
    adapter,
    getSession: () => session.get(),
    apiBaseUrl: "https://api.example.com",
  });

  await client.post("/auth/login", { platform: "wechat" });

  assert.equal(receivedHeaders?.Authorization, undefined);
  assert.equal(typeof receivedHeaders?.["x-trace-id"], "string");
});

test("request client attaches Authorization header for protected routes", async () => {
  const session = createSessionService(createCacheService(createMemoryAdapter(), "request-test-2"));
  await session.set({
    identity: { userId: "u_1" },
    loggedIn: true,
    platform: "wechat",
    token: { accessToken: "token-1" },
  });

  let receivedHeaders: Record<string, string> | undefined;
  const adapter: RequestAdapter = {
    async request<T = unknown>(options: RequestOptions) {
      receivedHeaders = options.headers;
      return responseOk({ items: [] } as T);
    },
  };

  const client = createRequestClient({
    adapter,
    getSession: () => session.get(),
    apiBaseUrl: "https://api.example.com",
  });

  const result = await client.get<{ items: unknown[] }>("/items");

  assert.equal(result.ok, true);
  assert.equal(receivedHeaders?.Authorization, "Bearer token-1");
});

test("request client maps 401 responses to UNAUTHORIZED", async () => {
  const adapter: RequestAdapter = {
    async request<T = unknown>() {
      return responseOk({ code: "UNAUTHORIZED" } as T, 401);
    },
  };

  const client = createRequestClient({
    adapter,
    getSession: async () => ok(null),
    apiBaseUrl: "https://api.example.com",
  });

  const result = await client.get("/items");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "UNAUTHORIZED");
  }
});

test("request client preserves structured client errors from response bodies", async () => {
  const adapter: RequestAdapter = {
    async request<T = unknown>() {
      return responseOk({ code: "LOGIN_FAILED", message: "invalid account or password" } as T, 400);
    },
  };

  const client = createRequestClient({
    adapter,
    getSession: async () => ok(null),
    apiBaseUrl: "https://api.example.com",
  });

  const result = await client.post("/auth/login", {});
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "LOGIN_FAILED");
    assert.equal(result.error.message, "invalid account or password");
  }
});

test("request client maps 429 responses to RATE_LIMITED and preserves retry-after", async () => {
  const adapter: RequestAdapter = {
    async request<T = unknown>() {
      return ok<ResponseData<T>>({
        status: 429,
        headers: {
          "retry-after": "60",
        },
        data: {
          code: "RATE_LIMITED",
          message: "Too many login attempts. Retry later.",
          retryAfterSeconds: 60,
        } as T,
      });
    },
  };

  const client = createRequestClient({
    adapter,
    getSession: async () => ok(null),
    apiBaseUrl: "https://api.example.com",
  });

  const result = await client.post("/auth/login", {});
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "RATE_LIMITED");
    assert.equal(result.error.detail?.retryAfterSeconds, 60);
  }
});

test("request client retries once after 401 by refreshing the session", async () => {
  const session = createSessionService(createCacheService(createMemoryAdapter(), "request-test-3"));
  await session.set({
    identity: { userId: "u_1" },
    loggedIn: true,
    platform: "wechat",
    token: {
      accessToken: "expired-token",
      refreshToken: "refresh-token",
    },
  });

  const seenHeaders: string[] = [];
  let requestCalls = 0;
  const adapter: RequestAdapter = {
    async request<T = unknown>(options: RequestOptions) {
      requestCalls += 1;
      seenHeaders.push(options.headers?.Authorization ?? "none");
      if (requestCalls === 1) {
        return responseOk({ code: "UNAUTHORIZED" } as T, 401);
      }

      return responseOk({ items: ["ok"] } as T);
    },
  };

  const client = createRequestClient({
    adapter,
    getSession: () => session.get(),
    refreshSession: async () => {
      await session.set({
        identity: { userId: "u_1" },
        loggedIn: true,
        platform: "wechat",
        token: {
          accessToken: "fresh-token",
          refreshToken: "refresh-token-next",
        },
      });

      return ok({
        identity: { userId: "u_1" },
        loggedIn: true,
        platform: "wechat",
        token: {
          accessToken: "fresh-token",
          refreshToken: "refresh-token-next",
        },
      });
    },
    apiBaseUrl: "https://api.example.com",
  });

  const result = await client.get<{ items: string[] }>("/items");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value.items, ["ok"]);
  }
  assert.equal(requestCalls, 2);
  assert.deepEqual(seenHeaders, ["Bearer expired-token", "Bearer fresh-token"]);
});

test("request client does not attach Authorization header for /auth/refresh", async () => {
  let receivedHeaders: Record<string, string> | undefined;
  const adapter: RequestAdapter = {
    async request<T = unknown>(options: RequestOptions) {
      receivedHeaders = options.headers;
      return responseOk({ accessToken: "fresh-token" } as T);
    },
  };

  const client = createRequestClient({
    adapter,
    getSession: async () =>
      ok({
        identity: { userId: "u_1" },
        loggedIn: true,
        platform: "wechat",
        token: {
          accessToken: "expired-token",
          refreshToken: "refresh-token",
        },
      }),
    apiBaseUrl: "https://api.example.com",
  });

  await client.post("/auth/refresh", {
    platform: "wechat",
    refreshToken: "refresh-token",
  });

  assert.equal(receivedHeaders?.Authorization, undefined);
});
