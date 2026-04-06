export type AuthRedirectTarget = "overview" | "plan" | "preferences" | null;

export interface AuthPageState {
  loading: boolean;
  errorMessage: string | null;
  authenticated: boolean;
  noticeMessage: string | null;
  redirectTarget: AuthRedirectTarget;
}

export function createInitialAuthPageState(): AuthPageState {
  return {
    loading: false,
    errorMessage: null,
    authenticated: false,
    noticeMessage: null,
    redirectTarget: null,
  };
}
