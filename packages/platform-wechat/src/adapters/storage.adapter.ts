import { createError, fail, ok, type StorageAdapter } from "@minix/core";

import { resolveWechatRuntime } from "../runtime";

interface WechatStorageRuntime {
  getStorage?: (options: {
    key: string;
    success?: (response: { data: unknown }) => void;
    fail?: (error: unknown) => void;
  }) => void;
  setStorage?: (options: {
    key: string;
    data: unknown;
    success?: () => void;
    fail?: (error: unknown) => void;
  }) => void;
  removeStorage?: (options: { key: string; success?: () => void; fail?: (error: unknown) => void }) => void;
  clearStorage?: (options: { success?: () => void; fail?: (error: unknown) => void }) => void;
}

export function createWechatStorageAdapter(
  runtime?: WechatStorageRuntime,
): StorageAdapter {
  const host = resolveWechatRuntime<WechatStorageRuntime>(runtime);

  return {
    get<T>(key: string) {
      if (!host.getStorage) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat storage API is unavailable", { recoverable: false })),
        );
      }

      return new Promise<import("@minix/core").Result<T | null>>((resolve) => {
        host.getStorage?.({
          key,
          success(response) {
            if (response.data === undefined) {
              resolve({ ok: true, value: null });
              return;
            }

            resolve({ ok: true, value: response.data as T });
          },
          fail(error) {
            resolve(fail(createError("STORAGE_ERROR", "wechat getStorage failed", { cause: error, recoverable: true })));
          },
        });
      });
    },

    set<T>(key: string, value: T) {
      if (!host.setStorage) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat storage API is unavailable", { recoverable: false })),
        );
      }

      return new Promise((resolve) => {
        host.setStorage?.({
          key,
          data: value,
          success() {
            resolve(ok(undefined));
          },
          fail(error) {
            resolve(fail(createError("STORAGE_ERROR", "wechat setStorage failed", { cause: error, recoverable: true })));
          },
        });
      });
    },

    remove(key: string) {
      if (!host.removeStorage) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat storage API is unavailable", { recoverable: false })),
        );
      }

      return new Promise((resolve) => {
        host.removeStorage?.({
          key,
          success() {
            resolve(ok(undefined));
          },
          fail(error) {
            resolve(
              fail(createError("STORAGE_ERROR", "wechat removeStorage failed", { cause: error, recoverable: true })),
            );
          },
        });
      });
    },

    clear() {
      if (!host.clearStorage) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat storage API is unavailable", { recoverable: false })),
        );
      }

      return new Promise((resolve) => {
        host.clearStorage?.({
          success() {
            resolve(ok(undefined));
          },
          fail(error) {
            resolve(fail(createError("STORAGE_ERROR", "wechat clearStorage failed", { cause: error, recoverable: true })));
          },
        });
      });
    },
  };
}
