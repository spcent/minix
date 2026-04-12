import type { LoginPlatformKind } from "@minix/contracts";

import type { ApiBindings, KVNamespaceLike } from "./types";

const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_LOGIN_MAX_ATTEMPTS = 10;
const DEFAULT_REFRESH_MAX_ATTEMPTS = 20;
const DEFAULT_VERIFICATION_MAX_ATTEMPTS = 6;
const DEFAULT_ACCOUNT_MAX_ATTEMPTS = 10;
const DEFAULT_PAYMENT_MAX_ATTEMPTS = 6;
const DEFAULT_UPLOAD_MAX_ATTEMPTS = 20;
const DEFAULT_SHARE_MAX_ATTEMPTS = 20;
const DEFAULT_FEEDBACK_MAX_ATTEMPTS = 10;
const DEFAULT_MESSAGES_MAX_ATTEMPTS = 30;

export type SecurityRateLimitAction =
  | "login"
  | "refresh"
  | "verification"
  | "account"
  | "payment"
  | "upload"
  | "share"
  | "feedback"
  | "messages";

export type AuthRateLimitAction = Extract<SecurityRateLimitAction, "login" | "refresh">;

export interface AuthRateLimitConfig {
  windowSeconds: number;
  loginMaxAttempts: number;
  refreshMaxAttempts: number;
  verificationMaxAttempts: number;
  accountMaxAttempts: number;
  paymentMaxAttempts: number;
  uploadMaxAttempts: number;
  shareMaxAttempts: number;
  feedbackMaxAttempts: number;
  messagesMaxAttempts: number;
}

export interface AuthRateLimitDecision {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface StoredRateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitCounterStore {
  get(key: string): Promise<StoredRateLimitRecord | null>;
  put(key: string, record: StoredRateLimitRecord, ttlSeconds: number): Promise<void>;
}

export interface CheckAuthRateLimitInput {
  action: AuthRateLimitAction;
  platform: LoginPlatformKind;
  clientId: string;
  env?: ApiBindings;
  config?: Partial<AuthRateLimitConfig>;
  counterStore?: RateLimitCounterStore;
  now?: () => number;
}

export interface CheckSecurityRateLimitInput extends Omit<CheckAuthRateLimitInput, "action"> {
  action: SecurityRateLimitAction;
}

function systemNow() {
  return Date.now();
}

function readPositiveInteger(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function resolveAuthRateLimitConfig(
  env: ApiBindings | undefined,
  overrides: Partial<AuthRateLimitConfig> | undefined,
): AuthRateLimitConfig {
  const processEnv = typeof process === "undefined" ? undefined : process.env;

  return {
    windowSeconds:
      overrides?.windowSeconds ??
      readPositiveInteger(
        env?.MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS ?? processEnv?.MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS,
        DEFAULT_WINDOW_SECONDS,
      ),
    loginMaxAttempts:
      overrides?.loginMaxAttempts ??
      readPositiveInteger(env?.MINIX_AUTH_LOGIN_MAX_ATTEMPTS ?? processEnv?.MINIX_AUTH_LOGIN_MAX_ATTEMPTS, DEFAULT_LOGIN_MAX_ATTEMPTS),
    refreshMaxAttempts:
      overrides?.refreshMaxAttempts ??
      readPositiveInteger(
        env?.MINIX_AUTH_REFRESH_MAX_ATTEMPTS ?? processEnv?.MINIX_AUTH_REFRESH_MAX_ATTEMPTS,
        DEFAULT_REFRESH_MAX_ATTEMPTS,
      ),
    verificationMaxAttempts:
      overrides?.verificationMaxAttempts ??
      readPositiveInteger(processEnv?.MINIX_SECURITY_VERIFICATION_MAX_ATTEMPTS, DEFAULT_VERIFICATION_MAX_ATTEMPTS),
    accountMaxAttempts:
      overrides?.accountMaxAttempts ??
      readPositiveInteger(processEnv?.MINIX_SECURITY_ACCOUNT_MAX_ATTEMPTS, DEFAULT_ACCOUNT_MAX_ATTEMPTS),
    paymentMaxAttempts:
      overrides?.paymentMaxAttempts ??
      readPositiveInteger(processEnv?.MINIX_SECURITY_PAYMENT_MAX_ATTEMPTS, DEFAULT_PAYMENT_MAX_ATTEMPTS),
    uploadMaxAttempts:
      overrides?.uploadMaxAttempts ??
      readPositiveInteger(processEnv?.MINIX_SECURITY_UPLOAD_MAX_ATTEMPTS, DEFAULT_UPLOAD_MAX_ATTEMPTS),
    shareMaxAttempts:
      overrides?.shareMaxAttempts ??
      readPositiveInteger(processEnv?.MINIX_SECURITY_SHARE_MAX_ATTEMPTS, DEFAULT_SHARE_MAX_ATTEMPTS),
    feedbackMaxAttempts:
      overrides?.feedbackMaxAttempts ??
      readPositiveInteger(processEnv?.MINIX_SECURITY_FEEDBACK_MAX_ATTEMPTS, DEFAULT_FEEDBACK_MAX_ATTEMPTS),
    messagesMaxAttempts:
      overrides?.messagesMaxAttempts ??
      readPositiveInteger(processEnv?.MINIX_SECURITY_MESSAGES_MAX_ATTEMPTS, DEFAULT_MESSAGES_MAX_ATTEMPTS),
  };
}

class MemoryRateLimitCounterStore implements RateLimitCounterStore {
  private readonly records = new Map<string, StoredRateLimitRecord>();

  constructor(private readonly now: () => number = systemNow) {}

  async get(key: string): Promise<StoredRateLimitRecord | null> {
    const record = this.records.get(key);
    if (!record) {
      return null;
    }

    if (record.resetAt <= this.now()) {
      this.records.delete(key);
      return null;
    }

    return record;
  }

  async put(key: string, record: StoredRateLimitRecord): Promise<void> {
    this.records.set(key, record);
  }
}

class KvRateLimitCounterStore implements RateLimitCounterStore {
  constructor(private readonly namespace: KVNamespaceLike) {}

  async get(key: string): Promise<StoredRateLimitRecord | null> {
    const rawValue = await this.namespace.get(key);
    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as StoredRateLimitRecord;
      if (!Number.isFinite(parsed.count) || !Number.isFinite(parsed.resetAt)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  async put(key: string, record: StoredRateLimitRecord, ttlSeconds: number): Promise<void> {
    await this.namespace.put(key, JSON.stringify(record), { expirationTtl: ttlSeconds });
  }
}

let globalMemoryCounterStore: RateLimitCounterStore | undefined;

function getGlobalMemoryCounterStore(now: () => number): RateLimitCounterStore {
  globalMemoryCounterStore ??= new MemoryRateLimitCounterStore(now);
  return globalMemoryCounterStore;
}

function resolveCounterStore(
  env: ApiBindings | undefined,
  overrideStore: RateLimitCounterStore | undefined,
  now: () => number,
): RateLimitCounterStore {
  if (overrideStore) {
    return overrideStore;
  }

  if (env?.AUTH_RATE_LIMIT_KV) {
    return new KvRateLimitCounterStore(env.AUTH_RATE_LIMIT_KV);
  }

  return getGlobalMemoryCounterStore(now);
}

function getLimitForAction(config: AuthRateLimitConfig, action: SecurityRateLimitAction): number {
  switch (action) {
    case "login":
      return config.loginMaxAttempts;
    case "refresh":
      return config.refreshMaxAttempts;
    case "verification":
      return config.verificationMaxAttempts;
    case "account":
      return config.accountMaxAttempts;
    case "payment":
      return config.paymentMaxAttempts;
    case "upload":
      return config.uploadMaxAttempts;
    case "share":
      return config.shareMaxAttempts;
    case "feedback":
      return config.feedbackMaxAttempts;
    case "messages":
      return config.messagesMaxAttempts;
  }
}

function createKey(input: {
  action: SecurityRateLimitAction;
  platform: LoginPlatformKind;
  clientId: string;
}): string {
  return ["auth-rate-limit", input.action, input.platform, input.clientId.trim() || "anonymous"].join(":");
}

export function createMemoryRateLimitCounterStore(now?: () => number): RateLimitCounterStore {
  return new MemoryRateLimitCounterStore(now);
}

export async function checkSecurityRateLimit(input: CheckSecurityRateLimitInput): Promise<AuthRateLimitDecision> {
  const now = input.now ?? systemNow;
  const config = resolveAuthRateLimitConfig(input.env, input.config);
  const counterStore = resolveCounterStore(input.env, input.counterStore, now);
  const limit = getLimitForAction(config, input.action);
  const currentTime = now();
  const key = createKey(input);
  const currentRecord = await counterStore.get(key);
  const windowMs = config.windowSeconds * 1000;

  let nextRecord: StoredRateLimitRecord;
  if (!currentRecord || currentRecord.resetAt <= currentTime) {
    nextRecord = {
      count: 1,
      resetAt: currentTime + windowMs,
    };
  } else {
    nextRecord = {
      count: currentRecord.count + 1,
      resetAt: currentRecord.resetAt,
    };
  }

  const ttlSeconds = Math.max(1, Math.ceil((nextRecord.resetAt - currentTime) / 1000));
  await counterStore.put(key, nextRecord, ttlSeconds);

  const limited = nextRecord.count > limit;

  return {
    limited,
    limit,
    remaining: limited ? 0 : Math.max(0, limit - nextRecord.count),
    resetAt: nextRecord.resetAt,
    retryAfterSeconds: ttlSeconds,
  };
}

export async function checkAuthRateLimit(input: CheckAuthRateLimitInput): Promise<AuthRateLimitDecision> {
  return checkSecurityRateLimit(input);
}

export function resolveClientId(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
    return cfConnectingIp.trim();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstValue = forwardedFor.split(",")[0]?.trim();
    if (firstValue) {
      return firstValue;
    }
  }

  return "anonymous";
}
