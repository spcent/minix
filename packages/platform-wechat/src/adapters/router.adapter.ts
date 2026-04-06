import { createError, fail, ok, type RouteLocation, type RouterAdapter } from "@minix/core";

import { resolveWechatRuntime } from "../runtime";

interface WechatRouterRuntime {
  navigateTo?: (options: { url: string; success?: () => void; fail?: (error: unknown) => void }) => void;
  redirectTo?: (options: { url: string; success?: () => void; fail?: (error: unknown) => void }) => void;
  navigateBack?: (options: { delta?: number; success?: () => void; fail?: (error: unknown) => void }) => void;
}

function toQueryString(params?: RouteLocation["params"]): string {
  if (!params) {
    return "";
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
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

      return new Promise((resolve) => {
        host.navigateTo?.({
          url: `${location.path}${toQueryString(location.params)}`,
          success() {
            currentLocation = location;
            resolve(ok(undefined));
          },
          fail(error) {
            resolve(fail(createError("ROUTE_ERROR", "wechat navigateTo failed", { cause: error, recoverable: true })));
          },
        });
      });
    },

    replace(location) {
      if (!host.redirectTo) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat router API is unavailable", { recoverable: false })),
        );
      }

      return new Promise((resolve) => {
        host.redirectTo?.({
          url: `${location.path}${toQueryString(location.params)}`,
          success() {
            currentLocation = location;
            resolve(ok(undefined));
          },
          fail(error) {
            resolve(fail(createError("ROUTE_ERROR", "wechat redirectTo failed", { cause: error, recoverable: true })));
          },
        });
      });
    },

    back(delta) {
      if (!host.navigateBack) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat router API is unavailable", { recoverable: false })),
        );
      }

      return new Promise((resolve) => {
        host.navigateBack?.({
          ...(delta !== undefined ? { delta } : {}),
          success() {
            resolve(ok(undefined));
          },
          fail(error) {
            resolve(fail(createError("ROUTE_ERROR", "wechat navigateBack failed", { cause: error, recoverable: true })));
          },
        });
      });
    },

    current() {
      return ok(currentLocation);
    },
  };
}
