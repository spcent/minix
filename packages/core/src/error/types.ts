import type { PlatformKind } from "../types/index";

export type AppErrorCode =
  | "UNKNOWN"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_ARGUMENT"
  | "NOT_FOUND"
  | "PLATFORM_UNSUPPORTED"
  | "CAPABILITY_UNAVAILABLE"
  | "STORAGE_ERROR"
  | "ROUTE_ERROR"
  | "LOGIN_FAILED"
  | "TOKEN_EXPIRED"
  | "USER_CANCELLED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface AppError {
  code: AppErrorCode;
  message: string;
  recoverable: boolean;
  platform?: PlatformKind;
  cause?: unknown;
  traceId?: string;
  detail?: Record<string, unknown>;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };
