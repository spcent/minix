import type { LoginPlatformKind } from "@minix/contracts";
import type { Context } from "hono";

import { createUserIdFromCredential } from "./domains/auth/identity";
import {
  appendSecurityAuditEvent,
  consumePhoneVerification,
  createOAuthCredentialRecord,
  createOAuthProviderLabel,
  createOperationBlockedResponse,
  ensureAuthSecurityState,
  guardSecurityRateLimit,
  loadOAuthCredentialLink,
  resolveRequestDeviceId,
} from "./domains/auth/security";
import {
  resolveClientId,
  type AuthRateLimitConfig,
  type RateLimitCounterStore,
} from "./rate-limit";
import type { ApiStore, UserState } from "./types";

type GuardAction = Parameters<typeof guardSecurityRateLimit>[0]["action"];
type GuardScope = Parameters<typeof guardSecurityRateLimit>[0]["scope"];
type AuditScope = Parameters<typeof appendSecurityAuditEvent>[0]["scope"];
type AuditResult = Parameters<typeof appendSecurityAuditEvent>[0]["result"];

interface ScopedRateLimitInput {
  c: Context<any>;
  store: ApiStore;
  userId: string;
  userState: UserState;
  platform: string;
  clientId: string;
  deviceId?: string;
  traceId: string;
  actorUserId?: string;
}

interface ScopedAuditInput {
  userState: UserState;
  actorUserId: string;
  clientId: string;
  deviceId?: string;
  platform: string;
  traceId: string;
}

type ValueOrResolver<Input, Value> = Value | ((input: Input) => Value);

export interface CreateApiSecurityWiringOptions {
  authRateLimitConfig?: Partial<AuthRateLimitConfig>;
  authRateLimitStore: RateLimitCounterStore;
}

function resolveValue<Input, Value>(
  valueOrResolver: ValueOrResolver<Input, Value>,
  input: Input,
): Value {
  if (typeof valueOrResolver === "function") {
    return (valueOrResolver as (value: Input) => Value)(input);
  }

  return valueOrResolver;
}

export function createApiSecurityWiring(options: CreateApiSecurityWiringOptions) {
  const { authRateLimitConfig, authRateLimitStore } = options;

  return {
    resolveClientId: (request: Request) => resolveClientId(request),
    resolveRequestDeviceId: (c: Context<any>) => resolveRequestDeviceId(c),
    createScopedRateLimitGuard<Input extends ScopedRateLimitInput>(config: {
      action: ValueOrResolver<Input, GuardAction>;
      scope: ValueOrResolver<Input, GuardScope>;
      blockedAction: ValueOrResolver<Input, string>;
      blockedMessage: ValueOrResolver<Input, string>;
    }) {
      return async (input: Input) =>
        guardSecurityRateLimit({
          c: input.c,
          store: input.store,
          userId: input.userId,
          userState: input.userState,
          action: resolveValue(config.action, input),
          scope: resolveValue(config.scope, input),
          platform: input.platform as LoginPlatformKind,
          clientId: input.clientId,
          ...(input.deviceId ? { deviceId: input.deviceId } : {}),
          actorUserId: input.actorUserId ?? input.userId,
          traceId: input.traceId,
          ...(authRateLimitConfig ? { config: authRateLimitConfig } : {}),
          counterStore: authRateLimitStore,
          blockedAction: resolveValue(config.blockedAction, input),
          blockedMessage: resolveValue(config.blockedMessage, input),
        });
    },
    createScopedAuditAppender<Input extends ScopedAuditInput>(config: {
      scope: ValueOrResolver<Input, AuditScope>;
      action: ValueOrResolver<Input, string>;
      result: ValueOrResolver<Input, AuditResult>;
      message: ValueOrResolver<Input, string>;
    }) {
      return (input: Input) => {
        appendSecurityAuditEvent({
          userState: input.userState,
          scope: resolveValue(config.scope, input),
          action: resolveValue(config.action, input),
          result: resolveValue(config.result, input),
          message: resolveValue(config.message, input),
          createdAt: new Date().toISOString(),
          actorUserId: input.actorUserId,
          ...(input.deviceId ? { deviceId: input.deviceId } : {}),
          clientId: input.clientId,
          platform: input.platform as LoginPlatformKind,
          traceId: input.traceId,
        });
      };
    },
    appendSecurityAuditEvent: (input: Parameters<typeof appendSecurityAuditEvent>[0]) =>
      appendSecurityAuditEvent(input),
    createOperationBlockedResponse: (input: Parameters<typeof createOperationBlockedResponse>[0]) =>
      createOperationBlockedResponse(input),
    consumePhoneVerification: (input: Parameters<typeof consumePhoneVerification>[0]) =>
      consumePhoneVerification(input),
    createUserIdFromCredential: (input: Parameters<typeof createUserIdFromCredential>[0]) =>
      createUserIdFromCredential(input),
    createOAuthProviderLabel: (provider: string) => createOAuthProviderLabel(provider),
    createOAuthCredentialRecord: (input: Parameters<typeof createOAuthCredentialRecord>[0]) =>
      createOAuthCredentialRecord(input),
    ensureAuthSecurityState: (userState: UserState) => ensureAuthSecurityState(userState),
    loadOAuthCredentialLink: (
      store: ApiStore,
      provider: string,
      providerUserId: string,
    ) => loadOAuthCredentialLink(store, provider, providerUserId),
  };
}

export type ApiSecurityWiring = ReturnType<typeof createApiSecurityWiring>;
