import { createError, fail, ok, type Result } from "../error/index";
import type { RouteLocation, RouterAdapter } from "../ports/router";

export interface RouteMapper {
  resolve(routeId: string): string | null;
}

export interface CreateRouterServiceOptions {
  adapter: RouterAdapter;
  routeMapper?: RouteMapper;
}

export interface RouterService {
  to(path: string, params?: Record<string, string | number | boolean>): Promise<Result<void>>;
  replace(path: string, params?: Record<string, string | number | boolean>): Promise<Result<void>>;
  toRoute(routeId: string, params?: Record<string, string | number | boolean>): Promise<Result<void>>;
  replaceRoute(routeId: string, params?: Record<string, string | number | boolean>): Promise<Result<void>>;
  resolve(routeId: string): Result<string>;
  back(delta?: number): Promise<Result<void>>;
  current(): Result<RouteLocation | null>;
}

export function createRouteMapper(routeMap: Record<string, string>): RouteMapper {
  return {
    resolve(routeId) {
      return routeMap[routeId] ?? null;
    },
  };
}

export function createRouterService(options: CreateRouterServiceOptions): RouterService {
  const { adapter, routeMapper } = options;

  function resolve(routeId: string): Result<string> {
    const path = routeMapper?.resolve(routeId) ?? null;
    if (!path) {
      return fail(
        createError("ROUTE_ERROR", `route id "${routeId}" is not mapped`, {
          recoverable: false,
          detail: { routeId },
        }),
      );
    }

    return ok(path);
  }

  function toPath(path: string, params?: Record<string, string | number | boolean>): Promise<Result<void>> {
    return adapter.push({
      path,
      ...(params ? { params } : {}),
    });
  }

  function replacePath(path: string, params?: Record<string, string | number | boolean>): Promise<Result<void>> {
    return adapter.replace({
      path,
      replace: true,
      ...(params ? { params } : {}),
    });
  }

  return {
    to(path, params) {
      return toPath(path, params);
    },

    replace(path, params) {
      return replacePath(path, params);
    },

    async toRoute(routeId, params) {
      const path = resolve(routeId);
      if (!path.ok) {
        return path;
      }

      return toPath(path.value, params);
    },

    async replaceRoute(routeId, params) {
      const path = resolve(routeId);
      if (!path.ok) {
        return path;
      }

      return replacePath(path.value, params);
    },

    resolve(routeId) {
      return resolve(routeId);
    },

    back(delta) {
      return adapter.back(delta);
    },

    current() {
      return adapter.current();
    },
  };
}
