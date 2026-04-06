import { ok, type Result } from "../error/index";
import type { UserSession } from "../types/index";
import type { CacheService } from "../store/cache";

export interface SessionService {
  get(): Promise<Result<UserSession | null>>;
  set(session: UserSession): Promise<Result<void>>;
  clear(): Promise<Result<void>>;
  isLoggedIn(): Promise<Result<boolean>>;
}

const SESSION_KEY = "session";

export function createSessionService(cache: CacheService): SessionService {
  return {
    get(): Promise<Result<UserSession | null>> {
      return cache.get<UserSession>(SESSION_KEY);
    },

    set(session: UserSession): Promise<Result<void>> {
      return cache.set<UserSession>(SESSION_KEY, session);
    },

    clear(): Promise<Result<void>> {
      return cache.remove(SESSION_KEY);
    },

    async isLoggedIn(): Promise<Result<boolean>> {
      const session = await cache.get<UserSession>(SESSION_KEY);
      if (!session.ok) {
        return session;
      }

      return ok(Boolean(session.value?.loggedIn && session.value.token?.accessToken));
    },
  };
}
