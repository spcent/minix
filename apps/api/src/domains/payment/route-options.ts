import type { ApiBindings, ApiStore, UserState } from "../../types";
import type {
  ApiClientContextRouteOptions,
  ApiRateLimitGuardInput,
  ApiRateLimitGuardResult,
  ApiRouteBaseOptions,
} from "../route-options";

export interface RegisterPaymentRoutesOptions extends ApiRouteBaseOptions, ApiClientContextRouteOptions {
  guardPaymentRateLimit: (input: ApiRateLimitGuardInput) => ApiRateLimitGuardResult;
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
