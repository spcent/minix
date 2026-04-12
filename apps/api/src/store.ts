import { createDefaultOperationalState, createDefaultUserState } from "./data";
import { buildSampleProfileAssetPath } from "./sample-assets";
import type { ApiStore, CreateSessionInput, LoginProfile, OperationalState, SessionRecord, UserState } from "./types";
import type { AuthIdentity, AuthStatus, LoginPlatformKind, LoginMethod } from "@minix/contracts";

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

function deriveIdentity(input: {
  userId: string;
  platform: LoginPlatformKind;
  identity?: Partial<AuthIdentity>;
  authStatus?: AuthStatus;
}): AuthIdentity {
  const anonymous =
    input.identity?.anonymous !== undefined
      ? input.identity.anonymous
      : (input.authStatus ?? (input.platform === "h5" ? "guest" : "authenticated")) === "guest";
  return {
    userId: input.userId,
    ...(anonymous ? { anonymous: true } : {}),
    ...(input.identity?.phoneBound !== undefined ? { phoneBound: input.identity.phoneBound } : {}),
    ...(input.identity?.wechatBound !== undefined ? { wechatBound: input.identity.wechatBound } : {}),
    ...(input.identity?.realNameVerified !== undefined ? { realNameVerified: input.identity.realNameVerified } : {}),
    ...(input.identity?.mergedUserId ? { mergedUserId: input.identity.mergedUserId } : {}),
  };
}

export function createMemoryApiStore(options: MemoryApiStoreOptions = {}): ApiStore {
  const now = options.now ?? systemNow;
  const accessTokenTtlMs = options.accessTokenTtlMs ?? ACCESS_TOKEN_TTL_MS;
  const refreshTokenTtlMs = options.refreshTokenTtlMs ?? REFRESH_TOKEN_TTL_MS;
  const sessionsByAccessToken = new Map<string, StoredSessionRecord>();
  const refreshIndex = new Map<string, StoredSessionRecord>();
  const userStateByUserId = new Map<string, UserState>();
  let operationalState: OperationalState = createDefaultOperationalState();

  function createSessionRecord(
    userId: string,
    platform: LoginPlatformKind,
    config: {
      profile?: LoginProfile;
      identity?: Partial<AuthIdentity>;
      authStatus?: AuthStatus;
      loginMethod?: LoginMethod;
    } = {},
  ): SessionRecord {
    const accessToken = createToken("access", platform);
    const refreshToken = createToken("refresh", platform);
    const authStatus = config.authStatus ?? (platform === "h5" ? "guest" : "authenticated");
    const identity = deriveIdentity(
      config.identity
        ? {
            userId,
            platform,
            identity: config.identity,
            authStatus,
          }
        : {
            userId,
            platform,
            authStatus,
          },
    );
    const session: StoredSessionRecord = {
      userId,
      platform,
      accessToken,
      refreshToken,
      expiresAt: now() + accessTokenTtlMs,
      refreshExpiresAt: now() + refreshTokenTtlMs,
      profile: config.profile ?? DEFAULT_PROFILE,
      identity,
      authStatus,
      ...(config.loginMethod ? { loginMethod: config.loginMethod } : {}),
    };

    sessionsByAccessToken.set(accessToken, session);
    refreshIndex.set(refreshToken, session);
    return session;
  }

  return {
    async createSession(input: CreateSessionInput) {
      return createSessionRecord(input.userId ?? DEFAULT_USER_ID, input.platform, {
        ...(input.profile ? { profile: input.profile } : {}),
        ...(input.identity ? { identity: input.identity } : {}),
        ...(input.authStatus ? { authStatus: input.authStatus } : {}),
        ...(input.loginMethod ? { loginMethod: input.loginMethod } : {}),
      });
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
      return createSessionRecord(existing.userId, platform, {
        profile: existing.profile,
        identity: existing.identity,
        authStatus: existing.authStatus,
        ...(existing.loginMethod ? { loginMethod: existing.loginMethod } : {}),
      });
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

    async getOperationalState() {
      return operationalState;
    },

    async saveOperationalState(state) {
      operationalState = state;
    },
  };
}

let globalStore: ApiStore | undefined;

export function getGlobalMemoryApiStore(): ApiStore {
  globalStore ??= createMemoryApiStore();
  return globalStore;
}
