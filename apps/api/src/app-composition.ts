import type { Hono, MiddlewareHandler } from "hono";

import { getStore, type CreateApiAppOptions } from "./app-support";
import { createApiJobWiring, type ApiJobWiring } from "./app-composition.jobs";
import {
  registerAccountAndOpsRouteGroups,
  registerCommerceAndGrowthRouteGroups,
  registerFoundationRouteGroups,
} from "./app-composition.route-groups";
import {
  createApiSecurityWiring,
  type ApiSecurityWiring,
} from "./app-composition.security";
import type { RateLimitCounterStore } from "./rate-limit";
import type { ApiBindings } from "./types";

export interface RegisterApiRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  createApiAppOptions: CreateApiAppOptions;
  authRateLimitStore: RateLimitCounterStore;
}

export function registerApiRoutes(options: RegisterApiRoutesOptions) {
  const { app, requireSession, createApiAppOptions, authRateLimitStore } = options;
  const resolveStore = (env: ApiBindings | undefined) => getStore(env, createApiAppOptions.store);
  const security: ApiSecurityWiring = createApiSecurityWiring({
    ...(createApiAppOptions.authRateLimitConfig
      ? { authRateLimitConfig: createApiAppOptions.authRateLimitConfig }
      : {}),
    authRateLimitStore,
  });
  const jobs: ApiJobWiring = createApiJobWiring();

  const routeGroupOptions = {
    app,
    requireSession,
    resolveStore,
    createApiAppOptions,
    authRateLimitStore,
    security,
    jobs,
  };

  registerFoundationRouteGroups(routeGroupOptions);
  registerCommerceAndGrowthRouteGroups(routeGroupOptions);
  registerAccountAndOpsRouteGroups(routeGroupOptions);
}
