import { createError, fail, ok, type StorageAdapter } from "@minix/core";

export function createH5StorageAdapter(storage: Storage | undefined = globalThis.localStorage): StorageAdapter {
  return {
    async get<T>(key: string) {
      if (!storage) {
        return fail(createError("PLATFORM_UNSUPPORTED", "localStorage is unavailable", { recoverable: false }));
      }

      const raw = storage.getItem(key);
      return ok(raw === null ? null : (JSON.parse(raw) as T));
    },

    async set<T>(key: string, value: T) {
      if (!storage) {
        return fail(createError("PLATFORM_UNSUPPORTED", "localStorage is unavailable", { recoverable: false }));
      }

      storage.setItem(key, JSON.stringify(value));
      return ok(undefined);
    },

    async remove(key: string) {
      if (!storage) {
        return fail(createError("PLATFORM_UNSUPPORTED", "localStorage is unavailable", { recoverable: false }));
      }

      storage.removeItem(key);
      return ok(undefined);
    },

    async clear(namespace?: string) {
      if (!storage) {
        return fail(createError("PLATFORM_UNSUPPORTED", "localStorage is unavailable", { recoverable: false }));
      }

      if (!namespace) {
        storage.clear();
        return ok(undefined);
      }

      const keys: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(`${namespace}:`)) {
          keys.push(key);
        }
      }

      for (const key of keys) {
        storage.removeItem(key);
      }

      return ok(undefined);
    },
  };
}
