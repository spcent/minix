export type PlatformKind = "wechat" | "h5";

export interface SessionToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  issuedAt?: number;
  tokenType?: string;
}

export interface UserIdentity {
  userId: string;
  anonymous?: boolean;
}

export interface UserProfile {
  nickname?: string;
  avatarUrl?: string;
}

export interface UserSession {
  identity: UserIdentity;
  token?: SessionToken;
  profile?: UserProfile;
  loggedIn: boolean;
  platform: PlatformKind;
}

export interface RuntimeEnv {
  appId: string;
  appName: string;
  platform: PlatformKind;
  apiBaseUrl: string;
  debug: boolean;
  version: string;
}

export interface FeatureFlags {
  enableAutoLogin: boolean;
  enableRouteGuard: boolean;
}

export interface ToastOptions {
  title: string;
  icon?: "success" | "error" | "none" | "loading";
  durationMs?: number;
}

export interface ModalOptions {
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
}

export * from "./novel-access";
export * from "./reading-center";
