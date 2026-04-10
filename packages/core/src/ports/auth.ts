import type { Result } from "../error/index";
import type { PlatformKind } from "../types/index";
import type { LoginMethod } from "@minix/contracts";

export interface LoginCredential {
  method?: LoginMethod;
  code?: string;
  authCode?: string;
  anonymousId?: string;
  phoneNumber?: string;
  verificationCode?: string;
  account?: string;
  password?: string;
  provider?: string;
  providerToken?: string;
  providerUserId?: string;
  oauthState?: string;
  deviceId?: string;
  raw?: unknown;
}

export interface LoginResult {
  credential: LoginCredential;
  platform: PlatformKind;
}

export interface AuthAdapter {
  login(): Promise<Result<LoginResult>>;
  logout?(): Promise<Result<void>>;
}
