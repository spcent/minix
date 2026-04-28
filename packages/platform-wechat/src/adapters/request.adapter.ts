import {
  appendRequestQuery,
  createError,
  fail,
  ok,
  type RequestAdapter,
  type RequestOptions,
  type ResponseData,
} from "@minix/core";

import { resolveWechatRuntime } from "../runtime";
import { createWechatCallbackResult } from "./callback-result";

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

      return createWechatCallbackResult<ResponseData<T>>((resolveValue, rejectValue) => {
        host.request?.({
          url: appendRequestQuery(options.url, options.query),
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

            resolveValue(normalized);
          },
          fail: rejectValue,
        });
      }, {
        code: "NETWORK_ERROR",
        message: "wechat request failed",
      });
    },
  };
}
