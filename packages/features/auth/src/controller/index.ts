import {
  createStore,
  deriveAuthRedirectLabel,
  ok,
  persistAuthSessionResponse,
  readAuthRedirectTarget,
  type AppKernel,
  type LoginCredential,
  type UserSession,
} from "@minix/core";
import type {
  AppRouteId,
  AuthIdentityFailureReason,
  AuthIdentityWorkflow,
  AuthRedirectTarget as ContractAuthRedirectTarget,
  IdentityBindPhoneRequest,
  IdentityMergeRequest,
  IdentityTransitionResponse,
  IdentityUpgradeRequest,
  LoginMethod,
} from "@minix/contracts";

import { createInitialAuthPageState, type AuthCredentialState, type AuthRedirectTarget } from "../model";

export interface CreateAuthControllerOptions {
  kernel: AppKernel;
  successRouteId: AppRouteId;
  stayOnSuccess?: boolean;
  overviewRouteId?: AppRouteId;
  planRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  reportError?: (message: string) => Promise<void>;
}

function hasActiveSession(session: UserSession | null | undefined): session is UserSession {
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

function createAnonymousId(): string {
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultMethod(_platform: AppKernel["env"]["platform"] | undefined): LoginMethod {
  return "wechat_code";
}

function createMethodValidation(
  method: LoginMethod,
  credentials: AuthCredentialState,
): Partial<Record<keyof AuthCredentialState, string>> {
  switch (method) {
    case "guest":
      return {};
    case "wechat_code":
      return {};
    case "phone_code":
      return {
        ...(credentials.phoneNumber.trim() ? {} : { phoneNumber: "Phone number is required." }),
        ...(credentials.verificationCode.trim() ? {} : { verificationCode: "Verification code is required." }),
      };
    case "password":
      return {
        ...(credentials.account.trim() || credentials.phoneNumber.trim()
          ? {}
          : { account: "Account or phone number is required." }),
        ...(credentials.password.trim() ? {} : { password: "Password is required." }),
      };
    case "oauth":
      return {
        ...(credentials.provider.trim() ? {} : { provider: "Provider is required." }),
        ...(credentials.providerToken.trim() ? {} : { providerToken: "Provider token is required." }),
      };
  }
}

function createCredentialFromState(
  method: LoginMethod,
  credentials: AuthCredentialState,
): LoginCredential {
  switch (method) {
    case "guest":
      return {
        method,
        anonymousId: credentials.anonymousId.trim() || createAnonymousId(),
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
    case "phone_code":
      return {
        method,
        phoneNumber: credentials.phoneNumber.trim(),
        verificationCode: credentials.verificationCode.trim(),
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
    case "password":
      return {
        method,
        ...(credentials.phoneNumber.trim()
          ? { phoneNumber: credentials.phoneNumber.trim() }
          : { account: credentials.account.trim() }),
        password: credentials.password,
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
    case "oauth":
      return {
        method,
        provider: credentials.provider.trim(),
        providerToken: credentials.providerToken.trim(),
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
    case "wechat_code":
    default:
      return {
        method: "wechat_code",
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      };
  }
}

function readRetryAfterSeconds(detail: unknown): number | null {
  if (typeof detail !== "object" || detail === null) {
    return null;
  }

  const value = (detail as Record<string, unknown>).retryAfterSeconds;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function deriveRateLimitMessage(retryAfterSeconds: number | null): string | null {
  if (retryAfterSeconds === null) {
    return "Too many login attempts. Retry later.";
  }

  return `Too many login attempts. Retry in ${retryAfterSeconds} seconds.`;
}

function createWorkflowRedirectTarget(state: ReturnType<typeof createInitialAuthPageState>): ContractAuthRedirectTarget | undefined {
  if (!state.redirectPath && !state.redirectTarget && !state.redirectLabel) {
    return undefined;
  }

  return {
    ...(state.redirectPath ? { path: state.redirectPath } : {}),
    ...(state.redirectParams ? { params: state.redirectParams } : {}),
    ...(state.redirectTarget ? { source: state.redirectTarget } : {}),
    ...(state.redirectLabel ? { label: state.redirectLabel } : {}),
  };
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
  const initialMethod = createDefaultMethod(kernel.env?.platform);
  const store = createStore({
    ...createInitialAuthPageState(),
    selectedLoginMethod: initialMethod,
    credentials: {
      ...createInitialAuthPageState().credentials,
      ...(initialMethod === "guest" ? { anonymousId: createAnonymousId() } : {}),
    },
  });

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

  async function handleError(message: string, options?: {
    retryAfterSeconds?: number | null;
    preserveRedirect?: boolean;
  }) {
    store.setState({
      loading: false,
      errorMessage: message,
      authenticated: false,
      authStatus: null,
      redirectTarget: options?.preserveRedirect ? store.getState().redirectTarget : null,
      redirectLabel: options?.preserveRedirect ? store.getState().redirectLabel : null,
      redirectPath: options?.preserveRedirect ? store.getState().redirectPath : null,
      redirectParams: options?.preserveRedirect ? store.getState().redirectParams : null,
      rateLimitMessage: options?.retryAfterSeconds !== undefined ? deriveRateLimitMessage(options.retryAfterSeconds) : null,
      retryAfterSeconds: options?.retryAfterSeconds ?? null,
    });

    await reportError?.(message);
  }

  function syncSessionState(session: UserSession, options?: { clearNotice?: boolean }) {
    store.setState({
      loading: false,
      errorMessage: null,
      authenticated: true,
      authStatus: session.authStatus ?? (session.identity.anonymous ? "guest" : "authenticated"),
      lastLoginMethod: session.identity.loginMethod ?? store.getState().selectedLoginMethod,
      noticeMessage: options?.clearNotice === false ? store.getState().noticeMessage : null,
      abnormalLoginPrompt: session.abnormalLoginPrompt ?? null,
      identityWorkflow: session.identityWorkflow ?? null,
      identityFailureReason: session.identityWorkflow?.failureReason ?? null,
      rateLimitMessage: null,
      retryAfterSeconds: null,
    });
  }

  async function persistTransitionResponse(response: IdentityTransitionResponse) {
    const existing = await kernel.session.get();
    if (!existing.ok) {
      return existing;
    }

    const persisted = await persistAuthSessionResponse(
      {
        session: kernel.session,
        env: kernel.env,
      },
      response,
      existing.value,
    );
    if (!persisted.ok) {
      return persisted;
    }

    syncSessionState(persisted.value);
    store.setState({
      identityWorkflow: response.identityWorkflow,
      identityFailureReason: response.identityWorkflow.failureReason ?? null,
    });
    return ok(persisted.value);
  }

  async function submitIdentityTransition<TRequest>(
    url: string,
    body: TRequest,
  ) {
    store.setState({
      loading: true,
      errorMessage: null,
      noticeMessage: null,
      fieldErrors: {},
      rateLimitMessage: null,
      retryAfterSeconds: null,
      abnormalLoginPrompt: null,
    });

    const result = await kernel.request.post<IdentityTransitionResponse>(url, body);
    if (!result.ok) {
      await handleError(result.error.message, {
        preserveRedirect: true,
      });
      return result;
    }

    const persisted = await persistTransitionResponse(result.value);
    if (!persisted.ok) {
      await handleError(persisted.error.message, { preserveRedirect: true });
      return persisted;
    }

    if (result.value.identityWorkflow.status === "completed") {
      return routeToSuccess();
    }

    store.setState({
      loading: false,
    });
    return ok(undefined);
  }

  function validateSelectedMethod() {
    const method = store.getState().selectedLoginMethod;
    const fieldErrors = createMethodValidation(method, store.getState().credentials);
    store.setState({
      fieldErrors,
      errorMessage:
        Object.keys(fieldErrors).length > 0
          ? "Please complete the required login fields."
          : null,
    });
    return fieldErrors;
  }

  async function submitCredentialLogin(method: LoginMethod) {
    const current = store.getState();
    const fieldErrors = createMethodValidation(method, current.credentials);
    if (Object.keys(fieldErrors).length > 0) {
      store.setState({
        fieldErrors,
        errorMessage: "Please complete the required login fields.",
      });
      return ok(undefined);
    }

    store.setState({
      loading: true,
      errorMessage: null,
      noticeMessage: null,
      fieldErrors: {},
      rateLimitMessage: null,
      retryAfterSeconds: null,
      abnormalLoginPrompt: null,
    });

    const credential = createCredentialFromState(method, current.credentials);
    const result = await kernel.auth.exchangeToken({
      credential,
      platform: kernel.env.platform,
    });
    if (!result.ok) {
      await handleError(result.error.message, {
        retryAfterSeconds: result.error.code === "RATE_LIMITED" ? readRetryAfterSeconds(result.error.detail) : null,
        preserveRedirect: true,
      });
      return result;
    }

    if (method === "guest" && credential.anonymousId && credential.anonymousId !== current.credentials.anonymousId) {
      store.setState({
        credentials: {
          ...store.getState().credentials,
          anonymousId: credential.anonymousId,
        },
      });
    }

    syncSessionState(result.value);
    return routeToSuccess();
  }

  return {
    store,

    setLoginMethod(method: LoginMethod) {
      store.setState({
        selectedLoginMethod: method,
        fieldErrors: {},
        errorMessage: null,
        ...(method === "guest" && !store.getState().credentials.anonymousId
          ? {
              credentials: {
                ...store.getState().credentials,
                anonymousId: createAnonymousId(),
              },
            }
          : {}),
      });
    },

    updateCredentials(values: Partial<AuthCredentialState>) {
      store.setState({
        credentials: {
          ...store.getState().credentials,
          ...values,
        },
        fieldErrors: {},
        errorMessage: null,
      });
    },

    clearAbnormalLoginPrompt() {
      store.setState({
        abnormalLoginPrompt: null,
      });
    },

    clearIdentityWorkflow() {
      store.setState({
        identityWorkflow: null,
        identityFailureReason: null,
      });
    },

    validateSelectedMethod,

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
          await handleError(recovered.error.message, { preserveRedirect: true });
          return recovered;
        }

        if (recovered.value) {
          syncSessionState(recovered.value);
          return routeToSuccess();
        }

        store.setState({
          loading: false,
          errorMessage: null,
          authenticated: false,
          authStatus: null,
          noticeMessage: redirectState.noticeMessage,
          redirectTarget: redirectState.target,
          redirectLabel: store.getState().redirectLabel,
          redirectPath: store.getState().redirectPath,
          redirectParams: store.getState().redirectParams,
          abnormalLoginPrompt: null,
        });
        return ok(false);
      }

      const session = await kernel.session.get();
      if (!session.ok) {
        await handleError(session.error.message, { preserveRedirect: true });
        return session;
      }

      if (hasActiveSession(session.value)) {
        syncSessionState(session.value, { clearNotice: true });
        return routeToSuccess();
      }

      if (canRefreshSession(session.value) && kernel.auth.refreshSession) {
        const refreshed = await kernel.auth.refreshSession(session.value);
        if (refreshed.ok) {
          syncSessionState(refreshed.value, { clearNotice: true });
          return routeToSuccess();
        }

        if (shouldClearAfterRefreshFailure(refreshed.error.code)) {
          await kernel.session.clear();
        } else {
          await handleError(refreshed.error.message, { preserveRedirect: true });
          return refreshed;
        }
      } else if (session.value) {
        await kernel.session.clear();
      }

      store.setState({
        loading: false,
        errorMessage: null,
        authenticated: false,
        authStatus: null,
        noticeMessage: redirectState.noticeMessage,
        redirectTarget: redirectState.target,
        redirectLabel: store.getState().redirectLabel,
        redirectPath: store.getState().redirectPath,
        redirectParams: store.getState().redirectParams,
        abnormalLoginPrompt: null,
      });
      return ok(false);
    },

    async submitSelectedLogin() {
      return submitCredentialLogin(store.getState().selectedLoginMethod);
    },

    async submitGuestLogin() {
      store.setState({
        selectedLoginMethod: "guest",
      });
      return submitCredentialLogin("guest");
    },

    async submitPhoneCodeLogin() {
      store.setState({
        selectedLoginMethod: "phone_code",
      });
      return submitCredentialLogin("phone_code");
    },

    async submitPasswordLogin() {
      store.setState({
        selectedLoginMethod: "password",
      });
      return submitCredentialLogin("password");
    },

    async submitOauthLogin() {
      store.setState({
        selectedLoginMethod: "oauth",
      });
      return submitCredentialLogin("oauth");
    },

    async submitIdentityUpgrade() {
      const method = store.getState().selectedLoginMethod;
      if (method !== "phone_code" && method !== "password") {
        const failureReason: AuthIdentityFailureReason = "upgrade_method_unsupported";
        store.setState({
          errorMessage: "Guest upgrade requires phone verification or password credentials.",
          identityFailureReason: failureReason,
          identityWorkflow: {
            kind: "guest_upgrade",
            status: "blocked",
            sourceUserId: "current-session",
            message: "Guest upgrade requires phone verification or password credentials.",
            failureReason,
          },
        });
        return ok(undefined);
      }

      const fieldErrors = createMethodValidation(method, store.getState().credentials);
      if (Object.keys(fieldErrors).length > 0) {
        store.setState({
          fieldErrors,
          errorMessage: "Please complete the required upgrade fields.",
        });
        return ok(undefined);
      }

      const redirectTarget = createWorkflowRedirectTarget(store.getState());
      const body: IdentityUpgradeRequest = {
        credential: {
          method,
          ...(store.getState().credentials.phoneNumber.trim()
            ? { phoneNumber: store.getState().credentials.phoneNumber.trim() }
            : {}),
          ...(store.getState().credentials.verificationCode.trim()
            ? { verificationCode: store.getState().credentials.verificationCode.trim() }
            : {}),
          ...(store.getState().credentials.account.trim()
            ? { account: store.getState().credentials.account.trim() }
            : {}),
          ...(store.getState().credentials.password
            ? { password: store.getState().credentials.password }
            : {}),
          ...(store.getState().credentials.deviceId.trim()
            ? { deviceId: store.getState().credentials.deviceId.trim() }
            : {}),
        },
      };
      if (redirectTarget) {
        body.redirectTarget = redirectTarget;
      }
      return submitIdentityTransition("/auth/identity/upgrade", body);
    },

    async submitPhoneBinding() {
      const fieldErrors = createMethodValidation("phone_code", store.getState().credentials);
      if (Object.keys(fieldErrors).length > 0) {
        store.setState({
          fieldErrors,
          errorMessage: "Please complete the required phone binding fields.",
        });
        return ok(undefined);
      }

      const redirectTarget = createWorkflowRedirectTarget(store.getState());
      const body: IdentityBindPhoneRequest = {
        phoneNumber: store.getState().credentials.phoneNumber.trim(),
        verificationCode: store.getState().credentials.verificationCode.trim(),
      };
      if (redirectTarget) {
        body.redirectTarget = redirectTarget;
      }
      return submitIdentityTransition("/auth/identity/bind-phone", body);
    },

    async confirmIdentityMerge(targetUserId?: string) {
      const workflow = store.getState().identityWorkflow;
      const nextTargetUserId = targetUserId ?? workflow?.targetUserId;
      if (!nextTargetUserId) {
        store.setState({
          errorMessage: "A merge target is required before confirming the identity merge.",
        });
        return ok(undefined);
      }

      const redirectTarget = createWorkflowRedirectTarget(store.getState());
      const body: IdentityMergeRequest = {
        targetUserId: nextTargetUserId,
        confirm: true,
      };
      if (workflow?.kind === "guest_upgrade" || workflow?.kind === "phone_binding") {
        body.workflowKind = workflow.kind;
      }
      if (redirectTarget) {
        body.redirectTarget = redirectTarget;
      }
      return submitIdentityTransition("/auth/identity/merge", body);
    },

    async submitLogin() {
      const method = store.getState().selectedLoginMethod;
      if (method !== "wechat_code") {
        return submitCredentialLogin(method);
      }

      store.setState({
        loading: true,
        errorMessage: null,
        noticeMessage: null,
        fieldErrors: {},
        rateLimitMessage: null,
        retryAfterSeconds: null,
        abnormalLoginPrompt: null,
      });

      const result = await kernel.auth.login();
      if (!result.ok) {
        await handleError(result.error.message, {
          retryAfterSeconds: result.error.code === "RATE_LIMITED" ? readRetryAfterSeconds(result.error.detail) : null,
          preserveRedirect: true,
        });
        return result;
      }

      syncSessionState(result.value);
      return routeToSuccess();
    },

    async submitEnsureLogin() {
      store.setState({
        loading: true,
        errorMessage: null,
        noticeMessage: null,
        fieldErrors: {},
        rateLimitMessage: null,
        retryAfterSeconds: null,
        abnormalLoginPrompt: null,
      });

      const result = await kernel.auth.ensureLogin();
      if (!result.ok) {
        await handleError(result.error.message, { preserveRedirect: true });
        return result;
      }

      syncSessionState(result.value);
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
