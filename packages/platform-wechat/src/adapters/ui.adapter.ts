import { createError, fail, ok, type UIAdapter } from "@minix/core";

import { resolveWechatRuntime } from "../runtime";

interface WechatUiRuntime {
  showToast?: (options: { title: string; icon?: string; duration?: number }) => void;
  showLoading?: (options: { title?: string }) => void;
  hideLoading?: () => void;
  showModal?: (options: {
    title?: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    success?: (response: { confirm: boolean }) => void;
    fail?: (error: unknown) => void;
  }) => void;
}

export function createWechatUiAdapter(runtime?: WechatUiRuntime): UIAdapter {
  const host = resolveWechatRuntime<WechatUiRuntime>(runtime);

  return {
    async toast(options) {
      if (!host.showToast) {
        return fail(createError("PLATFORM_UNSUPPORTED", "wechat toast API is unavailable", { recoverable: false }));
      }

      host.showToast({
        title: options.title,
        ...(options.icon ? { icon: options.icon } : {}),
        ...(options.durationMs !== undefined ? { duration: options.durationMs } : {}),
      });
      return ok(undefined);
    },

    async loading(show, title) {
      if (show) {
        if (!host.showLoading) {
          return fail(
            createError("PLATFORM_UNSUPPORTED", "wechat loading API is unavailable", { recoverable: false }),
          );
        }

        host.showLoading(title ? { title } : {});
        return ok(undefined);
      }

      host.hideLoading?.();
      return ok(undefined);
    },

    modal(options) {
      if (!host.showModal) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat modal API is unavailable", { recoverable: false })),
        );
      }

      return new Promise((resolve) => {
        host.showModal?.({
          content: options.content,
          ...(options.title ? { title: options.title } : {}),
          ...(options.confirmText ? { confirmText: options.confirmText } : {}),
          ...(options.cancelText ? { cancelText: options.cancelText } : {}),
          success(response) {
            resolve(ok(response.confirm));
          },
          fail(error) {
            resolve(fail(createError("UNKNOWN", "wechat modal failed", { cause: error, recoverable: true })));
          },
        });
      });
    },
  };
}
