import type { LoginCredential } from "@minix/core";
import type { LoginMethod } from "@minix/contracts";

import type { AuthCredentialState } from "../model";

export function createAnonymousId(): string {
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createMethodValidation(
  method: LoginMethod,
  credentials: AuthCredentialState,
): Partial<Record<keyof AuthCredentialState, string>> {
  switch (method) {
    case "guest":
      return {};
    case "wechat_code":
      return {};
    case "phone_code":
      return {
        ...(credentials.phoneNumber.trim() ? {} : { phoneNumber: "Phone number is required." }),
        ...(credentials.verificationCode.trim() ? {} : { verificationCode: "Verification code is required." }),
      };
    case "password":
      return {
        ...(credentials.account.trim() || credentials.phoneNumber.trim()
          ? {}
          : { account: "Account or phone number is required." }),
        ...(credentials.password.trim() ? {} : { password: "Password is required." }),
      };
    case "oauth":
      return {
        ...(credentials.provider.trim() ? {} : { provider: "Provider is required." }),
        ...(credentials.providerToken.trim() ? {} : { providerToken: "Provider token is required." }),
        ...(credentials.providerUserId.trim() ? {} : { providerUserId: "Provider user id is required." }),
        ...(credentials.oauthState.trim() ? {} : { oauthState: "OAuth state is required." }),
      };
  }
}

export function createCredentialFromState(
  method: LoginMethod,
  credentials: AuthCredentialState,
): LoginCredential {
  switch (method) {
    case "guest":
      return {
        method,
        anonymousId: credentials.anonymousId.trim() || createAnonymousId(),
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
    case "phone_code":
      return {
        method,
        phoneNumber: credentials.phoneNumber.trim(),
        verificationCode: credentials.verificationCode.trim(),
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
    case "password":
      return {
        method,
        ...(credentials.phoneNumber.trim()
          ? { phoneNumber: credentials.phoneNumber.trim() }
          : { account: credentials.account.trim() }),
        password: credentials.password,
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
    case "oauth":
      return {
        method,
        provider: credentials.provider.trim(),
        providerToken: credentials.providerToken.trim(),
        providerUserId: credentials.providerUserId.trim(),
        oauthState: credentials.oauthState.trim(),
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
    case "wechat_code":
    default:
      return {
        method: "wechat_code",
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
  }
}
