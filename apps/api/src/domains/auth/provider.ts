import type { AuthRedirectTarget, AuthVerificationPurpose, LoginPlatformKind } from "@minix/contracts";

import type { ApiBindings } from "../../types";

export interface AuthSmsDeliveryProviderInput {
  phoneNumber: string;
  maskedTarget: string;
  purpose: AuthVerificationPurpose;
  verificationId: string;
  verificationCode: string;
  deviceId?: string;
  deployEnv?: string;
}

export interface AuthSmsDeliveryProviderSuccess {
  provider: "sms";
  providerMode: "production";
  providerLabel: string;
  providerReference: string;
  maskedTarget: string;
  message: string;
}

export interface AuthSmsDeliveryProviderFailure {
  message: string;
  retryAfterSeconds?: number;
}

export type AuthSmsDeliveryProviderResult =
  | { ok: true; value: AuthSmsDeliveryProviderSuccess }
  | { ok: false; error: AuthSmsDeliveryProviderFailure };

export type AuthSmsDeliveryProvider = (
  input: AuthSmsDeliveryProviderInput,
  env: ApiBindings | undefined,
) => Promise<AuthSmsDeliveryProviderResult>;

export interface AuthOAuthAuthorizeProviderInput {
  provider: string;
  purpose?: "login" | "bind";
  state: string;
  expiresAt: number;
  redirectTarget?: AuthRedirectTarget;
  deviceId?: string;
  deployEnv?: string;
}

export interface AuthOAuthAuthorizeProviderSuccess {
  providerMode: "production";
  providerLabel: string;
  authorizationUrl: string;
  message: string;
}

export interface AuthOAuthCallbackProviderInput {
  provider: string;
  purpose?: "login" | "bind";
  state: string;
  providerToken: string;
  providerUserId: string;
  platform: LoginPlatformKind;
  deployEnv?: string;
}

export interface AuthOAuthCallbackProviderSuccess {
  providerMode: "production";
  providerLabel: string;
  providerUserId: string;
  message?: string;
}

export interface AuthOAuthProviderFailure {
  message: string;
  failureReason?: "provider_unavailable" | "oauth_token_invalid";
  retryAfterSeconds?: number;
}

export type AuthOAuthAuthorizeProviderResult =
  | { ok: true; value: AuthOAuthAuthorizeProviderSuccess }
  | { ok: false; error: AuthOAuthProviderFailure };

export type AuthOAuthCallbackProviderResult =
  | { ok: true; value: AuthOAuthCallbackProviderSuccess }
  | { ok: false; error: AuthOAuthProviderFailure };

export interface AuthOAuthProvider {
  authorize: (
    input: AuthOAuthAuthorizeProviderInput,
    env: ApiBindings | undefined,
  ) => Promise<AuthOAuthAuthorizeProviderResult>;
  validateCallback: (
    input: AuthOAuthCallbackProviderInput,
    env: ApiBindings | undefined,
  ) => Promise<AuthOAuthCallbackProviderResult>;
}
