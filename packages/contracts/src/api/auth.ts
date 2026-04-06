export type LoginPlatformKind = "wechat" | "h5";

export interface LoginUserProfile {
  nickname?: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  platform: LoginPlatformKind;
  credential: {
    code?: string;
    authCode?: string;
    anonymousId?: string;
  };
}

export interface LoginResponse {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  profile?: LoginUserProfile;
}

export interface RefreshTokenRequest {
  platform: LoginPlatformKind;
  refreshToken: string;
}

export interface RefreshTokenResponse extends LoginResponse {}
