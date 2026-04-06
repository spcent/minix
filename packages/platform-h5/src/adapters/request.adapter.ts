import { createError, fail, ok, type RequestAdapter, type RequestOptions } from "@minix/core";

export interface H5RequestAdapterOptions {
  fetcher?: typeof fetch;
  createAbortController?: () => AbortController;
}

function appendQuery(url: string, query?: RequestOptions["query"]): string {
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

export function createH5RequestAdapter(options: H5RequestAdapterOptions = {}): RequestAdapter {
  const fetcher = options.fetcher ?? globalThis.fetch;
  const createAbortController =
    options.createAbortController ??
    (() => {
      if (typeof AbortController === "undefined") {
        throw new Error("AbortController is unavailable");
      }

      return new AbortController();
    });

  return {
    async request<T = unknown>(options: RequestOptions) {
      if (!fetcher) {
        return fail(createError("PLATFORM_UNSUPPORTED", "fetch is unavailable", { recoverable: false }));
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      let timedOut = false;
      let signal: AbortSignal | undefined;

      try {
        if (options.timeoutMs !== undefined) {
          const controller = createAbortController();
          signal = controller.signal;
          timeoutId = setTimeout(() => {
            timedOut = true;
            controller.abort();
          }, options.timeoutMs);
        }

        const response = await fetcher(appendQuery(options.url, options.query), {
          ...(options.method ? { method: options.method } : {}),
          ...(options.headers ? { headers: options.headers } : {}),
          ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
          ...(signal ? { signal } : {}),
        });

        const data = (await response.json().catch(() => undefined)) as T;
        const headers = Object.fromEntries(response.headers.entries());

        return ok({
          status: response.status,
          headers,
          data,
          raw: response,
        });
      } catch (error) {
        if (timedOut) {
          return fail(createError("NETWORK_ERROR", "fetch request timed out", { cause: error, recoverable: true }));
        }

        return fail(createError("NETWORK_ERROR", "fetch request failed", { cause: error, recoverable: true }));
      } finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      }
    },
  };
}
