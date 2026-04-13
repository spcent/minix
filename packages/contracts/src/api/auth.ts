export type LoginPlatformKind = "wechat" | "h5";
export const LOGIN_METHODS = ["wechat_code", "phone_code", "password", "guest", "oauth"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];
export const AUTH_PROVIDER_MODES = ["builtin", "sample", "production"] as const;
export type AuthProviderMode = (typeof AUTH_PROVIDER_MODES)[number];
export const AUTH_STATUSES = ["guest", "authenticated", "reauth_required"] as const;
export type AuthStatus = (typeof AUTH_STATUSES)[number];
export const AUTH_REDIRECT_REASONS = ["auth-required", "session-expired", "force-relogin"] as const;
export type AuthRedirectReason = (typeof AUTH_REDIRECT_REASONS)[number];
export const AUTH_IDENTITY_WORKFLOW_KINDS = ["guest_upgrade", "phone_binding", "oauth_binding", "account_merge"] as const;
export type AuthIdentityWorkflowKind = (typeof AUTH_IDENTITY_WORKFLOW_KINDS)[number];
export const AUTH_PROVIDER_AUTHORIZATION_STATUSES = ["active", "revoked", "unlinked"] as const;
export type AuthProviderAuthorizationStatus = (typeof AUTH_PROVIDER_AUTHORIZATION_STATUSES)[number];
export const AUTH_PROVIDER_ACTION_KINDS = ["unlink", "revoke", "reauthorize"] as const;
export type AuthProviderActionKind = (typeof AUTH_PROVIDER_ACTION_KINDS)[number];
export const AUTH_IDENTITY_WORKFLOW_STATUSES = ["completed", "merge_required", "conflict", "blocked"] as const;
export type AuthIdentityWorkflowStatus = (typeof AUTH_IDENTITY_WORKFLOW_STATUSES)[number];
export const AUTH_IDENTITY_FAILURE_REASONS = [
  "guest_session_required",
  "formal_session_required",
  "wechat_binding_required",
  "phone_already_bound",
  "verification_code_invalid",
  "upgrade_method_unsupported",
  "merge_confirmation_required",
  "merge_target_mismatch",
] as const;
export type AuthIdentityFailureReason = (typeof AUTH_IDENTITY_FAILURE_REASONS)[number];
export const AUTH_MERGE_STRATEGIES = ["prompt", "merge"] as const;
export type AuthMergeStrategy = (typeof AUTH_MERGE_STRATEGIES)[number];
export const AUTH_VERIFICATION_PURPOSES = [
  "login",
  "guest_upgrade",
  "phone_binding",
  "change_phone",
  "password_reset",
  "account_security",
] as const;
export type AuthVerificationPurpose = (typeof AUTH_VERIFICATION_PURPOSES)[number];
export const AUTH_CREDENTIAL_FAILURE_REASONS = [
  "credential_missing",
  "verification_code_invalid",
  "verification_code_expired",
  "verification_code_locked",
  "password_not_configured",
  "password_invalid",
  "password_locked",
  "oauth_state_invalid",
  "oauth_token_invalid",
  "provider_unavailable",
] as const;
export type AuthCredentialFailureReason = (typeof AUTH_CREDENTIAL_FAILURE_REASONS)[number];

export const AUTH_SECURITY_EVENT_SCOPES = [
  "auth",
  "verification",
  "account",
  "payment",
  "upload",
  "share",
  "feedback",
  "messages",
] as const;
export type AuthSecurityEventScope = (typeof AUTH_SECURITY_EVENT_SCOPES)[number];

export interface AuthSecurityRequestContext {
  deviceId?: string;
  userAgent?: string;
  ipRegion?: string;
  frequencyKey?: string;
  scene?: string;
}

export interface AuthRiskDecision {
  deviceId?: string;
  frequencyKey?: string;
  scene?: string;
  level: "allow" | "review" | "block";
  reason?: string;
}

export interface AuthDeviceIdentity {
  deviceId: string;
  platform: LoginPlatformKind;
  trusted: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  trustedAt?: string;
  lastUserAgent?: string;
  lastIpRegion?: string;
  lastScene?: string;
  riskLevel?: AuthRiskDecision["level"];
}

export interface AuthRateLimitState {
  scope: AuthSecurityEventScope;
  key: string;
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  updatedAt: string;
}

export interface AuthSecurityAuditEvent {
  eventId: string;
  scope: AuthSecurityEventScope;
  action: string;
  result: "allowed" | "review" | "blocked";
  message: string;
  createdAt: string;
  actorUserId?: string;
  deviceId?: string;
  clientId?: string;
  platform?: LoginPlatformKind;
  reason?: string;
  frequencyKey?: string;
  scene?: string;
  traceId?: string;
}

export interface AuthSecurityPrompt {
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  acknowledgeRequired?: boolean;
  acknowledgeLabel?: string;
  scope?: AuthSecurityEventScope;
}

export interface AuthCredentialProtection {
  failureReason?: AuthCredentialFailureReason;
  remainingAttempts?: number;
  lockedUntil?: number;
}

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

export interface AuthProviderAction {
  kind: AuthProviderActionKind;
  label: string;
  available: boolean;
  blockedReason?: string;
  destructive?: boolean;
}

export interface AuthLoginMethodDescriptor {
  method: LoginMethod;
  label: string;
  providerMode: AuthProviderMode;
  availableOn: LoginPlatformKind[];
  defaultOn?: LoginPlatformKind[];
  summary: string;
  recoverySummary?: string;
}

export interface AuthProviderIdentity {
  provider: string;
  providerLabel: string;
  providerUserId: string;
  authorizationStatus: AuthProviderAuthorizationStatus;
  loginEnabled: boolean;
  linkedAt: string;
  lastAuthorizedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  actions: AuthProviderAction[];
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

export interface AuthAbnormalLoginPrompt extends AuthSecurityPrompt {}

export interface AuthIdentityWorkflow {
  kind: AuthIdentityWorkflowKind;
  status: AuthIdentityWorkflowStatus;
  workflowId?: string;
  stage?: "start" | "verify" | "preview" | "confirm" | "completed" | "failed";
  sourceUserId: string;
  targetUserId?: string;
  targetLabel?: string;
  message: string;
  continueTarget?: AuthRedirectTarget;
  failureReason?: AuthIdentityFailureReason;
  mergePreview?: AuthIdentityMergePreview;
  audit?: AuthIdentityAuditRecord[];
}

export interface AuthIdentityMergeImpact {
  key: string;
  label: string;
  sourceCount: number;
  targetCount: number;
  mergedCount: number;
  message: string;
}

export interface AuthIdentityMergePreview {
  sourceUserId: string;
  targetUserId: string;
  targetLabel: string;
  impacts: AuthIdentityMergeImpact[];
  requiresConfirmation: boolean;
  canRollback: boolean;
  recoveryMessage: string;
}

export interface AuthIdentityAuditRecord {
  eventId: string;
  action: "preview_created" | "merge_required" | "merge_confirmed" | "merge_completed" | "merge_blocked" | "rollback_safe_failure";
  workflowId: string;
  actorUserId: string;
  sourceUserId: string;
  targetUserId?: string;
  message: string;
  createdAt: string;
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
    providerUserId?: string;
    oauthState?: string;
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
  abnormalLoginPrompt?: AuthAbnormalLoginPrompt;
  riskDecision?: AuthRiskDecision;
  deviceIdentity?: AuthDeviceIdentity;
  rateLimitState?: AuthRateLimitState;
  securityAuditEvents?: AuthSecurityAuditEvent[];
  credentialProtection?: AuthCredentialProtection;
  identityWorkflow?: AuthIdentityWorkflow;
  redirectTarget?: AuthRedirectTarget;
}

export interface RefreshTokenRequest {
  platform: LoginPlatformKind;
  refreshToken: string;
}

export interface RefreshTokenResponse extends LoginResponse {}

export interface IdentityUpgradeRequest {
  credential: {
    method: Extract<LoginMethod, "phone_code" | "password">;
    phoneNumber?: string;
    verificationCode?: string;
    account?: string;
    password?: string;
    deviceId?: string;
  };
  mergeStrategy?: AuthMergeStrategy;
  redirectTarget?: AuthRedirectTarget;
}

export interface IdentityBindPhoneRequest {
  phoneNumber: string;
  verificationCode: string;
  mergeStrategy?: AuthMergeStrategy;
  redirectTarget?: AuthRedirectTarget;
}

export interface IdentityMergeRequest {
  targetUserId: string;
  workflowKind?: Extract<AuthIdentityWorkflowKind, "guest_upgrade" | "phone_binding" | "oauth_binding">;
  confirm: boolean;
  redirectTarget?: AuthRedirectTarget;
}

export interface IdentityTransitionResponse extends LoginResponse {
  identityWorkflow: AuthIdentityWorkflow;
}

export interface AuthPhoneVerificationRequest {
  phoneNumber: string;
  purpose: AuthVerificationPurpose;
  deviceId?: string;
  riskContext?: LoginRequest["riskContext"];
}

export interface AuthPhoneVerificationResponse {
  verificationId: string;
  phoneNumberMasked: string;
  purpose: AuthVerificationPurpose;
  expiresAt: number;
  retryAfterSeconds: number;
  maxAttempts: number;
  delivery: {
    provider: "sms" | "simulated";
    providerMode?: Extract<AuthProviderMode, "sample" | "production">;
    providerLabel?: string;
    providerReference: string;
    maskedTarget: string;
    debugCode?: string;
    message: string;
  };
  riskDecision?: AuthRiskDecision;
  deviceIdentity?: AuthDeviceIdentity;
  rateLimitState?: AuthRateLimitState;
  securityAuditEvents?: AuthSecurityAuditEvent[];
}

export interface AuthPasswordCredentialRequest {
  account?: string;
  phoneNumber?: string;
  password: string;
  verificationCode?: string;
  deviceId?: string;
}

export interface AuthPasswordCredentialResponse {
  userId: string;
  subject: string;
  passwordConfigured: boolean;
  credentialProtection: AuthCredentialProtection;
}

export interface AuthOAuthAuthorizeRequest {
  provider: string;
  purpose?: "login" | "bind";
  redirectTarget?: AuthRedirectTarget;
  deviceId?: string;
}

export interface AuthOAuthAuthorizeResponse {
  provider: string;
  purpose?: "login" | "bind";
  providerMode?: Extract<AuthProviderMode, "sample" | "production">;
  providerLabel?: string;
  state: string;
  authorizationUrl: string;
  expiresAt: number;
  message?: string;
}

export interface AuthOAuthCallbackRequest {
  provider: string;
  state: string;
  providerToken: string;
  providerUserId: string;
  platform: LoginPlatformKind;
  redirectTarget?: AuthRedirectTarget;
}

export interface AuthOAuthCallbackResponse extends LoginResponse {}

export interface IdentityBindOAuthRequest {
  provider: string;
  state: string;
  providerToken: string;
  providerUserId: string;
  mergeStrategy?: AuthMergeStrategy;
  redirectTarget?: AuthRedirectTarget;
}
