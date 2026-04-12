import type {
  AuthCredentialProtection,
  AuthDeviceIdentity,
  AuthOAuthAuthorizeResponse,
  AuthPhoneVerificationResponse,
  AuthRateLimitState,
  AuthRiskDecision,
  AuthSecurityAuditEvent,
  AuthSecurityPrompt,
  AuthVerificationPurpose,
  LoginPlatformKind,
} from "@minix/contracts";
import type { Context } from "hono";

import { checkSecurityRateLimit, resolveClientId, type AuthRateLimitConfig, type AuthRateLimitDecision, type RateLimitCounterStore } from "../../rate-limit";
import type { ApiBindings, ApiStore, AuthOAuthCredentialRecord, AuthSecurityState, SessionRecord, UserState } from "../../types";
import { createAccountOperationResponse } from "../account/current-user";
import { appendAccountOperationRecord } from "../account/operations";

export const PHONE_VERIFICATION_TTL_MS = 5 * 60 * 1000;
export const PHONE_VERIFICATION_RETRY_AFTER_SECONDS = 60;
export const PHONE_VERIFICATION_MAX_ATTEMPTS = 3;
export const PASSWORD_MAX_FAILED_ATTEMPTS = 3;
export const PASSWORD_LOCK_MS = 15 * 60 * 1000;
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export function sanitizeUserKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").slice(0, 24) || "demo";
}

export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^\d]/g, "");
}

export function maskPhoneNumber(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (normalized.length < 7) {
    return phoneNumber;
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
}

export function resolveRequestDeviceId(c: Context): string | undefined {
  const value = c.req.header("x-device-id") ?? c.req.header("x-minix-device-id");
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function createAuthSecurityState(): AuthSecurityState {
  return {
    phoneVerificationsById: {},
    latestVerificationIdByPhonePurpose: {},
    passwordCredentialsBySubject: {},
    oauthStatesByState: {},
    oauthCredentialsByProviderSubject: {},
    credentialProtectionBySubject: {},
    devicesById: {},
    auditEvents: [],
    rateLimitStatesByScope: {},
  };
}

export function ensureAuthSecurityState(userState: UserState): AuthSecurityState {
  userState.authSecurity ??= createAuthSecurityState();
  userState.authSecurity.phoneVerificationsById ??= {};
  userState.authSecurity.latestVerificationIdByPhonePurpose ??= {};
  userState.authSecurity.passwordCredentialsBySubject ??= {};
  userState.authSecurity.oauthStatesByState ??= {};
  userState.authSecurity.oauthCredentialsByProviderSubject ??= {};
  userState.authSecurity.credentialProtectionBySubject ??= {};
  userState.authSecurity.devicesById ??= {};
  userState.authSecurity.auditEvents ??= [];
  userState.authSecurity.rateLimitStatesByScope ??= {};
  return userState.authSecurity;
}

export function createSecurityPrompt(input: {
  title: string;
  message: string;
  severity: AuthSecurityPrompt["severity"];
  scope: AuthSecurityAuditEvent["scope"];
  acknowledgeRequired?: boolean;
  acknowledgeLabel?: string;
}): AuthSecurityPrompt {
  return {
    title: input.title,
    message: input.message,
    severity: input.severity,
    scope: input.scope,
    ...(input.acknowledgeRequired ? { acknowledgeRequired: true } : {}),
    ...(input.acknowledgeLabel ? { acknowledgeLabel: input.acknowledgeLabel } : {}),
  };
}

export function upsertDeviceIdentity(input: {
  userState: UserState;
  deviceId?: string;
  platform: LoginPlatformKind;
  now: string;
  riskDecision?: AuthRiskDecision;
  userAgent?: string;
  ipRegion?: string;
  scene?: string;
  trust?: boolean;
}): AuthDeviceIdentity | undefined {
  if (!input.deviceId) {
    return undefined;
  }

  const security = ensureAuthSecurityState(input.userState);
  const existing = security.devicesById[input.deviceId];
  const trusted = input.trust ?? existing?.trusted ?? input.riskDecision?.level === "allow";
  const next: AuthDeviceIdentity = {
    deviceId: input.deviceId,
    platform: input.platform,
    trusted,
    firstSeenAt: existing?.firstSeenAt ?? input.now,
    lastSeenAt: input.now,
    ...(trusted
      ? { trustedAt: existing?.trustedAt ?? input.now }
      : existing?.trustedAt
        ? { trustedAt: existing.trustedAt }
        : {}),
    ...(input.userAgent
      ? { lastUserAgent: input.userAgent }
      : existing?.lastUserAgent
        ? { lastUserAgent: existing.lastUserAgent }
        : {}),
    ...(input.ipRegion
      ? { lastIpRegion: input.ipRegion }
      : existing?.lastIpRegion
        ? { lastIpRegion: existing.lastIpRegion }
        : {}),
    ...(input.scene
      ? { lastScene: input.scene }
      : existing?.lastScene
        ? { lastScene: existing.lastScene }
        : {}),
    ...(input.riskDecision?.level
      ? { riskLevel: input.riskDecision.level }
      : existing?.riskLevel
        ? { riskLevel: existing.riskLevel }
        : {}),
  };
  security.devicesById[input.deviceId] = next;
  return next;
}

export function setLatestSecurityPrompt(userState: UserState, prompt: AuthSecurityPrompt | undefined) {
  if (!prompt) {
    return;
  }

  ensureAuthSecurityState(userState).latestPrompt = prompt;
}

export function getRecentSecurityAuditEvents(
  userState: UserState,
  limit = 5,
): AuthSecurityAuditEvent[] {
  return ensureAuthSecurityState(userState).auditEvents.slice(0, limit);
}

export function createRateLimitState(input: {
  scope: AuthSecurityAuditEvent["scope"];
  key: string;
  decision: AuthRateLimitDecision;
  now: string;
}): AuthRateLimitState {
  return {
    scope: input.scope,
    key: input.key,
    limited: input.decision.limited,
    limit: input.decision.limit,
    remaining: input.decision.remaining,
    resetAt: input.decision.resetAt,
    retryAfterSeconds: input.decision.retryAfterSeconds,
    updatedAt: input.now,
  };
}

export function recordRateLimitState(input: {
  userState: UserState;
  scope: AuthSecurityAuditEvent["scope"];
  key: string;
  decision: AuthRateLimitDecision;
  now: string;
}): AuthRateLimitState {
  const security = ensureAuthSecurityState(input.userState);
  const state = createRateLimitState(input);
  security.rateLimitStatesByScope[`${input.scope}:${input.key}`] = state;
  return state;
}

export function appendSecurityAuditEvent(input: {
  userState: UserState;
  scope: AuthSecurityAuditEvent["scope"];
  action: string;
  result: AuthSecurityAuditEvent["result"];
  message: string;
  createdAt: string;
  actorUserId?: string;
  deviceId?: string;
  clientId?: string;
  platform?: LoginPlatformKind;
  reason?: string;
  frequencyKey?: string;
  scene?: string;
  traceId?: string;
}) {
  const security = ensureAuthSecurityState(input.userState);
  const event: AuthSecurityAuditEvent = {
    eventId: createRandomId("security_audit"),
    scope: input.scope,
    action: input.action,
    result: input.result,
    message: input.message,
    createdAt: input.createdAt,
    ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
    ...(input.deviceId ? { deviceId: input.deviceId } : {}),
    ...(input.clientId ? { clientId: input.clientId } : {}),
    ...(input.platform ? { platform: input.platform } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.frequencyKey ? { frequencyKey: input.frequencyKey } : {}),
    ...(input.scene ? { scene: input.scene } : {}),
    ...(input.traceId ? { traceId: input.traceId } : {}),
  };
  security.auditEvents = [event, ...security.auditEvents].slice(0, 50);
  return event;
}

export async function guardSecurityRateLimit(input: {
  c: Context;
  store: ApiStore;
  userId: string;
  userState: UserState;
  action: Parameters<typeof checkSecurityRateLimit>[0]["action"];
  scope: AuthSecurityAuditEvent["scope"];
  platform: LoginPlatformKind;
  traceId: string;
  config?: Partial<AuthRateLimitConfig> | undefined;
  counterStore?: RateLimitCounterStore | undefined;
  actorUserId?: string | undefined;
  clientId?: string | undefined;
  deviceId?: string | undefined;
  blockedAction: string;
  blockedMessage: string;
  reason?: string | undefined;
  frequencyKey?: string | undefined;
  scene?: string | undefined;
}): Promise<
  | {
      allowed: true;
      clientId: string;
      nowIso: string;
      rateLimitState: AuthRateLimitState;
    }
  | {
      allowed: false;
      clientId: string;
      nowIso: string;
      rateLimitState: AuthRateLimitState;
      response: Response;
    }
> {
  const clientId = input.clientId ?? resolveClientId(input.c.req.raw);
  const rateLimitDecision = await checkSecurityRateLimit({
    action: input.action,
    platform: input.platform,
    clientId,
    env: input.c.env,
    ...(input.config ? { config: input.config } : {}),
    ...(input.counterStore ? { counterStore: input.counterStore } : {}),
  });
  const nowIso = new Date().toISOString();
  const rateLimitState = recordRateLimitState({
    userState: input.userState,
    scope: input.scope,
    key: `${input.action}:${clientId}`,
    decision: rateLimitDecision,
    now: nowIso,
  });
  if (!rateLimitDecision.limited) {
    return {
      allowed: true,
      clientId,
      nowIso,
      rateLimitState,
    };
  }

  appendSecurityAuditEvent({
    userState: input.userState,
    scope: input.scope,
    action: input.blockedAction,
    result: "blocked",
    message: input.blockedMessage,
    createdAt: nowIso,
    ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
    ...(input.deviceId ? { deviceId: input.deviceId } : {}),
    clientId,
    platform: input.platform,
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.frequencyKey ? { frequencyKey: input.frequencyKey } : {}),
    ...(input.scene ? { scene: input.scene } : {}),
    ...(input.traceId ? { traceId: input.traceId } : {}),
  });
  await input.store.saveUserState(input.userId, input.userState);
  const response = input.c.json(
    {
      code: "RATE_LIMITED",
      message: input.blockedMessage,
      retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
      rateLimitState,
    },
    429,
  );
  setRateLimitHeaders(response, rateLimitDecision);
  return {
    allowed: false,
    clientId,
    nowIso,
    rateLimitState,
    response,
  };
}

export function evaluateSecurityDecision(input: {
  userState: UserState;
  platform: LoginPlatformKind;
  deviceId?: string | undefined;
  riskContext?: {
    deviceId?: string | undefined;
    userAgent?: string | undefined;
    ipRegion?: string | undefined;
    frequencyKey?: string | undefined;
    scene?: string | undefined;
  } | undefined;
  scope: AuthSecurityAuditEvent["scope"];
  forceReview?: boolean | undefined;
}): {
  riskDecision: AuthRiskDecision;
  deviceIdentity?: AuthDeviceIdentity;
  prompt?: AuthSecurityPrompt;
} {
  const deviceId = input.deviceId ?? input.riskContext?.deviceId;
  const security = ensureAuthSecurityState(input.userState);
  const existingDevice = deviceId ? security.devicesById[deviceId] : undefined;
  const suspicious =
    input.forceReview ||
    input.riskContext?.scene === "suspicious-login" ||
    input.riskContext?.frequencyKey === "abnormal-login" ||
    input.riskContext?.ipRegion === "unusual-region" ||
    deviceId === "device-risk-review" ||
    Boolean(deviceId && !existingDevice);
  const riskDecision: AuthRiskDecision = {
    ...(deviceId ? { deviceId } : {}),
    ...(input.riskContext?.frequencyKey
      ? { frequencyKey: input.riskContext.frequencyKey }
      : {}),
    ...(input.riskContext?.scene ? { scene: input.riskContext.scene } : {}),
    level: suspicious ? "review" : "allow",
    ...(suspicious
      ? { reason: existingDevice ? "unusual_device_or_region" : "new_device" }
      : {}),
  };
  const deviceIdentity = upsertDeviceIdentity({
    userState: input.userState,
    platform: input.platform,
    now: new Date().toISOString(),
    riskDecision,
    trust: !suspicious,
    ...(deviceId ? { deviceId } : {}),
    ...(input.riskContext?.userAgent ? { userAgent: input.riskContext.userAgent } : {}),
    ...(input.riskContext?.ipRegion ? { ipRegion: input.riskContext.ipRegion } : {}),
    ...(input.riskContext?.scene ? { scene: input.riskContext.scene } : {}),
  });
  const prompt = suspicious
    ? createSecurityPrompt({
        title: input.scope === "auth" ? "Unusual sign-in detected" : "Review device activity",
        message:
          input.scope === "auth"
            ? "This sign-in came from a new or unusual device context. Review the session details before continuing."
            : "This action came from a new or unusual device context. Review the operation details before continuing.",
        severity: "warning",
        scope: input.scope,
        acknowledgeRequired: true,
      })
    : undefined;
  if (prompt) {
    security.latestPrompt = prompt;
  }
  return {
    riskDecision,
    ...(deviceIdentity ? { deviceIdentity } : {}),
    ...(prompt ? { prompt } : {}),
  };
}

export function createRandomCode(): string {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String((value[0] ?? 0) % 1_000_000).padStart(6, "0");
}

export function createRandomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function hashSecret(secret: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${secret}`);
  return toHex(await crypto.subtle.digest("SHA-256", bytes));
}

export function createCredentialSubject(input: {
  account?: string | undefined;
  phoneNumber?: string | undefined;
}): string | null {
  if (input.phoneNumber) {
    const normalized = normalizePhoneNumber(input.phoneNumber);
    return normalized ? `phone:${normalized}` : null;
  }

  if (input.account) {
    return `account:${sanitizeUserKey(input.account.toLowerCase())}`;
  }

  return null;
}

export function createPhonePurposeKey(
  phoneNumber: string,
  purpose: AuthVerificationPurpose,
): string {
  return `${normalizePhoneNumber(phoneNumber)}:${purpose}`;
}

export function createOAuthSubject(provider: string, providerUserId: string): string {
  return `${sanitizeUserKey(provider.toLowerCase())}:${sanitizeUserKey(providerUserId)}`;
}

export function createOAuthIndexUserId(provider: string, providerUserId: string): string {
  return `oauth_index_${createOAuthSubject(provider, providerUserId)}`;
}

export function createOAuthProviderLabel(provider: string): string {
  if (provider === "wechat-open-platform") {
    return "WeChat Open Platform";
  }

  return provider
    .split(/[-_]+/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function createOAuthCredentialRecord(input: {
  provider: string;
  providerUserId: string;
  userId: string;
  tokenHash: string;
  now: number;
  authorizationStatus?: AuthOAuthCredentialRecord["authorizationStatus"] | undefined;
  revokedAt?: number | undefined;
  revocationReason?: string | undefined;
  existing?: AuthOAuthCredentialRecord | undefined;
}): AuthOAuthCredentialRecord {
  return {
    provider: input.provider,
    providerUserId: input.providerUserId,
    userId: input.userId,
    tokenHash: input.tokenHash,
    createdAt: input.existing?.createdAt ?? input.now,
    linkedAt: input.existing?.linkedAt ?? input.now,
    lastAuthorizedAt: input.now,
    authorizationStatus: input.authorizationStatus ?? "active",
    ...(input.revokedAt ? { revokedAt: input.revokedAt } : {}),
    ...(input.revocationReason ? { revocationReason: input.revocationReason } : {}),
  };
}

export async function loadOAuthCredentialLink(
  store: ApiStore,
  provider: string,
  providerUserId: string,
): Promise<{
  subject: string;
  indexUserId: string;
  indexState: UserState;
  record?: AuthOAuthCredentialRecord;
}> {
  const subject = createOAuthSubject(provider, providerUserId);
  const indexUserId = createOAuthIndexUserId(provider, providerUserId);
  const indexState = await store.getUserState(indexUserId);
  const record = ensureAuthSecurityState(indexState).oauthCredentialsByProviderSubject[subject];
  return {
    subject,
    indexUserId,
    indexState,
    ...(record ? { record } : {}),
  };
}

export async function saveOAuthCredentialLink(input: {
  store: ApiStore;
  provider: string;
  providerUserId: string;
  ownerUserId: string;
  tokenHash: string;
  now: number;
  authorizationStatus?: AuthOAuthCredentialRecord["authorizationStatus"];
  revocationReason?: string;
}) {
  const { subject, indexUserId, indexState, record } = await loadOAuthCredentialLink(
    input.store,
    input.provider,
    input.providerUserId,
  );
  const nextRecord = createOAuthCredentialRecord({
    provider: input.provider,
    providerUserId: input.providerUserId,
    userId: input.ownerUserId,
    tokenHash: input.tokenHash,
    now: input.now,
    ...(input.authorizationStatus ? { authorizationStatus: input.authorizationStatus } : {}),
    ...(input.authorizationStatus && input.authorizationStatus !== "active"
      ? { revokedAt: input.now }
      : {}),
    ...(input.revocationReason ? { revocationReason: input.revocationReason } : {}),
    ...(record ? { existing: record } : {}),
  });
  ensureAuthSecurityState(indexState).oauthCredentialsByProviderSubject[subject] = nextRecord;
  await input.store.saveUserState(indexUserId, indexState);
  return { subject, indexUserId, indexState, record: nextRecord };
}

export async function createPhoneVerificationChallenge(input: {
  userState: UserState;
  phoneNumber: string;
  purpose: AuthVerificationPurpose;
  deviceId?: string;
  now: number;
}) {
  const security = ensureAuthSecurityState(input.userState);
  const code = createRandomCode();
  const salt = createRandomId("ver_salt");
  const verificationId = createRandomId("ver");
  const expiresAt = input.now + PHONE_VERIFICATION_TTL_MS;
  security.phoneVerificationsById[verificationId] = {
    verificationId,
    purpose: input.purpose,
    phoneNumber: input.phoneNumber,
    salt,
    codeHash: await hashSecret(code, salt),
    attempts: 0,
    maxAttempts: PHONE_VERIFICATION_MAX_ATTEMPTS,
    expiresAt,
    createdAt: input.now,
    ...(input.deviceId ? { deviceId: input.deviceId } : {}),
  };
  security.latestVerificationIdByPhonePurpose[
    createPhonePurposeKey(input.phoneNumber, input.purpose)
  ] = verificationId;
  return { code, verificationId, expiresAt };
}

export async function consumePhoneVerification(input: {
  userState: UserState;
  phoneNumber: string;
  purpose: AuthVerificationPurpose;
  verificationCode: string;
  now: number;
}): Promise<
  { ok: true } | { ok: false; status: 400 | 423; message: string; protection: AuthCredentialProtection }
> {
  const security = ensureAuthSecurityState(input.userState);
  const verificationId =
    security.latestVerificationIdByPhonePurpose[
      createPhonePurposeKey(input.phoneNumber, input.purpose)
    ];
  const record = verificationId ? security.phoneVerificationsById[verificationId] : undefined;
  if (!record || record.consumedAt) {
    return {
      ok: false,
      status: 400,
      message: "phone verification code is missing or already consumed",
      protection: { failureReason: "credential_missing", remainingAttempts: 0 },
    };
  }

  if (record.expiresAt <= input.now) {
    return {
      ok: false,
      status: 400,
      message: "phone verification code has expired",
      protection: { failureReason: "verification_code_expired", remainingAttempts: 0 },
    };
  }

  if (record.attempts >= record.maxAttempts) {
    return {
      ok: false,
      status: 423,
      message: "phone verification is locked after too many failed attempts",
      protection: {
        failureReason: "verification_code_locked",
        remainingAttempts: 0,
        lockedUntil: record.expiresAt,
      },
    };
  }

  const inputHash = await hashSecret(input.verificationCode, record.salt);
  if (inputHash !== record.codeHash) {
    record.attempts += 1;
    const remainingAttempts = Math.max(0, record.maxAttempts - record.attempts);
    return {
      ok: false,
      status: remainingAttempts > 0 ? 400 : 423,
      message:
        remainingAttempts > 0
          ? "invalid phone verification code"
          : "phone verification is locked after too many failed attempts",
      protection: {
        failureReason:
          remainingAttempts > 0
            ? "verification_code_invalid"
            : "verification_code_locked",
        remainingAttempts,
        ...(remainingAttempts === 0 ? { lockedUntil: record.expiresAt } : {}),
      },
    };
  }

  record.consumedAt = input.now;
  return { ok: true };
}

export async function registerPasswordCredential(input: {
  userState: UserState;
  userId: string;
  subject: string;
  password: string;
  now: number;
}) {
  const security = ensureAuthSecurityState(input.userState);
  const salt = createRandomId("pwd_salt");
  security.passwordCredentialsBySubject[input.subject] = {
    subject: input.subject,
    userId: input.userId,
    salt,
    passwordHash: await hashSecret(input.password, salt),
    failedAttempts: 0,
    maxFailedAttempts: PASSWORD_MAX_FAILED_ATTEMPTS,
    updatedAt: input.now,
  };
  security.credentialProtectionBySubject[input.subject] = {
    remainingAttempts: PASSWORD_MAX_FAILED_ATTEMPTS,
  };
}

export async function verifyPasswordCredential(input: {
  userState: UserState;
  subject: string;
  password: string;
  now: number;
}): Promise<
  | { ok: true; userId: string; protection: AuthCredentialProtection }
  | { ok: false; status: 400 | 423; message: string; protection: AuthCredentialProtection }
> {
  const security = ensureAuthSecurityState(input.userState);
  const credential = security.passwordCredentialsBySubject[input.subject];
  if (!credential) {
    return {
      ok: false,
      status: 400,
      message: "password credential is not configured",
      protection: { failureReason: "password_not_configured", remainingAttempts: 0 },
    };
  }

  if (credential.lockedUntil && credential.lockedUntil > input.now) {
    return {
      ok: false,
      status: 423,
      message: "password credential is locked after too many failed attempts",
      protection: { failureReason: "password_locked", remainingAttempts: 0 },
    };
  }

  if (credential.lockedUntil && credential.lockedUntil <= input.now) {
    delete credential.lockedUntil;
    credential.failedAttempts = 0;
  }

  const inputHash = await hashSecret(input.password, credential.salt);
  if (inputHash !== credential.passwordHash) {
    credential.failedAttempts += 1;
    const remainingAttempts = Math.max(
      0,
      credential.maxFailedAttempts - credential.failedAttempts,
    );
    if (remainingAttempts === 0) {
      credential.lockedUntil = input.now + PASSWORD_LOCK_MS;
    }
    const protection: AuthCredentialProtection = {
      failureReason: remainingAttempts === 0 ? "password_locked" : "password_invalid",
      remainingAttempts,
      ...(credential.lockedUntil ? { lockedUntil: credential.lockedUntil } : {}),
    };
    security.credentialProtectionBySubject[input.subject] = protection;
    return {
      ok: false,
      status: remainingAttempts === 0 ? 423 : 400,
      message:
        remainingAttempts === 0
          ? "password credential is locked after too many failed attempts"
          : "invalid account or password",
      protection,
    };
  }

  credential.failedAttempts = 0;
  delete credential.lockedUntil;
  credential.updatedAt = input.now;
  const protection: AuthCredentialProtection = {
    remainingAttempts: credential.maxFailedAttempts,
  };
  security.credentialProtectionBySubject[input.subject] = protection;
  return {
    ok: true,
    userId: credential.userId,
    protection,
  };
}

export function createOperationBlockedResponse(input: {
  userState: UserState;
  kind:
    | "change_phone"
    | "unbind_wechat"
    | "unlink_provider"
    | "revoke_provider"
    | "request_cancellation"
    | "revoke_cancellation";
  actorLabel: string;
  message: string;
  session: SessionRecord;
  requestUrl: string;
  traceId?: string | undefined;
  clientId?: string | undefined;
  deviceId?: string | undefined;
}) {
  const prompt = createSecurityPrompt({
    title: "Review account security requirements",
    message: input.message,
    severity: "warning",
    scope: "account",
    acknowledgeRequired: true,
  });
  setLatestSecurityPrompt(input.userState, prompt);
  appendAccountOperationRecord(input.userState, {
    kind: input.kind,
    status: "blocked",
    actorLabel: input.actorLabel,
    message: input.message,
    notificationHookLabel: "notify:account_operation_blocked",
  });
  appendSecurityAuditEvent({
    userState: input.userState,
    scope: "account",
    action: input.kind,
    result: "blocked",
    message: input.message,
    createdAt: new Date().toISOString(),
    actorUserId: input.session.userId,
    ...(input.deviceId ? { deviceId: input.deviceId } : {}),
    ...(input.clientId ? { clientId: input.clientId } : {}),
    platform: input.session.platform,
    ...(input.traceId ? { traceId: input.traceId } : {}),
  });

  return createAccountOperationResponse(
    input.session,
    input.userState,
    input.requestUrl,
    input.message,
  );
}

export function setAuthRateLimitHeaders(
  c: Context<{ Bindings: ApiBindings }>,
  decision: AuthRateLimitDecision,
) {
  c.header("X-RateLimit-Limit", String(decision.limit));
  c.header("X-RateLimit-Remaining", String(decision.remaining));
  c.header("X-RateLimit-Reset", String(decision.resetAt));

  if (decision.limited) {
    c.header("Retry-After", String(decision.retryAfterSeconds));
  }
}

export function setRateLimitHeaders(response: Response, decision: AuthRateLimitDecision) {
  response.headers.set("X-RateLimit-Limit", String(decision.limit));
  response.headers.set("X-RateLimit-Remaining", String(decision.remaining));
  response.headers.set("X-RateLimit-Reset", String(decision.resetAt));
  if (decision.limited) {
    response.headers.set("Retry-After", String(decision.retryAfterSeconds));
  }
}

export function logAuthEvent(
  event: "login_rate_limited" | "refresh_rate_limited" | "login_failed" | "refresh_failed",
  detail: Record<string, string | number | undefined>,
) {
  console.warn("[minix-api:auth]", JSON.stringify({ event, ...detail }));
}
