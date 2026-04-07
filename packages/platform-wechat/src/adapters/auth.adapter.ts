import { createError, fail, ok, type AuthAdapter } from "@minix/core";

import { resolveWechatRuntime } from "../runtime";

interface WechatAuthRuntime {
  login?: (options: {
    success?: (response: { code?: string }) => void;
    fail?: (error: unknown) => void;
  }) => void;
}

export function createWechatAuthAdapter(runtime?: WechatAuthRuntime): AuthAdapter {
  const host = resolveWechatRuntime<WechatAuthRuntime>(runtime);

  return {
    login() {
      if (!host.login) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat login API is unavailable", { recoverable: false })),
        );
      }

      return new Promise((resolve) => {
        host.login?.({
          success(response) {
            if (!response.code) {
              resolve(fail(createError("LOGIN_FAILED", "wechat login did not return a code", { recoverable: true })));
              return;
            }

            resolve(
              ok({
                platform: "wechat",
                credential: { method: "wechat_code", code: response.code },
              }),
            );
          },
          fail(error) {
            resolve(fail(createError("LOGIN_FAILED", "wechat login failed", { cause: error, recoverable: true })));
          },
        });
      });
    },
  };
}
