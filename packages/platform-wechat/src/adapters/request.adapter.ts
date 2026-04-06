import {
  createError,
  fail,
  ok,
  type RequestAdapter,
  type RequestOptions,
  type ResponseData,
} from "@minix/core";

import { resolveWechatRuntime } from "../runtime";

interface WechatRequestTask {
  abort?: () => void;
}

interface WechatRuntime {
  request?: (options: {
    url: string;
    method?: string;
    header?: Record<string, string>;
    data?: unknown;
    timeout?: number;
    success?: (response: {
      statusCode: number;
      header?: Record<string, string>;
      data: unknown;
    }) => void;
    fail?: (error: unknown) => void;
  }) => WechatRequestTask | void;
}

export function createWechatRequestAdapter(runtime?: WechatRuntime): RequestAdapter {
  const host = resolveWechatRuntime<WechatRuntime>(runtime);

  return {
    request<T = unknown>(options: RequestOptions) {
      if (!host.request) {
        return Promise.resolve(
          fail(createError("PLATFORM_UNSUPPORTED", "wechat request API is unavailable", { recoverable: false })),
        );
      }

      return new Promise<import("@minix/core").Result<ResponseData<T>>>((resolve) => {
        host.request?.({
          url: options.url,
          ...(options.method ? { method: options.method } : {}),
          ...(options.headers ? { header: options.headers } : {}),
          ...(options.body === undefined ? {} : { data: options.body }),
          ...(options.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
          success(response) {
            const normalized: ResponseData<T> = {
              status: response.statusCode,
              headers: response.header ?? {},
              data: response.data as T,
              raw: response,
            };

            resolve({ ok: true, value: normalized });
          },
          fail(error) {
            resolve(
              fail(createError("NETWORK_ERROR", "wechat request failed", { cause: error, recoverable: true })),
            );
          },
        });
      });
    },
  };
}
