import type { AuthRateLimitState } from "@minix/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";

import type { ApiBindings, ApiStore, UserState } from "../../types";

export interface RegisterPaymentRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  resolveClientId: (request: Request) => string;
  resolveRequestDeviceId: (c: Context<any>) => string | undefined;
  guardPaymentRateLimit: (input: {
    c: Context<any>;
    store: ApiStore;
    userId: string;
    userState: UserState;
    platform: string;
    clientId: string;
    deviceId?: string;
    traceId: string;
  }) => Promise<
    | {
        allowed: true;
        rateLimitState: AuthRateLimitState;
      }
    | {
        allowed: false;
        rateLimitState: AuthRateLimitState;
        response: Response;
      }
  >;
  appendPaymentAudit: (input: {
    userState: UserState;
    actorUserId: string;
    clientId: string;
    deviceId?: string;
    platform: string;
    traceId: string;
    action: "membership_purchase";
    result: "allowed" | "review";
    message: string;
  }) => void;
  schedulePaymentReconciliation: (input: {
    store: ApiStore;
    userId: string;
    userState: UserState;
    orderId: string;
  }) => Promise<void>;
  resolveWebhookSecret: (env: ApiBindings | undefined) => string;
}
