import { createError, fail, ok, type StorageAdapter } from "@minix/core";

import { resolveWechatRuntime } from "../runtime";
import { createWechatCallbackResult } from "./callback-result";

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

      return createWechatCallbackResult<T | null>((resolveValue, rejectValue) => {
        host.getStorage?.({
          key,
          success(response) {
            if (response.data === undefined) {
              resolveValue(null);
              return;
            }

            resolveValue(response.data as T);
          },
          fail: rejectValue,
        });
      }, {
        code: "STORAGE_ERROR",
        message: "wechat getStorage failed",
      });
    },

    set<T>(key: string, value: T) {
      if (!host.setStorage) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat storage API is unavailable", { recoverable: false })),
        );
      }

      return createWechatCallbackResult<void>((resolveValue, rejectValue) => {
        host.setStorage?.({
          key,
          data: value,
          success() {
            resolveValue(undefined);
          },
          fail: rejectValue,
        });
      }, {
        code: "STORAGE_ERROR",
        message: "wechat setStorage failed",
      });
    },

    remove(key: string) {
      if (!host.removeStorage) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat storage API is unavailable", { recoverable: false })),
        );
      }

      return createWechatCallbackResult<void>((resolveValue, rejectValue) => {
        host.removeStorage?.({
          key,
          success() {
            resolveValue(undefined);
          },
          fail: rejectValue,
        });
      }, {
        code: "STORAGE_ERROR",
        message: "wechat removeStorage failed",
      });
    },

    clear() {
      if (!host.clearStorage) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat storage API is unavailable", { recoverable: false })),
        );
      }

      return createWechatCallbackResult<void>((resolveValue, rejectValue) => {
        host.clearStorage?.({
          success() {
            resolveValue(undefined);
          },
          fail: rejectValue,
        });
      }, {
        code: "STORAGE_ERROR",
        message: "wechat clearStorage failed",
      });
    },
  };
}
