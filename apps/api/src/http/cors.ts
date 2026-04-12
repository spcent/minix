import type { Context } from "hono";

import type { ApiBindings } from "../types";
import { withTraceHeaders } from "./response";

const DEFAULT_ALLOWED_CORS_ORIGINS = [
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:4174",
  "http://127.0.0.1:4174",
] as const;

const CORS_ALLOW_HEADERS = "authorization, content-type, x-trace-id";
const CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_MAX_AGE_SECONDS = "600";

export function parseConfiguredCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function readConfiguredCorsOrigins(env?: ApiBindings): string[] {
  const envValue = env?.MINIX_CORS_ALLOWED_ORIGINS;
  if (envValue) {
    return parseConfiguredCorsOrigins(envValue);
  }

  if (typeof process === "undefined") {
    return [];
  }

  return parseConfiguredCorsOrigins(process.env?.MINIX_CORS_ALLOWED_ORIGINS);
}

export function buildAllowedCorsOrigins(env: ApiBindings | undefined, overrides: readonly string[] = []): string[] {
  return Array.from(new Set([...DEFAULT_ALLOWED_CORS_ORIGINS, ...readConfiguredCorsOrigins(env), ...overrides]));
}

export function resolveAllowedCorsOrigin(origin: string | undefined, configuredOrigins: readonly string[]): string | null {
  if (!origin) {
    return null;
  }

  return configuredOrigins.includes(origin) ? origin : null;
}

export function createCorsPreflightResponse(allowedOrigin: string | null, traceId: string): Response {
  if (!allowedOrigin) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: withTraceHeaders(
      {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
        "Access-Control-Allow-Methods": CORS_ALLOW_METHODS,
        "Access-Control-Max-Age": CORS_MAX_AGE_SECONDS,
        Vary: "Origin",
      },
      traceId,
    ),
  });
}

export function applyCorsHeaders(c: Context, traceId: string, allowedOrigin: string | null) {
  c.header("X-Trace-Id", traceId);

  if (!allowedOrigin) {
    return;
  }

  c.header("Access-Control-Allow-Origin", allowedOrigin);
  c.header("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  c.header("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  c.header("Access-Control-Max-Age", CORS_MAX_AGE_SECONDS);
  c.header("Vary", "Origin");
}
