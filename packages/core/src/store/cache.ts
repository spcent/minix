import { createError, fail, mapUnknownError, ok, type Result } from "../error/index";
import type { StorageAdapter } from "../ports/storage";

export interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

export interface CacheService {
  get<T>(key: string): Promise<Result<T | null>>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<Result<void>>;
  remove(key: string): Promise<Result<void>>;
  clear(): Promise<Result<void>>;
}

const DEFAULT_NAMESPACE = "minix";

function namespacedKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

export function createCacheService(
  adapter: StorageAdapter,
  namespace = DEFAULT_NAMESPACE,
): CacheService {
  return {
    async get<T>(key: string): Promise<Result<T | null>> {
      try {
        const stored = await adapter.get<CacheEntry<T>>(namespacedKey(namespace, key));
        if (!stored.ok) {
          return stored;
        }

        if (stored.value === null) {
          return ok(null);
        }

        const entry = stored.value;
        if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
          await adapter.remove(namespacedKey(namespace, key));
          return ok(null);
        }

        return ok(entry.value);
      } catch (error) {
        return fail(
          createError("STORAGE_ERROR", "Failed to read cache entry", {
            cause: mapUnknownError(error),
            recoverable: true,
          }),
        );
      }
    },

    async set<T>(key: string, value: T, ttlMs?: number): Promise<Result<void>> {
      const entry: CacheEntry<T> = {
        value,
        ...(ttlMs === undefined ? {} : { expiresAt: Date.now() + ttlMs }),
      };

      try {
        return await adapter.set(namespacedKey(namespace, key), entry);
      } catch (error) {
        return fail(
          createError("STORAGE_ERROR", "Failed to write cache entry", {
            cause: mapUnknownError(error),
            recoverable: true,
          }),
        );
      }
    },

    async remove(key: string): Promise<Result<void>> {
      try {
        return await adapter.remove(namespacedKey(namespace, key));
      } catch (error) {
        return fail(
          createError("STORAGE_ERROR", "Failed to remove cache entry", {
            cause: mapUnknownError(error),
            recoverable: true,
          }),
        );
      }
    },

    async clear(): Promise<Result<void>> {
      try {
        return await adapter.clear(namespace);
      } catch (error) {
        return fail(
          createError("STORAGE_ERROR", "Failed to clear cache namespace", {
            cause: mapUnknownError(error),
            recoverable: true,
          }),
        );
      }
    },
  };
}
