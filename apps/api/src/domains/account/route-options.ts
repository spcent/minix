import type {
  AccountOperationResponse,
  AuthCredentialProtection,
  AuthRateLimitState,
  AuthVerificationPurpose,
  LoginPlatformKind,
} from "@minix/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";

import type {
  ApiBindings,
  ApiStore,
  AuthOAuthCredentialRecord,
  AuthSecurityState,
  SessionRecord,
  UserState,
} from "../../types";

export interface RegisterAccountRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  resolveClientId: (request: Request) => string;
  resolveRequestDeviceId: (c: Context<any>) => string | undefined;
  guardSecurityRateLimit: (input: {
    c: Context<any>;
    store: ApiStore;
    userId: string;
    userState: UserState;
    action: "account";
    scope: "account";
    platform: LoginPlatformKind;
    clientId: string;
    deviceId?: string;
    actorUserId: string;
    traceId: string;
  }) => Promise<
    | {
        allowed: true;
        clientId: string;
        nowIso: string;
        rateLimitState: AuthRateLimitState;
      }
    | {
        allowed: false;
        clientId: string;
        nowIso: string;
        rateLimitState: AuthRateLimitState;
        response: Response;
      }
  >;
  appendSecurityAuditEvent: (input: {
    userState: UserState;
    scope: "auth" | "account" | "payment" | "upload" | "feedback" | "messages" | "share";
    action: string;
    result: "allowed" | "blocked" | "review";
    message: string;
    createdAt: string;
    actorUserId?: string;
    deviceId?: string;
    clientId?: string;
    platform?: LoginPlatformKind;
    traceId?: string;
  }) => void;
  createOperationBlockedResponse: (input: {
    userState: UserState;
    kind:
      | "change_phone"
      | "unbind_wechat"
      | "unlink_provider"
      | "revoke_provider"
      | "request_cancellation"
      | "revoke_cancellation";
    actorLabel: string;
    message: string;
    session: SessionRecord;
    requestUrl: string;
    traceId: string;
    clientId?: string;
    deviceId?: string;
  }) => AccountOperationResponse;
  consumePhoneVerification: (input: {
    userState: UserState;
    phoneNumber: string;
    purpose: AuthVerificationPurpose;
    verificationCode: string;
    now: number;
  }) => Promise<
    | { ok: true }
    | {
        ok: false;
        status: number;
        message: string;
        protection?: AuthCredentialProtection;
      }
  >;
  createUserIdFromCredential: (input: {
    method: "phone_code" | "password" | "guest";
    phoneNumber?: string;
    anonymousId?: string;
    account?: string;
  }) => string;
  createOAuthProviderLabel: (provider: string) => string;
  createOAuthCredentialRecord: (input: {
    provider: string;
    providerUserId: string;
    userId: string;
    tokenHash: string;
    now: number;
    authorizationStatus?: "active" | "revoked" | "unlinked";
    revocationReason?: string;
    existing?: AuthOAuthCredentialRecord;
  }) => AuthOAuthCredentialRecord;
  ensureAuthSecurityState: (userState: UserState) => AuthSecurityState;
  loadOAuthCredentialLink: (
    store: ApiStore,
    provider: string,
    providerUserId: string,
  ) => Promise<{
    subject: string;
    indexUserId: string;
    indexState: UserState;
    record?: AuthOAuthCredentialRecord;
  }>;
  scheduleOperationalJobForUser: (
    store: ApiStore,
    input: {
      userId: string;
      userState: UserState;
      kind: "cancellation_expiry";
      dedupeKey: string;
      relatedRecordId?: string;
      scheduledAt: string;
      maxAttempts: number;
    },
  ) => Promise<unknown>;
}
