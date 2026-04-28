import { Hono } from "hono";

import {
  createMemoryRateLimitCounterStore,
} from "./rate-limit";
import { createUnauthorizedResponse, resolveBearerSession } from "./http/auth";
import { applyCorsHeaders, buildAllowedCorsOrigins, createCorsPreflightResponse, resolveAllowedCorsOrigin } from "./http/cors";
import { getRouteTraceId } from "./http/route-context";
import { resolveTraceId } from "./http/response";
import { registerApiRoutes } from "./app-composition";
import {
  getStore,
  type CreateApiAppOptions,
} from "./app-support";
import type {
  ApiBindings,
  SessionRecord,
  UserState,
} from "./types";

declare module "hono" {
  interface ContextVariableMap {
    session: SessionRecord;
    traceId: string;
  }
}

export function createApiApp(options: CreateApiAppOptions = {}) {
  const app = new Hono<{ Bindings: ApiBindings }>();
  const authRateLimitStore = options.authRateLimitStore ?? createMemoryRateLimitCounterStore();
  const requireSession = async (
    c: Parameters<Parameters<typeof app.use>[1]>[0],
    next: Parameters<Parameters<typeof app.use>[1]>[1],
  ) => {
    const store = getStore(c.env, options.store);
    const { session } = await resolveBearerSession(c.req.header("authorization"), store);
    if (!session) {
      return createUnauthorizedResponse(getRouteTraceId(c));
    }

    c.set("session", session);
    await next();
  };

  app.use("*", async (c, next) => {
    const traceId = resolveTraceId(c.req.header("x-trace-id"));
    c.set("traceId", traceId);
    const allowedOrigins = buildAllowedCorsOrigins(c.env, options.allowedOrigins ?? []);
    const allowedOrigin = resolveAllowedCorsOrigin(c.req.header("origin"), allowedOrigins);

    if (c.req.method === "OPTIONS") {
      return createCorsPreflightResponse(allowedOrigin, traceId);
    }

    await next();
    applyCorsHeaders(c, traceId, allowedOrigin);
  });

  registerApiRoutes({
    app,
    requireSession,
    createApiAppOptions: options,
    authRateLimitStore,
  });

  return app;
}
