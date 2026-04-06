import test from "node:test";
import assert from "node:assert/strict";

import { ok } from "../error/index";
import type { StorageAdapter } from "../ports/storage";

import { createCacheService } from "./cache";

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
    async clear(namespace?: string) {
      if (!namespace) {
        store.clear();
        return ok(undefined);
      }

      for (const key of store.keys()) {
        if (key.startsWith(`${namespace}:`)) {
          store.delete(key);
        }
      }

      return ok(undefined);
    },
  };
}

test("cache service stores and loads namespaced values", async () => {
  const cache = createCacheService(createMemoryAdapter(), "test");

  await cache.set("profile", { nickname: "MiniX" });
  const result = await cache.get<{ nickname: string }>("profile");

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value, { nickname: "MiniX" });
  }
});

test("cache service drops expired values", async () => {
  const cache = createCacheService(createMemoryAdapter(), "test");

  await cache.set("profile", { nickname: "MiniX" }, -1);
  const result = await cache.get<{ nickname: string }>("profile");

  assert.deepEqual(result, { ok: true, value: null });
});
