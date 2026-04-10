export type LoginPlatformKind = "wechat" | "h5";
export const LOGIN_METHODS = ["wechat_code", "phone_code", "password", "guest", "oauth"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];
export const AUTH_STATUSES = ["guest", "authenticated", "reauth_required"] as const;
export type AuthStatus = (typeof AUTH_STATUSES)[number];
export const AUTH_REDIRECT_REASONS = ["auth-required", "session-expired", "force-relogin"] as const;
export type AuthRedirectReason = (typeof AUTH_REDIRECT_REASONS)[number];
export const AUTH_IDENTITY_WORKFLOW_KINDS = ["guest_upgrade", "phone_binding", "account_merge"] as const;
export type AuthIdentityWorkflowKind = (typeof AUTH_IDENTITY_WORKFLOW_KINDS)[number];
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
export const AUTH_VERIFICATION_PURPOSES = ["login", "guest_upgrade", "phone_binding", "change_phone", "password_reset"] as const;
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

export interface AuthRiskDecision {
  deviceId?: string;
  frequencyKey?: string;
  scene?: string;
  level: "allow" | "review" | "block";
  reason?: string;
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

export interface AuthRedirectTarget {
  routeId?: string;
  path?: string;
  params?: Record<string, string | number | boolean>;
  source?: string;
  label?: string;
  reason?: AuthRedirectReason;
  forceReauth?: boolean;
}

export interface AuthAbnormalLoginPrompt {
  title: string;
  message: string;
  severity: "info" | "warning";
  acknowledgeRequired?: boolean;
}

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
  workflowKind?: Extract<AuthIdentityWorkflowKind, "guest_upgrade" | "phone_binding">;
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
    providerReference: string;
    maskedTarget: string;
    debugCode?: string;
    message: string;
  };
  riskDecision?: AuthRiskDecision;
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
  redirectTarget?: AuthRedirectTarget;
  deviceId?: string;
}

export interface AuthOAuthAuthorizeResponse {
  provider: string;
  state: string;
  authorizationUrl: string;
  expiresAt: number;
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
