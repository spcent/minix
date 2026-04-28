import { createError, createRouteLocationUrl, fail, ok, type RouteLocation, type RouterAdapter } from "@minix/core";

function fromLocation(locationApi: Location | undefined, state?: unknown): RouteLocation | null {
  if (typeof locationApi?.pathname !== "string") {
    return null;
  }

  const params: Record<string, string | number | boolean> = {};
  if (typeof locationApi.search === "string" && locationApi.search.length > 1) {
    const search = new URLSearchParams(locationApi.search);
    for (const [key, value] of search.entries()) {
      params[key] = value;
    }
  }

  if (state && typeof state === "object") {
    Object.assign(params, state as Record<string, string | number | boolean>);
  }

  return {
    path: locationApi.pathname,
    ...(Object.keys(params).length > 0 ? { params } : {}),
  };
}

export function createH5RouterAdapter(historyApi: History | undefined = globalThis.history): RouterAdapter {
  let currentLocation: RouteLocation | null = fromLocation(globalThis.location, historyApi?.state);

  return {
    async push(location) {
      if (!historyApi) {
        return fail(createError("PLATFORM_UNSUPPORTED", "history API is unavailable", { recoverable: false }));
      }

      const url = createRouteLocationUrl(location);
      historyApi.pushState(location.params ?? null, "", url);
      currentLocation = location;
      return ok(undefined);
    },

    async replace(location) {
      if (!historyApi) {
        return fail(createError("PLATFORM_UNSUPPORTED", "history API is unavailable", { recoverable: false }));
      }

      const url = createRouteLocationUrl(location);
      historyApi.replaceState(location.params ?? null, "", url);
      currentLocation = location;
      return ok(undefined);
    },

    async back(delta) {
      if (!historyApi) {
        return fail(createError("PLATFORM_UNSUPPORTED", "history API is unavailable", { recoverable: false }));
      }

      historyApi.go(-(delta ?? 1));
      return ok(undefined);
    },

    current() {
      if (!currentLocation) {
        currentLocation = fromLocation(globalThis.location, historyApi?.state);
      }
      return ok(currentLocation);
    },
  };
}
