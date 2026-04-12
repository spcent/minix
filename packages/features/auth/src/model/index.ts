import type {
  AuthAbnormalLoginPrompt,
  AuthCredentialProtection,
  AuthDeviceIdentity,
  AuthIdentityFailureReason,
  AuthIdentityWorkflow,
  AuthRateLimitState,
  AuthRiskDecision,
  AuthSecurityAuditEvent,
  AuthRedirectReason,
  AuthStatus,
  AuthVerificationPurpose,
  LoginMethod,
} from "@minix/contracts";

export type AuthRedirectTarget = string | null;
export type AuthRedirectParams = Record<string, string | number | boolean> | null;

export interface AuthCredentialState {
  anonymousId: string;
  phoneNumber: string;
  verificationCode: string;
  account: string;
  password: string;
  provider: string;
  providerToken: string;
  providerUserId: string;
  oauthState: string;
  deviceId: string;
}

export interface AuthPageState {
  loading: boolean;
  errorMessage: string | null;
  authenticated: boolean;
  authStatus: AuthStatus | null;
  selectedLoginMethod: LoginMethod;
  lastLoginMethod: LoginMethod | null;
  noticeMessage: string | null;
  redirectTarget: AuthRedirectTarget;
  redirectRouteId: string | null;
  redirectSource: string | null;
  redirectLabel: string | null;
  redirectPath: string | null;
  redirectParams: AuthRedirectParams;
  redirectReason: AuthRedirectReason | null;
  redirectForceReauth: boolean;
  credentials: AuthCredentialState;
  fieldErrors: Partial<Record<keyof AuthCredentialState, string>>;
  rateLimitMessage: string | null;
  retryAfterSeconds: number | null;
  abnormalLoginPrompt: AuthAbnormalLoginPrompt | null;
  riskDecision: AuthRiskDecision | null;
  deviceIdentity: AuthDeviceIdentity | null;
  rateLimitState: AuthRateLimitState | null;
  securityAuditEvents: AuthSecurityAuditEvent[];
  credentialProtection: AuthCredentialProtection | null;
  phoneVerification:
    | {
        verificationId: string;
        phoneNumberMasked: string;
        purpose: AuthVerificationPurpose;
        expiresAt: number;
        retryAfterSeconds: number;
        debugCode: string | null;
      }
    | null;
  oauthAuthorization:
    | {
        provider: string;
        purpose?: "login" | "bind";
        state: string;
        authorizationUrl: string;
        expiresAt: number;
      }
    | null;
  identityWorkflow: AuthIdentityWorkflow | null;
  identityFailureReason: AuthIdentityFailureReason | null;
}

export function createInitialAuthPageState(): AuthPageState {
  return {
    loading: false,
    errorMessage: null,
    authenticated: false,
    authStatus: null,
    selectedLoginMethod: "guest",
    lastLoginMethod: null,
    noticeMessage: null,
    redirectTarget: null,
    redirectRouteId: null,
    redirectSource: null,
    redirectLabel: null,
    redirectPath: null,
    redirectParams: null,
    redirectReason: null,
    redirectForceReauth: false,
    credentials: {
      anonymousId: "",
      phoneNumber: "",
      verificationCode: "",
      account: "",
      password: "",
      provider: "",
      providerToken: "",
      providerUserId: "",
      oauthState: "",
      deviceId: "",
    },
    fieldErrors: {},
    rateLimitMessage: null,
    retryAfterSeconds: null,
    abnormalLoginPrompt: null,
    riskDecision: null,
    deviceIdentity: null,
    rateLimitState: null,
    securityAuditEvents: [],
    credentialProtection: null,
    phoneVerification: null,
    oauthAuthorization: null,
    identityWorkflow: null,
    identityFailureReason: null,
  };
}
