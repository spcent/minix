import type { AppError, AppErrorCode, Result } from "./types";

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T = never>(error: AppError): Result<T> {
  return { ok: false, error };
}

export function createError(
  code: AppErrorCode,
  message: string,
  options: Partial<Omit<AppError, "code" | "message">> = {},
): AppError {
  return {
    code,
    message,
    recoverable: options.recoverable ?? false,
    ...(options.platform !== undefined ? { platform: options.platform } : {}),
    ...(options.cause !== undefined ? { cause: options.cause } : {}),
    ...(options.traceId !== undefined ? { traceId: options.traceId } : {}),
    ...(options.detail !== undefined ? { detail: options.detail } : {}),
  };
}

export function mapUnknownError(error: unknown, fallback = "Unknown error"): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createError("UNKNOWN", error.message || fallback, {
      cause: error,
      recoverable: false,
    });
  }

  return createError("UNKNOWN", fallback, {
    cause: error,
    recoverable: false,
  });
}

export function isAppError(value: unknown): value is AppError {
  return typeof value === "object" && value !== null && "code" in value && "message" in value;
}
