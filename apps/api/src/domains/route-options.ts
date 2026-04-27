import type { AuthRateLimitState } from "@minix/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";

import type { ApiBindings, ApiStore, UserState } from "../types";

export interface ApiRouteAppOptions {
  app: Hono<{ Bindings: ApiBindings }>;
}

export interface ApiSessionRouteOptions extends ApiRouteAppOptions {
  requireSession: MiddlewareHandler<any>;
}

export interface ApiRouteBaseOptions extends ApiSessionRouteOptions {
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
}

export interface ApiClientContextRouteOptions {
  resolveClientId: (request: Request) => string;
  resolveRequestDeviceId: (c: Context<any>) => string | undefined;
}

export interface ApiRateLimitGuardInput {
  c: Context<any>;
  store: ApiStore;
  userId: string;
  userState: UserState;
  platform: string;
  clientId: string;
  deviceId?: string;
  traceId: string;
}

export type ApiRateLimitGuardResult<
  TAllowedExtra extends object = {},
  TBlockedExtra extends object = TAllowedExtra,
> = Promise<
  | ({ allowed: true; rateLimitState: AuthRateLimitState } & TAllowedExtra)
  | ({ allowed: false; rateLimitState: AuthRateLimitState; response: Response } & TBlockedExtra)
>;

export type ApiClientStampedRateLimitGuardResult = ApiRateLimitGuardResult<{
  clientId: string;
  nowIso: string;
}>;
