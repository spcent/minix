import type {
  AuthRedirectTarget,
  AuthStatus,
  CapabilityKind,
  ConfigValue,
  FeatureConfig as ContractFeatureConfig,
  FeatureConfigMap as ContractFeatureConfigMap,
  LoginMethod,
  TelemetryAttributeMap,
  TelemetryLevel,
} from "@minix/contracts";

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
  phoneBound?: boolean;
  wechatBound?: boolean;
  realNameVerified?: boolean;
  mergedUserId?: string;
  loginMethod?: LoginMethod;
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
  authStatus?: AuthStatus;
  platform: PlatformKind;
  redirectTarget?: AuthRedirectTarget;
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

export type FeatureConfig = ContractFeatureConfig;
export type FeatureConfigMap = ContractFeatureConfigMap;

export interface UserContext {
  userId: string;
  platform: PlatformKind;
  loggedIn: boolean;
  authStatus?: AuthStatus;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
  profile?: UserProfile;
}

export interface AppContext {
  env: RuntimeEnv;
  user?: UserContext;
  featureConfig?: FeatureConfigMap;
  capabilityStatus?: Partial<Record<CapabilityKind, boolean>>;
  traceId?: string;
}

export interface TelemetryContext {
  traceId?: string;
  sessionId?: string;
  viewId?: string;
  level?: TelemetryLevel;
  attributes?: TelemetryAttributeMap;
}

export type { ConfigValue };

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
