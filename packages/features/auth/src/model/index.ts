import type {
  AuthAbnormalLoginPrompt,
  AuthIdentityFailureReason,
  AuthIdentityWorkflow,
  AuthStatus,
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
  redirectLabel: string | null;
  redirectPath: string | null;
  redirectParams: AuthRedirectParams;
  credentials: AuthCredentialState;
  fieldErrors: Partial<Record<keyof AuthCredentialState, string>>;
  rateLimitMessage: string | null;
  retryAfterSeconds: number | null;
  abnormalLoginPrompt: AuthAbnormalLoginPrompt | null;
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
    redirectLabel: null,
    redirectPath: null,
    redirectParams: null,
    credentials: {
      anonymousId: "",
      phoneNumber: "",
      verificationCode: "",
      account: "",
      password: "",
      provider: "",
      providerToken: "",
      deviceId: "",
    },
    fieldErrors: {},
    rateLimitMessage: null,
    retryAfterSeconds: null,
    abnormalLoginPrompt: null,
    identityWorkflow: null,
    identityFailureReason: null,
  };
}
