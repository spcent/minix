import { createError, fail, ok, type Result } from "../error/index";
import type { RequestAdapter, RequestOptions, ResponseData } from "../ports/request";
import type { UserSession } from "../types/index";

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

function mapHttpError<T>(response: ResponseData<T>): Result<T> {
  if (response.status >= 200 && response.status < 300) {
    return ok(response.data);
  }

  if (response.status === 401) {
    return fail(createError("UNAUTHORIZED", "Request is unauthorized", { recoverable: true }));
  }

  if (response.status === 403) {
    return fail(createError("FORBIDDEN", "Request is forbidden", { recoverable: false }));
  }

  if (response.status === 404) {
    return fail(createError("NOT_FOUND", "Resource was not found", { recoverable: true }));
  }

  return fail(
    createError("NETWORK_ERROR", `Request failed with status ${response.status}`, {
      recoverable: response.status >= 500,
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
