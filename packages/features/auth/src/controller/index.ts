import {
  createControllerRouterHelpers,
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
  AuthOAuthAuthorizeRequest,
  AuthOAuthAuthorizeResponse,
  AuthOAuthCallbackResponse,
  AuthPasswordCredentialResponse,
  AuthPhoneVerificationResponse,
  AuthIdentityFailureReason,
  AuthIdentityWorkflow,
  AuthRedirectTarget as ContractAuthRedirectTarget,
  AuthVerificationPurpose,
  IdentityBindPhoneRequest,
  IdentityBindOAuthRequest,
  IdentityMergeRequest,
  IdentityTransitionResponse,
  IdentityUpgradeRequest,
  LoginMethod,
} from "@minix/contracts";

import {
  createAuthLoginMethodDescriptors,
  createAuthSecurityPosture,
  createDefaultLoginMethod,
  createInitialAuthPageState,
  type AuthCredentialState,
  type AuthRedirectTarget,
} from "../model";

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

function formatForceReauthNotice(label?: string | null): string {
  return label
    ? `Sign in again to continue to ${label}.`
    : "Sign in again to continue.";
}

function createAnonymousId(): string {
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
        ...(credentials.providerUserId.trim() ? {} : { providerUserId: "Provider user id is required." }),
        ...(credentials.oauthState.trim() ? {} : { oauthState: "OAuth state is required." }),
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
        providerUserId: credentials.providerUserId.trim(),
        oauthState: credentials.oauthState.trim(),
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
  if (
    !state.redirectRouteId &&
    !state.redirectPath &&
    !state.redirectSource &&
    !state.redirectLabel &&
    !state.redirectReason &&
    !state.redirectForceReauth
  ) {
    return undefined;
  }

  return {
    ...(state.redirectRouteId ? { routeId: state.redirectRouteId } : {}),
    ...(state.redirectPath ? { path: state.redirectPath } : {}),
    ...(state.redirectParams ? { params: state.redirectParams } : {}),
    ...(state.redirectSource ? { source: state.redirectSource } : {}),
    ...(state.redirectLabel ? { label: state.redirectLabel } : {}),
    ...(state.redirectReason ? { reason: state.redirectReason } : {}),
    ...(state.redirectForceReauth ? { forceReauth: true } : {}),
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
  const baseState = createInitialAuthPageState(kernel.env?.platform);
  const initialMethod = createDefaultLoginMethod(kernel.env?.platform);
  const loginMethodDescriptors = createAuthLoginMethodDescriptors(kernel.env?.platform);
  const store = createStore({
    ...baseState,
    selectedLoginMethod: initialMethod,
    loginMethodDescriptors,
    securityPosture: createAuthSecurityPosture(initialMethod, loginMethodDescriptors),
    credentials: {
      ...baseState.credentials,
      ...(initialMethod === "guest" ? { anonymousId: createAnonymousId() } : {}),
    },
  });
  const { routeToOptional } = createControllerRouterHelpers({ kernel });

  async function routeToSuccess() {
    if (stayOnSuccess) {
      return { ok: true, value: undefined } as const;
    }

    return kernel.router.replaceRoute(successRouteId);
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
      redirectRouteId: redirect?.routeId ?? null,
      redirectSource: redirect?.source ?? null,
      redirectLabel: label,
      redirectPath: redirect?.path ?? null,
      redirectParams: redirect?.params ?? null,
      redirectReason: redirect?.reason ?? null,
      redirectForceReauth: redirect?.forceReauth ?? false,
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
      redirectRouteId: options?.preserveRedirect ? store.getState().redirectRouteId : null,
      redirectSource: options?.preserveRedirect ? store.getState().redirectSource : null,
      redirectLabel: options?.preserveRedirect ? store.getState().redirectLabel : null,
      redirectPath: options?.preserveRedirect ? store.getState().redirectPath : null,
      redirectParams: options?.preserveRedirect ? store.getState().redirectParams : null,
      redirectReason: options?.preserveRedirect ? store.getState().redirectReason : null,
      redirectForceReauth: options?.preserveRedirect ? store.getState().redirectForceReauth : false,
      rateLimitMessage: options?.retryAfterSeconds !== undefined ? deriveRateLimitMessage(options.retryAfterSeconds) : null,
      retryAfterSeconds: options?.retryAfterSeconds ?? null,
      rateLimitState: null,
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
      riskDecision: session.riskDecision ?? null,
      deviceIdentity: session.deviceIdentity ?? null,
      rateLimitState: session.rateLimitState ?? null,
      securityAuditEvents: session.securityAuditEvents ?? [],
      credentialProtection: null,
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
      riskDecision: null,
      deviceIdentity: null,
      rateLimitState: null,
      securityAuditEvents: [],
      credentialProtection: null,
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
      riskDecision: null,
      deviceIdentity: null,
      rateLimitState: null,
      securityAuditEvents: [],
    });

    const credential = createCredentialFromState(method, current.credentials);
    const redirectTarget = createWorkflowRedirectTarget(current);
    const result = await kernel.auth.exchangeToken({
      credential,
      platform: kernel.env?.platform ?? "h5",
      ...(redirectTarget ? { redirectTarget } : {}),
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
        securityPosture: createAuthSecurityPosture(method, store.getState().loginMethodDescriptors),
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

    async requestPhoneVerification(purpose: AuthVerificationPurpose = "login") {
      const credentials = store.getState().credentials;
      if (!credentials.phoneNumber.trim()) {
        store.setState({
          fieldErrors: { phoneNumber: "Phone number is required." },
          errorMessage: "Phone number is required before requesting a verification code.",
        });
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorMessage: null,
        fieldErrors: {},
        credentialProtection: null,
      });
      const result = await kernel.request.post<AuthPhoneVerificationResponse>("/auth/verification-code/request", {
        phoneNumber: credentials.phoneNumber.trim(),
        purpose,
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      });
      if (!result.ok) {
        await handleError(result.error.message, { preserveRedirect: true });
        return result;
      }

      store.setState({
        loading: false,
        phoneVerification: {
          verificationId: result.value.verificationId,
          phoneNumberMasked: result.value.phoneNumberMasked,
          purpose: result.value.purpose,
          expiresAt: result.value.expiresAt,
          retryAfterSeconds: result.value.retryAfterSeconds,
          debugCode: result.value.delivery.debugCode ?? null,
          ...(result.value.delivery.providerMode ? { providerMode: result.value.delivery.providerMode } : {}),
          ...(result.value.delivery.providerLabel ? { providerLabel: result.value.delivery.providerLabel } : {}),
          ...(result.value.delivery.message ? { message: result.value.delivery.message } : {}),
        },
        riskDecision: result.value.riskDecision ?? null,
        deviceIdentity: result.value.deviceIdentity ?? null,
        rateLimitState: result.value.rateLimitState ?? null,
        securityAuditEvents: result.value.securityAuditEvents ?? [],
        noticeMessage: result.value.delivery.message ?? `Verification code sent to ${result.value.phoneNumberMasked}.`,
      });
      return result;
    },

    async registerPasswordCredential() {
      const credentials = store.getState().credentials;
      const fieldErrors: Partial<Record<keyof AuthCredentialState, string>> = {
        ...(credentials.account.trim() || credentials.phoneNumber.trim()
          ? {}
          : { account: "Account or phone number is required." }),
        ...(credentials.password.length >= 8 ? {} : { password: "Password must be at least 8 characters." }),
      };
      if (Object.keys(fieldErrors).length > 0) {
        store.setState({
          fieldErrors,
          errorMessage: "Please complete the required password fields.",
        });
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorMessage: null,
        fieldErrors: {},
        riskDecision: null,
        deviceIdentity: null,
        rateLimitState: null,
        securityAuditEvents: [],
      });
      const result = await kernel.request.post<AuthPasswordCredentialResponse>("/auth/password/register", {
        ...(credentials.account.trim() ? { account: credentials.account.trim() } : {}),
        ...(credentials.phoneNumber.trim() ? { phoneNumber: credentials.phoneNumber.trim() } : {}),
        password: credentials.password,
        ...(credentials.verificationCode.trim() ? { verificationCode: credentials.verificationCode.trim() } : {}),
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      });
      if (!result.ok) {
        await handleError(result.error.message, { preserveRedirect: true });
        return result;
      }

      store.setState({
        loading: false,
        credentialProtection: result.value.credentialProtection,
        riskDecision: null,
        deviceIdentity: null,
        rateLimitState: null,
        securityAuditEvents: [],
        noticeMessage: "Password credential configured.",
      });
      return result;
    },

    async resetPasswordCredential() {
      const credentials = store.getState().credentials;
      const fieldErrors: Partial<Record<keyof AuthCredentialState, string>> = {
        ...(credentials.phoneNumber.trim() ? {} : { phoneNumber: "Phone number is required." }),
        ...(credentials.verificationCode.trim() ? {} : { verificationCode: "Verification code is required." }),
        ...(credentials.password.length >= 8 ? {} : { password: "Password must be at least 8 characters." }),
      };
      if (Object.keys(fieldErrors).length > 0) {
        store.setState({
          fieldErrors,
          errorMessage: "Please complete the required password reset fields.",
        });
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorMessage: null,
        fieldErrors: {},
        riskDecision: null,
        deviceIdentity: null,
        rateLimitState: null,
        securityAuditEvents: [],
      });
      const result = await kernel.request.post<AuthPasswordCredentialResponse>("/auth/password/reset", {
        phoneNumber: credentials.phoneNumber.trim(),
        verificationCode: credentials.verificationCode.trim(),
        password: credentials.password,
        ...(credentials.deviceId.trim() ? { deviceId: credentials.deviceId.trim() } : {}),
      });
      if (!result.ok) {
        await handleError(result.error.message, { preserveRedirect: true });
        return result;
      }

      store.setState({
        loading: false,
        credentialProtection: result.value.credentialProtection,
        riskDecision: null,
        deviceIdentity: null,
        rateLimitState: null,
        securityAuditEvents: [],
        noticeMessage: "Password credential reset.",
      });
      return result;
    },

    async startOauthAuthorization(purpose: "login" | "bind" = "login") {
      const credentials = store.getState().credentials;
      if (!credentials.provider.trim()) {
        store.setState({
          fieldErrors: { provider: "Provider is required." },
          errorMessage: "Provider is required before starting OAuth.",
        });
        return ok(undefined);
      }

      store.setState({ loading: true, errorMessage: null, fieldErrors: {} });
      const body: AuthOAuthAuthorizeRequest = {
        provider: credentials.provider.trim(),
      };
      if (purpose === "bind") {
        body.purpose = purpose;
      }
      if (credentials.deviceId.trim()) {
        body.deviceId = credentials.deviceId.trim();
      }
      const redirectTarget = createWorkflowRedirectTarget(store.getState());
      if (redirectTarget) {
        body.redirectTarget = redirectTarget;
      }
      const result = await kernel.request.post<AuthOAuthAuthorizeResponse>("/auth/oauth/authorize", body);
      if (!result.ok) {
        await handleError(result.error.message, { preserveRedirect: true });
        return result;
      }

      store.setState({
        loading: false,
        oauthAuthorization: result.value,
        credentials: {
          ...store.getState().credentials,
          oauthState: result.value.state,
        },
        noticeMessage: result.value.message ?? "OAuth authorization started.",
      });
      return result;
    },

    async completeOauthCallback() {
      const credentials = store.getState().credentials;
      const fieldErrors = createMethodValidation("oauth", credentials);
      if (Object.keys(fieldErrors).length > 0) {
        store.setState({
          fieldErrors,
          errorMessage: "Please complete the required OAuth callback fields.",
        });
        return ok(undefined);
      }

      store.setState({ loading: true, errorMessage: null, fieldErrors: {} });
      const result = await kernel.request.post<AuthOAuthCallbackResponse>("/auth/oauth/callback", {
        provider: credentials.provider.trim(),
        state: credentials.oauthState.trim(),
        providerToken: credentials.providerToken.trim(),
        providerUserId: credentials.providerUserId.trim(),
        platform: kernel.env?.platform ?? "h5",
        ...(createWorkflowRedirectTarget(store.getState()) ? { redirectTarget: createWorkflowRedirectTarget(store.getState()) } : {}),
      });
      if (!result.ok) {
        await handleError(result.error.message, { preserveRedirect: true });
        return result;
      }

      const persisted = await persistAuthSessionResponse(
        {
          session: kernel.session,
          env: kernel.env,
        },
        result.value,
      );
      if (!persisted.ok) {
        await handleError(persisted.error.message, { preserveRedirect: true });
        return persisted;
      }

      syncSessionState(persisted.value);
      return routeToSuccess();
    },

    async submitOauthBinding() {
      const fieldErrors = createMethodValidation("oauth", store.getState().credentials);
      if (Object.keys(fieldErrors).length > 0) {
        store.setState({
          fieldErrors,
          errorMessage: "Please complete the required OAuth binding fields.",
        });
        return ok(undefined);
      }

      const body: IdentityBindOAuthRequest = {
        provider: store.getState().credentials.provider.trim(),
        state: store.getState().credentials.oauthState.trim(),
        providerToken: store.getState().credentials.providerToken.trim(),
        providerUserId: store.getState().credentials.providerUserId.trim(),
      };
      const redirectTarget = createWorkflowRedirectTarget(store.getState());
      if (redirectTarget) {
        body.redirectTarget = redirectTarget;
      }
      return submitIdentityTransition("/auth/identity/bind-oauth", body);
    },

    async restoreSession() {
      const redirectState = readRedirectState();
      store.setState({
        loading: true,
        errorMessage: null,
        noticeMessage: store.getState().redirectForceReauth
          ? formatForceReauthNotice(store.getState().redirectLabel)
          : redirectState.noticeMessage,
        redirectTarget: redirectState.target,
        redirectRouteId: store.getState().redirectRouteId,
        redirectSource: store.getState().redirectSource,
        redirectLabel: store.getState().redirectLabel,
        redirectPath: store.getState().redirectPath,
        redirectParams: store.getState().redirectParams,
        redirectReason: store.getState().redirectReason,
        redirectForceReauth: store.getState().redirectForceReauth,
      });

      if (store.getState().redirectForceReauth) {
        store.setState({
          loading: false,
          authenticated: false,
          authStatus: "reauth_required",
          abnormalLoginPrompt: null,
        });
        return ok(false);
      }

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
          redirectRouteId: store.getState().redirectRouteId,
          redirectSource: store.getState().redirectSource,
          redirectLabel: store.getState().redirectLabel,
          redirectPath: store.getState().redirectPath,
          redirectParams: store.getState().redirectParams,
          redirectReason: store.getState().redirectReason,
          redirectForceReauth: store.getState().redirectForceReauth,
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
        redirectRouteId: store.getState().redirectRouteId,
        redirectSource: store.getState().redirectSource,
        redirectLabel: store.getState().redirectLabel,
        redirectPath: store.getState().redirectPath,
        redirectParams: store.getState().redirectParams,
        redirectReason: store.getState().redirectReason,
        redirectForceReauth: store.getState().redirectForceReauth,
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
        securityPosture: createAuthSecurityPosture("guest", store.getState().loginMethodDescriptors),
      });
      return submitCredentialLogin("guest");
    },

    async submitPhoneCodeLogin() {
      store.setState({
        selectedLoginMethod: "phone_code",
        securityPosture: createAuthSecurityPosture("phone_code", store.getState().loginMethodDescriptors),
      });
      return submitCredentialLogin("phone_code");
    },

    async submitPasswordLogin() {
      store.setState({
        selectedLoginMethod: "password",
        securityPosture: createAuthSecurityPosture("password", store.getState().loginMethodDescriptors),
      });
      return submitCredentialLogin("password");
    },

    async submitOauthLogin() {
      store.setState({
        selectedLoginMethod: "oauth",
        securityPosture: createAuthSecurityPosture("oauth", store.getState().loginMethodDescriptors),
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
      if (workflow?.kind === "guest_upgrade" || workflow?.kind === "phone_binding" || workflow?.kind === "oauth_binding") {
        body.workflowKind = workflow.kind;
      }
      if (redirectTarget) {
        body.redirectTarget = redirectTarget;
      }
      return submitIdentityTransition("/auth/identity/merge", body);
    },

    async cancelIdentityMerge(targetUserId?: string) {
      const workflow = store.getState().identityWorkflow;
      const nextTargetUserId = targetUserId ?? workflow?.targetUserId;
      if (!nextTargetUserId) {
        store.setState({
          errorMessage: "A merge target is required before cancelling the identity merge.",
        });
        return ok(undefined);
      }

      const redirectTarget = createWorkflowRedirectTarget(store.getState());
      const body: IdentityMergeRequest = {
        targetUserId: nextTargetUserId,
        confirm: false,
      };
      if (workflow?.kind === "guest_upgrade" || workflow?.kind === "phone_binding" || workflow?.kind === "oauth_binding") {
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
        riskDecision: null,
        deviceIdentity: null,
        rateLimitState: null,
        securityAuditEvents: [],
      });

      const redirectTarget = createWorkflowRedirectTarget(store.getState());
      const result = await kernel.auth.login({
        ...(redirectTarget ? { redirectTarget } : {}),
      });
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
        riskDecision: null,
        deviceIdentity: null,
        rateLimitState: null,
        securityAuditEvents: [],
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

      const redirectRouteId = store.getState().redirectRouteId;
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

      const result = redirectRouteId
        ? await kernel.router.toRoute(redirectRouteId, redirectParams ?? undefined)
        : redirectPath
          ? await kernel.router.to(redirectPath, redirectParams ?? undefined)
          : await routeToOptional(routeId);
      if (result.ok) {
        store.setState({
          redirectTarget: null,
          redirectRouteId: null,
          redirectSource: null,
          noticeMessage: null,
          redirectLabel: null,
          redirectPath: null,
          redirectParams: null,
          redirectReason: null,
          redirectForceReauth: false,
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
