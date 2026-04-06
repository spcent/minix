import type { Result } from "../error/index";
import type { PlatformKind } from "../types/index";

export interface LoginCredential {
  code?: string;
  authCode?: string;
  anonymousId?: string;
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
