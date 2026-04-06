import type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from "@minix/contracts";

import { createError, fail, ok, type Result } from "../error/index";
import type { AuthAdapter, LoginCredential } from "../ports/auth";
import type { RequestClient } from "./request";
import type { SessionService } from "./session";
import type { RuntimeEnv, UserSession } from "../types/index";

export interface ExchangeTokenInput {
  credential: LoginCredential;
  platform: RuntimeEnv["platform"];
}

export interface AuthService {
  ensureLogin(): Promise<Result<UserSession>>;
  login(): Promise<Result<UserSession>>;
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

function toUserSession(
  env: RuntimeEnv,
  response: LoginResponse | RefreshTokenResponse,
  previousSession?: UserSession | null,
): UserSession {
  const nextToken: UserSession["token"] = {
    accessToken: response.accessToken,
    issuedAt: Date.now(),
    tokenType: "Bearer",
    ...(response.expiresAt !== undefined ? { expiresAt: response.expiresAt } : {}),
  };

  const nextRefreshToken = response.refreshToken ?? previousSession?.token?.refreshToken;
  if (nextRefreshToken) {
    nextToken.refreshToken = nextRefreshToken;
  }

  const nextProfile = response.profile ?? previousSession?.profile;

  return {
    identity: {
      userId: response.userId || previousSession?.identity.userId || "",
      ...(previousSession?.identity.anonymous !== undefined ? { anonymous: previousSession.identity.anonymous } : {}),
    },
    loggedIn: true,
    platform: env.platform,
    ...(nextProfile ? { profile: nextProfile } : {}),
    token: nextToken,
  };
}

function shouldClearAfterRefreshFailure(errorCode: string): boolean {
  return errorCode === "TOKEN_EXPIRED" || errorCode === "UNAUTHORIZED" || errorCode === "FORBIDDEN";
}

async function persistSession(
  options: {
    session: SessionService;
    env: RuntimeEnv;
  },
  response: LoginResponse | RefreshTokenResponse,
  previousSession?: UserSession | null,
): Promise<Result<UserSession>> {
  const session = toUserSession(options.env, response, previousSession);
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

    return persistSession(options, response.value, session);
  }

  const service: AuthService = {
    async ensureLogin(): Promise<Result<UserSession>> {
      const existing = await options.session.get();
      if (!existing.ok) {
        return existing;
      }

      if (isActiveSession(existing.value)) {
        return ok(existing.value);
      }

      if (isRefreshableSession(existing.value)) {
        const refreshed = await refreshSession(existing.value);
        if (refreshed.ok) {
          return refreshed;
        }

        if (shouldClearAfterRefreshFailure(refreshed.error.code)) {
          const cleared = await options.session.clear();
          if (!cleared.ok) {
            return cleared;
          }
        }
      } else if (existing.value !== null) {
        const cleared = await options.session.clear();
        if (!cleared.ok) {
          return cleared;
        }
      }

      return service.login();
    },

    async login(): Promise<Result<UserSession>> {
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
      } satisfies LoginRequest);

      if (!response.ok) {
        return response;
      }

      return persistSession(options, response.value);
    },

    refreshSession,
  };

  return service;
}
