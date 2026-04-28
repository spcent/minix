import { createError, fail, ok, type Result } from "../error/index";
import type { AppErrorCode } from "../error/types";
import type { RequestAdapter, RequestOptions, ResponseData } from "../ports/request";
import type { UserSession } from "../types/index";

const KNOWN_ERROR_CODES = new Set<AppErrorCode>([
  "UNKNOWN",
  "NETWORK_ERROR",
  "TIMEOUT",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "INVALID_ARGUMENT",
  "NOT_FOUND",
  "PLATFORM_UNSUPPORTED",
  "CAPABILITY_UNAVAILABLE",
  "STORAGE_ERROR",
  "ROUTE_ERROR",
  "LOGIN_FAILED",
  "TOKEN_EXPIRED",
  "USER_CANCELLED",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
]);

function toKnownErrorCode(code?: string): AppErrorCode | undefined {
  return code && KNOWN_ERROR_CODES.has(code as AppErrorCode) ? (code as AppErrorCode) : undefined;
}

export interface RequestClient {
  get<T>(url: string, query?: Record<string, unknown>): Promise<Result<T>>;
  post<T>(url: string, body?: unknown): Promise<Result<T>>;
  put<T>(url: string, body?: unknown): Promise<Result<T>>;
  patch<T>(url: string, body?: unknown): Promise<Result<T>>;
  delete<T>(url: string, body?: unknown): Promise<Result<T>>;
}

export interface CreateRequestClientOptions {
  adapter: RequestAdapter;
  getSession: () => Promise<Result<UserSession | null>>;
  refreshSession?: (session: UserSession) => Promise<Result<UserSession>>;
  apiBaseUrl: string;
  defaultHeaders?: Record<string, string>;
}

function createTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function shouldAttachAuthorization(path: string): boolean {
  return path !== "/auth/login" && path !== "/auth/refresh";
}

function shouldAttemptSessionRefresh(path: string, session: UserSession | null): session is UserSession & {
  token: UserSession["token"] & { refreshToken: string };
} {
  return shouldAttachAuthorization(path) && Boolean(session?.token?.refreshToken);
}

function normalizeUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function appendRequestQuery(url: string, query?: RequestOptions["query"]): string {
  if (!query || Object.keys(query).length === 0) {
    return url;
  }

  const isAbsolute = /^https?:\/\//.test(url);
  const next = new URL(url, isAbsolute ? undefined : "http://localhost");
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      next.searchParams.set(key, String(value));
    }
  }

  if (isAbsolute) {
    return next.toString();
  }

  return `${next.pathname}${next.search}`;
}

function toQueryRecord(query?: Record<string, unknown>): Record<string, string | number | boolean | undefined> | undefined {
  if (!query) {
    return undefined;
  }

  const next: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === undefined
    ) {
      next[key] = value;
    }
  }

  return next;
}

function parseErrorPayload(data: unknown): {
  code?: string;
  message?: string;
  detail?: Record<string, unknown>;
} {
  if (typeof data !== "object" || data === null) {
    return {};
  }

  const record = data as Record<string, unknown>;
  const detail: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key !== "code" && key !== "message") {
      detail[key] = value;
    }
  }

  return {
    ...(typeof record.code === "string" ? { code: record.code } : {}),
    ...(typeof record.message === "string" ? { message: record.message } : {}),
    ...(Object.keys(detail).length > 0 ? { detail } : {}),
  };
}

function mapHttpError<T>(response: ResponseData<T>): Result<T> {
  const payload = parseErrorPayload(response.data);
  const normalizedCode = toKnownErrorCode(payload.code);
  const traceId = response.headers["x-trace-id"];
  const payloadDetail = payload.detail ? { ...payload.detail } : {};
  const retryAfter = response.headers["retry-after"];
  if (retryAfter) {
    const retryAfterSeconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(retryAfterSeconds)) {
      payloadDetail.retryAfterSeconds = retryAfterSeconds;
    }
  }

  if (response.status >= 200 && response.status < 300) {
    return ok(response.data);
  }

  if (response.status === 429) {
    return fail(
      createError("RATE_LIMITED", payload.message ?? "Too many requests. Retry later.", {
        recoverable: true,
        ...(traceId ? { traceId } : {}),
        ...(Object.keys(payloadDetail).length > 0 ? { detail: payloadDetail } : {}),
      }),
    );
  }

  if (response.status === 401) {
    return fail(
      createError(normalizedCode === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "UNAUTHORIZED", payload.message ?? "Request is unauthorized", {
        recoverable: true,
        ...(traceId ? { traceId } : {}),
        ...(Object.keys(payloadDetail).length > 0 ? { detail: payloadDetail } : {}),
      }),
    );
  }

  if (response.status === 403) {
    return fail(
      createError(normalizedCode ?? "FORBIDDEN", payload.message ?? "Request is forbidden", {
        recoverable: false,
        ...(traceId ? { traceId } : {}),
        ...(Object.keys(payloadDetail).length > 0 ? { detail: payloadDetail } : {}),
      }),
    );
  }

  if (response.status === 404) {
    return fail(
      createError(normalizedCode ?? "NOT_FOUND", payload.message ?? "Resource was not found", {
        recoverable: true,
        ...(traceId ? { traceId } : {}),
        ...(Object.keys(payloadDetail).length > 0 ? { detail: payloadDetail } : {}),
      }),
    );
  }

  if (response.status >= 400 && response.status < 500 && normalizedCode) {
    return fail(
      createError(normalizedCode, payload.message ?? `Request failed with status ${response.status}`, {
        recoverable: true,
        ...(traceId ? { traceId } : {}),
        ...(Object.keys(payloadDetail).length > 0 ? { detail: payloadDetail } : {}),
      }),
    );
  }

  return fail(
    createError(normalizedCode ?? "NETWORK_ERROR", payload.message ?? `Request failed with status ${response.status}`, {
      recoverable: response.status >= 500,
      ...(traceId ? { traceId } : {}),
      ...(Object.keys(payloadDetail).length > 0 ? { detail: payloadDetail } : {}),
    }),
  );
}

async function dispatch<T>(
  options: CreateRequestClientOptions,
  request: RequestOptions,
  allowRefreshRetry = true,
): Promise<Result<T>> {
  const session = await options.getSession();
  if (!session.ok) {
    return session;
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.defaultHeaders,
    ...request.headers,
    "x-trace-id": createTraceId(),
  };

  if (request.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const accessToken = session.value?.token?.accessToken;
  if (accessToken && shouldAttachAuthorization(request.url)) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await options.adapter.request<T>({
    ...request,
    url: normalizeUrl(options.apiBaseUrl, request.url),
    headers,
  });

  if (!response.ok) {
    return response;
  }

  if (
    response.value.status === 401 &&
    allowRefreshRetry &&
    options.refreshSession &&
    shouldAttemptSessionRefresh(request.url, session.value)
  ) {
    const refreshed = await options.refreshSession(session.value);
    if (!refreshed.ok) {
      return fail(createError("UNAUTHORIZED", "Request is unauthorized", {
        recoverable: true,
        cause: refreshed.error,
      }));
    }

    return dispatch<T>(options, request, false);
  }

  return mapHttpError(response.value);
}

export function createRequestClient(options: CreateRequestClientOptions): RequestClient {
  return {
    get<T>(url: string, query?: Record<string, unknown>) {
      const normalizedQuery = toQueryRecord(query);
      return dispatch<T>(options, {
        method: "GET",
        url,
        ...(normalizedQuery ? { query: normalizedQuery } : {}),
      });
    },

    post<T>(url: string, body?: unknown) {
      return dispatch<T>(options, {
        method: "POST",
        url,
        body,
      });
    },

    put<T>(url: string, body?: unknown) {
      return dispatch<T>(options, {
        method: "PUT",
        url,
        body,
      });
    },

    patch<T>(url: string, body?: unknown) {
      return dispatch<T>(options, {
        method: "PATCH",
        url,
        body,
      });
    },

    delete<T>(url: string, body?: unknown) {
      return dispatch<T>(options, {
        method: "DELETE",
        url,
        body,
      });
    },
  };
}
