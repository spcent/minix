import { Hono, type Context } from "hono";
import { z } from "zod";

import type {
  AccountOperationResponse,
  AddToBookshelfRequest,
  AuthAbnormalLoginPrompt,
  AuthCredentialProtection,
  AuthOAuthAuthorizeResponse,
  AuthOAuthCallbackResponse,
  AuthPhoneVerificationResponse,
  AuthIdentity,
  AuthIdentityFailureReason,
  AuthIdentityAuditRecord,
  AuthIdentityMergePreview,
  AuthIdentityWorkflow,
  AuthRedirectTarget,
  AuthRiskDecision,
  AuthStatus,
  AuthVerificationPurpose,
  BookshelfMutationResponse,
  ContentDetailResponse,
  ContentLifecycleMutationResponse,
  FeedbackRevisitRequest,
  FeedbackRevisitResponse,
  FeedbackTicketDetailResponse,
  IdentityBindPhoneRequest,
  IdentityMergeRequest,
  IdentityTransitionResponse,
  IdentityUpgradeRequest,
  LoadReadingProgressResponse,
  OrderDetailResponse,
  LoginMethod,
  LoginResponse,
  MarkThreadReadRequest,
  MembershipEntitlement,
  OrderOperationRequest,
  PaymentCallbackRequest,
  PaymentResult,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  RefreshTokenResponse,
  RemoveFromBookshelfRequest,
  SaveReadingProgressRequest,
  SendMessageRequest,
  SendMessageResponse,
  SharePrepareRequest,
  SharePrepareResponse,
  ShareReturnRecognitionRequest,
  ShareReturnRecognitionResponse,
  SubmitFeedbackRequest,
  UploadAsset,
  UploadCancelRequest,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadRetryRequest,
  UserRelationMutationResponse,
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
  createPaymentOperationResult,
  createSettingsResponse,
  createSharePrepareResponse,
  createUploadPipelineResponse,
  cancelUploadPipeline,
  deriveReturnTarget,
  getManagedContentDetail,
  getMessageThread,
  getUnreadBadge,
  getFeedbackTicket,
  revisitFeedbackTicket,
  applyManagedContentLifecycle,
  listFeed,
  listItems,
  listNotifications,
  listNovels,
  markThreadRead,
  submitFeedbackTicket,
  markNotificationsRead,
  recognizeShareReturn,
  retryUploadPipeline,
  resolveChapterContent,
  resolveChapterList,
  resolveNovelDetail,
  sendThreadMessage,
} from "./data";
import { checkAuthRateLimit, resolveClientId, type AuthRateLimitConfig, type AuthRateLimitDecision, type RateLimitCounterStore } from "./rate-limit";
import { renderSampleCoverAssetSvg, renderSampleProfileAssetSvg, resolveProfileMedia } from "./sample-assets";
import { createD1ApiStore } from "./store.d1";
import { getGlobalMemoryApiStore } from "./store";
import type { ApiBindings, ApiStore, AuthSecurityState, SessionRecord, UserState } from "./types";

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
    providerUserId: z.string().min(1).optional(),
    oauthState: z.string().min(1).optional(),
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

const authRiskContextSchema = z
  .object({
    deviceId: z.string().min(1).optional(),
    userAgent: z.string().min(1).optional(),
    ipRegion: z.string().min(1).optional(),
    frequencyKey: z.string().min(1).optional(),
    scene: z.string().min(1).optional(),
  })
  .optional();

const phoneVerificationRequestSchema = z.object({
  phoneNumber: z.string().min(1),
  purpose: z.enum(["login", "guest_upgrade", "phone_binding", "change_phone", "password_reset"]),
  deviceId: z.string().min(1).optional(),
  riskContext: authRiskContextSchema,
});

const passwordCredentialSchema = z.object({
  account: z.string().min(1).optional(),
  phoneNumber: z.string().min(1).optional(),
  password: z.string().min(8),
  verificationCode: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),
});

const oauthAuthorizeSchema = z.object({
  provider: z.string().min(1),
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
  deviceId: z.string().min(1).optional(),
});

const oauthCallbackSchema = z.object({
  provider: z.string().min(1),
  state: z.string().min(1),
  providerToken: z.string().min(8),
  providerUserId: z.string().min(1),
  platform: z.enum(["wechat", "h5"]),
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

const contentIdQuerySchema = z.object({
  contentId: z.string().min(1),
});

const contentLifecycleMutationSchema = z.object({
  contentId: z.string().min(1),
  action: z.enum([
    "publish",
    "update",
    "archive",
    "delete",
    "restore",
    "submit_review",
    "approve_review",
    "reject_review",
    "change_visibility",
  ]),
  visibility: z.enum(["public", "login_required", "member_only", "purchased_only"]).optional(),
  reviewMessage: z.string().min(1).max(280).optional(),
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
  paymentScenario: z.enum(["instant_success", "pending"]).optional(),
  idempotencyKey: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  novelId: z.string().min(1).optional(),
  chapterId: z.string().min(1).optional(),
});

const orderOperationSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(1).optional(),
});

const paymentCallbackSchema = z.object({
  orderId: z.string().min(1),
  outcome: z.enum(["success", "failure", "cancelled"]),
  verified: z.boolean().optional(),
  callbackReference: z.string().min(1).optional(),
});

const orderIdQuerySchema = z.object({
  orderId: z.string().min(1),
});

const threadIdQuerySchema = z.object({
  threadId: z.string().min(1),
});

const updateAccountProfileSchema = z.object({
  nickname: z.string().min(1).max(32).optional(),
  region: z.string().min(1).max(64).optional(),
  bio: z.string().min(1).max(160).optional(),
});

const changeAccountPhoneSchema = z.object({
  phoneNumber: z.string().min(1),
  verificationCode: z.string().min(1),
});

const accountUnbindSchema = z.object({
  provider: z.literal("wechat"),
});

const accountCancellationSchema = z.object({
  confirm: z.literal(true),
});

const relationActionSchema = z.object({
  targetUserId: z.string().min(1),
  action: z.enum(["follow", "unfollow", "block", "unblock", "set_remark", "clear_remark"]),
  remarkName: z.string().min(1).max(40).optional(),
});

const sendMessageSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1),
});

const markThreadReadSchema = z.object({
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

const uploadGovernanceSchema = z.object({
  maxSizeBytes: z.number().int().positive(),
  acceptedFileTypes: z.array(z.enum(["image", "audio", "video", "pdf", "avatar", "attachment"])).min(1),
  sensitiveReviewRequired: z.boolean(),
  expiresInDays: z.number().int().positive().optional(),
});

const uploadProgressSchema = z.object({
  completedBytes: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

const uploadLifecycleSchema = z.object({
  backendBacked: z.boolean(),
  retentionStatus: z.enum(["active", "scheduled_cleanup", "expired"]),
  retryCount: z.number().int().nonnegative(),
  canRetry: z.boolean(),
  canCancel: z.boolean(),
  lastTransitionAt: z.string().min(1).optional(),
  expiresAt: z.string().min(1).optional(),
});

const uploadTaskSchema = z.object({
  taskId: z.string().min(1),
  scenario: z.enum(["content", "avatar", "attachment"]),
  fileType: z.enum(["image", "audio", "video", "pdf", "avatar", "attachment"]),
  stage: z.enum(["idle", "choosing", "compressing", "chunking_reserved", "uploading", "reviewing", "completed", "failed", "canceled"]),
  fileName: z.string().min(1).optional(),
  progress: uploadProgressSchema,
  chunkingReserved: z.boolean(),
  governance: uploadGovernanceSchema,
  reviewStatus: z.enum(["not_required", "pending", "approved", "rejected"]),
  reviewMessage: z.string().min(1).optional(),
  lifecycle: uploadLifecycleSchema,
});

const uploadErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  recoverable: z.boolean(),
  retryable: z.boolean(),
  stage: z.enum(["idle", "choosing", "compressing", "chunking_reserved", "uploading", "reviewing", "completed", "failed", "canceled"]),
});

const uploadSelectionResultSchema = z.object({
  uploadTask: uploadTaskSchema,
  uploadAsset: uploadAssetSchema.optional(),
  uploadError: uploadErrorSchema.optional(),
});

const uploadPipelineRequestSchema = z.object({
  scenario: z.enum(["content", "avatar", "attachment"]),
  selection: uploadSelectionResultSchema,
});

const uploadRetrySchema = z.object({
  taskId: z.string().min(1),
});

const uploadCancelSchema = z.object({
  taskId: z.string().min(1),
  reason: z.string().min(1).optional(),
});

const shareRedirectTargetSchema = z.object({
  routeId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  source: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  reason: z.enum(["auth-required", "session-expired", "force-relogin"]).optional(),
  forceReauth: z.boolean().optional(),
});

const shareLandingTargetSchema = z.object({
  routeId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  shortLink: z.string().min(1).optional(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  channelMarker: z.string().min(1).optional(),
  authRedirect: shareRedirectTargetSchema.optional(),
});

const sharePayloadSchema = z.object({
  scenario: z.enum(["page", "content", "invite", "poster"]),
  title: z.string().min(1),
  summary: z.string().min(1).optional(),
  coverUrl: z.string().min(1).optional(),
  landingPath: z.string().min(1).optional(),
  landingUrl: z.string().min(1).optional(),
  shortLink: z.string().min(1).optional(),
  posterImageUrl: z.string().min(1).optional(),
  trackingParams: z.record(z.string(), z.string()),
  channelMarker: z.string().min(1).optional(),
  contentId: z.string().min(1).optional(),
  inviteCode: z.string().min(1).optional(),
  shareToken: z.string().min(1).optional(),
  landingTarget: shareLandingTargetSchema.optional(),
  returnTarget: shareRedirectTargetSchema.optional(),
});

const shareChannelSchema = z.object({
  kind: z.enum(["wechat_session", "wechat_moments", "copy_link", "poster_image", "short_link"]),
  label: z.string().min(1),
  executable: z.boolean(),
  channelMarker: z.string().min(1).optional(),
});

const shareAttributionSchema = z.object({
  attributionId: z.string().min(1).optional(),
  channelMarker: z.string().min(1).optional(),
  inviteBindingEnabled: z.boolean(),
  returnFlowRecognized: z.boolean(),
  shareCount: z.number().int().nonnegative(),
  clickCount: z.number().int().nonnegative(),
  conversionCount: z.number().int().nonnegative(),
  preparedAt: z.string().min(1).optional(),
  lastSharedAt: z.string().min(1).optional(),
  lastClickAt: z.string().min(1).optional(),
  lastConversionAt: z.string().min(1).optional(),
  lastReturnAt: z.string().min(1).optional(),
  lastLandingPath: z.string().min(1).optional(),
  inviteBoundUserId: z.string().min(1).optional(),
  returnTarget: shareRedirectTargetSchema.optional(),
});

const sharePrepareSchema = z.object({
  sharePayload: sharePayloadSchema,
  shareChannel: shareChannelSchema,
  shareAttribution: shareAttributionSchema,
  redirectTarget: shareRedirectTargetSchema.optional(),
});

const shareReturnRecognitionSchema = z.object({
  attributionId: z.string().min(1),
  outcome: z.enum(["click", "return", "conversion"]),
  recognizedPath: z.string().min(1).optional(),
  recognizedUserId: z.string().min(1).optional(),
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

const revisitFeedbackSchema = z.object({
  ticketId: z.string().min(1),
  userMessage: z.string().min(1).optional(),
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
const PHONE_VERIFICATION_TTL_MS = 5 * 60 * 1000;
const PHONE_VERIFICATION_RETRY_AFTER_SECONDS = 60;
const PHONE_VERIFICATION_MAX_ATTEMPTS = 3;
const PASSWORD_MAX_FAILED_ATTEMPTS = 3;
const PASSWORD_LOCK_MS = 15 * 60 * 1000;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

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

function maskPhoneNumber(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (normalized.length < 7) {
    return phoneNumber;
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
}

function createAuthSecurityState(): AuthSecurityState {
  return {
    phoneVerificationsById: {},
    latestVerificationIdByPhonePurpose: {},
    passwordCredentialsBySubject: {},
    oauthStatesByState: {},
    oauthCredentialsByProviderSubject: {},
    credentialProtectionBySubject: {},
  };
}

function ensureAuthSecurityState(userState: UserState): AuthSecurityState {
  userState.authSecurity ??= createAuthSecurityState();
  userState.authSecurity.phoneVerificationsById ??= {};
  userState.authSecurity.latestVerificationIdByPhonePurpose ??= {};
  userState.authSecurity.passwordCredentialsBySubject ??= {};
  userState.authSecurity.oauthStatesByState ??= {};
  userState.authSecurity.oauthCredentialsByProviderSubject ??= {};
  userState.authSecurity.credentialProtectionBySubject ??= {};
  return userState.authSecurity;
}

function createRandomCode(): string {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String((value[0] ?? 0) % 1_000_000).padStart(6, "0");
}

function createRandomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashSecret(secret: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${secret}`);
  return toHex(await crypto.subtle.digest("SHA-256", bytes));
}

function createCredentialSubject(input: { account?: string | undefined; phoneNumber?: string | undefined }): string | null {
  if (input.phoneNumber) {
    const normalized = normalizePhoneNumber(input.phoneNumber);
    return normalized ? `phone:${normalized}` : null;
  }

  if (input.account) {
    return `account:${sanitizeUserKey(input.account.toLowerCase())}`;
  }

  return null;
}

function createPhonePurposeKey(phoneNumber: string, purpose: AuthVerificationPurpose): string {
  return `${normalizePhoneNumber(phoneNumber)}:${purpose}`;
}

function createOAuthSubject(provider: string, providerUserId: string): string {
  return `${sanitizeUserKey(provider.toLowerCase())}:${sanitizeUserKey(providerUserId)}`;
}

function createGuestUserId(anonymousId?: string): string {
  return anonymousId ? `guest_${sanitizeUserKey(anonymousId).slice(0, 32)}` : "guest_minix_demo";
}

function normalizeUploadAsset(asset: z.infer<typeof uploadAssetSchema>): UploadAsset {
  return {
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
  };
}

function normalizeUploadPipelineRequest(
  payload: z.infer<typeof uploadPipelineRequestSchema>,
): UploadPipelineRequest {
  return {
    scenario: payload.scenario,
    selection: {
      uploadTask: {
        taskId: payload.selection.uploadTask.taskId,
        scenario: payload.selection.uploadTask.scenario,
        fileType: payload.selection.uploadTask.fileType,
        stage: payload.selection.uploadTask.stage,
        ...(payload.selection.uploadTask.fileName !== undefined
          ? { fileName: payload.selection.uploadTask.fileName }
          : {}),
        progress: {
          completedBytes: payload.selection.uploadTask.progress.completedBytes,
          totalBytes: payload.selection.uploadTask.progress.totalBytes,
          percentage: payload.selection.uploadTask.progress.percentage,
        },
        chunkingReserved: payload.selection.uploadTask.chunkingReserved,
        governance: {
          maxSizeBytes: payload.selection.uploadTask.governance.maxSizeBytes,
          acceptedFileTypes: [...payload.selection.uploadTask.governance.acceptedFileTypes],
          sensitiveReviewRequired: payload.selection.uploadTask.governance.sensitiveReviewRequired,
          ...(payload.selection.uploadTask.governance.expiresInDays !== undefined
            ? { expiresInDays: payload.selection.uploadTask.governance.expiresInDays }
            : {}),
        },
        reviewStatus: payload.selection.uploadTask.reviewStatus,
        ...(payload.selection.uploadTask.reviewMessage !== undefined
          ? { reviewMessage: payload.selection.uploadTask.reviewMessage }
          : {}),
        lifecycle: {
          backendBacked: payload.selection.uploadTask.lifecycle.backendBacked,
          retentionStatus: payload.selection.uploadTask.lifecycle.retentionStatus,
          retryCount: payload.selection.uploadTask.lifecycle.retryCount,
          canRetry: payload.selection.uploadTask.lifecycle.canRetry,
          canCancel: payload.selection.uploadTask.lifecycle.canCancel,
          ...(payload.selection.uploadTask.lifecycle.lastTransitionAt !== undefined
            ? { lastTransitionAt: payload.selection.uploadTask.lifecycle.lastTransitionAt }
            : {}),
          ...(payload.selection.uploadTask.lifecycle.expiresAt !== undefined
            ? { expiresAt: payload.selection.uploadTask.lifecycle.expiresAt }
            : {}),
        },
      },
      ...(payload.selection.uploadAsset !== undefined
        ? { uploadAsset: normalizeUploadAsset(payload.selection.uploadAsset) }
        : {}),
      ...(payload.selection.uploadError !== undefined
        ? {
            uploadError: {
              code: payload.selection.uploadError.code,
              message: payload.selection.uploadError.message,
              recoverable: payload.selection.uploadError.recoverable,
              retryable: payload.selection.uploadError.retryable,
              stage: payload.selection.uploadError.stage,
            },
          }
        : {}),
    },
  };
}

function normalizeSharePrepareRequest(payload: z.infer<typeof sharePrepareSchema>): SharePrepareRequest {
  const normalizeRedirectTarget = (
    value:
      | z.infer<typeof shareRedirectTargetSchema>
      | undefined,
  ) =>
    value
      ? {
          ...(value.routeId !== undefined ? { routeId: value.routeId } : {}),
          ...(value.path !== undefined ? { path: value.path } : {}),
          ...(value.params !== undefined ? { params: value.params } : {}),
          ...(value.source !== undefined ? { source: value.source } : {}),
          ...(value.label !== undefined ? { label: value.label } : {}),
          ...(value.reason !== undefined ? { reason: value.reason } : {}),
          ...(value.forceReauth !== undefined ? { forceReauth: value.forceReauth } : {}),
        }
      : undefined;
  const landingAuthRedirect = normalizeRedirectTarget(payload.sharePayload.landingTarget?.authRedirect);
  const landingTarget = payload.sharePayload.landingTarget
    ? {
        ...(payload.sharePayload.landingTarget.routeId !== undefined
          ? { routeId: payload.sharePayload.landingTarget.routeId }
          : {}),
        ...(payload.sharePayload.landingTarget.path !== undefined ? { path: payload.sharePayload.landingTarget.path } : {}),
        ...(payload.sharePayload.landingTarget.url !== undefined ? { url: payload.sharePayload.landingTarget.url } : {}),
        ...(payload.sharePayload.landingTarget.shortLink !== undefined
          ? { shortLink: payload.sharePayload.landingTarget.shortLink }
          : {}),
        ...(payload.sharePayload.landingTarget.params !== undefined ? { params: payload.sharePayload.landingTarget.params } : {}),
        ...(payload.sharePayload.landingTarget.channelMarker !== undefined
          ? { channelMarker: payload.sharePayload.landingTarget.channelMarker }
          : {}),
        ...(landingAuthRedirect !== undefined ? { authRedirect: landingAuthRedirect } : {}),
      }
    : undefined;
  const returnTarget = normalizeRedirectTarget(payload.sharePayload.returnTarget);
  const attributionReturnTarget = normalizeRedirectTarget(payload.shareAttribution.returnTarget);
  const redirectTarget = normalizeRedirectTarget(payload.redirectTarget);

  return {
    sharePayload: {
      scenario: payload.sharePayload.scenario,
      title: payload.sharePayload.title,
      ...(payload.sharePayload.summary !== undefined ? { summary: payload.sharePayload.summary } : {}),
      ...(payload.sharePayload.coverUrl !== undefined ? { coverUrl: payload.sharePayload.coverUrl } : {}),
      ...(payload.sharePayload.landingPath !== undefined ? { landingPath: payload.sharePayload.landingPath } : {}),
      ...(payload.sharePayload.landingUrl !== undefined ? { landingUrl: payload.sharePayload.landingUrl } : {}),
      ...(payload.sharePayload.shortLink !== undefined ? { shortLink: payload.sharePayload.shortLink } : {}),
      ...(payload.sharePayload.posterImageUrl !== undefined
        ? { posterImageUrl: payload.sharePayload.posterImageUrl }
        : {}),
      trackingParams: payload.sharePayload.trackingParams,
      ...(payload.sharePayload.channelMarker !== undefined ? { channelMarker: payload.sharePayload.channelMarker } : {}),
      ...(payload.sharePayload.contentId !== undefined ? { contentId: payload.sharePayload.contentId } : {}),
      ...(payload.sharePayload.inviteCode !== undefined ? { inviteCode: payload.sharePayload.inviteCode } : {}),
      ...(payload.sharePayload.shareToken !== undefined ? { shareToken: payload.sharePayload.shareToken } : {}),
      ...(landingTarget !== undefined ? { landingTarget } : {}),
      ...(returnTarget !== undefined ? { returnTarget } : {}),
    },
    shareChannel: {
      kind: payload.shareChannel.kind,
      label: payload.shareChannel.label,
      executable: payload.shareChannel.executable,
      ...(payload.shareChannel.channelMarker !== undefined ? { channelMarker: payload.shareChannel.channelMarker } : {}),
    },
    shareAttribution: {
      ...(payload.shareAttribution.attributionId !== undefined ? { attributionId: payload.shareAttribution.attributionId } : {}),
      ...(payload.shareAttribution.channelMarker !== undefined ? { channelMarker: payload.shareAttribution.channelMarker } : {}),
      inviteBindingEnabled: payload.shareAttribution.inviteBindingEnabled,
      returnFlowRecognized: payload.shareAttribution.returnFlowRecognized,
      shareCount: payload.shareAttribution.shareCount,
      clickCount: payload.shareAttribution.clickCount,
      conversionCount: payload.shareAttribution.conversionCount,
      ...(payload.shareAttribution.preparedAt !== undefined ? { preparedAt: payload.shareAttribution.preparedAt } : {}),
      ...(payload.shareAttribution.lastSharedAt !== undefined ? { lastSharedAt: payload.shareAttribution.lastSharedAt } : {}),
      ...(payload.shareAttribution.lastClickAt !== undefined ? { lastClickAt: payload.shareAttribution.lastClickAt } : {}),
      ...(payload.shareAttribution.lastConversionAt !== undefined
        ? { lastConversionAt: payload.shareAttribution.lastConversionAt }
        : {}),
      ...(payload.shareAttribution.lastReturnAt !== undefined ? { lastReturnAt: payload.shareAttribution.lastReturnAt } : {}),
      ...(payload.shareAttribution.lastLandingPath !== undefined
        ? { lastLandingPath: payload.shareAttribution.lastLandingPath }
        : {}),
      ...(payload.shareAttribution.inviteBoundUserId !== undefined
        ? { inviteBoundUserId: payload.shareAttribution.inviteBoundUserId }
        : {}),
      ...(attributionReturnTarget !== undefined ? { returnTarget: attributionReturnTarget } : {}),
    },
    ...(redirectTarget !== undefined ? { redirectTarget } : {}),
  };
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
    case "oauth":
      return payload.credential.provider && payload.credential.providerUserId
        ? `user_oauth_${sanitizeUserKey(payload.credential.provider.toLowerCase())}_${sanitizeUserKey(payload.credential.providerUserId)}`
        : "user_oauth_pending";
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

function countRecordValues(record: Record<string, unknown> | undefined): number {
  return record ? Object.keys(record).length : 0;
}

function createMergePreview(input: {
  sourceUserId: string;
  targetUserId: string;
  targetLabel: string;
  sourceState: UserState;
  targetState: UserState;
  requiresConfirmation?: boolean | undefined;
  recoveryMessage?: string | undefined;
}): AuthIdentityMergePreview {
  const sourceMessageCount = Object.values(input.sourceState.threadMessagesByThreadId).reduce((sum, items) => sum + items.length, 0);
  const targetMessageCount = Object.values(input.targetState.threadMessagesByThreadId).reduce((sum, items) => sum + items.length, 0);
  const sourceFeedbackCount = countRecordValues(input.sourceState.feedbackDetailsById);
  const targetFeedbackCount = countRecordValues(input.targetState.feedbackDetailsById);
  const sourceContentCount = countRecordValues(input.sourceState.managedContentById);
  const targetContentCount = countRecordValues(input.targetState.managedContentById);
  const sourceAssetCount = countRecordValues(input.sourceState.uploadsByTaskId);
  const targetAssetCount = countRecordValues(input.targetState.uploadsByTaskId);

  return {
    sourceUserId: input.sourceUserId,
    targetUserId: input.targetUserId,
    targetLabel: input.targetLabel,
    requiresConfirmation: input.requiresConfirmation ?? true,
    canRollback: true,
    recoveryMessage: input.recoveryMessage ?? "If confirmation fails, the source session remains unchanged and can retry the merge preview.",
    impacts: [
      {
        key: "assets",
        label: "Uploaded assets",
        sourceCount: sourceAssetCount,
        targetCount: targetAssetCount,
        mergedCount: sourceAssetCount + targetAssetCount,
        message: "Uploaded assets are combined and keep their existing task ids.",
      },
      {
        key: "messages",
        label: "Message threads",
        sourceCount: sourceMessageCount,
        targetCount: targetMessageCount,
        mergedCount: sourceMessageCount + targetMessageCount,
        message: "Thread read state and outbound message history are merged into the target account.",
      },
      {
        key: "feedback",
        label: "Feedback tickets",
        sourceCount: sourceFeedbackCount,
        targetCount: targetFeedbackCount,
        mergedCount: sourceFeedbackCount + targetFeedbackCount,
        message: "Feedback tickets and latest support context are preserved.",
      },
      {
        key: "content",
        label: "Managed content",
        sourceCount: sourceContentCount,
        targetCount: targetContentCount,
        mergedCount: sourceContentCount + targetContentCount,
        message: "Managed content lifecycle state follows the target account after merge.",
      },
      {
        key: "relationships",
        label: "Relationships",
        sourceCount: input.sourceState.relationTarget ? 1 : 0,
        targetCount: input.targetState.relationTarget ? 1 : 0,
        mergedCount: input.targetState.relationTarget || input.sourceState.relationTarget ? 1 : 0,
        message: "Relationship summary prefers the target account and backfills missing source state.",
      },
    ],
  };
}

function createIdentityAuditRecord(input: {
  action: AuthIdentityAuditRecord["action"];
  workflowId: string;
  actorUserId: string;
  sourceUserId: string;
  targetUserId?: string | undefined;
  message: string;
}): AuthIdentityAuditRecord {
  return {
    eventId: createRandomId("identity_audit"),
    action: input.action,
    workflowId: input.workflowId,
    actorUserId: input.actorUserId,
    sourceUserId: input.sourceUserId,
    ...(input.targetUserId ? { targetUserId: input.targetUserId } : {}),
    message: input.message,
    createdAt: new Date().toISOString(),
  };
}

function createIdentityWorkflow(input: {
  kind: AuthIdentityWorkflow["kind"];
  status: AuthIdentityWorkflow["status"];
  workflowId?: string | undefined;
  stage?: AuthIdentityWorkflow["stage"];
  sourceUserId: string;
  continueTarget?: AuthRedirectTarget | undefined;
  targetUserId?: string | undefined;
  targetLabel?: string | undefined;
  failureReason?: AuthIdentityFailureReason | undefined;
  mergePreview?: AuthIdentityMergePreview | undefined;
  audit?: AuthIdentityAuditRecord[] | undefined;
}): AuthIdentityWorkflow {
  return {
    kind: input.kind,
    status: input.status,
    ...(input.workflowId ? { workflowId: input.workflowId } : {}),
    ...(input.stage ? { stage: input.stage } : {}),
    sourceUserId: input.sourceUserId,
    message: createWorkflowMessage(input.kind, input.status, input.targetLabel),
    ...(input.continueTarget ? { continueTarget: input.continueTarget } : {}),
    ...(input.targetUserId ? { targetUserId: input.targetUserId } : {}),
    ...(input.targetLabel ? { targetLabel: input.targetLabel } : {}),
    ...(input.failureReason ? { failureReason: input.failureReason } : {}),
    ...(input.mergePreview ? { mergePreview: input.mergePreview } : {}),
    ...(input.audit ? { audit: input.audit } : {}),
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
    ...(method === "oauth" && payload.credential.provider?.toLowerCase().includes("wechat") ? { wechatBound: true } : {}),
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

function resolveRiskDecision(input: {
  credentialDeviceId?: string | undefined;
  riskContext?: z.infer<typeof authRiskContextSchema>;
}): AuthRiskDecision {
  const deviceId = input.credentialDeviceId ?? input.riskContext?.deviceId;
  const suspicious =
    input.riskContext?.scene === "suspicious-login" ||
    input.riskContext?.frequencyKey === "abnormal-login" ||
    input.riskContext?.ipRegion === "unusual-region" ||
    deviceId === "device-risk-review";

  return {
    ...(deviceId ? { deviceId } : {}),
    ...(input.riskContext?.frequencyKey ? { frequencyKey: input.riskContext.frequencyKey } : {}),
    ...(input.riskContext?.scene ? { scene: input.riskContext.scene } : {}),
    level: suspicious ? "review" : "allow",
    ...(suspicious ? { reason: "unusual_device_or_region" } : {}),
  };
}

function createAuthResponseFromSession(
  session: SessionRecord,
  requestUrl: string,
  options: {
    abnormalLoginPrompt?: AuthAbnormalLoginPrompt | undefined;
    credentialProtection?: AuthCredentialProtection | undefined;
    identityWorkflow?: AuthIdentityWorkflow | undefined;
    redirectTarget?: AuthRedirectTarget | undefined;
    riskDecision?: AuthRiskDecision | undefined;
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
    ...(options.credentialProtection ? { credentialProtection: options.credentialProtection } : {}),
    ...(options.identityWorkflow ? { identityWorkflow: options.identityWorkflow } : {}),
    ...(options.redirectTarget ? { redirectTarget: options.redirectTarget } : {}),
    ...(options.riskDecision ? { riskDecision: options.riskDecision } : {}),
  };
}

async function createPhoneVerificationChallenge(input: {
  userState: UserState;
  phoneNumber: string;
  purpose: AuthVerificationPurpose;
  deviceId?: string | undefined;
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
  security.latestVerificationIdByPhonePurpose[createPhonePurposeKey(input.phoneNumber, input.purpose)] = verificationId;
  return { code, verificationId, expiresAt };
}

async function consumePhoneVerification(input: {
  userState: UserState;
  phoneNumber: string;
  purpose: AuthVerificationPurpose;
  verificationCode: string;
  now: number;
}): Promise<{ ok: true } | { ok: false; status: 400 | 423; message: string; protection: AuthCredentialProtection }> {
  const security = ensureAuthSecurityState(input.userState);
  const verificationId = security.latestVerificationIdByPhonePurpose[createPhonePurposeKey(input.phoneNumber, input.purpose)];
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
      protection: { failureReason: "verification_code_locked", remainingAttempts: 0, lockedUntil: record.expiresAt },
    };
  }

  const inputHash = await hashSecret(input.verificationCode, record.salt);
  if (inputHash !== record.codeHash) {
    record.attempts += 1;
    const remainingAttempts = Math.max(0, record.maxAttempts - record.attempts);
    return {
      ok: false,
      status: remainingAttempts > 0 ? 400 : 423,
      message: remainingAttempts > 0 ? "invalid phone verification code" : "phone verification is locked after too many failed attempts",
      protection: {
        failureReason: remainingAttempts > 0 ? "verification_code_invalid" : "verification_code_locked",
        remainingAttempts,
        ...(remainingAttempts === 0 ? { lockedUntil: record.expiresAt } : {}),
      },
    };
  }

  record.consumedAt = input.now;
  return { ok: true };
}

async function registerPasswordCredential(input: {
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

async function verifyPasswordCredential(input: {
  userState: UserState;
  subject: string;
  password: string;
  now: number;
}): Promise<{ ok: true; userId: string; protection: AuthCredentialProtection } | { ok: false; status: 400 | 423; message: string; protection: AuthCredentialProtection }> {
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
      protection: { failureReason: "password_locked", remainingAttempts: 0, lockedUntil: credential.lockedUntil },
    };
  }

  if (credential.lockedUntil && credential.lockedUntil <= input.now) {
    delete credential.lockedUntil;
    credential.failedAttempts = 0;
  }

  const inputHash = await hashSecret(input.password, credential.salt);
  if (inputHash !== credential.passwordHash) {
    credential.failedAttempts += 1;
    const remainingAttempts = Math.max(0, credential.maxFailedAttempts - credential.failedAttempts);
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
      message: remainingAttempts === 0 ? "password credential is locked after too many failed attempts" : "invalid account or password",
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
    threadReadAtById: {
      ...source.threadReadAtById,
      ...target.threadReadAtById,
    },
    threadMessagesByThreadId: {
      ...source.threadMessagesByThreadId,
      ...target.threadMessagesByThreadId,
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
    sharePreparesById: {
      ...source.sharePreparesById,
      ...target.sharePreparesById,
    },
    uploadsByTaskId: {
      ...source.uploadsByTaskId,
      ...target.uploadsByTaskId,
    },
    ...(target.boundPhoneNumber ?? source.boundPhoneNumber
      ? { boundPhoneNumber: target.boundPhoneNumber ?? source.boundPhoneNumber }
      : {}),
    ...(target.wechatBoundOverride !== undefined || source.wechatBoundOverride !== undefined
      ? { wechatBoundOverride: target.wechatBoundOverride ?? source.wechatBoundOverride }
      : {}),
    ...(target.profileOverrides ?? source.profileOverrides
      ? {
          profileOverrides: {
            ...(source.profileOverrides ?? {}),
            ...(target.profileOverrides ?? {}),
          },
        }
      : {}),
    ...(target.availabilityStatus ?? source.availabilityStatus
      ? { availabilityStatus: target.availabilityStatus ?? source.availabilityStatus }
      : {}),
    ...(target.relationTarget ?? source.relationTarget
      ? {
          relationTarget: {
            ...(source.relationTarget ?? {}),
            ...(target.relationTarget ?? {}),
          } as NonNullable<UserState["relationTarget"]>,
        }
      : {}),
    ...(target.managedContentById ?? source.managedContentById
      ? {
          managedContentById: {
            ...(source.managedContentById ?? {}),
            ...(target.managedContentById ?? {}),
          },
        }
      : {}),
    ...(target.pendingIdentityWorkflow ?? source.pendingIdentityWorkflow
      ? { pendingIdentityWorkflow: target.pendingIdentityWorkflow ?? source.pendingIdentityWorkflow }
      : {}),
    ...(target.lastIdentityWorkflow ?? source.lastIdentityWorkflow
      ? { lastIdentityWorkflow: target.lastIdentityWorkflow ?? source.lastIdentityWorkflow }
      : {}),
    ...(target.authSecurity ?? source.authSecurity
      ? {
          authSecurity: {
            phoneVerificationsById: {
              ...(source.authSecurity?.phoneVerificationsById ?? {}),
              ...(target.authSecurity?.phoneVerificationsById ?? {}),
            },
            latestVerificationIdByPhonePurpose: {
              ...(source.authSecurity?.latestVerificationIdByPhonePurpose ?? {}),
              ...(target.authSecurity?.latestVerificationIdByPhonePurpose ?? {}),
            },
            passwordCredentialsBySubject: {
              ...(source.authSecurity?.passwordCredentialsBySubject ?? {}),
              ...(target.authSecurity?.passwordCredentialsBySubject ?? {}),
            },
            oauthStatesByState: {
              ...(source.authSecurity?.oauthStatesByState ?? {}),
              ...(target.authSecurity?.oauthStatesByState ?? {}),
            },
            oauthCredentialsByProviderSubject: {
              ...(source.authSecurity?.oauthCredentialsByProviderSubject ?? {}),
              ...(target.authSecurity?.oauthCredentialsByProviderSubject ?? {}),
            },
            credentialProtectionBySubject: {
              ...(source.authSecurity?.credentialProtectionBySubject ?? {}),
              ...(target.authSecurity?.credentialProtectionBySubject ?? {}),
            },
          },
        }
      : {}),
  };
}

function cloneOrderDetail(detail: OrderDetailResponse): OrderDetailResponse {
  return structuredClone(detail);
}

function applyOrderCancellation(detail: OrderDetailResponse, reason?: string): OrderDetailResponse {
  const next = cloneOrderDetail(detail);
  const processedAt = new Date().toISOString();
  const cancellable = next.order.status === "created" || next.order.status === "pending_payment";
  if (cancellable) {
    next.order.status = "cancelled";
    next.order.updatedAt = processedAt;
    next.paymentIntent.status = "cancelled";
    next.paymentResult.status = "cancelled";
    next.paymentResult.paid = false;
    next.paymentResult.callbackVerified = false;
    next.paymentResult.message = reason
      ? `Order cancelled before payment completion. Reason: ${reason}.`
      : "Order cancelled before payment completion.";
    next.callbackVerification = {
      status: "pending",
      message: "No callback verification is required after the cancellation.",
    };
    next.reconciliation = {
      status: "reconciled",
      message: "Order cancellation and payment result are aligned.",
      checkedAt: processedAt,
    };
  }

  next.operationResult = createPaymentOperationResult({
    operation: "cancel",
    applied: cancellable,
    orderStatus: next.order.status,
    paymentStatus: next.paymentResult.status,
    message: cancellable
      ? next.paymentResult.message
      : "The current order can no longer be cancelled.",
    processedAt,
  });
  return next;
}

function applyOrderRefund(detail: OrderDetailResponse, reason?: string): OrderDetailResponse {
  const next = cloneOrderDetail(detail);
  const processedAt = new Date().toISOString();
  const refundable = next.order.status === "paid";
  if (refundable) {
    next.order.status = "refunded";
    next.order.updatedAt = processedAt;
    next.paymentIntent.status = "succeeded";
    next.paymentResult.status = "refunded";
    next.paymentResult.paid = false;
    next.paymentResult.callbackVerified = true;
    next.paymentResult.message = reason
      ? `Refund completed in the sample payment domain. Reason: ${reason}.`
      : "Refund completed in the sample payment domain.";
    next.callbackVerification = {
      status: "verified",
      message: "The payment callback remained verified through the refund transition.",
      verifiedAt: processedAt,
      callbackReference: next.callbackVerification.callbackReference ?? `cb_${next.order.orderId}`,
    };
    next.reconciliation = {
      status: "reconciled",
      message: "Refund state reconciled with the stored order record.",
      checkedAt: processedAt,
    };
    if (next.entitlement) {
      next.entitlement.active = false;
      next.entitlement.statusLabel = "Refunded";
    }
  }

  next.operationResult = createPaymentOperationResult({
    operation: "refund",
    applied: refundable,
    orderStatus: next.order.status,
    paymentStatus: next.paymentResult.status,
    message: refundable
      ? next.paymentResult.message
      : "Only paid orders can enter the refund flow.",
    processedAt,
  });
  return next;
}

function applyPaymentCallback(detail: OrderDetailResponse, payload: PaymentCallbackRequest): OrderDetailResponse {
  const next = cloneOrderDetail(detail);
  const processedAt = new Date().toISOString();
  const verified = payload.verified !== false;
  next.order.updatedAt = processedAt;
  next.callbackVerification = {
    status: verified ? "verified" : "rejected",
    message: verified
      ? "Sample callback verification succeeded."
      : "Sample callback verification rejected the callback payload.",
    ...(verified ? { verifiedAt: processedAt } : {}),
    ...(payload.callbackReference ? { callbackReference: payload.callbackReference } : {}),
  };
  next.paymentIntent.status = verified ? "succeeded" : "verifying";

  if (payload.outcome === "success" && verified) {
    next.order.status = "paid";
    next.paymentIntent.status = "succeeded";
    next.paymentResult.status = "success";
    next.paymentResult.paid = true;
    next.paymentResult.callbackVerified = true;
    next.paymentResult.message = "Payment callback confirmed the successful payment result.";
    next.paymentResult.polledAt = processedAt;
    if (next.entitlement) {
      next.entitlement.active = true;
      next.entitlement.statusLabel = "Membership active";
    }
  } else if (payload.outcome === "failure") {
    next.order.status = "payment_failed";
    next.paymentIntent.status = verified ? "failed" : "verifying";
    next.paymentResult.status = "failure";
    next.paymentResult.paid = false;
    next.paymentResult.callbackVerified = verified;
    next.paymentResult.message = verified
      ? "Payment callback marked the order as failed."
      : "Payment callback could not be verified and the order remains in a failed state.";
    next.paymentResult.polledAt = processedAt;
    if (next.entitlement) {
      next.entitlement.active = false;
      next.entitlement.statusLabel = "Payment failed";
    }
  } else if (payload.outcome === "cancelled") {
    next.order.status = "cancelled";
    next.paymentIntent.status = "cancelled";
    next.paymentResult.status = "cancelled";
    next.paymentResult.paid = false;
    next.paymentResult.callbackVerified = verified;
    next.paymentResult.message = "Payment callback marked the order as cancelled.";
    next.paymentResult.polledAt = processedAt;
    if (next.entitlement) {
      next.entitlement.active = false;
      next.entitlement.statusLabel = "Cancelled";
    }
  }

  next.reconciliation = {
    status: "pending",
    message: "Callback applied. Reconciliation is still pending.",
  };
  next.operationResult = createPaymentOperationResult({
    operation: "verify_callback",
    applied: true,
    orderStatus: next.order.status,
    paymentStatus: next.paymentResult.status,
    message: next.paymentResult.message,
    processedAt,
  });
  return next;
}

function applyPaymentReconciliation(detail: OrderDetailResponse): OrderDetailResponse {
  const next = cloneOrderDetail(detail);
  const processedAt = new Date().toISOString();
  const matches =
    (next.order.status === "paid" && next.paymentResult.status === "success" && next.paymentResult.paid) ||
    (next.order.status === "cancelled" && next.paymentResult.status === "cancelled" && !next.paymentResult.paid) ||
    (next.order.status === "payment_failed" && next.paymentResult.status === "failure" && !next.paymentResult.paid) ||
    (next.order.status === "refunded" && next.paymentResult.status === "refunded" && !next.paymentResult.paid) ||
    (next.order.status === "pending_payment" && next.paymentResult.status === "pending");
  next.reconciliation = matches
    ? {
        status: "reconciled",
        message: "The stored payment result matches the current order state.",
        checkedAt: processedAt,
      }
    : {
        status: "mismatch",
        message: "The stored payment result does not match the current order state.",
        checkedAt: processedAt,
        mismatchReason: `${next.order.status} vs ${next.paymentResult.status}`,
      };
  next.operationResult = createPaymentOperationResult({
    operation: "reconcile",
    applied: true,
    orderStatus: next.order.status,
    paymentStatus: next.paymentResult.status,
    message: next.reconciliation.message,
    processedAt,
  });
  return next;
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
      version: "1.0.0",
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

  app.post("/auth/verification-code/request", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, phoneVerificationRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const store = getStore(c.env, options.store);
    const userId = createUserIdFromCredential({ method: "phone_code", phoneNumber: payload.phoneNumber });
    const userState = await store.getUserState(userId);
    const now = Date.now();
    const challenge = await createPhoneVerificationChallenge({
      userState,
      phoneNumber: payload.phoneNumber,
      purpose: payload.purpose,
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      now,
    });
    await store.saveUserState(userId, userState);

    const maskedTarget = maskPhoneNumber(payload.phoneNumber);
    const riskDecision = resolveRiskDecision({
      credentialDeviceId: payload.deviceId,
      riskContext: payload.riskContext,
    });
    const response: AuthPhoneVerificationResponse = {
      verificationId: challenge.verificationId,
      phoneNumberMasked: maskedTarget,
      purpose: payload.purpose,
      expiresAt: challenge.expiresAt,
      retryAfterSeconds: PHONE_VERIFICATION_RETRY_AFTER_SECONDS,
      maxAttempts: PHONE_VERIFICATION_MAX_ATTEMPTS,
      delivery: {
        provider: "simulated",
        providerReference: `sms_${challenge.verificationId}`,
        maskedTarget,
        debugCode: challenge.code,
        message: "Verification code issued by the built-in simulated SMS provider.",
      },
      riskDecision,
    };

    return c.json(response);
  });

  app.post("/auth/password/register", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, passwordCredentialSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const subject = createCredentialSubject(payload);
    if (!subject) {
      return jsonError("INVALID_ARGUMENT", "password registration requires an account or phone number", 400, traceId);
    }

    const userId = createUserIdFromCredential({
      method: "password",
      ...(payload.account ? { account: payload.account } : {}),
      ...(payload.phoneNumber ? { phoneNumber: payload.phoneNumber } : {}),
    });
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(userId);
    if (payload.phoneNumber) {
      if (!payload.verificationCode) {
        return jsonError("LOGIN_FAILED", "phone password registration requires a verification code", 400, traceId);
      }
      const verified = await consumePhoneVerification({
        userState,
        phoneNumber: payload.phoneNumber,
        purpose: "password_reset",
        verificationCode: payload.verificationCode,
        now: Date.now(),
      });
      if (!verified.ok) {
        await store.saveUserState(userId, userState);
        return c.json({ code: "LOGIN_FAILED", message: verified.message, credentialProtection: verified.protection }, verified.status);
      }
    }

    await registerPasswordCredential({
      userState,
      userId,
      subject,
      password: payload.password,
      now: Date.now(),
    });
    await store.saveUserState(userId, userState);

    return c.json({
      userId,
      subject,
      passwordConfigured: true,
      credentialProtection: { remainingAttempts: PASSWORD_MAX_FAILED_ATTEMPTS },
    });
  });

  app.post("/auth/password/reset", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, passwordCredentialSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    if (!payload.phoneNumber || !payload.verificationCode) {
      return jsonError("INVALID_ARGUMENT", "password reset requires phone number and verification code", 400, traceId);
    }

    const subject = createCredentialSubject({ phoneNumber: payload.phoneNumber });
    if (!subject) {
      return jsonError("INVALID_ARGUMENT", "password reset requires a valid phone number", 400, traceId);
    }

    const userId = createUserIdFromCredential({ method: "password", phoneNumber: payload.phoneNumber });
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(userId);
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: payload.phoneNumber,
      purpose: "password_reset",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(userId, userState);
      return c.json({ code: "LOGIN_FAILED", message: verified.message, credentialProtection: verified.protection }, verified.status);
    }

    await registerPasswordCredential({
      userState,
      userId,
      subject,
      password: payload.password,
      now: Date.now(),
    });
    await store.saveUserState(userId, userState);
    return c.json({
      userId,
      subject,
      passwordConfigured: true,
      credentialProtection: { remainingAttempts: PASSWORD_MAX_FAILED_ATTEMPTS },
    });
  });

  app.post("/auth/oauth/authorize", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, oauthAuthorizeSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const providerKey = sanitizeUserKey(payload.provider.toLowerCase());
    const state = createRandomId("oauth_state");
    const expiresAt = Date.now() + OAUTH_STATE_TTL_MS;
    const store = getStore(c.env, options.store);
    const stateUserId = `oauth_state_${providerKey}`;
    const stateStore = await store.getUserState(stateUserId);
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    ensureAuthSecurityState(stateStore).oauthStatesByState[state] = {
      provider: payload.provider,
      state,
      expiresAt,
      createdAt: Date.now(),
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      ...(redirectTarget ? { redirectTarget } : {}),
    };
    await store.saveUserState(stateUserId, stateStore);

    const response: AuthOAuthAuthorizeResponse = {
      provider: payload.provider,
      state,
      authorizationUrl: `https://auth.example.test/${providerKey}/authorize?state=${encodeURIComponent(state)}`,
      expiresAt,
    };
    return c.json(response);
  });

  app.post("/auth/oauth/callback", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, oauthCallbackSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const providerKey = sanitizeUserKey(payload.provider.toLowerCase());
    const store = getStore(c.env, options.store);
    const stateUserId = `oauth_state_${providerKey}`;
    const stateStore = await store.getUserState(stateUserId);
    const stateRecord = ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    if (!stateRecord || stateRecord.provider !== payload.provider || stateRecord.expiresAt <= Date.now()) {
      return c.json(
        {
          code: "LOGIN_FAILED",
          message: "oauth state is invalid or expired",
          credentialProtection: { failureReason: "oauth_state_invalid" },
        },
        400,
      );
    }

    const userId = `user_oauth_${providerKey}_${sanitizeUserKey(payload.providerUserId)}`;
    const userState = await store.getUserState(userId);
    ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[createOAuthSubject(payload.provider, payload.providerUserId)] = {
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      userId,
      tokenHash: await hashSecret(payload.providerToken, payload.state),
      createdAt: Date.now(),
    };
    delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    await store.saveUserState(stateUserId, stateStore);
    await store.saveUserState(userId, userState);

    const session = await store.createSession({
      platform: payload.platform,
      userId,
      authStatus: "authenticated",
      identity: {
        userId,
        ...(payload.provider.toLowerCase().includes("wechat") ? { wechatBound: true } : {}),
      },
      loginMethod: "oauth",
    });
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget ?? stateRecord.redirectTarget);
    const response: AuthOAuthCallbackResponse = createAuthResponseFromSession(session, c.req.url, {
      ...(redirectTarget ? { redirectTarget } : {}),
    });
    return c.json(response);
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

    if (loginMethod === "password" && (!(payload.credential.phoneNumber || payload.credential.account) || !payload.credential.password)) {
      return jsonError("LOGIN_FAILED", "password login requires an account identifier and password", 400, traceId);
    }

    if (loginMethod === "oauth" && (!payload.credential.provider || !payload.credential.providerToken || !payload.credential.providerUserId || !payload.credential.oauthState)) {
      return jsonError("LOGIN_FAILED", "third-party login requires provider, provider user id, provider token, and oauth state", 400, traceId);
    }

    const store = getStore(c.env, options.store);
    let userId = createUserIdFromLogin(payload, loginMethod);
    let credentialProtection: AuthCredentialProtection | undefined;

    if (loginMethod === "phone_code") {
      const userState = await store.getUserState(userId);
      const verified = await consumePhoneVerification({
        userState,
        phoneNumber: payload.credential.phoneNumber!,
        purpose: "login",
        verificationCode: payload.credential.verificationCode!,
        now: Date.now(),
      });
      await store.saveUserState(userId, userState);
      if (!verified.ok) {
        return c.json({ code: "LOGIN_FAILED", message: verified.message, credentialProtection: verified.protection }, verified.status);
      }
    }

    if (loginMethod === "password") {
      const subject = createCredentialSubject(payload.credential);
      if (!subject) {
        return jsonError("LOGIN_FAILED", "password login requires an account identifier and password", 400, traceId);
      }
      const userState = await store.getUserState(userId);
      const verified = await verifyPasswordCredential({
        userState,
        subject,
        password: payload.credential.password!,
        now: Date.now(),
      });
      await store.saveUserState(userId, userState);
      if (!verified.ok) {
        return c.json({ code: "LOGIN_FAILED", message: verified.message, credentialProtection: verified.protection }, verified.status);
      }
      userId = verified.userId;
      credentialProtection = verified.protection;
    }

    if (loginMethod === "oauth") {
      const providerKey = sanitizeUserKey(payload.credential.provider!.toLowerCase());
      const stateStore = await store.getUserState(`oauth_state_${providerKey}`);
      const stateRecord = ensureAuthSecurityState(stateStore).oauthStatesByState[payload.credential.oauthState!];
      if (!stateRecord || stateRecord.provider !== payload.credential.provider || stateRecord.expiresAt <= Date.now()) {
        return c.json(
          {
            code: "LOGIN_FAILED",
            message: "oauth state is invalid or expired",
            credentialProtection: { failureReason: "oauth_state_invalid" },
          },
          400,
        );
      }
      userId = `user_oauth_${providerKey}_${sanitizeUserKey(payload.credential.providerUserId!)}`;
      const userState = await store.getUserState(userId);
      ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[
        createOAuthSubject(payload.credential.provider!, payload.credential.providerUserId!)
      ] = {
        provider: payload.credential.provider!,
        providerUserId: payload.credential.providerUserId!,
        userId,
        tokenHash: await hashSecret(payload.credential.providerToken!, payload.credential.oauthState!),
        createdAt: Date.now(),
      };
      delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.credential.oauthState!];
      await store.saveUserState(`oauth_state_${providerKey}`, stateStore);
      await store.saveUserState(userId, userState);
    }

    const session = await store.createSession({
      platform: payload.platform,
      userId,
      authStatus: resolveAuthStatus(loginMethod),
      identity: resolveIdentity(payload, userId, loginMethod),
      loginMethod,
    });
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const abnormalLoginPrompt = resolveAbnormalLoginPrompt(payload, loginMethod);
    const riskDecision = resolveRiskDecision({
      credentialDeviceId: payload.credential.deviceId,
      riskContext: payload.riskContext,
    });
    const response: LoginResponse = createAuthResponseFromSession(session, c.req.url, {
      ...(abnormalLoginPrompt ? { abnormalLoginPrompt } : {}),
      ...(credentialProtection ? { credentialProtection } : {}),
      ...(redirectTarget ? { redirectTarget } : {}),
      riskDecision,
    });

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
    }

    if (payload.credential.method === "password") {
      if ((!(payload.credential.account || payload.credential.phoneNumber)) || !payload.credential.password) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with password requires an account identifier and password", 400, traceId);
      }
    }

    const store = getStore(c.env, options.store);
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const targetUserId = createUserIdFromUpgradeRequest(payload);
    const targetState = await store.getUserState(targetUserId);
    if (payload.credential.method === "phone_code") {
      const verified = await consumePhoneVerification({
        userState: targetState,
        phoneNumber: payload.credential.phoneNumber!,
        purpose: "guest_upgrade",
        verificationCode: payload.credential.verificationCode!,
        now: Date.now(),
      });
      await store.saveUserState(targetUserId, targetState);
      if (!verified.ok) {
        const workflow = createIdentityWorkflow({
          kind: "guest_upgrade",
          status: "blocked",
          sourceUserId: session.userId,
          continueTarget: redirectTarget,
          failureReason:
            verified.protection.failureReason === "verification_code_expired"
              ? "verification_code_invalid"
              : "verification_code_invalid",
        });
        return c.json(createAuthResponseFromSession(session, c.req.url, {
          identityWorkflow: workflow,
          credentialProtection: verified.protection,
          redirectTarget,
        }));
      }
    }

    if (payload.credential.method === "password") {
      const subject = createCredentialSubject(payload.credential);
      if (!subject) {
        return jsonError("INVALID_ARGUMENT", "guest upgrade with password requires an account identifier and password", 400, traceId);
      }
      const verified = await verifyPasswordCredential({
        userState: targetState,
        subject,
        password: payload.credential.password!,
        now: Date.now(),
      });
      await store.saveUserState(targetUserId, targetState);
      if (!verified.ok) {
        return c.json({ code: "LOGIN_FAILED", message: verified.message, credentialProtection: verified.protection }, verified.status);
      }
    }
    const mergeCandidate = isMergeSampleIdentity(payload.credential);
    if (mergeCandidate && payload.mergeStrategy !== "merge") {
      const sourceState = await store.getUserState(session.userId);
      const workflowId = createRandomId("identity_workflow");
      const targetLabel = `account ${targetUserId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId,
        targetLabel,
        sourceState,
        targetState,
      });
      const audit = [
        createIdentityAuditRecord({
          action: "preview_created",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId,
          message: "Guest upgrade merge preview created.",
        }),
        createIdentityAuditRecord({
          action: "merge_required",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId,
          message: "Guest upgrade requires explicit merge confirmation.",
        }),
      ];
      const workflow = createIdentityWorkflow({
        kind: "guest_upgrade",
        status: "merge_required",
        workflowId,
        stage: "preview",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId,
        targetLabel,
        failureReason: "merge_confirmation_required",
        mergePreview,
        audit,
      });
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
    const workflowId = sourceState.pendingIdentityWorkflow?.workflowId ?? createRandomId("identity_workflow");
    const targetLabel = `account ${targetUserId}`;
    const mergePreview = createMergePreview({
      sourceUserId: session.userId,
      targetUserId,
      targetLabel,
      sourceState,
      targetState,
    });
    const workflow = createIdentityWorkflow({
      kind: "guest_upgrade",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId,
      targetLabel,
      mergePreview,
      audit: [
        ...(sourceState.pendingIdentityWorkflow?.audit ?? []),
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId,
          message: "Guest upgrade completed with rollback-safe state merge.",
        }),
      ],
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

    const store = getStore(c.env, options.store);
    const targetUserId = createUserIdFromCredential({
      method: "phone_code",
      phoneNumber: payload.phoneNumber,
    });
    const targetState = await store.getUserState(targetUserId);
    const verified = await consumePhoneVerification({
      userState: targetState,
      phoneNumber: payload.phoneNumber,
      purpose: "phone_binding",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    await store.saveUserState(targetUserId, targetState);
    if (!verified.ok) {
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "blocked",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        failureReason: "verification_code_invalid",
      });
      return c.json(createAuthResponseFromSession(session, c.req.url, {
        identityWorkflow: workflow,
        credentialProtection: verified.protection,
        redirectTarget,
      }));
    }
    const mergeCandidate = isMergeSampleIdentity({ phoneNumber: payload.phoneNumber }) && targetUserId !== session.userId;
    if (mergeCandidate && payload.mergeStrategy !== "merge") {
      const sourceState = await store.getUserState(session.userId);
      const workflowId = createRandomId("identity_workflow");
      const targetLabel = `account ${targetUserId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId,
        targetLabel,
        sourceState,
        targetState,
      });
      const audit = [
        createIdentityAuditRecord({
          action: "preview_created",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId,
          message: "Phone binding merge preview created.",
        }),
        createIdentityAuditRecord({
          action: "merge_required",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId,
          message: "Phone binding requires explicit merge confirmation.",
        }),
      ];
      const workflow = createIdentityWorkflow({
        kind: "phone_binding",
        status: "merge_required",
        workflowId,
        stage: "preview",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId,
        targetLabel,
        failureReason: "merge_confirmation_required",
        mergePreview,
        audit,
      });
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
    const workflowId = sourceState.pendingIdentityWorkflow?.workflowId ?? createRandomId("identity_workflow");
    const targetLabel = `account ${session.userId}`;
    const mergePreview = createMergePreview({
      sourceUserId: session.userId,
      targetUserId: session.userId,
      targetLabel,
      sourceState,
      targetState: sourceState,
      requiresConfirmation: false,
      recoveryMessage: "Phone binding completed on the current account; no cross-account merge was required.",
    });
    delete sourceState.pendingIdentityWorkflow;
    sourceState.lastIdentityWorkflow = createIdentityWorkflow({
      kind: "phone_binding",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId: session.userId,
      targetLabel,
      mergePreview,
      audit: [
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: session.userId,
          message: "Phone binding completed without cross-account merge.",
        }),
      ],
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
    const store = getStore(c.env, options.store);
    const sourceState = await store.getUserState(session.userId);
    const pendingWorkflow = sourceState.pendingIdentityWorkflow;

    if (!payload.confirm) {
      const workflowId = pendingWorkflow?.workflowId ?? createRandomId("identity_workflow");
      const workflow = createIdentityWorkflow({
        kind: payload.workflowKind ?? pendingWorkflow?.kind ?? "account_merge",
        status: "blocked",
        workflowId,
        stage: "failed",
        sourceUserId: session.userId,
        continueTarget: redirectTarget ?? pendingWorkflow?.continueTarget,
        targetUserId: payload.targetUserId,
        targetLabel: `account ${payload.targetUserId}`,
        failureReason: "merge_confirmation_required",
        ...(pendingWorkflow?.mergePreview ? { mergePreview: pendingWorkflow.mergePreview } : {}),
        audit: [
          ...(pendingWorkflow?.audit ?? []),
          createIdentityAuditRecord({
            action: "merge_blocked",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "Account merge was cancelled before explicit confirmation.",
          }),
          createIdentityAuditRecord({
            action: "rollback_safe_failure",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "No account data was changed because the merge was not confirmed.",
          }),
        ],
      });
      sourceState.lastIdentityWorkflow = workflow;
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    if (!pendingWorkflow || pendingWorkflow.targetUserId !== payload.targetUserId) {
      const targetState = await store.getUserState(payload.targetUserId);
      const workflowId = pendingWorkflow?.workflowId ?? createRandomId("identity_workflow");
      const targetLabel = `account ${payload.targetUserId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId: payload.targetUserId,
        targetLabel,
        sourceState,
        targetState,
      });
      const workflow = createIdentityWorkflow({
        kind: payload.workflowKind ?? "account_merge",
        status: "blocked",
        workflowId,
        stage: "failed",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId: payload.targetUserId,
        targetLabel,
        failureReason: "merge_target_mismatch",
        mergePreview,
        audit: [
          ...(pendingWorkflow?.audit ?? []),
          createIdentityAuditRecord({
            action: "merge_blocked",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "Account merge target did not match the pending identity workflow.",
          }),
          createIdentityAuditRecord({
            action: "rollback_safe_failure",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: payload.targetUserId,
            message: "No account data was changed because the pending workflow target did not match.",
          }),
        ],
      });
      sourceState.lastIdentityWorkflow = workflow;
      await store.saveUserState(session.userId, sourceState);
      return c.json(createAuthResponseFromSession(session, c.req.url, { identityWorkflow: workflow, redirectTarget }));
    }

    const targetState = await store.getUserState(payload.targetUserId);
    const workflowId = pendingWorkflow.workflowId ?? createRandomId("identity_workflow");
    const targetLabel = `account ${payload.targetUserId}`;
    const mergePreview = pendingWorkflow.mergePreview ?? createMergePreview({
      sourceUserId: session.userId,
      targetUserId: payload.targetUserId,
      targetLabel,
      sourceState,
      targetState,
    });
    const workflow = createIdentityWorkflow({
      kind: "account_merge",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget ?? pendingWorkflow.continueTarget,
      targetUserId: payload.targetUserId,
      targetLabel,
      mergePreview,
      audit: [
        ...(pendingWorkflow.audit ?? []),
        createIdentityAuditRecord({
          action: "merge_confirmed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: payload.targetUserId,
          message: "Account merge was explicitly confirmed by the source session.",
        }),
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: payload.targetUserId,
          message: "Account merge completed with rollback-safe target state persistence.",
        }),
      ],
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
  app.use("/content", requireSession);
  app.use("/content/*", requireSession);
  app.use("/notifications", requireSession);
  app.use("/notifications/*", requireSession);
  app.use("/messages", requireSession);
  app.use("/messages/*", requireSession);
  app.use("/account", requireSession);
  app.use("/account/*", requireSession);
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
  app.use("/share", requireSession);
  app.use("/share/*", requireSession);
  app.use("/uploads", requireSession);
  app.use("/uploads/*", requireSession);
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
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(createSettingsResponse(session, userState, c.env?.MINIX_DEPLOY_ENV));
  });

  app.post("/account/profile", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, updateAccountProfileSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "edit_profile");
    if (!operation?.available) {
      return jsonError("FORBIDDEN", operation?.blockedReason ?? "Profile editing is unavailable.", 409, traceId);
    }

    userState.profileOverrides = {
      ...(userState.profileOverrides ?? {}),
      ...(payload.nickname ? { nickname: payload.nickname } : {}),
      ...(payload.region ? { region: payload.region } : {}),
      ...(payload.bio ? { bio: payload.bio } : {}),
    };
    await store.saveUserState(session.userId, userState);

    const next = createCurrentUserResponse(session, userState, c.req.url);
    const response: AccountOperationResponse = {
      userProfile: next.userProfile,
      accountSummary: next.accountSummary,
      userStatus: next.userStatus,
      accountOperations: next.accountOperations,
      transitionMessage: "Profile updated.",
    };
    return c.json(response);
  });

  app.post("/account/change-phone", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, changeAccountPhoneSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const targetUserId = createUserIdFromCredential({ method: "phone_code", phoneNumber: payload.phoneNumber });
    const targetState = await store.getUserState(targetUserId);
    const verified = await consumePhoneVerification({
      userState: targetState,
      phoneNumber: payload.phoneNumber,
      purpose: "change_phone",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    await store.saveUserState(targetUserId, targetState);
    if (!verified.ok) {
      return c.json({ code: "INVALID_ARGUMENT", message: verified.message, credentialProtection: verified.protection }, verified.status);
    }

    const userState = await store.getUserState(session.userId);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "change_phone");
    if (!operation?.available) {
      return jsonError("FORBIDDEN", operation?.blockedReason ?? "Phone binding changes are unavailable.", 409, traceId);
    }

    userState.boundPhoneNumber = payload.phoneNumber;
    await store.saveUserState(session.userId, userState);

    const next = createCurrentUserResponse(session, userState, c.req.url);
    const response: AccountOperationResponse = {
      userProfile: next.userProfile,
      accountSummary: next.accountSummary,
      userStatus: next.userStatus,
      accountOperations: next.accountOperations,
      transitionMessage: "Phone binding updated.",
    };
    return c.json(response);
  });

  app.post("/account/unbind", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, accountUnbindSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "unbind_wechat");
    if (!operation?.available) {
      return jsonError("FORBIDDEN", operation?.blockedReason ?? "WeChat unbinding is unavailable.", 409, traceId);
    }

    if (payload.provider === "wechat") {
      userState.wechatBoundOverride = false;
    }
    await store.saveUserState(session.userId, userState);

    const next = createCurrentUserResponse(session, userState, c.req.url);
    const response: AccountOperationResponse = {
      userProfile: next.userProfile,
      accountSummary: next.accountSummary,
      userStatus: next.userStatus,
      accountOperations: next.accountOperations,
      transitionMessage: "WeChat binding removed.",
    };
    return c.json(response);
  });

  app.post("/account/cancellation", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, accountCancellationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "request_cancellation");
    if (!operation?.available) {
      return jsonError("FORBIDDEN", operation?.blockedReason ?? "Cancellation is unavailable.", 409, traceId);
    }

    if (payload.confirm) {
      userState.availabilityStatus = "cancellation_pending";
    }
    await store.saveUserState(session.userId, userState);

    const next = createCurrentUserResponse(session, userState, c.req.url);
    const response: AccountOperationResponse = {
      userProfile: next.userProfile,
      accountSummary: next.accountSummary,
      userStatus: next.userStatus,
      accountOperations: next.accountOperations,
      transitionMessage: "Cancellation request submitted.",
    };
    return c.json(response);
  });

  app.post("/account/relations", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, relationActionSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const target = current.relationTargets.find((item) => item.targetUserId === payload.targetUserId);
    if (!target || !userState.relationTarget || userState.relationTarget.targetUserId !== payload.targetUserId) {
      return jsonError("NOT_FOUND", "Relation target not found.", 404, traceId);
    }

    const action = target.actions.find((item) => item.kind === payload.action);
    if (!action?.available) {
      return jsonError("FORBIDDEN", action?.blockedReason ?? "Relation action is unavailable.", 409, traceId);
    }

    switch (payload.action) {
      case "follow":
        userState.relationTarget.following = true;
        break;
      case "unfollow":
        userState.relationTarget.following = false;
        userState.relationTarget.friend = false;
        break;
      case "block":
        userState.relationTarget.blocked = true;
        userState.relationTarget.following = false;
        userState.relationTarget.friend = false;
        break;
      case "unblock":
        userState.relationTarget.blocked = false;
        break;
      case "set_remark":
        if (!payload.remarkName) {
          return jsonError("INVALID_ARGUMENT", "remark name is required when setting a remark", 400, traceId);
        }
        userState.relationTarget.remarkName = payload.remarkName;
        break;
      case "clear_remark":
        delete userState.relationTarget.remarkName;
        break;
    }

    await store.saveUserState(session.userId, userState);
    const next = createCurrentUserResponse(session, userState, c.req.url);
    const response: UserRelationMutationResponse = {
      accountSummary: next.accountSummary,
      userStatus: next.userStatus,
      relationTargets: next.relationTargets,
      transitionMessage:
        payload.action === "follow"
          ? "Followed relation target."
          : payload.action === "unfollow"
            ? "Unfollowed relation target."
            : payload.action === "block"
              ? "Relation target blocked."
              : payload.action === "unblock"
                ? "Relation target unblocked."
                : payload.action === "set_remark"
                  ? "Remark name updated."
                  : "Remark name cleared.",
    };
    return c.json(response);
  });

  app.get("/items", (c) => {
    const url = new URL(c.req.url);
    const query = parseQuery(url, itemsQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    return c.json(listItems(query.page, query.pageSize));
  });

  app.get("/feed", async (c) => {
    const query = parseQuery(new URL(c.req.url), feedQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(listFeed(query, userState));
  });

  app.get("/content/detail", async (c) => {
    const query = parseQuery(new URL(c.req.url), contentIdQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response = getManagedContentDetail(query.contentId, userState);
    if (!response) {
      return jsonError("NOT_FOUND", "Managed content not found.", 404, c.get("traceId"));
    }

    return c.json(response satisfies ContentDetailResponse);
  });

  app.post("/content/lifecycle", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, contentLifecycleMutationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response = applyManagedContentLifecycle(userState, {
      contentId: payload.contentId,
      action: payload.action,
      ...(payload.visibility ? { visibility: payload.visibility } : {}),
      ...(payload.reviewMessage ? { reviewMessage: payload.reviewMessage } : {}),
    });
    if (!response) {
      return jsonError("NOT_FOUND", "Managed content not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies ContentLifecycleMutationResponse);
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

  app.post("/messages/thread/read", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, markThreadReadSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const request: MarkThreadReadRequest = {
      threadId: payload.threadId,
    };
    const response = markThreadRead(userState, request);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.post("/messages/thread/send", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, sendMessageSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const request: SendMessageRequest = {
      threadId: payload.threadId,
      body: payload.body,
    };
    const response = sendThreadMessage(userState, request);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies SendMessageResponse);
  });

  app.post("/share/prepare", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, sharePrepareSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response = createSharePrepareResponse(normalizeSharePrepareRequest(payload), c.req.url);
    userState.sharePreparesById[response.shareAttribution.attributionId ?? response.sharePayload.shareToken ?? response.sharePayload.title] = response;
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.post("/share/return", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, shareReturnRecognitionSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = userState.sharePreparesById[payload.attributionId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Share attribution was not found.", 404, traceId);
    }

    const request: ShareReturnRecognitionRequest = {
      attributionId: payload.attributionId,
      outcome: payload.outcome,
      ...(payload.recognizedPath !== undefined ? { recognizedPath: payload.recognizedPath } : {}),
      ...(payload.recognizedUserId !== undefined ? { recognizedUserId: payload.recognizedUserId } : {}),
    };
    const response = recognizeShareReturn(existing, request);
    userState.sharePreparesById[payload.attributionId] = {
      sharePayload: response.sharePayload,
      shareChannel: response.shareChannel,
      shareAttribution: response.shareAttribution,
      landingTarget: response.landingTarget ?? existing.landingTarget,
    };
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.post("/uploads", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, uploadPipelineRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response = createUploadPipelineResponse(normalizeUploadPipelineRequest(payload), c.req.url);
    userState.uploadsByTaskId[response.uploadTask.taskId] = response;
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.post("/uploads/retry", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, uploadRetrySchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = userState.uploadsByTaskId[payload.taskId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Upload task not found.", 404, traceId);
    }

    const request: UploadRetryRequest = { taskId: payload.taskId };
    const response = retryUploadPipeline(existing, request);
    userState.uploadsByTaskId[payload.taskId] = response;
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.post("/uploads/cancel", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, uploadCancelSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = userState.uploadsByTaskId[payload.taskId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Upload task not found.", 404, traceId);
    }

    const request: UploadCancelRequest = {
      taskId: payload.taskId,
      ...(payload.reason !== undefined ? { reason: payload.reason } : {}),
    };
    const response = cancelUploadPipeline(existing, request);
    userState.uploadsByTaskId[payload.taskId] = response;
    await store.saveUserState(session.userId, userState);
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

  app.post("/feedback/ticket/revisit", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, revisitFeedbackSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const normalizedPayload: FeedbackRevisitRequest = {
      ticketId: payload.ticketId,
      ...(payload.userMessage !== undefined ? { userMessage: payload.userMessage } : {}),
    };
    const response = revisitFeedbackTicket(userState, normalizedPayload);
    if (!response) {
      return jsonError("NOT_FOUND", "Feedback ticket not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies FeedbackRevisitResponse);
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
      ...(payload.paymentScenario ? { paymentScenario: payload.paymentScenario } : {}),
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
    if (existingOrder?.entitlement && "overview" in existingOrder.entitlement && existingOrder.order.status === "paid") {
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
            callbackVerification: existingOrder.callbackVerification,
            reconciliation: existingOrder.reconciliation,
            entitlement: existingOrder.entitlement as MembershipEntitlement,
          },
          purchasePayload,
        ) satisfies PurchaseMembershipResponse,
      );
    }

    const duplicateProtected = Boolean(userState.latestPaidOrderId);
    const orderDetail = createMembershipOrderDetail(session, purchasePayload, duplicateProtected);
    userState.ordersById[orderDetail.order.orderId] = orderDetail;
    if (orderDetail.order.status === "paid") {
      userState.membershipPlanId = purchasePayload.planId;
      userState.latestPaidOrderId = orderDetail.order.orderId;
    }
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

  app.post("/orders/cancel", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, orderOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = userState.ordersById[payload.orderId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    const nextOrder = applyOrderCancellation(existing, payload.reason);
    userState.ordersById[payload.orderId] = nextOrder;
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
  });

  app.post("/orders/refund", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, orderOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = userState.ordersById[payload.orderId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    const nextOrder = applyOrderRefund(existing, payload.reason);
    userState.ordersById[payload.orderId] = nextOrder;
    if (nextOrder.order.status === "refunded" && userState.latestPaidOrderId === payload.orderId) {
      delete userState.latestPaidOrderId;
      delete userState.membershipPlanId;
    }
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
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

    const nextResult = {
      ...orderDetail.paymentResult,
      polledAt: new Date().toISOString(),
    } satisfies PaymentResult;
    userState.ordersById[query.orderId] = {
      ...orderDetail,
      paymentResult: nextResult,
    };
    await store.saveUserState(session.userId, userState);
    return c.json(nextResult);
  });

  app.post("/payments/callback", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, paymentCallbackSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = userState.ordersById[payload.orderId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    const callbackPayload: PaymentCallbackRequest = {
      orderId: payload.orderId,
      outcome: payload.outcome,
      ...(payload.verified !== undefined ? { verified: payload.verified } : {}),
      ...(payload.callbackReference ? { callbackReference: payload.callbackReference } : {}),
    };
    const nextOrder = applyPaymentCallback(existing, callbackPayload);
    userState.ordersById[payload.orderId] = nextOrder;
    if (nextOrder.order.status === "paid" && nextOrder.entitlement && "overview" in nextOrder.entitlement) {
      const membershipProductId = nextOrder.order.lineItems.find((item) => item.productType === "membership")?.productId ?? "";
      userState.membershipPlanId = membershipProductId.endsWith("_annual")
        ? "annual"
        : membershipProductId.endsWith("_monthly")
          ? "monthly"
          : "quarterly";
      userState.latestPaidOrderId = payload.orderId;
    }
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
  });

  app.post("/payments/reconcile", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, orderOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = userState.ordersById[payload.orderId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    const nextOrder = applyPaymentReconciliation(existing);
    userState.ordersById[payload.orderId] = nextOrder;
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
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
