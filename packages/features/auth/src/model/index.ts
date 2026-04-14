import type {
  AuthAbnormalLoginPrompt,
  AuthCredentialProtection,
  AuthDeviceIdentity,
  AuthIdentityFailureReason,
  AuthLoginMethodDescriptor,
  AuthIdentityWorkflow,
  AuthRateLimitState,
  AuthRiskDecision,
  AuthSecurityAuditEvent,
  AuthRedirectReason,
  AuthStatus,
  AuthVerificationPurpose,
  LoginPlatformKind,
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
  loginMethodDescriptors: AuthLoginMethodDescriptor[];
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
      providerMode?: "sample" | "production";
      providerLabel?: string;
      message?: string;
    }
    | null;
  oauthAuthorization:
    | {
        provider: string;
        purpose?: "login" | "bind";
        state: string;
        authorizationUrl: string;
        expiresAt: number;
        providerMode?: "sample" | "production";
        providerLabel?: string;
        message?: string;
      }
    | null;
  identityWorkflow: AuthIdentityWorkflow | null;
  identityFailureReason: AuthIdentityFailureReason | null;
}

export function createDefaultLoginMethod(platform?: LoginPlatformKind): LoginMethod {
  return platform === "wechat" ? "wechat_code" : "guest";
}

export function createAuthLoginMethodDescriptors(platform?: LoginPlatformKind): AuthLoginMethodDescriptor[] {
  const activePlatform = platform ?? "h5";
  const defaultMethod = createDefaultLoginMethod(activePlatform);

  return [
    {
      method: "wechat_code",
      label: "WeChat Code",
      providerMode: "production",
      availableOn: ["wechat"],
      ...(defaultMethod === "wechat_code" ? { defaultOn: ["wechat"] } : {}),
      summary: "Official WeChat hosts use wx.login and exchange the returned platform code through /auth/login.",
      recoverySummary: "If re-authentication is required, the preserved destination stays on the current login surface until wx.login succeeds again.",
    },
    {
      method: "guest",
      label: "Guest Session",
      providerMode: "builtin",
      availableOn: ["h5"],
      ...(defaultMethod === "guest" ? { defaultOn: ["h5"] } : {}),
      summary: "The official H5 host uses the built-in guest path for the primary Home sign-in action.",
      recoverySummary: "Guest entry has no provider callback and stays on the current login surface until a protected route asks for a formal session.",
    },
    {
      method: "phone_code",
      label: "Phone Verification",
      providerMode: "sample",
      availableOn: ["h5", "wechat"],
      summary: "Phone login depends on /auth/verification-code/request. Local and sample deployments use the simulated SMS provider until operator SMS credentials are configured.",
      recoverySummary: "Verification-code issue, retry, and password-recovery handoff stay on the current login or identity page. No separate callback route is required.",
    },
    {
      method: "password",
      label: "Password",
      providerMode: "builtin",
      availableOn: ["h5", "wechat"],
      summary: "Password login verifies stored hashed credentials. Phone-based password setup and reset still depend on the verification provider.",
      recoverySummary: "Password recovery remains tied to the current login or identity page and reuses the verification provider instead of a dedicated reset host route.",
    },
    {
      method: "oauth",
      label: "OAuth",
      providerMode: "sample",
      availableOn: ["h5", "wechat"],
      summary: "OAuth state, callback, and account binding flows are implemented. Local and sample deployments use a sample authorization posture until a production provider is injected by the operator.",
      recoverySummary: "OAuth authorize and callback return to the current login or bind page. Operators own provider credentials and callback-domain registration outside tracked source.",
    },
  ];
}

export function createInitialAuthPageState(platform?: LoginPlatformKind): AuthPageState {
  const selectedLoginMethod = createDefaultLoginMethod(platform);

  return {
    loading: false,
    errorMessage: null,
    authenticated: false,
    authStatus: null,
    selectedLoginMethod,
    loginMethodDescriptors: createAuthLoginMethodDescriptors(platform),
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
