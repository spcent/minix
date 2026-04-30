import type { UserSession } from "@minix/core";

export function hasActiveSession(session: UserSession | null | undefined): session is UserSession {
  if (!session?.loggedIn || !session.token?.accessToken) {
    return false;
  }

  if (session.token.expiresAt === undefined) {
    return true;
  }

  return session.token.expiresAt > Date.now();
}

export function canRefreshSession(session: UserSession | null | undefined): session is UserSession {
  return Boolean(session?.loggedIn && session.token?.refreshToken);
}

export function shouldClearAfterRefreshFailure(code: string): boolean {
  return code === "TOKEN_EXPIRED" || code === "UNAUTHORIZED" || code === "FORBIDDEN";
}
