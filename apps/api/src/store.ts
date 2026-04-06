import { createDefaultUserState } from "./data";
import { buildSampleProfileAssetPath } from "./sample-assets";
import type { ApiStore, LoginProfile, SessionRecord, UserState } from "./types";
import type { LoginPlatformKind } from "@minix/contracts";

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_USER_ID = "minix-demo-user";
const DEFAULT_PROFILE: LoginProfile = {
  nickname: "MiniX User",
  avatarUrl: buildSampleProfileAssetPath("minix-user"),
};

interface StoredSessionRecord extends SessionRecord {
  refreshExpiresAt: number;
}

interface MemoryApiStoreOptions {
  now?: () => number;
  accessTokenTtlMs?: number;
  refreshTokenTtlMs?: number;
}

function systemNow() {
  return Date.now();
}

function createToken(prefix: string, platform: LoginPlatformKind): string {
  return `${prefix}_${platform}_${crypto.randomUUID()}`;
}

export function createMemoryApiStore(options: MemoryApiStoreOptions = {}): ApiStore {
  const now = options.now ?? systemNow;
  const accessTokenTtlMs = options.accessTokenTtlMs ?? ACCESS_TOKEN_TTL_MS;
  const refreshTokenTtlMs = options.refreshTokenTtlMs ?? REFRESH_TOKEN_TTL_MS;
  const sessionsByAccessToken = new Map<string, StoredSessionRecord>();
  const refreshIndex = new Map<string, StoredSessionRecord>();
  const userStateByUserId = new Map<string, UserState>();

  function createSessionRecord(userId: string, platform: LoginPlatformKind, profile = DEFAULT_PROFILE): SessionRecord {
    const accessToken = createToken("access", platform);
    const refreshToken = createToken("refresh", platform);
    const session: StoredSessionRecord = {
      userId,
      platform,
      accessToken,
      refreshToken,
      expiresAt: now() + accessTokenTtlMs,
      refreshExpiresAt: now() + refreshTokenTtlMs,
      profile,
    };

    sessionsByAccessToken.set(accessToken, session);
    refreshIndex.set(refreshToken, session);
    return session;
  }

  return {
    async createSession(platform) {
      return createSessionRecord(DEFAULT_USER_ID, platform);
    },

    async refreshSession(platform, refreshToken) {
      const existing = refreshIndex.get(refreshToken);
      if (!existing || existing.platform !== platform) {
        return null;
      }

      if (existing.refreshExpiresAt <= now()) {
        sessionsByAccessToken.delete(existing.accessToken);
        refreshIndex.delete(refreshToken);
        return null;
      }

      refreshIndex.delete(refreshToken);
      sessionsByAccessToken.delete(existing.accessToken);
      return createSessionRecord(existing.userId, platform, existing.profile);
    },

    async revokeSession(input) {
      if (input.accessToken) {
        const existing = sessionsByAccessToken.get(input.accessToken);
        if (existing) {
          refreshIndex.delete(existing.refreshToken);
          sessionsByAccessToken.delete(input.accessToken);
        }
      }

      if (input.refreshToken) {
        refreshIndex.delete(input.refreshToken);
        for (const [accessToken, session] of sessionsByAccessToken.entries()) {
          if (session.refreshToken === input.refreshToken) {
            sessionsByAccessToken.delete(accessToken);
            break;
          }
        }
      }
    },

    async getSessionByAccessToken(accessToken) {
      const session = sessionsByAccessToken.get(accessToken);
      if (!session) {
        return null;
      }

      if (session.expiresAt <= now()) {
        if (session.refreshExpiresAt <= now()) {
          sessionsByAccessToken.delete(accessToken);
          refreshIndex.delete(session.refreshToken);
        }
        return null;
      }

      return session;
    },

    async getUserState(userId) {
      let userState = userStateByUserId.get(userId);
      if (!userState) {
        userState = createDefaultUserState();
        userStateByUserId.set(userId, userState);
      }

      return userState;
    },

    async saveUserState(userId, userState) {
      userStateByUserId.set(userId, userState);
    },
  };
}

let globalStore: ApiStore | undefined;

export function getGlobalMemoryApiStore(): ApiStore {
  globalStore ??= createMemoryApiStore();
  return globalStore;
}
