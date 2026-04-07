export type AuthRedirectTarget = string | null;
export type AuthRedirectParams = Record<string, string | number | boolean> | null;

export interface AuthPageState {
  loading: boolean;
  errorMessage: string | null;
  authenticated: boolean;
  noticeMessage: string | null;
  redirectTarget: AuthRedirectTarget;
  redirectLabel: string | null;
  redirectPath: string | null;
  redirectParams: AuthRedirectParams;
}

export function createInitialAuthPageState(): AuthPageState {
  return {
    loading: false,
    errorMessage: null,
    authenticated: false,
    noticeMessage: null,
    redirectTarget: null,
    redirectLabel: null,
    redirectPath: null,
    redirectParams: null,
  };
}
