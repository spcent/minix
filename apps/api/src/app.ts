import { Hono, type Context } from "hono";
import { z } from "zod";

import type {
  AddToBookshelfRequest,
  AuthAbnormalLoginPrompt,
  AuthIdentity,
  AuthIdentityFailureReason,
  AuthIdentityWorkflow,
  AuthRedirectTarget,
  AuthStatus,
  BookshelfMutationResponse,
  FeedbackTicketDetailResponse,
  IdentityBindPhoneRequest,
  IdentityMergeRequest,
  IdentityTransitionResponse,
  IdentityUpgradeRequest,
  LoadReadingProgressResponse,
  OrderDetailResponse,
  LoginMethod,
  LoginResponse,
  MembershipEntitlement,
  PaymentResult,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  RefreshTokenResponse,
  RemoveFromBookshelfRequest,
  SaveReadingProgressRequest,
  SubmitFeedbackRequest,
  UploadAsset,
} from "@minix/contracts";
import {
  CHAPTER_CONTENT,
  CHAPTER_LISTS,
  DEFAULT_MEMBERSHIP_OVERVIEW,
  NOVELS,
  createCurrentUserResponse,
  createBookshelf,
  createFeedbackBootstrapResponse,
  createMembershipOverview,
  createMembershipOrderDetail,
  createMembershipPurchaseResponse,
  createSettingsResponse,
  deriveReturnTarget,
  getMessageThread,
  getUnreadBadge,
  getFeedbackTicket,
  listFeed,
  listItems,
  listNotifications,
  listNovels,
  submitFeedbackTicket,
  markNotificationsRead,
  resolveChapterContent,
  resolveChapterList,
  resolveNovelDetail,
} from "./data";
import { checkAuthRateLimit, resolveClientId, type AuthRateLimitConfig, type AuthRateLimitDecision, type RateLimitCounterStore } from "./rate-limit";
import { renderSampleCoverAssetSvg, renderSampleProfileAssetSvg, resolveProfileMedia } from "./sample-assets";
import { createD1ApiStore } from "./store.d1";
import { getGlobalMemoryApiStore } from "./store";
import type { ApiBindings, ApiStore, SessionRecord, UserState } from "./types";

declare module "hono" {
  interface ContextVariableMap {
    session: SessionRecord;
    traceId: string;
  }
}

const loginRequestSchema = z.object({
  platform: z.enum(["wechat", "h5"]),
  credential: z.object({
    method: z.enum(["wechat_code", "phone_code", "password", "guest", "oauth"]).optional(),
    code: z.string().min(1).optional(),
    authCode: z.string().min(1).optional(),
    anonymousId: z.string().min(1).optional(),
    phoneNumber: z.string().min(1).optional(),
    verificationCode: z.string().min(1).optional(),
    account: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    provider: z.string().min(1).optional(),
    providerToken: z.string().min(1).optional(),
    deviceId: z.string().min(1).optional(),
  }),
  riskContext: z
    .object({
      deviceId: z.string().min(1).optional(),
      userAgent: z.string().min(1).optional(),
      ipRegion: z.string().min(1).optional(),
      frequencyKey: z.string().min(1).optional(),
      scene: z.string().min(1).optional(),
    })
    .optional(),
  redirectTarget: z
    .object({
      routeId: z.string().min(1).optional(),
      path: z.string().min(1).optional(),
      params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
      source: z.string().min(1).optional(),
      label: z.string().min(1).optional(),
      reason: z.enum(["auth-required", "session-expired", "force-relogin"]).optional(),
      forceReauth: z.boolean().optional(),
    })
    .optional(),
});

const refreshTokenRequestSchema = z.object({
  platform: z.enum(["wechat", "h5"]),
  refreshToken: z.string().min(1),
});

const authRedirectTargetSchema = z.object({
  routeId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  source: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  reason: z.enum(["auth-required", "session-expired", "force-relogin"]).optional(),
  forceReauth: z.boolean().optional(),
});

const identityUpgradeSchema = z.object({
  credential: z.object({
    method: z.enum(["phone_code", "password"]),
    phoneNumber: z.string().min(1).optional(),
    verificationCode: z.string().min(1).optional(),
    account: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    deviceId: z.string().min(1).optional(),
  }),
  mergeStrategy: z.enum(["prompt", "merge"]).optional(),
  redirectTarget: authRedirectTargetSchema.optional(),
});

const identityBindPhoneSchema = z.object({
  phoneNumber: z.string().min(1),
  verificationCode: z.string().min(1),
  mergeStrategy: z.enum(["prompt", "merge"]).optional(),
  redirectTarget: authRedirectTargetSchema.optional(),
});

const identityMergeSchema = z.object({
  targetUserId: z.string().min(1),
  workflowKind: z.enum(["guest_upgrade", "phone_binding"]).optional(),
  confirm: z.boolean(),
  redirectTarget: authRedirectTargetSchema.optional(),
});

const itemsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

const feedQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  keyword: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  mode: z.enum(["global", "content", "user", "domain"]).optional(),
  domain: z.enum(["all", "content", "user", "novel", "feed"]).optional(),
});

const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  type: z.enum(["system", "business", "campaign", "review", "all"]).optional(),
  groupKey: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  onlyUnread: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

const novelsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  keyword: z.string().min(1).optional(),
  categoryKey: z.string().min(1).optional(),
  status: z.enum(["serializing", "completed", "paused", "all"]).optional(),
  sort: z.enum(["recommended", "updatedAt", "popular", "wordCount"]).optional(),
});

const novelIdQuerySchema = z.object({
  novelId: z.string().min(1),
});

const chapterIdQuerySchema = z.object({
  chapterId: z.string().min(1),
});

const bookshelfMutationSchema = z.object({
  novelId: z.string().min(1),
});

const purchaseMembershipSchema = z.object({
  planId: z.enum(["monthly", "quarterly", "annual"]),
  channel: z.enum(["wechat_pay", "h5_pay", "membership_purchase", "virtual_entitlement"]).optional(),
  idempotencyKey: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  novelId: z.string().min(1).optional(),
  chapterId: z.string().min(1).optional(),
});

const orderIdQuerySchema = z.object({
  orderId: z.string().min(1),
});

const threadIdQuerySchema = z.object({
  threadId: z.string().min(1),
});

const feedbackTicketIdQuerySchema = z.object({
  ticketId: z.string().min(1),
});

const uploadAssetSchema = z.object({
  assetId: z.string().min(1),
  fileType: z.enum(["image", "audio", "video", "pdf", "avatar", "attachment"]),
  fileName: z.string().min(1),
  url: z.string().min(1),
  thumbnailUrl: z.string().min(1).optional(),
  coverImageUrl: z.string().min(1).optional(),
  metadata: z.object({
    mimeType: z.string().min(1).optional(),
    sizeBytes: z.number().int().nonnegative(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    durationSeconds: z.number().nonnegative().optional(),
    pageCount: z.number().int().positive().optional(),
  }),
});

const feedbackContextSchema = z.object({
  sourcePage: z.string().min(1),
  sourceRouteId: z.string().min(1).optional(),
  sourceLabel: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  platform: z.string().min(1),
  appVersion: z.string().min(1),
  deviceSummary: z.string().min(1).optional(),
  screenshotAssets: z.array(uploadAssetSchema),
  attachmentAssets: z.array(uploadAssetSchema),
});

const submitFeedbackSchema = z.object({
  type: z.enum(["issue_report", "suggestion", "complaint", "abuse_report", "satisfaction"]),
  categoryKey: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  labels: z.array(z.string().min(1)).optional(),
  revisitRequested: z.boolean().optional(),
  satisfactionScore: z.number().min(1).max(5).optional(),
  context: feedbackContextSchema,
});

const markNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  type: z.enum(["system", "business", "campaign", "review", "all"]).optional(),
  groupKey: z.string().min(1).optional(),
  onlyUnread: z.boolean().optional(),
});

const saveReadingProgressSchema = z.object({
  novelId: z.string().min(1),
  chapterId: z.string().min(1),
  progressPercent: z.number().min(0).max(1),
  scrollOffset: z.number().min(0).optional(),
  pageIndex: z.number().int().min(0).optional(),
});

const DEFAULT_ALLOWED_CORS_ORIGINS = [
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:4174",
  "http://127.0.0.1:4174",
] as const;
const CORS_ALLOW_HEADERS = "authorization, content-type, x-trace-id";
const CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_MAX_AGE_SECONDS = "600";
const DEMO_PHONE_VERIFICATION_CODE = "123456";
const DEMO_PASSWORD = "minix-demo-pass";

function createTraceId() {
  return `api_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveTraceId(header: string | undefined): string {
  if (header && header.trim().length > 0) {
    return header.trim();
  }

  return createTraceId();
}

function withTraceHeaders(headers: Record<string, string>, traceId: string) {
  return {
    ...headers,
    "X-Trace-Id": traceId,
  };
}

function resolveLoginMethod(payload: z.infer<typeof loginRequestSchema>): LoginMethod {
  if (payload.credential.method) {
    return payload.credential.method;
  }

  return payload.platform === "wechat" ? "wechat_code" : "guest";
}

function sanitizeUserKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").slice(0, 24) || "demo";
}

function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^\d]/g, "");
}

function createGuestUserId(anonymousId?: string): string {
  return anonymousId ? `guest_${sanitizeUserKey(anonymousId).slice(0, 32)}` : "guest_minix_demo";
}

function createUserIdFromCredential(input: {
  method: Extract<LoginMethod, "guest" | "phone_code" | "password">;
  anonymousId?: string;
  phoneNumber?: string;
  account?: string;
}): string {
  switch (input.method) {
    case "guest":
      return createGuestUserId(input.anonymousId);
    case "phone_code":
      return input.phoneNumber ? `user_phone_${normalizePhoneNumber(input.phoneNumber).slice(-4)}` : "user_phone_demo";
    case "password":
      if (input.account) {
        return `user_account_${sanitizeUserKey(input.account)}`;
      }
      return input.phoneNumber ? `user_phone_${normalizePhoneNumber(input.phoneNumber).slice(-4)}` : "user_password_demo";
  }
}

function createUserIdFromLogin(payload: z.infer<typeof loginRequestSchema>, method: LoginMethod): string {
  switch (method) {
    case "guest":
      return createUserIdFromCredential({
        method,
        ...(payload.credential.anonymousId ? { anonymousId: payload.credential.anonymousId } : {}),
      });
    case "phone_code":
      return createUserIdFromCredential({
        method,
        ...(payload.credential.phoneNumber ? { phoneNumber: payload.credential.phoneNumber } : {}),
      });
    case "password":
      return createUserIdFromCredential({
        method,
        ...(payload.credential.account ? { account: payload.credential.account } : {}),
        ...(payload.credential.phoneNumber ? { phoneNumber: payload.credential.phoneNumber } : {}),
      });
    default:
      return "minix-demo-user";
  }
}

function createUserIdFromUpgradeRequest(payload: {
  credential: {
    method: "phone_code" | "password";
    phoneNumber?: string | undefined;
    account?: string | undefined;
  };
}): string {
  return createUserIdFromCredential({
    method: payload.credential.method,
    ...(payload.credential.phoneNumber ? { phoneNumber: payload.credential.phoneNumber } : {}),
    ...(payload.credential.account ? { account: payload.credential.account } : {}),
  });
}

function resolveMaskedPhoneNumber(phoneNumber: string | undefined): string | undefined {
  if (!phoneNumber) {
    return undefined;
  }

  const normalized = normalizePhoneNumber(phoneNumber);
  if (normalized.length < 7) {
    return undefined;
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
}

function createWorkflowMessage(
  kind: AuthIdentityWorkflow["kind"],
  status: AuthIdentityWorkflow["status"],
  targetLabel?: string,
): string {
  if (status === "merge_required") {
    return targetLabel
      ? `This identity is already linked to ${targetLabel}. Confirm the merge to continue.`
      : "This identity is already linked to another account. Confirm the merge to continue.";
  }

  if (status === "conflict") {
    return targetLabel
      ? `The current session conflicts with ${targetLabel}. Resolve the target account before retrying.`
      : "The current session conflicts with another account.";
  }

  if (kind === "guest_upgrade") {
    return "The guest session has been upgraded to a formal account.";
  }

  if (kind === "phone_binding") {
    return "The current account is now bound to the verified phone number.";
  }

  return "The current session has been merged into the target account.";
}

function createIdentityWorkflow(input: {
  kind: AuthIdentityWorkflow["kind"];
  status: AuthIdentityWorkflow["status"];
  sourceUserId: string;
  continueTarget?: AuthRedirectTarget | undefined;
  targetUserId?: string | undefined;
  targetLabel?: string | undefined;
  failureReason?: AuthIdentityFailureReason | undefined;
}): AuthIdentityWorkflow {
  return {
    kind: input.kind,
    status: input.status,
    sourceUserId: input.sourceUserId,
    message: createWorkflowMessage(input.kind, input.status, input.targetLabel),
    ...(input.continueTarget ? { continueTarget: input.continueTarget } : {}),
    ...(input.targetUserId ? { targetUserId: input.targetUserId } : {}),
    ...(input.targetLabel ? { targetLabel: input.targetLabel } : {}),
    ...(input.failureReason ? { failureReason: input.failureReason } : {}),
  };
}

function isMergeSampleIdentity(input: {
  phoneNumber?: string | undefined;
  account?: string | undefined;
}): boolean {
  return normalizePhoneNumber(input.phoneNumber ?? "") === "13800000001" || input.account === "minix-demo";
}

function resolveAuthStatus(method: LoginMethod): AuthStatus {
  return method === "guest" ? "guest" : "authenticated";
}

function resolveIdentity(payload: z.infer<typeof loginRequestSchema>, userId: string, method: LoginMethod): AuthIdentity {
  const guest = resolveAuthStatus(method) === "guest";
  return {
    userId,
    ...(guest ? { anonymous: true } : {}),
    ...(payload.platform === "wechat" || method === "wechat_code" ? { wechatBound: true } : {}),
    ...(method === "phone_code" || method === "password" ? { phoneBound: true } : {}),
  };
}

function resolveRedirectTarget(
  target?: z.infer<typeof loginRequestSchema>["redirectTarget"],
): AuthRedirectTarget | undefined {
  if (!target) {
    return undefined;
  }

  const nextTarget: AuthRedirectTarget = {};
  if (target.routeId) {
    nextTarget.routeId = target.routeId;
  }
  if (target.path) {
    nextTarget.path = target.path;
  }
  if (target.params) {
    nextTarget.params = target.params;
  }
  if (target.source) {
    nextTarget.source = target.source;
  }
  if (target.label) {
    nextTarget.label = target.label;
  }
  if (target.reason) {
    nextTarget.reason = target.reason;
  }
  if (target.forceReauth) {
    nextTarget.forceReauth = true;
  }

  return Object.keys(nextTarget).length > 0 ? nextTarget : undefined;
}

function resolveAbnormalLoginPrompt(
  payload: z.infer<typeof loginRequestSchema>,
  method: LoginMethod,
): AuthAbnormalLoginPrompt | undefined {
  const deviceId = payload.credential.deviceId ?? payload.riskContext?.deviceId;
  const suspicious =
    payload.riskContext?.scene === "suspicious-login" ||
    payload.riskContext?.frequencyKey === "abnormal-login" ||
    payload.riskContext?.ipRegion === "unusual-region" ||
    deviceId === "device-risk-review";

  if (!suspicious) {
    return undefined;
  }

  return {
    title: "Unusual sign-in detected",
    message:
      method === "guest"
        ? "This guest sign-in came from an unusual device context. Review the session before upgrading or binding the account."
        : "This sign-in came from an unusual device or region. Review the session details before continuing.",
    severity: "warning",
    acknowledgeRequired: true,
  };
}

function createAuthResponseFromSession(
  session: SessionRecord,
  requestUrl: string,
  options: {
    abnormalLoginPrompt?: AuthAbnormalLoginPrompt | undefined;
    identityWorkflow?: AuthIdentityWorkflow | undefined;
    redirectTarget?: AuthRedirectTarget | undefined;
  } = {},
): LoginResponse {
  return {
    userId: session.userId,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    profile: resolveProfileMedia(session.profile, requestUrl),
    session: {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      issuedAt: Date.now(),
      tokenType: "Bearer",
    },
    identity: session.identity,
    authStatus: session.authStatus,
    ...(session.loginMethod ? { loginMethod: session.loginMethod } : {}),
    ...(options.abnormalLoginPrompt ? { abnormalLoginPrompt: options.abnormalLoginPrompt } : {}),
    ...(options.identityWorkflow ? { identityWorkflow: options.identityWorkflow } : {}),
    ...(options.redirectTarget ? { redirectTarget: options.redirectTarget } : {}),
  };
}

function mergeUserStates(target: UserState, source: UserState): UserState {
  const mergedBookshelf = new Set<string>([...target.bookshelfNovelIds, ...source.bookshelfNovelIds]);
  return {
    ...(target.membershipPlanId ?? source.membershipPlanId
      ? { membershipPlanId: target.membershipPlanId ?? source.membershipPlanId }
      : {}),
    bookshelfNovelIds: mergedBookshelf,
    progressByNovelId: {
      ...source.progressByNovelId,
      ...target.progressByNovelId,
    },
    notificationReadAtById: {
      ...source.notificationReadAtById,
      ...target.notificationReadAtById,
    },
    feedbackDetailsById: {
      ...source.feedbackDetailsById,
      ...target.feedbackDetailsById,
    },
    ...(target.latestFeedbackTicketId ?? source.latestFeedbackTicketId
      ? { latestFeedbackTicketId: target.latestFeedbackTicketId ?? source.latestFeedbackTicketId }
      : {}),
    ...(target.latestPaidOrderId ?? source.latestPaidOrderId
      ? { latestPaidOrderId: target.latestPaidOrderId ?? source.latestPaidOrderId }
      : {}),
    ordersById: {
      ...source.ordersById,
      ...target.ordersById,
    },
    orderIdByIdempotencyKey: {
      ...source.orderIdByIdempotencyKey,
      ...target.orderIdByIdempotencyKey,
    },
    ...(target.boundPhoneNumber ?? source.boundPhoneNumber
      ? { boundPhoneNumber: target.boundPhoneNumber ?? source.boundPhoneNumber }
      : {}),
    ...(target.pendingIdentityWorkflow ?? source.pendingIdentityWorkflow
      ? { pendingIdentityWorkflow: target.pendingIdentityWorkflow ?? source.pendingIdentityWorkflow }
      : {}),
    ...(target.lastIdentityWorkflow ?? source.lastIdentityWorkflow
      ? { lastIdentityWorkflow: target.lastIdentityWorkflow ?? source.lastIdentityWorkflow }
      : {}),
  };
}

function jsonError(code: string, message: string, status: number, traceId: string) {
  return Response.json(
    { code, message },
    {
      status,
      headers: withTraceHeaders({}, traceId),
    },
  );
}

function getStore(env: ApiBindings | undefined, overrideStore?: ApiStore): ApiStore {
  if (overrideStore) {
    return overrideStore;
  }

  if (env?.MINIX_STORE) {
    return env.MINIX_STORE;
  }

  if (env?.DB) {
    return createD1ApiStore(env.DB);
  }

  return getGlobalMemoryApiStore();
}

async function parseJsonBody<T>(request: Request, schema: z.ZodSchema<T>, traceId: string): Promise<T | Response> {
  const body = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);
  if (!result.success) {
    return jsonError("BAD_REQUEST", result.error.issues[0]?.message ?? "Invalid request body", 400, traceId);
  }

  return result.data;
}

function parseQuery<T>(url: URL, schema: z.ZodSchema<T>, traceId: string): T | Response {
  const query = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(query);
  if (!result.success) {
    return jsonError("BAD_REQUEST", result.error.issues[0]?.message ?? "Invalid request query", 400, traceId);
  }

  return result.data;
}

function createUnauthorizedResponse(traceId: string) {
  return jsonError("UNAUTHORIZED", "Access token is missing, invalid, or expired.", 401, traceId);
}

function createSvgResponse(svg: string, traceId: string) {
  return new Response(svg, {
    status: 200,
    headers: withTraceHeaders({
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    }, traceId),
  });
}

function parseSvgAssetId(assetName: string): string | null {
  return assetName.endsWith(".svg") ? assetName.slice(0, -4) : null;
}

function resolveBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/.exec(header);
  return match?.[1] ?? null;
}

export interface CreateApiAppOptions {
  store?: ApiStore;
  allowedOrigins?: string[];
  authRateLimitConfig?: Partial<AuthRateLimitConfig>;
  authRateLimitStore?: RateLimitCounterStore;
}

function parseConfiguredCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function readConfiguredCorsOrigins(env?: ApiBindings): string[] {
  const envValue = env?.MINIX_CORS_ALLOWED_ORIGINS;
  if (envValue) {
    return parseConfiguredCorsOrigins(envValue);
  }

  if (typeof process === "undefined") {
    return [];
  }

  return parseConfiguredCorsOrigins(process.env?.MINIX_CORS_ALLOWED_ORIGINS);
}

function resolveAllowedCorsOrigin(origin: string | undefined, configuredOrigins: readonly string[]): string | null {
  if (!origin) {
    return null;
  }

  return configuredOrigins.includes(origin) ? origin : null;
}

function setAuthRateLimitHeaders(c: Context<{ Bindings: ApiBindings }>, decision: AuthRateLimitDecision) {
  c.header("X-RateLimit-Limit", String(decision.limit));
  c.header("X-RateLimit-Remaining", String(decision.remaining));
  c.header("X-RateLimit-Reset", String(decision.resetAt));

  if (decision.limited) {
    c.header("Retry-After", String(decision.retryAfterSeconds));
  }
}

function logAuthEvent(
  event: "login_rate_limited" | "refresh_rate_limited" | "login_failed" | "refresh_failed",
  detail: Record<string, string | number | undefined>,
) {
  console.warn("[minix-api:auth]", JSON.stringify({ event, ...detail }));
}

export function createApiApp(options: CreateApiAppOptions = {}) {
  const app = new Hono<{ Bindings: ApiBindings }>();
  const requireSession = async (
    c: Parameters<Parameters<typeof app.use>[1]>[0],
    next: Parameters<Parameters<typeof app.use>[1]>[1],
  ) => {
    const store = getStore(c.env, options.store);
    const token = resolveBearerToken(c.req.header("authorization"));
    if (!token) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    const session = await store.getSessionByAccessToken(token);
    if (!session) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    c.set("session", session);
    await next();
  };

  app.use("*", async (c, next) => {
    const traceId = resolveTraceId(c.req.header("x-trace-id"));
    c.set("traceId", traceId);
    const allowedOrigins = Array.from(
      new Set([...DEFAULT_ALLOWED_CORS_ORIGINS, ...readConfiguredCorsOrigins(c.env), ...(options.allowedOrigins ?? [])]),
    );
    const allowedOrigin = resolveAllowedCorsOrigin(c.req.header("origin"), allowedOrigins);

    if (c.req.method === "OPTIONS") {
      if (!allowedOrigin) {
        return new Response(null, { status: 403 });
      }

      return new Response(null, {
        status: 204,
        headers: withTraceHeaders({
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
          "Access-Control-Allow-Methods": CORS_ALLOW_METHODS,
          "Access-Control-Max-Age": CORS_MAX_AGE_SECONDS,
          Vary: "Origin",
        }, traceId),
      });
    }

    await next();

    c.header("X-Trace-Id", traceId);

    if (allowedOrigin) {
      c.header("Access-Control-Allow-Origin", allowedOrigin);
      c.header("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
      c.header("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
      c.header("Access-Control-Max-Age", CORS_MAX_AGE_SECONDS);
      c.header("Vary", "Origin");
    }
  });

  app.get("/", (c) =>
    c.json({
      service: "minix-api",
      status: "ok",
      version: "0.1.0",
    }),
  );

  app.get("/sample-assets/covers/:assetName", (c) => {
    const traceId = c.get("traceId");
    const assetId = parseSvgAssetId(c.req.param("assetName"));
    if (!assetId) {
      return jsonError("NOT_FOUND", "Sample cover asset not found.", 404, traceId);
    }

    const svg = renderSampleCoverAssetSvg(assetId);
    if (!svg) {
      return jsonError("NOT_FOUND", "Sample cover asset not found.", 404, traceId);
    }

    return createSvgResponse(svg, traceId);
  });

  app.get("/sample-assets/profiles/:assetName", (c) => {
    const traceId = c.get("traceId");
    const assetId = parseSvgAssetId(c.req.param("assetName"));
    if (!assetId) {
      return jsonError("NOT_FOUND", "Sample profile asset not found.", 404, traceId);
    }

    const svg = renderSampleProfileAssetSvg(assetId);
    if (!svg) {
      return jsonError("NOT_FOUND", "Sample profile asset not found.", 404, traceId);
    }

    return createSvgResponse(svg, traceId);
  });

  app.post("/auth/login", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, loginRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const clientId = resolveClientId(c.req.raw);
    const rateLimitDecision = await checkAuthRateLimit({
      action: "login",
      platform: payload.platform,
      clientId,
      env: c.env,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
    });
    setAuthRateLimitHeaders(c, rateLimitDecision);
    if (rateLimitDecision.limited) {
      logAuthEvent("login_rate_limited", {
        clientId,
        platform: payload.platform,
        retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return c.json(
        {
          code: "RATE_LIMITED",
          message: "Too many login attempts. Retry later.",
          retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
        },
        429,
      );
    }

    const loginMethod = resolveLoginMethod(payload);

    if (loginMethod === "wechat_code" && !payload.credential.code && !payload.credential.authCode) {
      logAuthEvent("login_failed", {
        clientId,
        platform: payload.platform,
        reason: "missing_platform_code",
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return jsonError("LOGIN_FAILED", "wechat login requires a platform code", 400, traceId);
    }

    if (loginMethod === "guest" && !payload.credential.anonymousId) {
      return jsonError("LOGIN_FAILED", "guest login requires an anonymous id", 400, traceId);
    }

    if (loginMethod === "phone_code" && (!payload.credential.phoneNumber || !payload.credential.verificationCode)) {
      return jsonError("LOGIN_FAILED", "phone verification login requires both phone number and verification code", 400, traceId);
    }

    if (loginMethod === "phone_code" && payload.credential.verificationCode !== DEMO_PHONE_VERIFICATION_CODE) {
      return jsonError("LOGIN_FAILED", "invalid phone verification code", 400, traceId);
    }

    if (loginMethod === "password" && (!(payload.credential.phoneNumber || payload.credential.account) || !payload.credential.password)) {
      return jsonError("LOGIN_FAILED", "password login requires an account identifier and password", 400, traceId);
    }

    if (loginMethod === "password" && payload.credential.password !== DEMO_PASSWORD) {
      return jsonError("LOGIN_FAILED", "invalid account or password", 400, traceId);
    }

    if (loginMethod === "oauth" && (!payload.credential.provider || !payload.credential.providerToken)) {
      return jsonError("LOGIN_FAILED", "third-party login requires both provider and provider token", 400, traceId);
    }

    if (loginMethod === "oauth") {
      return jsonError("PLATFORM_UNSUPPORTED", "third-party oauth login is reserved in the sample backend", 501, traceId);
    }

    const store = getStore(c.env, options.store);
    const userId = createUserIdFromLogin(payload, loginMethod);
    const session = await store.createSession({
      platform: payload.platform,
      userId,
      authStatus: resolveAuthStatus(loginMethod),
      identity: resolveIdentity(payload, userId, loginMethod),
      loginMethod,
    });
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const abnormalLoginPrompt = resolveAbnormalLoginPrompt(payload, loginMethod);
    const response: LoginResponse = {
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      profile: resolveProfileMedia(session.profile, c.req.url),
      session: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        issuedAt: Date.now(),
        tokenType: "Bearer",
      },
      identity: session.identity,
      authStatus: session.authStatus,
      ...(session.loginMethod ? { loginMethod: session.loginMethod } : {}),
      ...(abnormalLoginPrompt ? { abnormalLoginPrompt } : {}),
      ...(redirectTarget ? { redirectTarget } : {}),
    };

    return c.json(response);
  });

  app.post("/auth/refresh", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, refreshTokenRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const clientId = resolveClientId(c.req.raw);
    const rateLimitDecision = await checkAuthRateLimit({
      action: "refresh",
      platform: payload.platform,
      clientId,
      env: c.env,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
    });
    setAuthRateLimitHeaders(c, rateLimitDecision);
    if (rateLimitDecision.limited) {
      logAuthEvent("refresh_rate_limited", {
        clientId,
        platform: payload.platform,
        retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return c.json(
        {
          code: "RATE_LIMITED",
          message: "Too many refresh attempts. Retry later.",
          retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
        },
        429,
      );
    }

    const store = getStore(c.env, options.store);
    const session = await store.refreshSession(payload.platform, payload.refreshToken);
    if (!session) {
      logAuthEvent("refresh_failed", {
        clientId,
        platform: payload.platform,
        reason: "invalid_or_expired_refresh_token",
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return jsonError("UNAUTHORIZED", "Refresh token is invalid or expired.", 401, traceId);
    }

    const response: RefreshTokenResponse = {
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      profile: resolveProfileMedia(session.profile, c.req.url),
      session: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        issuedAt: Date.now(),
        tokenType: "Bearer",
      },
      identity: session.identity,
      authStatus: session.authStatus,
      ...(session.loginMethod ? { loginMethod: session.loginMethod } : {}),
    };

    return c.json(response);
  });

  app.post("/auth/logout", async (c) => {
    const store = getStore(c.env, options.store);
    const authHeader = c.req.header("authorization");
    const token = resolveBearerToken(authHeader);
    const body = await c.req.json().catch(() => undefined);
    const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined;
    await store.revokeSession({
      ...(token ? { accessToken: token } : {}),
      ...(refreshToken ? { refreshToken } : {}),
    });
    return c.json({ loggedOut: true });
  });

  app.use("/auth/identity/*", requireSession);

  app.post("/auth/identity/upgrade", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, identityUpgradeSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    if (session.authStatus !== "guest" && !session.identity.anonymous) {
      const workflow = createIdentityWorkflow({
        kind: "guest_upgrade",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: resolveRedirectTarget(payload.redirectTarget),
        failureReason: "guest_session_required",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow }));
    }

    if (payload.credential.method === "phone_code") {
      if (!payload.credential.phoneNumber || !payload.credential.verificationCode) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with phone verification requires phone number and verification code", 400, traceId);
      }

      if (payload.credential.verificationCode !== DEMO_PHONE_VERIFICATION_CODE) {
        const workflow = createIdentityWorkflow({
          kind: "guest_upgrade",
          status: "blocked",
          sourceUserId: session.userId,
          continueTarget: resolveRedirectTarget(payload.redirectTarget),
          failureReason: "verification_code_invalid",
        });
        return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow }));
      }
    }

    if (payload.credential.method === "password") {
      if ((!(payload.credential.account || payload.credential.phoneNumber)) || !payload.credential.password) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with password requires an account identifier and password", 400, traceId);
      }

      if (payload.credential.password !== DEMO_PASSWORD) {
        return jsonError("LOGIN_FAILED", "invalid account or password", 400, traceId);
      }
    }

    const store = getStore(c.env, options.store);
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const targetUserId = createUserIdFromUpgradeRequest(payload);
    const mergeCandidate = isMergeSampleIdentity(payload.credential);
    if (mergeCandidate && payload.mergeStrategy !== "merge") {
      const workflow = createIdentityWorkflow({
        kind: "guest_upgrade",
        status: "merge_required",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId,
        targetLabel: `account ${targetUserId}`,
        failureReason: "merge_confirmation_required",
      });
      const sourceState = await store.getUserState(session.userId);
      sourceState.pendingIdentityWorkflow = workflow;
      sourceState.lastIdentityWorkflow = workflow;
      if (payload.credential.phoneNumber) {
        sourceState.boundPhoneNumber = payload.credential.phoneNumber;
      }
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }));
    }

    const sourceState = await store.getUserState(session.userId);
    const targetState = await store.getUserState(targetUserId);
    const workflow = createIdentityWorkflow({
      kind: "guest_upgrade",
      status: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId,
      targetLabel: `account ${targetUserId}`,
    });
    const nextState = mergeUserStates(targetState, {
      ...sourceState,
      lastIdentityWorkflow: workflow,
      ...(payload.credential.phoneNumber ? { boundPhoneNumber: payload.credential.phoneNumber } : {}),
    });
    delete nextState.pendingIdentityWorkflow;
    nextState.lastIdentityWorkflow = workflow;
    if (payload.credential.phoneNumber) {
      nextState.boundPhoneNumber = payload.credential.phoneNumber;
    }
    await store.saveUserState(targetUserId, nextState);
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = workflow;
    await store.saveUserState(session.userId, sourceState);
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: targetUserId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        anonymous: false,
        phoneBound: Boolean(payload.credential.phoneNumber),
        wechatBound: session.platform === "wechat" || Boolean(session.identity.wechatBound),
      },
      loginMethod: payload.credential.method,
    });
    const response: IdentityTransitionResponse = {
      ...createAuthResponseFromSession(nextSession, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }),
      identityWorkflow: workflow,
    };
    return c.json(response);
  });

  app.post("/auth/identity/bind-phone", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, identityBindPhoneSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    if (!(session.identity.wechatBound || session.platform === "wechat")) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "wechat_binding_required",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    if (session.identity.phoneBound) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "conflict",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "phone_already_bound",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    if (payload.verificationCode !== DEMO_PHONE_VERIFICATION_CODE) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "verification_code_invalid",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    const store = getStore(c.env, options.store);
    const targetUserId = createUserIdFromCredential({
      method: "phone_code",
      phoneNumber: payload.phoneNumber,
    });
    const mergeCandidate = isMergeSampleIdentity({ phoneNumber: payload.phoneNumber }) && targetUserId !== session.userId;
    if (mergeCandidate && payload.mergeStrategy !== "merge") {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "merge_required",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId,
        targetLabel: `account ${targetUserId}`,
        failureReason: "merge_confirmation_required",
      });
      const sourceState = await store.getUserState(session.userId);
      sourceState.pendingIdentityWorkflow = workflow;
      sourceState.lastIdentityWorkflow = workflow;
      sourceState.boundPhoneNumber = payload.phoneNumber;
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }));
    }

    const sourceState = await store.getUserState(session.userId);
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = createIdentityWorkflow({
      kind: "phone_binding",
      status: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId: session.userId,
      targetLabel: `account ${session.userId}`,
    });
    sourceState.boundPhoneNumber = payload.phoneNumber;
    await store.saveUserState(session.userId, sourceState);
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: session.userId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        anonymous: false,
        phoneBound: true,
        wechatBound: true,
        ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
      },
      loginMethod: session.loginMethod ?? "wechat_code",
    });
    const workflow = sourceState.lastIdentityWorkflow;
    const response: IdentityTransitionResponse = {
      ...createAuthResponseFromSession(nextSession, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget,
      }),
      identityWorkflow: workflow,
    };
    return c.json(response);
  });

  app.post("/auth/identity/merge", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, identityMergeSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    if (!payload.confirm) {
      return jsonError("INVALID_ARGUMENT", "account merge requires explicit confirmation", 400, traceId);
    }

    const store = getStore(c.env, options.store);
    const sourceState = await store.getUserState(session.userId);
    const pendingWorkflow = sourceState.pendingIdentityWorkflow;
    if (!pendingWorkflow || pendingWorkflow.targetUserId !== payload.targetUserId) {
      const workflow = createIdentityWorkflow({
        kind: payload.workflowKind ?? "account_merge",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId: payload.targetUserId,
        targetLabel: `account ${payload.targetUserId}`,
        failureReason: "merge_target_mismatch",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    const targetState = await store.getUserState(payload.targetUserId);
    const workflow = createIdentityWorkflow({
      kind: "account_merge",
      status: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget ?? pendingWorkflow.continueTarget,
      targetUserId: payload.targetUserId,
      targetLabel: `account ${payload.targetUserId}`,
    });
    const nextState = mergeUserStates(targetState, {
      ...sourceState,
      lastIdentityWorkflow: workflow,
    });
    delete nextState.pendingIdentityWorkflow;
    nextState.lastIdentityWorkflow = workflow;
    await store.saveUserState(payload.targetUserId, nextState);
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = workflow;
    await store.saveUserState(session.userId, sourceState);
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: payload.targetUserId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        anonymous: false,
        ...((Boolean(nextState.boundPhoneNumber) || session.identity.phoneBound !== undefined)
          ? { phoneBound: Boolean(nextState.boundPhoneNumber) || Boolean(session.identity.phoneBound) }
          : {}),
        wechatBound: Boolean(session.identity.wechatBound || session.platform === "wechat"),
        ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
        mergedUserId: session.userId,
      },
      loginMethod: session.loginMethod ?? "wechat_code",
    });
    const response: IdentityTransitionResponse = {
      ...createAuthResponseFromSession(nextSession, c.req.url, {
        identityWorkflow: workflow,
        redirectTarget: redirectTarget ?? pendingWorkflow.continueTarget,
      }),
      identityWorkflow: workflow,
    };
    return c.json(response);
  });

  app.use("/items", requireSession);
  app.use("/feed", requireSession);
  app.use("/notifications", requireSession);
  app.use("/notifications/*", requireSession);
  app.use("/messages", requireSession);
  app.use("/messages/*", requireSession);
  app.use("/feedback", requireSession);
  app.use("/feedback/*", requireSession);
  app.use("/novels", requireSession);
  app.use("/novels/*", requireSession);
  app.use("/chapters", requireSession);
  app.use("/chapters/*", requireSession);
  app.use("/bookshelf", requireSession);
  app.use("/membership", requireSession);
  app.use("/membership/*", requireSession);
  app.use("/orders", requireSession);
  app.use("/orders/*", requireSession);
  app.use("/payments", requireSession);
  app.use("/payments/*", requireSession);
  app.use("/reading-progress", requireSession);
  app.use("/settings", requireSession);

  app.get("/me", async (c) => {
    const store = getStore(c.env, options.store);
    const token = resolveBearerToken(c.req.header("authorization"));
    if (!token) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    const session = await store.getSessionByAccessToken(token);
    if (!session) {
      return createUnauthorizedResponse(c.get("traceId"));
    }

    const userState = await store.getUserState(session.userId);
    return c.json(createCurrentUserResponse(session, userState, c.req.url));
  });

  app.get("/settings", async (c) => {
    const session = c.get("session");
    return c.json(createSettingsResponse(session, c.env?.MINIX_DEPLOY_ENV));
  });

  app.get("/items", (c) => {
    const url = new URL(c.req.url);
    const query = parseQuery(url, itemsQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    return c.json(listItems(query.page, query.pageSize));
  });

  app.get("/feed", (c) => {
    const query = parseQuery(new URL(c.req.url), feedQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    return c.json(listFeed(query));
  });

  app.get("/notifications", async (c) => {
    const query = parseQuery(new URL(c.req.url), notificationsQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(listNotifications(userState, query));
  });

  app.post("/notifications/mark-read", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, markNotificationsReadSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response = markNotificationsRead(userState, payload);
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.get("/messages/unread-badge", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(getUnreadBadge(userState));
  });

  app.get("/messages/thread", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), threadIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response = getMessageThread(userState, query.threadId);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }

    return c.json(response);
  });

  app.get("/feedback/bootstrap", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(createFeedbackBootstrapResponse(userState));
  });

  app.get("/feedback/ticket", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), feedbackTicketIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response = getFeedbackTicket(userState, query.ticketId);
    if (!response) {
      return jsonError("NOT_FOUND", "Feedback ticket not found.", 404, traceId);
    }

    return c.json(response);
  });

  app.post("/feedback", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, submitFeedbackSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const normalizeUploadAsset = (asset: z.infer<typeof uploadAssetSchema>): UploadAsset => ({
      assetId: asset.assetId,
      fileType: asset.fileType,
      fileName: asset.fileName,
      url: asset.url,
      ...(asset.thumbnailUrl !== undefined ? { thumbnailUrl: asset.thumbnailUrl } : {}),
      ...(asset.coverImageUrl !== undefined ? { coverImageUrl: asset.coverImageUrl } : {}),
      metadata: {
        sizeBytes: asset.metadata.sizeBytes,
        ...(asset.metadata.mimeType !== undefined ? { mimeType: asset.metadata.mimeType } : {}),
        ...(asset.metadata.width !== undefined ? { width: asset.metadata.width } : {}),
        ...(asset.metadata.height !== undefined ? { height: asset.metadata.height } : {}),
        ...(asset.metadata.durationSeconds !== undefined
          ? { durationSeconds: asset.metadata.durationSeconds }
          : {}),
        ...(asset.metadata.pageCount !== undefined ? { pageCount: asset.metadata.pageCount } : {}),
      },
    });
    const normalizedPayload: SubmitFeedbackRequest = {
      type: payload.type,
      categoryKey: payload.categoryKey,
      title: payload.title,
      description: payload.description,
      ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
      ...(payload.labels !== undefined ? { labels: payload.labels } : {}),
      ...(payload.revisitRequested !== undefined ? { revisitRequested: payload.revisitRequested } : {}),
      ...(payload.satisfactionScore !== undefined ? { satisfactionScore: payload.satisfactionScore } : {}),
      context: {
        sourcePage: payload.context.sourcePage,
        ...(payload.context.sourceRouteId !== undefined ? { sourceRouteId: payload.context.sourceRouteId } : {}),
        ...(payload.context.sourceLabel !== undefined ? { sourceLabel: payload.context.sourceLabel } : {}),
        ...(payload.context.userId !== undefined ? { userId: payload.context.userId } : {}),
        platform: payload.context.platform,
        appVersion: payload.context.appVersion,
        ...(payload.context.deviceSummary !== undefined ? { deviceSummary: payload.context.deviceSummary } : {}),
        screenshotAssets: payload.context.screenshotAssets.map(normalizeUploadAsset),
        attachmentAssets: payload.context.attachmentAssets.map(normalizeUploadAsset),
      },
    };
    const response = submitFeedbackTicket(session, userState, normalizedPayload);
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.get("/novels", async (c) => {
    const query = parseQuery(new URL(c.req.url), novelsQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const membershipActive = Boolean(userState.membershipPlanId);
    return c.json(listNovels(query, membershipActive, userState, c.req.url));
  });

  app.get("/novels/detail", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), novelIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const detail = NOVELS.find((item) => item.id === query.novelId);
    if (!detail) {
      return jsonError("NOT_FOUND", "Novel not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(resolveNovelDetail(detail, Boolean(userState.membershipPlanId), userState.bookshelfNovelIds, c.req.url));
  });

  app.get("/chapters", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), novelIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const response = CHAPTER_LISTS[query.novelId];
    if (!response) {
      return jsonError("NOT_FOUND", "Chapter list not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(resolveChapterList(response, Boolean(userState.membershipPlanId)));
  });

  app.get("/chapters/content", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), chapterIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const response = CHAPTER_CONTENT[query.chapterId];
    if (!response) {
      return jsonError("NOT_FOUND", "Chapter content not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(resolveChapterContent(response, Boolean(userState.membershipPlanId)));
  });

  app.get("/bookshelf", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(createBookshelf(userState, Boolean(userState.membershipPlanId), c.req.url));
  });

  app.post("/bookshelf", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, bookshelfMutationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const detail = NOVELS.find((item) => item.id === payload.novelId);
    if (!detail) {
      return jsonError("NOT_FOUND", "Novel not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    userState.bookshelfNovelIds.add(payload.novelId);
    await store.saveUserState(session.userId, userState);
    const updatedDetail = resolveNovelDetail(detail, Boolean(userState.membershipPlanId), userState.bookshelfNovelIds);

    const response: BookshelfMutationResponse = {
      novelId: payload.novelId,
      inBookshelf: true,
      bookshelfCount: updatedDetail.bookshelfCount ?? 0,
      items: createBookshelf(userState, Boolean(userState.membershipPlanId)).items,
    };

    return c.json(response);
  });

  app.delete("/bookshelf", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, bookshelfMutationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const detail = NOVELS.find((item) => item.id === payload.novelId);
    if (!detail) {
      return jsonError("NOT_FOUND", "Novel not found.", 404, traceId);
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    userState.bookshelfNovelIds.delete(payload.novelId);
    await store.saveUserState(session.userId, userState);
    const updatedDetail = resolveNovelDetail(detail, Boolean(userState.membershipPlanId), userState.bookshelfNovelIds);

    const response: BookshelfMutationResponse = {
      novelId: payload.novelId,
      inBookshelf: false,
      bookshelfCount: updatedDetail.bookshelfCount ?? 0,
      items: createBookshelf(userState, Boolean(userState.membershipPlanId)).items,
    };

    return c.json(response);
  });

  app.get("/membership", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(userState.membershipPlanId ? createMembershipOverview(userState.membershipPlanId) : DEFAULT_MEMBERSHIP_OVERVIEW);
  });

  app.post("/membership/purchase", async (c) => {
    const payload = await parseJsonBody(c.req.raw, purchaseMembershipSchema, c.get("traceId"));
    if (payload instanceof Response) {
      return payload;
    }
    const purchasePayload: PurchaseMembershipRequest = {
      planId: payload.planId,
      ...(payload.channel ? { channel: payload.channel } : {}),
      ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
      ...(payload.source ? { source: payload.source } : {}),
      ...(payload.novelId ? { novelId: payload.novelId } : {}),
      ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    };

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);

    const existingOrderId = purchasePayload.idempotencyKey ? userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey] : undefined;
    const existingOrder = existingOrderId ? userState.ordersById[existingOrderId] : undefined;
    if (existingOrder?.entitlement && "overview" in existingOrder.entitlement) {
      return c.json(
        createMembershipPurchaseResponse(
          {
            order: existingOrder.order,
            paymentIntent: existingOrder.paymentIntent,
            paymentResult: {
              ...existingOrder.paymentResult,
              duplicateProtected: true,
              message: "Idempotency key matched an existing paid order. Returning the stored result without another charge.",
            },
            entitlement: existingOrder.entitlement as MembershipEntitlement,
          },
          purchasePayload,
        ) satisfies PurchaseMembershipResponse,
      );
    }

    userState.membershipPlanId = purchasePayload.planId;
    const duplicateProtected = Boolean(userState.latestPaidOrderId);
    const orderDetail = createMembershipOrderDetail(session, purchasePayload, duplicateProtected);
    userState.ordersById[orderDetail.order.orderId] = orderDetail;
    userState.latestPaidOrderId = orderDetail.order.orderId;
    if (purchasePayload.idempotencyKey) {
      userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey] = orderDetail.order.orderId;
    }
    await store.saveUserState(session.userId, userState);

    return c.json(createMembershipPurchaseResponse(orderDetail, purchasePayload) satisfies PurchaseMembershipResponse);
  });

  app.get("/orders/detail", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), orderIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const orderDetail = userState.ordersById[query.orderId];
    if (!orderDetail) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    return c.json(orderDetail satisfies OrderDetailResponse);
  });

  app.get("/payments/result", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), orderIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const orderDetail = userState.ordersById[query.orderId];
    if (!orderDetail) {
      return jsonError("NOT_FOUND", "Payment result not found.", 404, traceId);
    }

    return c.json({
      ...orderDetail.paymentResult,
      polledAt: new Date().toISOString(),
    } satisfies PaymentResult);
  });

  app.get("/reading-progress", async (c) => {
    const query = parseQuery(new URL(c.req.url), novelIdQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response: LoadReadingProgressResponse = {
      progress: userState.progressByNovelId[query.novelId] ?? null,
    };
    return c.json(response);
  });

  app.post("/reading-progress", async (c) => {
    const payload = await parseJsonBody(c.req.raw, saveReadingProgressSchema, c.get("traceId"));
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const chapter = CHAPTER_CONTENT[payload.chapterId];
    const updatedAt = new Date().toISOString();
    userState.progressByNovelId[payload.novelId] = {
      novelId: payload.novelId,
      chapterId: payload.chapterId,
      progressPercent: payload.progressPercent,
      updatedAt,
      ...(chapter?.title ? { chapterTitle: chapter.title } : {}),
      ...(payload.pageIndex !== undefined ? { pageIndex: payload.pageIndex } : {}),
      ...(payload.scrollOffset !== undefined ? { scrollOffset: payload.scrollOffset } : {}),
    };
    await store.saveUserState(session.userId, userState);

    return c.json({
      saved: true,
      progress: {
        ...payload,
        updatedAt,
      },
    });
  });

  return app;
}
