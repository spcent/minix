import type { Hono, MiddlewareHandler } from "hono";

import type { CreateApiAppOptions } from "./app-support";
import type { ApiJobWiring } from "./app-composition.jobs";
import type { ApiSecurityWiring } from "./app-composition.security";
import type { RateLimitCounterStore } from "./rate-limit";
import type { ApiBindings, ApiStore } from "./types";

export interface RegisterApiRouteGroupsOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  createApiAppOptions: CreateApiAppOptions;
  authRateLimitStore: RateLimitCounterStore;
  security: ApiSecurityWiring;
  jobs: ApiJobWiring;
}
