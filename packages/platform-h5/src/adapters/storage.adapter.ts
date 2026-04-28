import { createError, fail, ok, type StorageAdapter } from "@minix/core";

function createStorageFailure(message: string, cause: unknown) {
  return fail(createError("STORAGE_ERROR", message, { cause, recoverable: true }));
}

export function createH5StorageAdapter(storage: Storage | undefined = globalThis.localStorage): StorageAdapter {
  return {
    async get<T>(key: string) {
      if (!storage) {
        return fail(createError("PLATFORM_UNSUPPORTED", "localStorage is unavailable", { recoverable: false }));
      }

      try {
        const raw = storage.getItem(key);
        return ok(raw === null ? null : (JSON.parse(raw) as T));
      } catch (error) {
        return createStorageFailure("localStorage read failed", error);
      }
    },

    async set<T>(key: string, value: T) {
      if (!storage) {
        return fail(createError("PLATFORM_UNSUPPORTED", "localStorage is unavailable", { recoverable: false }));
      }

      try {
        storage.setItem(key, JSON.stringify(value));
        return ok(undefined);
      } catch (error) {
        return createStorageFailure("localStorage write failed", error);
      }
    },

    async remove(key: string) {
      if (!storage) {
        return fail(createError("PLATFORM_UNSUPPORTED", "localStorage is unavailable", { recoverable: false }));
      }

      try {
        storage.removeItem(key);
        return ok(undefined);
      } catch (error) {
        return createStorageFailure("localStorage remove failed", error);
      }
    },

    async clear(namespace?: string) {
      if (!storage) {
        return fail(createError("PLATFORM_UNSUPPORTED", "localStorage is unavailable", { recoverable: false }));
      }

      try {
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
      } catch (error) {
        return createStorageFailure("localStorage clear failed", error);
      }
    },
  };
}
