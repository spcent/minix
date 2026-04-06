import test from "node:test";
import assert from "node:assert/strict";

import { ok } from "../error/index";
import type { StorageAdapter } from "../ports/storage";
import { createCacheService } from "../store/cache";

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

test("session service persists and restores session", async () => {
  const cache = createCacheService(createMemoryAdapter(), "session-test");
  const sessions = createSessionService(cache);

  await sessions.set({
    identity: { userId: "u_1" },
    loggedIn: true,
    platform: "wechat",
    token: { accessToken: "token-1" },
  });

  const result = await sessions.get();
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value?.identity.userId, "u_1");
  }
});

test("session service exposes login state", async () => {
  const cache = createCacheService(createMemoryAdapter(), "session-test");
  const sessions = createSessionService(cache);

  const before = await sessions.isLoggedIn();
  assert.deepEqual(before, { ok: true, value: false });

  await sessions.set({
    identity: { userId: "u_1" },
    loggedIn: true,
    platform: "wechat",
    token: { accessToken: "token-1" },
  });

  const after = await sessions.isLoggedIn();
  assert.deepEqual(after, { ok: true, value: true });
});
