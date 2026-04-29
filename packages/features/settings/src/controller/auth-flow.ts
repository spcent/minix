import {
  createAuthRedirectParams,
  ok,
  type AppKernel,
  type Result,
  type UserSession,
} from "@minix/core";
import type { AppRouteId } from "@minix/contracts";

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

function routeToLoginWithCurrentRedirect(input: {
  kernel: AppKernel;
  loginRouteId: AppRouteId;
  authRedirectSource?: string | undefined;
}) {
  const current = input.kernel.router.current();
  return input.kernel.router.replaceRoute(
    input.loginRouteId,
    createAuthRedirectParams({
      ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
      ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
      ...(input.authRedirectSource ? { source: input.authRedirectSource } : {}),
      reason: "auth-required",
    }),
  );
}

export async function ensureSettingsAuthenticated(input: {
  kernel: AppKernel;
  loginRouteId: AppRouteId;
  authRedirectSource?: string | undefined;
  hydrateRemoteSettings: () => Promise<Result<void>>;
  hydrateDisplayPreferences: () => Promise<Result<void>>;
  hydrateReadingCenterPreferences: () => Promise<Result<void>>;
}): Promise<Result<void>> {
  const { kernel, loginRouteId, authRedirectSource } = input;
  const sessionResult = await kernel.session.get();
  if (!sessionResult.ok) {
    return sessionResult;
  }

  const hydrateAllSettings = async () => {
    const remoteSettings = await input.hydrateRemoteSettings();
    if (!remoteSettings.ok) {
      if (remoteSettings.error.code === "UNAUTHORIZED") {
        return routeToLoginWithCurrentRedirect({
          kernel,
          loginRouteId,
          authRedirectSource,
        });
      }

      return remoteSettings;
    }

    await input.hydrateDisplayPreferences();
    await input.hydrateReadingCenterPreferences();
    return ok(undefined);
  };

  if (hasActiveSession(sessionResult.value)) {
    return hydrateAllSettings();
  }

  if (canRefreshSession(sessionResult.value) && kernel.auth.refreshSession) {
    const refreshed = await kernel.auth.refreshSession(sessionResult.value);
    if (refreshed.ok) {
      return hydrateAllSettings();
    }

    if (shouldClearAfterRefreshFailure(refreshed.error.code)) {
      await kernel.session.clear();
    } else {
      return refreshed;
    }
  } else if (sessionResult.value) {
    await kernel.session.clear();
  }

  return routeToLoginWithCurrentRedirect({
    kernel,
    loginRouteId,
    authRedirectSource,
  });
}
