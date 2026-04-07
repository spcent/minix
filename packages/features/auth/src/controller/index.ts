import {
  createStore,
  deriveAuthRedirectLabel,
  ok,
  readAuthRedirectTarget,
  type AppKernel,
  type UserSession,
} from "@minix/core";
import { type AppRouteId } from "@minix/contracts";

import { createInitialAuthPageState, type AuthRedirectTarget } from "../model";

export interface CreateAuthControllerOptions {
  kernel: AppKernel;
  successRouteId: AppRouteId;
  stayOnSuccess?: boolean;
  overviewRouteId?: AppRouteId;
  planRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  reportError?: (message: string) => Promise<void>;
}

function hasActiveSession(session: UserSession | null | undefined): boolean {
  if (!session?.loggedIn || !session.token?.accessToken) {
    return false;
  }

  if (session.token.expiresAt === undefined) {
    return true;
  }

  return session.token.expiresAt > Date.now();
}

function canRefreshSession(session: UserSession | null | undefined): session is UserSession {
  return Boolean(session?.loggedIn && session.token?.refreshToken);
}

function shouldClearAfterRefreshFailure(code: string): boolean {
  return code === "TOKEN_EXPIRED" || code === "UNAUTHORIZED" || code === "FORBIDDEN";
}

function formatProtectedPageNotice(label?: string | null): string | null {
  return label ? `Return to Home and sign in to open ${label}.` : null;
}

export function createAuthController(options: CreateAuthControllerOptions) {
  const {
    kernel,
    successRouteId,
    stayOnSuccess = false,
    overviewRouteId,
    planRouteId,
    settingsRouteId,
    reportError,
  } = options;
  const store = createStore(createInitialAuthPageState());

  async function routeToSuccess() {
    if (stayOnSuccess) {
      return { ok: true, value: undefined } as const;
    }

    return kernel.router.replaceRoute(successRouteId);
  }

  async function routeToOptional(routeId?: AppRouteId) {
    if (!routeId) {
      return { ok: true, value: undefined } as const;
    }

    return kernel.router.toRoute(routeId);
  }

  function readRedirectState(): { target: AuthRedirectTarget; noticeMessage: string | null } {
    const current = kernel.router.current();
    if (!current.ok) {
      return {
        target: null,
        noticeMessage: null,
      };
    }

    const redirect = readAuthRedirectTarget(current.value);
    const label = deriveAuthRedirectLabel(redirect);
    const target = redirect?.source ?? redirect?.routeId ?? redirect?.path ?? null;

    store.setState({
      redirectLabel: label,
      redirectPath: redirect?.path ?? null,
      redirectParams: redirect?.params ?? null,
    });

    return {
      target,
      noticeMessage: formatProtectedPageNotice(label),
    };
  }

  async function handleError(message: string) {
      store.setState({
        loading: false,
        errorMessage: message,
        authenticated: false,
        redirectTarget: null,
        redirectLabel: null,
        redirectPath: null,
        redirectParams: null,
      });

    await reportError?.(message);
  }

  return {
    store,

    async restoreSession() {
      const redirectState = readRedirectState();
      store.setState({
        loading: true,
        errorMessage: null,
        noticeMessage: redirectState.noticeMessage,
        redirectTarget: redirectState.target,
        redirectLabel: store.getState().redirectLabel,
        redirectPath: store.getState().redirectPath,
        redirectParams: store.getState().redirectParams,
      });

      if (kernel.auth.recoverSession) {
        const recovered = await kernel.auth.recoverSession();
        if (!recovered.ok) {
          await handleError(recovered.error.message);
          return recovered;
        }

        if (recovered.value) {
          store.setState({
            loading: false,
            errorMessage: null,
            authenticated: true,
            noticeMessage: null,
            redirectTarget: redirectState.target,
            redirectLabel: store.getState().redirectLabel,
            redirectPath: store.getState().redirectPath,
            redirectParams: store.getState().redirectParams,
          });
          return routeToSuccess();
        }

        store.setState({
          loading: false,
          errorMessage: null,
          authenticated: false,
          noticeMessage: redirectState.noticeMessage,
          redirectTarget: redirectState.target,
          redirectLabel: store.getState().redirectLabel,
          redirectPath: store.getState().redirectPath,
          redirectParams: store.getState().redirectParams,
        });
        return ok(false);
      }

      const session = await kernel.session.get();
      if (!session.ok) {
        await handleError(session.error.message);
        return session;
      }

      if (hasActiveSession(session.value)) {
        store.setState({
          loading: false,
          errorMessage: null,
          authenticated: true,
          noticeMessage: null,
          redirectTarget: redirectState.target,
          redirectLabel: store.getState().redirectLabel,
          redirectPath: store.getState().redirectPath,
          redirectParams: store.getState().redirectParams,
        });
        return routeToSuccess();
      }

      if (canRefreshSession(session.value) && kernel.auth.refreshSession) {
        const refreshed = await kernel.auth.refreshSession(session.value);
        if (refreshed.ok) {
          store.setState({
            loading: false,
            errorMessage: null,
            authenticated: true,
            noticeMessage: null,
            redirectTarget: redirectState.target,
            redirectLabel: store.getState().redirectLabel,
            redirectPath: store.getState().redirectPath,
            redirectParams: store.getState().redirectParams,
          });
          return routeToSuccess();
        }

        if (shouldClearAfterRefreshFailure(refreshed.error.code)) {
          await kernel.session.clear();
        } else {
          await handleError(refreshed.error.message);
          return refreshed;
        }
      } else if (session.value) {
        await kernel.session.clear();
      }

      store.setState({
        loading: false,
        errorMessage: null,
        authenticated: false,
        noticeMessage: redirectState.noticeMessage,
        redirectTarget: redirectState.target,
        redirectLabel: store.getState().redirectLabel,
        redirectPath: store.getState().redirectPath,
        redirectParams: store.getState().redirectParams,
      });
      return ok(false);
    },

    async submitLogin() {
      store.setState({
        loading: true,
        errorMessage: null,
        noticeMessage: null,
        redirectTarget: store.getState().redirectTarget,
        redirectLabel: store.getState().redirectLabel,
        redirectPath: store.getState().redirectPath,
        redirectParams: store.getState().redirectParams,
      });

      const result = await kernel.auth.login();
      if (!result.ok) {
        await handleError(result.error.message);
        return result;
      }

      store.setState({
        loading: false,
        errorMessage: null,
        authenticated: true,
        noticeMessage: null,
        redirectTarget: store.getState().redirectTarget,
        redirectLabel: store.getState().redirectLabel,
        redirectPath: store.getState().redirectPath,
        redirectParams: store.getState().redirectParams,
      });
      return routeToSuccess();
    },

    async submitEnsureLogin() {
      store.setState({
        loading: true,
        errorMessage: null,
        noticeMessage: null,
        redirectTarget: store.getState().redirectTarget,
        redirectLabel: store.getState().redirectLabel,
        redirectPath: store.getState().redirectPath,
        redirectParams: store.getState().redirectParams,
      });

      const result = await kernel.auth.ensureLogin();
      if (!result.ok) {
        await handleError(result.error.message);
        return result;
      }

      store.setState({
        loading: false,
        errorMessage: null,
        authenticated: true,
        noticeMessage: null,
        redirectTarget: store.getState().redirectTarget,
        redirectLabel: store.getState().redirectLabel,
        redirectPath: store.getState().redirectPath,
        redirectParams: store.getState().redirectParams,
      });
      return routeToSuccess();
    },

    async goToRedirectTarget() {
      const redirectTarget = store.getState().redirectTarget;
      if (!redirectTarget) {
        return { ok: true, value: undefined } as const;
      }

      const redirectPath = store.getState().redirectPath;
      const redirectParams = store.getState().redirectParams ?? undefined;
      const routeId =
        redirectTarget === "overview"
          ? overviewRouteId
          : redirectTarget === "plan"
            ? planRouteId
            : redirectTarget === "preferences"
              ? settingsRouteId
              : undefined;

      const result = redirectPath
        ? await kernel.router.to(redirectPath, redirectParams ?? undefined)
        : await routeToOptional(routeId);
      if (result.ok) {
        store.setState({
          redirectTarget: null,
          noticeMessage: null,
          redirectLabel: null,
          redirectPath: null,
          redirectParams: null,
        });
      }

      return result;
    },

    async goToOverview() {
      return routeToOptional(overviewRouteId);
    },

    async goToPlan() {
      return routeToOptional(planRouteId);
    },

    async goToSettings() {
      return routeToOptional(settingsRouteId);
    },
  };
}
