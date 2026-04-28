import { createError, fail, ok, type AppErrorCode, type Result } from "@minix/core";

interface WechatCallbackFailureOptions {
  code: AppErrorCode;
  message: string;
  recoverable?: boolean;
}

export function createWechatCallbackResult<TValue>(
  run: (resolveValue: (value: TValue) => void, rejectValue: (error: unknown) => void) => void,
  failure: WechatCallbackFailureOptions,
): Promise<Result<TValue>> {
  return new Promise((resolve) => {
    run(
      (value) => {
        resolve(ok(value));
      },
      (error) => {
        resolve(
          fail(
            createError(failure.code, failure.message, {
              cause: error,
              recoverable: failure.recoverable ?? true,
            }),
          ),
        );
      },
    );
  });
}
