import type {
  AuthIdentity,
  AuthRedirectTarget,
  AuthSessionPayload,
  AuthStatus,
  LoginMethod,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "@minix/contracts";

import { createError, fail, ok, type Result } from "../error/index";
import type { AuthAdapter, LoginCredential } from "../ports/auth";
import type { RequestClient } from "./request";
import type { SessionService } from "./session";
import type { RuntimeEnv, UserSession } from "../types/index";

export interface ExchangeTokenInput {
  credential: LoginCredential;
  platform: RuntimeEnv["platform"];
  redirectTarget?: AuthRedirectTarget;
}

export interface AuthService {
  ensureLogin(): Promise<Result<UserSession>>;
  recoverSession?(currentSession?: UserSession | null): Promise<Result<UserSession | null>>;
  login(input?: { redirectTarget?: AuthRedirectTarget }): Promise<Result<UserSession>>;
  logout(): Promise<Result<void>>;
  exchangeToken(input: ExchangeTokenInput): Promise<Result<UserSession>>;
  refreshSession?(currentSession?: UserSession | null): Promise<Result<UserSession>>;
}

function isActiveSession(session: UserSession | null): session is UserSession {
  if (!session?.loggedIn || !session.token?.accessToken) {
    return false;
  }

  if (session.token.expiresAt === undefined) {
    return true;
  }

  return session.token.expiresAt > Date.now();
}

function isRefreshableSession(session: UserSession | null): session is UserSession & {
  token: UserSession["token"] & { refreshToken: string };
} {
  return Boolean(session?.loggedIn && session.token?.refreshToken);
}

export function createUserSessionFromAuthResponse(
  env: RuntimeEnv,
  response: LoginResponse | RefreshTokenResponse,
  previousSession?: UserSession | null,
): UserSession {
  const sessionPayload: AuthSessionPayload = response.session ?? {
    accessToken: response.accessToken,
    ...(response.refreshToken !== undefined ? { refreshToken: response.refreshToken } : {}),
    ...(response.expiresAt !== undefined ? { expiresAt: response.expiresAt } : {}),
    issuedAt: Date.now(),
    tokenType: "Bearer",
  };
  const nextToken: UserSession["token"] = {
    accessToken: sessionPayload.accessToken,
    issuedAt: sessionPayload.issuedAt ?? Date.now(),
    tokenType: sessionPayload.tokenType ?? "Bearer",
    ...(sessionPayload.expiresAt !== undefined ? { expiresAt: sessionPayload.expiresAt } : {}),
  };

  const nextRefreshToken = sessionPayload.refreshToken ?? response.refreshToken ?? previousSession?.token?.refreshToken;
  if (nextRefreshToken) {
    nextToken.refreshToken = nextRefreshToken;
  }

  const nextProfile = response.profile ?? previousSession?.profile;
  const identity: AuthIdentity = response.identity ?? {
    userId: response.userId || previousSession?.identity.userId || "",
    ...(previousSession?.identity.anonymous !== undefined ? { anonymous: previousSession.identity.anonymous } : {}),
  };
  const loginMethod = response.loginMethod ?? (previousSession?.identity.loginMethod as LoginMethod | undefined);
  const authStatus: AuthStatus =
    response.authStatus ?? (identity.anonymous ? "guest" : "authenticated");

  return {
    identity: {
      userId: identity.userId || response.userId || previousSession?.identity.userId || "",
      ...(identity.anonymous !== undefined ? { anonymous: identity.anonymous } : {}),
      ...(identity.phoneBound !== undefined ? { phoneBound: identity.phoneBound } : {}),
      ...(identity.wechatBound !== undefined ? { wechatBound: identity.wechatBound } : {}),
      ...(identity.realNameVerified !== undefined ? { realNameVerified: identity.realNameVerified } : {}),
      ...(identity.mergedUserId ? { mergedUserId: identity.mergedUserId } : {}),
      ...(loginMethod ? { loginMethod } : {}),
    },
    loggedIn: true,
    authStatus,
    platform: env.platform,
    ...(nextProfile ? { profile: nextProfile } : {}),
    ...(response.abnormalLoginPrompt ? { abnormalLoginPrompt: response.abnormalLoginPrompt } : {}),
    ...(response.riskDecision ? { riskDecision: response.riskDecision } : {}),
    ...(response.deviceIdentity ? { deviceIdentity: response.deviceIdentity } : {}),
    ...(response.rateLimitState ? { rateLimitState: response.rateLimitState } : {}),
    ...(response.securityAuditEvents ? { securityAuditEvents: response.securityAuditEvents } : {}),
    ...(response.identityWorkflow ? { identityWorkflow: response.identityWorkflow } : {}),
    ...(response.redirectTarget ? { redirectTarget: response.redirectTarget } : {}),
    token: nextToken,
  };
}

function shouldClearAfterRefreshFailure(errorCode: string): boolean {
  return errorCode === "TOKEN_EXPIRED" || errorCode === "UNAUTHORIZED" || errorCode === "FORBIDDEN";
}

export async function persistAuthSessionResponse(
  options: {
    session: SessionService;
    env: RuntimeEnv;
  },
  response: LoginResponse | RefreshTokenResponse,
  previousSession?: UserSession | null,
): Promise<Result<UserSession>> {
  const session = createUserSessionFromAuthResponse(options.env, response, previousSession);
  const stored = await options.session.set(session);
  if (!stored.ok) {
    return stored;
  }

  return ok(session);
}

export function createAuthService(options: {
  adapter: AuthAdapter;
  request: RequestClient;
  session: SessionService;
  env: RuntimeEnv;
}): AuthService {
  async function refreshSession(currentSession?: UserSession | null): Promise<Result<UserSession>> {
    let session = currentSession ?? null;
    if (currentSession === undefined) {
      const existing = await options.session.get();
      if (!existing.ok) {
        return existing;
      }

      session = existing.value;
    }

    if (!isRefreshableSession(session)) {
      return fail(
        createError("TOKEN_EXPIRED", "Session refresh token is unavailable", {
          recoverable: true,
        }),
      );
    }

    const response = await options.request.post<RefreshTokenResponse>("/auth/refresh", {
      platform: session.platform,
      refreshToken: session.token.refreshToken,
    } satisfies RefreshTokenRequest);

    if (!response.ok) {
      if (response.error.code === "UNAUTHORIZED" || response.error.code === "FORBIDDEN") {
        return fail(
          createError("TOKEN_EXPIRED", "Session refresh failed", {
            cause: response.error,
            recoverable: true,
          }),
        );
      }

      return response;
    }

    return persistAuthSessionResponse(options, response.value, session);
  }

  async function recoverSession(currentSession?: UserSession | null): Promise<Result<UserSession | null>> {
    let session = currentSession ?? null;
    if (currentSession === undefined) {
      const existing = await options.session.get();
      if (!existing.ok) {
        return existing;
      }

      session = existing.value;
    }

    if (isActiveSession(session)) {
      return ok(session);
    }

    if (isRefreshableSession(session)) {
      const refreshed = await refreshSession(session);
      if (refreshed.ok) {
        return ok(refreshed.value);
      }

      if (shouldClearAfterRefreshFailure(refreshed.error.code)) {
        const cleared = await options.session.clear();
        if (!cleared.ok) {
          return cleared;
        }

        return ok(null);
      }

      return refreshed;
    }

    if (session !== null) {
      const cleared = await options.session.clear();
      if (!cleared.ok) {
        return cleared;
      }
    }

    return ok(null);
  }

  const service: AuthService = {
    async ensureLogin(): Promise<Result<UserSession>> {
      const recovered = await recoverSession();
      if (!recovered.ok) {
        return recovered;
      }

      if (recovered.value) {
        return ok(recovered.value);
      }

      return service.login();
    },

    recoverSession,

    async login(input?: { redirectTarget?: AuthRedirectTarget }): Promise<Result<UserSession>> {
      const loginResult = await options.adapter.login();
      if (!loginResult.ok) {
        return fail(
          createError("LOGIN_FAILED", loginResult.error.message, {
            cause: loginResult.error,
            recoverable: loginResult.error.recoverable,
          }),
        );
      }

      return this.exchangeToken({
        credential: loginResult.value.credential,
        platform: loginResult.value.platform,
        ...(input?.redirectTarget ? { redirectTarget: input.redirectTarget } : {}),
      });
    },

    async logout(): Promise<Result<void>> {
      if (options.adapter.logout) {
        const result = await options.adapter.logout();
        if (!result.ok) {
          return result;
        }
      }

      return options.session.clear();
    },

    async exchangeToken(input: ExchangeTokenInput): Promise<Result<UserSession>> {
      const response = await options.request.post<LoginResponse>("/auth/login", {
        platform: input.platform,
        credential: input.credential,
        ...(input.redirectTarget ? { redirectTarget: input.redirectTarget } : {}),
      } satisfies LoginRequest);

      if (!response.ok) {
        return response;
      }

      return persistAuthSessionResponse(options, response.value);
    },

    refreshSession,
  };

  return service;
}
