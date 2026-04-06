import type { LoginPlatformKind, PurchaseMembershipRequest, ReadingProgress } from "@minix/contracts";

export interface ApiBindings {
  MINIX_STORE?: ApiStore;
  MINIX_CORS_ALLOWED_ORIGINS?: string;
  MINIX_DEPLOY_ENV?: string;
  MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS?: string;
  MINIX_AUTH_LOGIN_MAX_ATTEMPTS?: string;
  MINIX_AUTH_REFRESH_MAX_ATTEMPTS?: string;
  AUTH_RATE_LIMIT_KV?: KVNamespaceLike;
  DB?: D1DatabaseLike;
}

export interface LoginProfile {
  nickname: string;
  avatarUrl?: string;
}

export interface UserState {
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  bookshelfNovelIds: Set<string>;
  progressByNovelId: Record<string, ReadingProgress>;
}

export interface SessionRecord {
  userId: string;
  platform: LoginPlatformKind;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  profile: LoginProfile;
}

export interface ApiStore {
  createSession(platform: LoginPlatformKind): Promise<SessionRecord>;
  refreshSession(platform: LoginPlatformKind, refreshToken: string): Promise<SessionRecord | null>;
  revokeSession(input: { accessToken?: string; refreshToken?: string }): Promise<void>;
  getSessionByAccessToken(accessToken: string): Promise<SessionRecord | null>;
  getUserState(userId: string): Promise<UserState>;
  saveUserState(userId: string, userState: UserState): Promise<void>;
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
