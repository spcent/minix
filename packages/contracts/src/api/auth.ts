export type LoginPlatformKind = "wechat" | "h5";
export const LOGIN_METHODS = ["wechat_code", "phone_code", "password", "guest", "oauth"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];
export const AUTH_STATUSES = ["guest", "authenticated", "reauth_required"] as const;
export type AuthStatus = (typeof AUTH_STATUSES)[number];
export const AUTH_REDIRECT_REASONS = ["auth-required", "session-expired", "force-relogin"] as const;
export type AuthRedirectReason = (typeof AUTH_REDIRECT_REASONS)[number];

export interface AuthSessionPayload {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  issuedAt?: number;
  tokenType?: string;
}

export interface AuthIdentity {
  userId: string;
  anonymous?: boolean;
  phoneBound?: boolean;
  wechatBound?: boolean;
  realNameVerified?: boolean;
  mergedUserId?: string;
}

export interface AuthRedirectTarget {
  routeId?: string;
  path?: string;
  params?: Record<string, string | number | boolean>;
  source?: string;
  label?: string;
  reason?: AuthRedirectReason;
  forceReauth?: boolean;
}

export interface LoginUserProfile {
  nickname?: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  platform: LoginPlatformKind;
  credential: {
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
    deviceId?: string;
  };
  riskContext?: {
    deviceId?: string;
    userAgent?: string;
    ipRegion?: string;
    frequencyKey?: string;
    scene?: string;
  };
  redirectTarget?: AuthRedirectTarget;
}

export interface LoginResponse {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  profile?: LoginUserProfile;
  session: AuthSessionPayload;
  identity: AuthIdentity;
  authStatus: AuthStatus;
  loginMethod?: LoginMethod;
  redirectTarget?: AuthRedirectTarget;
}

export interface RefreshTokenRequest {
  platform: LoginPlatformKind;
  refreshToken: string;
}

export interface RefreshTokenResponse extends LoginResponse {}
