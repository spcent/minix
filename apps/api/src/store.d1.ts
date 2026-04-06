import { createDefaultUserState } from "./data";
import { buildSampleProfileAssetPath } from "./sample-assets";
import { deserializeUserState, serializeUserState } from "./state";
import type { ApiStore, D1DatabaseLike, LoginProfile, SessionRecord } from "./types";
import type { LoginPlatformKind } from "@minix/contracts";

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_USER_ID = "minix-demo-user";
const DEFAULT_PROFILE: LoginProfile = {
  nickname: "MiniX User",
  avatarUrl: buildSampleProfileAssetPath("minix-user"),
};

interface SessionRow {
  user_id: string;
  platform: LoginPlatformKind;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  refresh_expires_at: number;
  profile_nickname: string | null;
  profile_avatar_url: string | null;
}

interface UserStateRow {
  user_id: string;
  membership_plan_id: string | null;
  state_json: string;
}

function now() {
  return Date.now();
}

function createToken(prefix: string, platform: LoginPlatformKind): string {
  return `${prefix}_${platform}_${crypto.randomUUID()}`;
}

function toSessionRecord(row: SessionRow): SessionRecord {
  const profile: LoginProfile = {
    nickname: row.profile_nickname ?? DEFAULT_PROFILE.nickname,
    ...(row.profile_avatar_url ? { avatarUrl: row.profile_avatar_url } : {}),
  };

  return {
    userId: row.user_id,
    platform: row.platform,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    profile,
  };
}

export function createD1ApiStore(db: D1DatabaseLike): ApiStore {
  async function upsertUserState(userId: string) {
    await db
      .prepare(
        `INSERT INTO user_state (user_id, membership_plan_id, state_json, updated_at)
         VALUES (?, NULL, ?, ?)
         ON CONFLICT(user_id) DO NOTHING`,
      )
      .bind(userId, serializeUserState(createDefaultUserState()), new Date().toISOString())
      .run();
  }

  async function createSessionRecord(
    userId: string,
    platform: LoginPlatformKind,
    profile = DEFAULT_PROFILE,
  ): Promise<SessionRecord> {
    const accessToken = createToken("access", platform);
    const refreshToken = createToken("refresh", platform);
    const expiresAt = now() + ACCESS_TOKEN_TTL_MS;
    const refreshExpiresAt = now() + REFRESH_TOKEN_TTL_MS;

    await db
      .prepare(
        `INSERT INTO sessions (
          access_token,
          refresh_token,
          user_id,
          platform,
          expires_at,
          refresh_expires_at,
          profile_nickname,
          profile_avatar_url,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        accessToken,
        refreshToken,
        userId,
        platform,
        expiresAt,
        refreshExpiresAt,
        profile.nickname,
        profile.avatarUrl ?? null,
        new Date().toISOString(),
        new Date().toISOString(),
      )
      .run();

    await upsertUserState(userId);

    return {
      userId,
      platform,
      accessToken,
      refreshToken,
      expiresAt,
      profile,
    };
  }

  return {
    async createSession(platform) {
      return createSessionRecord(DEFAULT_USER_ID, platform);
    },

    async refreshSession(platform, refreshToken) {
      const row = await db
        .prepare(
          `SELECT user_id, platform, access_token, refresh_token, expires_at, refresh_expires_at, profile_nickname, profile_avatar_url
           FROM sessions
           WHERE refresh_token = ? AND platform = ?`,
        )
        .bind(refreshToken, platform)
        .first<SessionRow>();

      if (!row) {
        return null;
      }

      if (row.refresh_expires_at <= now()) {
        await db.prepare("DELETE FROM sessions WHERE refresh_token = ?").bind(refreshToken).run();
        return null;
      }

      await db.prepare("DELETE FROM sessions WHERE refresh_token = ?").bind(refreshToken).run();
      return createSessionRecord(row.user_id, platform, {
        nickname: row.profile_nickname ?? DEFAULT_PROFILE.nickname,
        ...(row.profile_avatar_url ? { avatarUrl: row.profile_avatar_url } : {}),
      });
    },

    async revokeSession(input) {
      if (input.accessToken) {
        await db.prepare("DELETE FROM sessions WHERE access_token = ?").bind(input.accessToken).run();
      }

      if (input.refreshToken) {
        await db.prepare("DELETE FROM sessions WHERE refresh_token = ?").bind(input.refreshToken).run();
      }
    },

    async getSessionByAccessToken(accessToken) {
      const row = await db
        .prepare(
          `SELECT user_id, platform, access_token, refresh_token, expires_at, refresh_expires_at, profile_nickname, profile_avatar_url
           FROM sessions
           WHERE access_token = ?`,
        )
        .bind(accessToken)
        .first<SessionRow>();

      if (!row) {
        return null;
      }

      if (row.expires_at <= now()) {
        if (row.refresh_expires_at <= now()) {
          await db.prepare("DELETE FROM sessions WHERE access_token = ?").bind(accessToken).run();
        }
        return null;
      }

      return toSessionRecord(row);
    },

    async getUserState(userId) {
      const row = await db
        .prepare(
          `SELECT user_id, membership_plan_id, state_json
           FROM user_state
           WHERE user_id = ?`,
        )
        .bind(userId)
        .first<UserStateRow>();

      if (!row) {
        const defaultState = createDefaultUserState();
        await db
          .prepare(
            `INSERT INTO user_state (user_id, membership_plan_id, state_json, updated_at)
             VALUES (?, NULL, ?, ?)`,
          )
          .bind(userId, serializeUserState(defaultState), new Date().toISOString())
          .run();
        return defaultState;
      }

      const state = deserializeUserState(row.state_json);
      if (row.membership_plan_id === "monthly" || row.membership_plan_id === "quarterly" || row.membership_plan_id === "annual") {
        state.membershipPlanId = row.membership_plan_id;
      }
      return state;
    },

    async saveUserState(userId, userState) {
      await db
        .prepare(
          `INSERT INTO user_state (user_id, membership_plan_id, state_json, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             membership_plan_id = excluded.membership_plan_id,
             state_json = excluded.state_json,
             updated_at = excluded.updated_at`,
        )
        .bind(
          userId,
          userState.membershipPlanId ?? null,
          serializeUserState(userState),
          new Date().toISOString(),
        )
        .run();
    },
  };
}
