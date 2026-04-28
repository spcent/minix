import { createError, createRouteLocationUrl, fail, ok, type RouteLocation, type RouterAdapter } from "@minix/core";

import { resolveWechatRuntime } from "../runtime";
import { createWechatCallbackResult } from "./callback-result";

interface WechatRouterRuntime {
  navigateTo?: (options: { url: string; success?: () => void; fail?: (error: unknown) => void }) => void;
  redirectTo?: (options: { url: string; success?: () => void; fail?: (error: unknown) => void }) => void;
  navigateBack?: (options: { delta?: number; success?: () => void; fail?: (error: unknown) => void }) => void;
}

export function createWechatRouterAdapter(
  runtime?: WechatRouterRuntime,
): RouterAdapter {
  const host = resolveWechatRuntime<WechatRouterRuntime>(runtime);
  let currentLocation: RouteLocation | null = null;

  return {
    push(location) {
      if (!host.navigateTo) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat router API is unavailable", { recoverable: false })),
        );
      }

      return createWechatCallbackResult<void>((resolveValue, rejectValue) => {
        host.navigateTo?.({
          url: createRouteLocationUrl(location),
          success() {
            currentLocation = location;
            resolveValue(undefined);
          },
          fail: rejectValue,
        });
      }, {
        code: "ROUTE_ERROR",
        message: "wechat navigateTo failed",
      });
    },

    replace(location) {
      if (!host.redirectTo) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat router API is unavailable", { recoverable: false })),
        );
      }

      return createWechatCallbackResult<void>((resolveValue, rejectValue) => {
        host.redirectTo?.({
          url: createRouteLocationUrl(location),
          success() {
            currentLocation = location;
            resolveValue(undefined);
          },
          fail: rejectValue,
        });
      }, {
        code: "ROUTE_ERROR",
        message: "wechat redirectTo failed",
      });
    },

    back(delta) {
      if (!host.navigateBack) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat router API is unavailable", { recoverable: false })),
        );
      }

      return createWechatCallbackResult<void>((resolveValue, rejectValue) => {
        host.navigateBack?.({
          ...(delta !== undefined ? { delta } : {}),
          success() {
            resolveValue(undefined);
          },
          fail: rejectValue,
        });
      }, {
        code: "ROUTE_ERROR",
        message: "wechat navigateBack failed",
      });
    },

    current() {
      return ok(currentLocation);
    },
  };
}
