import { createHmac } from "node:crypto";

import { Hono, type Context } from "hono";
import { z } from "zod";

import type {
  AccountOperationResponse,
  AddToBookshelfRequest,
  AuthAbnormalLoginPrompt,
  AuthCredentialProtection,
  AuthDeviceIdentity,
  AuthOAuthAuthorizeResponse,
  AuthOAuthCallbackResponse,
  AuthPhoneVerificationResponse,
  AuthIdentity,
  AuthIdentityFailureReason,
  AuthIdentityAuditRecord,
  AuthIdentityMergePreview,
  AuthIdentityWorkflow,
  AuthRateLimitState,
  AuthRedirectTarget,
  AuthRiskDecision,
  AuthSecurityAuditEvent,
  AuthSecurityPrompt,
  AuthStatus,
  AuthVerificationPurpose,
  AfterSalesDetailResponse,
  AfterSalesListResponse,
  BookshelfMutationResponse,
  ContentActorRole,
  ContentDetailResponse,
  ContentLifecycleMutationResponse,
  ContentReviewQueueResponse,
  FeedbackRevisitRequest,
  FeedbackRevisitResponse,
  FeedbackTicketActionRequest,
  FeedbackTicketActionResponse,
  FeedbackTicketDetailResponse,
  ListFeedbackTicketsRequest,
  ListFeedbackTicketsResponse,
  ListOrdersRequest,
  SaveContentDraftRequest,
  SaveContentDraftResponse,
  IdentityBindPhoneRequest,
  IdentityBindOAuthRequest,
  IdentityMergeRequest,
  IdentityTransitionResponse,
  IdentityUpgradeRequest,
  ListContentReviewQueueRequest,
  ListUserAssetHistoryRequest,
  LoadReadingProgressResponse,
  ListMessageThreadsRequest,
  OrderDetailResponse,
  LoginMethod,
  LoginPlatformKind,
  LoginResponse,
  MarkThreadReadRequest,
  MembershipEntitlement,
  OrderListResponse,
  OrderOperationRequest,
  PaymentCallbackLedgerEntry,
  PaymentCatalogResponse,
  PaymentCallbackRequest,
  PaymentGatewayReference,
  PaymentLedgerEntry,
  PaymentReconciliationLedgerEntry,
  PaymentResult,
  PurchaseOrderRequest,
  PurchaseOrderResponse,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  RefreshTokenResponse,
  RemoveFromBookshelfRequest,
  RetryMessageRequest,
  RetryMessageResponse,
  SaveReadingProgressRequest,
  CreateMessageThreadRequest,
  CreateMessageThreadResponse,
  SendMessageRequest,
  SendMessageResponse,
  ShareAttributionReportRequest,
  ShareAttributionReportResponse,
  SharePrepareRequest,
  SharePrepareResponse,
  ShareShortLinkResolveResponse,
  ShareReturnRecognitionRequest,
  ShareReturnRecognitionResponse,
  SubscriptionListResponse,
  SubscriptionOperationRequest,
  SyncMessageThreadRequest,
  SubmitFeedbackRequest,
  UploadAsset,
  UploadAttachRequest,
  UploadCancelRequest,
  UploadChunkRequest,
  UploadCompleteRequest,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadSessionRequest,
  UploadRetryRequest,
  UpdateSettingsRequest,
  AccountProviderRevokeRequest,
  UserAssetLedgerEntry,
  UserAssetHistoryResponse,
  UserRelationListResponse,
  UserRelationMutationResponse,
} from "@minix/contracts";
import {
  CHAPTER_CONTENT,
  CHAPTER_LISTS,
  DEFAULT_MEMBERSHIP_OVERVIEW,
  NOVELS,
  appendAccountOperationRecord,
  applySettingsUpdate,
  clearAccountOperationCooldown,
  createAccountOperationResponse,
  createCurrentUserResponse,
  createAssetLedgerEntry,
  createBookshelf,
  createFeedbackBootstrapResponse,
  applyFeedbackTicketAction,
  createMembershipOverview,
  createMembershipOrderDetail,
  createMembershipPurchaseResponse,
  createPaymentCatalogResponse,
  createPaymentOperationResult,
  createProductOrderDetail,
  createSettingsResponse,
  createShareAttributionReport,
  createSharePrepareResponse,
  createUploadResponse,
  createUploadSessionRecord,
  createUploadPipelineResponse,
  attachUploadRecord,
  attachAfterSalesCase,
  appendUploadChunkRecord,
  bindUploadAssetsToOwner,
  cancelUploadPipeline,
  createAfterSalesCaseRecord,
  deriveReturnTarget,
  findUploadRecordByAssetId,
  getManagedContentDetail,
  hasFallbackCredential,
  getMessageThread,
  getUnreadBadge,
  getAfterSalesCaseDetail,
  getFeedbackTicket,
  listAfterSalesCases,
  listMessageThreadResponse,
  listFeedbackTickets,
  listManagedContentReviewQueue,
  listOrders,
  listSubscriptions,
  listUserAssetHistory,
  listUserRelations,
  readUploadedAssetBinary,
  revisitFeedbackTicket,
  applyManagedContentLifecycle,
  saveManagedContentDraft,
  listFeed,
  listItems,
  listNotifications,
  listNovels,
  markThreadRead,
  submitFeedbackTicket,
  markNotificationsRead,
  resolveShareShortLink,
  recognizeShareReturn,
  appendUserAssetLedgerEntry,
  resolveAccountSecurityPhoneNumber,
  resolveUploadAssetForUser,
  retryUploadPipeline,
  setAccountOperationCooldown,
  retryThreadMessage,
  completeUploadRecord,
  resolveChapterContent,
  resolveChapterList,
  resolveNovelDetail,
  sendThreadMessage,
  createMessageThread,
  syncMessageThread,
} from "./data";
import {
  checkAuthRateLimit,
  checkSecurityRateLimit,
  resolveClientId,
  type AuthRateLimitConfig,
  type AuthRateLimitDecision,
  type RateLimitCounterStore,
} from "./rate-limit";
import { renderSampleCoverAssetSvg, renderSampleProfileAssetSvg, renderSharePosterSvg, resolveProfileMedia } from "./sample-assets";
import { createD1ApiStore } from "./store.d1";
import { getGlobalMemoryApiStore } from "./store";
import type {
  ApiBindings,
  ApiStore,
  AuthOAuthCredentialRecord,
  AuthSecurityState,
  BackgroundJobRecord,
  OperationalAuditRecord,
  OperationalDomainKey,
  OperationalState,
  SessionRecord,
  UserState,
} from "./types";

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
  purpose: z.enum(["login", "guest_upgrade", "phone_binding", "change_phone", "password_reset", "account_security"]),
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
  purpose: z.enum(["login", "bind"]).optional(),
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

const identityBindOAuthSchema = z.object({
  provider: z.string().min(1),
  state: z.string().min(1),
  providerToken: z.string().min(8),
  providerUserId: z.string().min(1),
  mergeStrategy: z.enum(["prompt", "merge"]).optional(),
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
  workflowKind: z.enum(["guest_upgrade", "phone_binding", "oauth_binding"]).optional(),
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
  sort: z.string().min(1).optional(),
});

const contentActorRoleSchema = z.enum(["author", "reviewer", "admin", "reader"]);

const contentIdQuerySchema = z.object({
  contentId: z.string().min(1),
  actorRole: contentActorRoleSchema.optional(),
});

const contentReviewQueueQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  state: z.enum(["draft", "published", "offline", "under_review", "review_rejected", "deleted", "all"]).optional(),
  actorRole: contentActorRoleSchema.optional(),
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
  actorRole: contentActorRoleSchema.optional(),
});

const contentDraftSaveSchema = z.object({
  contentId: z.string().min(1).optional(),
  model: z.enum(["article", "course", "consultation_service", "tool_config", "post", "event", "novel_story"]),
  title: z.string().min(1).max(80),
  subtitle: z.string().min(1).max(120).optional(),
  summary: z.string().min(1).max(280),
  bodyPreview: z.string().min(1).max(2000).optional(),
  visibility: z.enum(["public", "login_required", "member_only", "purchased_only"]),
  categoryKey: z.string().min(1).max(64),
  categoryLabel: z.string().min(1).max(64),
  tags: z.array(z.object({ key: z.string().min(1), label: z.string().min(1) })).min(1),
  coverAssetId: z.string().min(1).optional(),
  attachmentAssetIds: z.array(z.string().min(1)).optional(),
  actorRole: contentActorRoleSchema.optional(),
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
  providerMode: z.enum(["sample", "production"]).optional(),
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
  provider: z.enum(["sample", "wechat_pay", "h5_gateway"]).optional(),
  gatewayTransactionId: z.string().min(1).optional(),
  nonce: z.string().min(1).optional(),
  timestamp: z.number().int().positive().optional(),
  signature: z.string().min(1).optional(),
});

const orderIdQuerySchema = z.object({
  orderId: z.string().min(1),
});

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  status: z.enum(["created", "pending_payment", "paid", "payment_failed", "closed", "cancelled", "refund_pending", "refunded"]).optional(),
  productType: z.enum(["one_time", "subscription", "membership", "value_added"]).optional(),
});

const purchaseOrderSchema = z.object({
  skuId: z.string().min(1),
  channel: z.enum(["wechat_pay", "h5_pay", "membership_purchase", "virtual_entitlement"]).optional(),
  providerMode: z.enum(["sample", "production"]).optional(),
  paymentScenario: z.enum(["instant_success", "pending"]).optional(),
  idempotencyKey: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  novelId: z.string().min(1).optional(),
  chapterId: z.string().min(1).optional(),
  subscriptionId: z.string().min(1).optional(),
});

const subscriptionOperationSchema = z.object({
  subscriptionId: z.string().min(1),
  skuId: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
});

const afterSalesDetailQuerySchema = z.object({
  caseId: z.string().min(1),
});

const threadIdQuerySchema = z.object({
  threadId: z.string().min(1),
  cursor: z.string().min(1).optional(),
});

const messageThreadListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  type: z.enum(["private", "consultation", "customer_service", "group", "all"]).optional(),
  onlyUnread: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sort: z.enum(["activity", "unread"]).optional(),
  sourceTicketId: z.string().min(1).optional(),
});

const updateAccountProfileSchema = z.object({
  nickname: z.string().min(1).max(32).optional(),
  region: z.string().min(1).max(64).optional(),
  bio: z.string().min(1).max(160).optional(),
  avatarAssetId: z.string().min(1).optional(),
});

const changeAccountPhoneSchema = z.object({
  phoneNumber: z.string().min(1),
  verificationCode: z.string().min(1),
  securityVerificationCode: z.string().min(1).optional(),
  riskConfirmed: z.boolean().optional(),
});

const accountUnbindSchema = z.object({
  provider: z.string().min(1),
  providerUserId: z.string().min(1).optional(),
  verificationCode: z.string().min(1).optional(),
  riskConfirmed: z.boolean().optional(),
});

const accountProviderRevokeSchema = z.object({
  provider: z.string().min(1),
  providerUserId: z.string().min(1),
  verificationCode: z.string().min(1).optional(),
  riskConfirmed: z.boolean().optional(),
  reason: z.string().min(1).optional(),
});

const accountCancellationSchema = z.object({
  action: z.enum(["request", "revoke"]).optional(),
  confirm: z.literal(true),
  verificationCode: z.string().min(1).optional(),
  riskConfirmed: z.boolean().optional(),
  reason: z.enum(["privacy", "switching", "other"]).optional(),
  details: z.string().min(1).optional(),
});

const relationActionSchema = z.object({
  targetUserId: z.string().min(1),
  action: z.enum(["follow", "unfollow", "block", "unblock", "set_remark", "clear_remark"]),
  remarkName: z.string().min(1).max(40).optional(),
  listKind: z.enum(["following", "followers", "friends", "blocked", "remarks"]).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  keyword: z.string().min(1).optional(),
});

const relationListQuerySchema = z.object({
  kind: z.enum(["following", "followers", "friends", "blocked", "remarks"]),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  keyword: z.string().min(1).optional(),
});

const assetHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  subject: z.enum(["points", "level", "balance", "membership", "entitlement", "all"]).optional(),
});

const sendMessageSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1),
});

const createMessageThreadSchema = z.object({
  type: z.enum(["private", "consultation", "customer_service", "group"]),
  title: z.string().min(1).optional(),
  participantUserIds: z.array(z.string().min(1)).optional(),
  sourceTicketId: z.string().min(1).optional(),
  replyPolicy: z.enum(["open", "members_only", "support_only", "readonly"]).optional(),
});

const markThreadReadSchema = z.object({
  threadId: z.string().min(1),
});

const retryMessageSchema = z.object({
  threadId: z.string().min(1),
  messageId: z.string().min(1),
});

const feedbackTicketIdQuerySchema = z.object({
  ticketId: z.string().min(1),
});

const feedbackTicketListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  state: z.enum(["submitted", "triaged", "in_progress", "waiting_user", "resolved", "closed", "all"]).optional(),
  categoryKey: z.string().min(1).optional(),
  keyword: z.string().min(1).optional(),
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
    checksum: z.string().min(1).optional(),
    checksumAlgorithm: z.enum(["sha256"]).optional(),
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
  transferMode: z.enum(["single_part", "chunked"]).optional(),
  sessionId: z.string().min(1).optional(),
  chunkCount: z.number().int().nonnegative().optional(),
  uploadedChunkCount: z.number().int().nonnegative().optional(),
  integrity: z
    .object({
      checksumAlgorithm: z.enum(["sha256"]),
      fileChecksum: z.string().min(1),
      expectedSizeBytes: z.number().int().nonnegative(),
    })
    .optional(),
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
  transfer: z
    .object({
      mode: z.enum(["single_part", "chunked"]),
      checksumAlgorithm: z.enum(["sha256"]),
      fileChecksum: z.string().min(1),
      totalBytes: z.number().int().nonnegative(),
      chunkSizeBytes: z.number().int().positive(),
      chunks: z.array(
        z.object({
          chunkIndex: z.number().int().nonnegative(),
          byteOffset: z.number().int().nonnegative(),
          byteLength: z.number().int().nonnegative(),
          checksum: z.string().min(1),
          checksumAlgorithm: z.enum(["sha256"]),
          dataBase64: z.string().min(1),
        }),
      ),
    })
    .optional(),
});

const uploadSessionRequestSchema = z.object({
  scenario: z.enum(["content", "avatar", "attachment"]),
  selection: uploadSelectionResultSchema,
});

const uploadChunkRequestSchema = z.object({
  taskId: z.string().min(1),
  sessionId: z.string().min(1),
  chunk: z.object({
    chunkIndex: z.number().int().nonnegative(),
    byteOffset: z.number().int().nonnegative(),
    byteLength: z.number().int().nonnegative(),
    checksum: z.string().min(1),
    checksumAlgorithm: z.enum(["sha256"]),
    dataBase64: z.string().min(1),
  }),
});

const uploadCompleteSchema = z.object({
  taskId: z.string().min(1),
  sessionId: z.string().min(1),
  fileChecksum: z.string().min(1),
  checksumAlgorithm: z.enum(["sha256"]),
});

const uploadAttachSchema = z
  .object({
    taskId: z.string().min(1).optional(),
    assetId: z.string().min(1).optional(),
    reference: z.object({
      ownerType: z.enum(["feedback", "content", "avatar"]),
      ownerId: z.string().min(1),
      role: z.string().min(1),
    }),
  })
  .refine((value) => Boolean(value.taskId || value.assetId), {
    message: "Either taskId or assetId is required.",
    path: ["taskId"],
  });

const uploadRetrySchema = z.object({
  taskId: z.string().min(1),
});

const uploadCancelSchema = z.object({
  taskId: z.string().min(1),
  reason: z.string().min(1).optional(),
});

const opsDiagnosticsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  includeCompletedJobs: z.coerce.boolean().optional(),
});

const opsRunJobsRequestSchema = z.object({
  kind: z.enum(["upload_cleanup", "payment_reconciliation", "notification_retry", "cancellation_expiry"]).optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const settingsUpdateSchema = z.object({
  preferences: z
    .object({
      notificationsEnabled: z.boolean().optional(),
      device: z
        .object({
          networkStrategy: z.enum(["balanced", "wifi-first", "data-saver"]).optional(),
          autoplay: z.boolean().optional(),
          weakNetworkMode: z.boolean().optional(),
        })
        .optional(),
      developerOptions: z
        .object({
          logsEnabled: z.boolean().optional(),
          experimentsEnabled: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  featureToggles: z
    .object({
      pushEnabled: z.boolean().optional(),
      smsEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
    })
    .optional(),
  notificationChannels: z
    .array(
      z.object({
        channel: z.enum(["subscription_message", "sms", "email", "push"]),
        enabled: z.boolean().optional(),
        unsubscribed: z.boolean().optional(),
      }),
    )
    .optional(),
  privacyOptions: z
    .object({
      profileVisibility: z.enum(["signed_in_only", "followers_only", "public"]).optional(),
      personalizedRecommendations: z.boolean().optional(),
      searchHistoryEnabled: z.boolean().optional(),
      analyticsEnabled: z.boolean().optional(),
      screenshotFeedbackEnabled: z.boolean().optional(),
    })
    .optional(),
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
  shortCode: z.string().min(1).optional(),
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
  returnCount: z.number().int().nonnegative(),
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

const shareResolveSchema = z.object({
  attributionId: z.string().min(1).optional(),
  shortCode: z.string().min(1).optional(),
});

const shareAttributionReportSchema = z.object({
  attributionId: z.string().min(1),
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

const feedbackTicketAssigneeSchema = z.object({
  userId: z.string().min(1),
  label: z.string().min(1),
  teamLabel: z.string().min(1).optional(),
  assignedAt: z.string().min(1).optional(),
});

const feedbackTicketSlaSchema = z.object({
  policyKey: z.string().min(1),
  label: z.string().min(1),
  deadlineAt: z.string().min(1),
  breached: z.boolean(),
  updatedAt: z.string().min(1).optional(),
});

const feedbackTicketActionSchema = z.object({
  ticketId: z.string().min(1),
  state: z.enum(["triaged", "in_progress", "waiting_user", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  labels: z.array(z.string().min(1)).optional(),
  assignee: feedbackTicketAssigneeSchema.optional(),
  queueKey: z.string().min(1).optional(),
  queueLabel: z.string().min(1).optional(),
  sla: feedbackTicketSlaSchema.optional(),
  note: z.string().min(1).optional(),
  supportReply: z.string().min(1).optional(),
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
const ACCOUNT_OPERATION_COOLDOWN_MS = 10 * 60 * 1000;
const ACCOUNT_CANCELLATION_COOLING_OFF_MS = 7 * 24 * 60 * 60 * 1000;

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
    devicesById: {},
    auditEvents: [],
    rateLimitStatesByScope: {},
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
  userState.authSecurity.devicesById ??= {};
  userState.authSecurity.auditEvents ??= [];
  userState.authSecurity.rateLimitStatesByScope ??= {};
  return userState.authSecurity;
}

function createSecurityPrompt(input: {
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

function upsertDeviceIdentity(input: {
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
    ...(trusted ? { trustedAt: existing?.trustedAt ?? input.now } : existing?.trustedAt ? { trustedAt: existing.trustedAt } : {}),
    ...(input.userAgent ? { lastUserAgent: input.userAgent } : existing?.lastUserAgent ? { lastUserAgent: existing.lastUserAgent } : {}),
    ...(input.ipRegion ? { lastIpRegion: input.ipRegion } : existing?.lastIpRegion ? { lastIpRegion: existing.lastIpRegion } : {}),
    ...(input.scene ? { lastScene: input.scene } : existing?.lastScene ? { lastScene: existing.lastScene } : {}),
    ...(input.riskDecision?.level ? { riskLevel: input.riskDecision.level } : existing?.riskLevel ? { riskLevel: existing.riskLevel } : {}),
  };
  security.devicesById[input.deviceId] = next;
  return next;
}

function resolveRequestDeviceId(c: Context): string | undefined {
  const value = c.req.header("x-device-id") ?? c.req.header("x-minix-device-id");
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function setLatestSecurityPrompt(userState: UserState, prompt: AuthSecurityPrompt | undefined) {
  if (!prompt) {
    return;
  }

  ensureAuthSecurityState(userState).latestPrompt = prompt;
}

function getRecentSecurityAuditEvents(userState: UserState, limit = 5): AuthSecurityAuditEvent[] {
  return ensureAuthSecurityState(userState).auditEvents.slice(0, limit);
}

async function guardSecurityRateLimit(input: {
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

function createRateLimitState(input: {
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

function recordRateLimitState(input: {
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

function appendSecurityAuditEvent(input: {
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

function evaluateSecurityDecision(input: {
  userState: UserState;
  platform: LoginPlatformKind;
  deviceId?: string;
  riskContext?: z.infer<typeof authRiskContextSchema>;
  scope: AuthSecurityAuditEvent["scope"];
  forceReview?: boolean;
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
    ...(input.riskContext?.frequencyKey ? { frequencyKey: input.riskContext.frequencyKey } : {}),
    ...(input.riskContext?.scene ? { scene: input.riskContext.scene } : {}),
    level: suspicious ? "review" : "allow",
    ...(suspicious ? { reason: existingDevice ? "unusual_device_or_region" : "new_device" } : {}),
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

function createRandomCode(): string {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String((value[0] ?? 0) % 1_000_000).padStart(6, "0");
}

function createRandomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function cloneOperationalState(state: OperationalState): OperationalState {
  return structuredClone(state);
}

function appendOperationalMonitoringEvent(
  state: OperationalState,
  input: Omit<OperationalState["monitoringEvents"][number], "eventId">,
) {
  const event = {
    eventId: createRandomId("ops_event"),
    ...input,
  };
  state.monitoringEvents = [event, ...state.monitoringEvents].slice(0, 100);
  return event;
}

function appendOperationalAuditRecord(
  state: OperationalState,
  input: Omit<OperationalAuditRecord, "auditId">,
) {
  const audit = {
    auditId: createRandomId("ops_audit"),
    ...input,
  };
  state.auditTrail = [audit, ...state.auditTrail].slice(0, 200);
  return audit;
}

function upsertOperationalDomainSchema(
  state: OperationalState,
  input: {
    domain: OperationalDomainKey;
    recordCount: number;
    nowIso: string;
    lastRecordId?: string;
  },
) {
  const existing = state.domainSchemas.find((item) => item.domain === input.domain);
  if (existing) {
    existing.recordCount = input.recordCount;
    existing.lastBackfilledAt = input.nowIso;
    if (input.lastRecordId !== undefined) {
      existing.lastRecordId = input.lastRecordId;
    }
    return;
  }

  state.domainSchemas.push({
    domain: input.domain,
    schemaVersion: 1,
    recordCount: input.recordCount,
    lastBackfilledAt: input.nowIso,
    ...(input.lastRecordId !== undefined ? { lastRecordId: input.lastRecordId } : {}),
  });
}

function countFailedNotificationRetries(userState: UserState): number {
  const failedThreadMessages = Object.values(userState.threadRecordsById)
    .flatMap((record) => record.messages)
    .filter((message) => message.deliveryStatus === "failed" && message.retryable).length;
  const failedNotificationReceipts = Object.values(userState.notificationTouchpointReceiptsByNotificationId ?? {})
    .flatMap((entry) => Object.values(entry))
    .filter((receipt) => receipt.status === "failed" && receipt.retryable).length;
  return failedThreadMessages + failedNotificationReceipts;
}

function syncOperationalDomainSchemas(
  state: OperationalState,
  input: {
    userId: string;
    userState: UserState;
    nowIso: string;
    sessionCount?: number;
  },
) {
  const { userState, nowIso } = input;
  upsertOperationalDomainSchema(state, {
    domain: "sessions",
    recordCount: input.sessionCount ?? 1,
    nowIso,
    lastRecordId: input.userId,
  });
  upsertOperationalDomainSchema(state, {
    domain: "credentials",
    recordCount:
      Object.keys(userState.authSecurity?.passwordCredentialsBySubject ?? {}).length +
      Object.keys(userState.authSecurity?.oauthCredentialsByProviderSubject ?? {}).length +
      Object.keys(userState.authSecurity?.phoneVerificationsById ?? {}).length,
    nowIso,
  });
  upsertOperationalDomainSchema(state, {
    domain: "orders",
    recordCount: Object.keys(userState.ordersById).length,
    nowIso,
    ...(userState.latestPaidOrderId ? { lastRecordId: userState.latestPaidOrderId } : {}),
  });
  upsertOperationalDomainSchema(state, {
    domain: "uploads",
    recordCount: Object.keys(userState.uploadsByTaskId).length,
    nowIso,
  });
  upsertOperationalDomainSchema(state, {
    domain: "messages",
    recordCount:
      Object.keys(userState.threadRecordsById).length +
      Object.values(userState.threadRecordsById).reduce((sum, record) => sum + record.messages.length, 0),
    nowIso,
  });
  upsertOperationalDomainSchema(state, {
    domain: "content",
    recordCount: Object.keys(userState.managedContentById ?? {}).length,
    nowIso,
  });
  upsertOperationalDomainSchema(state, {
    domain: "feedback",
    recordCount: userState.feedbackTicketIds.length,
    nowIso,
    ...(userState.latestFeedbackTicketId ? { lastRecordId: userState.latestFeedbackTicketId } : {}),
  });
  upsertOperationalDomainSchema(state, {
    domain: "audit_events",
    recordCount:
      (userState.authSecurity?.auditEvents.length ?? 0) +
      userState.operationRecords.length +
      state.auditTrail.length,
    nowIso,
  });
}

function ensureOperationalBackfill(state: OperationalState, nowIso: string) {
  if (state.migrations.some((item) => item.migrationId === "user_state_backfill_v1")) {
    return;
  }

  const backfillMigration: OperationalState["migrations"][number] = {
    migrationId: "user_state_backfill_v1",
    target: "user_state",
    fromVersion: 0,
    toVersion: 1,
    status: "completed",
    appliedAt: nowIso,
    note: "Backfilled operational governance metadata from persisted user state records.",
  };

  state.migrations = [
    backfillMigration,
    ...state.migrations,
  ].slice(0, 50);
}

function scheduleOperationalJob(
  state: OperationalState,
  input: {
    kind: BackgroundJobRecord["kind"];
    userId: string;
    dedupeKey: string;
    scheduledAt: string;
    relatedRecordId?: string;
    maxAttempts?: number;
  },
) {
  const existing = state.backgroundJobs.find(
    (job) => job.userId === input.userId && job.kind === input.kind && job.dedupeKey === input.dedupeKey && job.status !== "failed",
  );
  if (existing) {
    return existing;
  }

  const job: BackgroundJobRecord = {
    jobId: createRandomId("job"),
    kind: input.kind,
    status: "queued",
    userId: input.userId,
    dedupeKey: input.dedupeKey,
    ...(input.relatedRecordId ? { relatedRecordId: input.relatedRecordId } : {}),
    scheduledAt: input.scheduledAt,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
  };
  state.backgroundJobs = [job, ...state.backgroundJobs].slice(0, 200);
  appendOperationalAuditRecord(state, {
    category: "job",
    action: "job_scheduled",
    message: `${job.kind} scheduled for ${job.userId}.`,
    createdAt: input.scheduledAt,
    userId: input.userId,
    ...(job.relatedRecordId ? { recordId: job.relatedRecordId } : {}),
    metadata: {
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
    },
  });
  return job;
}

async function scheduleOperationalJobForUser(
  store: ApiStore,
  input: {
    userId: string;
    userState: UserState;
    kind: BackgroundJobRecord["kind"];
    dedupeKey: string;
    relatedRecordId?: string;
    scheduledAt?: string;
    maxAttempts?: number;
  },
) {
  const scheduledAt = input.scheduledAt ?? new Date().toISOString();
  const operationalState = cloneOperationalState(await store.getOperationalState());
  ensureOperationalBackfill(operationalState, scheduledAt);
  syncOperationalDomainSchemas(operationalState, {
    userId: input.userId,
    userState: input.userState,
    nowIso: scheduledAt,
  });
  const job = scheduleOperationalJob(operationalState, {
    kind: input.kind,
    userId: input.userId,
    dedupeKey: input.dedupeKey,
    scheduledAt,
    ...(input.relatedRecordId ? { relatedRecordId: input.relatedRecordId } : {}),
    ...(input.maxAttempts !== undefined ? { maxAttempts: input.maxAttempts } : {}),
  });
  await store.saveOperationalState(operationalState);
  return job;
}

async function runOperationalJobs(
  store: ApiStore,
  input: {
    userId: string;
    kind?: BackgroundJobRecord["kind"];
    limit?: number;
  },
) {
  const nowIso = new Date().toISOString();
  const userState = await store.getUserState(input.userId);
  const operationalState = cloneOperationalState(await store.getOperationalState());
  ensureOperationalBackfill(operationalState, nowIso);
  syncOperationalDomainSchemas(operationalState, {
    userId: input.userId,
    userState,
    nowIso,
  });

  const runnable = operationalState.backgroundJobs
    .filter((job) => {
      if (job.userId !== input.userId) {
        return false;
      }
      if (input.kind && job.kind !== input.kind) {
        return false;
      }
      if (!(job.status === "queued" || job.status === "failed")) {
        return false;
      }
      if (Date.parse(job.scheduledAt) > Date.now()) {
        return false;
      }
      return true;
    })
    .slice(0, input.limit ?? 20);

  for (const job of runnable) {
    job.status = "running";
    job.startedAt = nowIso;
    job.attempts += 1;

    try {
      switch (job.kind) {
        case "upload_cleanup": {
          const record = job.relatedRecordId ? userState.uploadsByTaskId[job.relatedRecordId] : undefined;
          if (!record) {
            job.status = "skipped";
            job.lastResult = "Upload record is already absent.";
            break;
          }
          if (record.cleanupRecord?.referenced || record.references.length > 0) {
            job.status = "skipped";
            job.lastResult = "Upload is still referenced and cannot be cleaned up.";
            break;
          }
          if (record.uploadTask.lifecycle.retentionStatus === "expired") {
            job.status = "skipped";
            job.lastResult = "Upload cleanup already completed.";
            break;
          }
          record.uploadTask.lifecycle.retentionStatus = "expired";
          record.uploadTask.lifecycle.canCancel = false;
          record.binaryByChunkIndex = {};
          delete record.binaryObjectKey;
          record.cleanupRecord = {
            retentionStatus: "expired",
            cleanupScheduledAt: record.cleanupRecord?.cleanupScheduledAt ?? nowIso,
            cleanupReason: record.cleanupRecord?.cleanupReason ?? "background_cleanup",
            referenced: false,
          };
          job.status = "completed";
          job.lastResult = "Upload cleanup completed.";
          break;
        }
        case "payment_reconciliation": {
          const order = job.relatedRecordId ? userState.ordersById[job.relatedRecordId] : undefined;
          if (!order) {
            job.status = "skipped";
            job.lastResult = "Order record is already absent.";
            break;
          }
          if (order.reconciliation?.status === "reconciled") {
            job.status = "skipped";
            job.lastResult = "Order is already reconciled.";
            break;
          }
          userState.ordersById[order.order.orderId] = applyPaymentReconciliation(order);
          job.status = "completed";
          job.lastResult = "Payment reconciliation completed.";
          break;
        }
        case "notification_retry": {
          const messageId = job.relatedRecordId;
          const targetThreadId = Object.values(userState.threadRecordsById).find((record) =>
            record.messages.some((message) => message.messageId === messageId),
          )?.thread.threadId;
          if (!messageId || !targetThreadId) {
            job.status = "skipped";
            job.lastResult = "Notification retry target is already absent.";
            break;
          }
          const retried = retryThreadMessage(userState, {
            threadId: targetThreadId,
            messageId,
          });
          if (!retried) {
            job.status = "skipped";
            job.lastResult = "Notification retry target is no longer retryable.";
            break;
          }
          job.status = "completed";
          job.lastResult = "Notification retry queued again.";
          break;
        }
        case "cancellation_expiry": {
          if (!userState.pendingCancellation) {
            job.status = "skipped";
            job.lastResult = "Cancellation expiry already finalized.";
            break;
          }
          userState.availabilityStatus = "frozen";
          delete userState.pendingCancellation;
          appendAccountOperationRecord(userState, {
            kind: "request_cancellation",
            status: "completed",
            actorLabel: "MiniX Operations",
            message: "Cancellation cooling-off window expired and the account moved into a frozen archival state.",
            notificationHookLabel: "notify:cancellation_finalized",
          });
          job.status = "completed";
          job.lastResult = "Cancellation expiry finalized.";
          break;
        }
      }
    } catch (error) {
      job.status = job.attempts >= job.maxAttempts ? "failed" : "queued";
      job.lastError = error instanceof Error ? error.message : "unknown operational job failure";
      appendOperationalMonitoringEvent(operationalState, {
        level: "error",
        scope: "job",
        message: `${job.kind} failed: ${job.lastError}`,
        createdAt: nowIso,
        jobId: job.jobId,
        userId: job.userId,
        dedupeKey: job.dedupeKey,
      });
    }

    job.completedAt = nowIso;
    appendOperationalAuditRecord(operationalState, {
      category: "job",
      action: `job_${job.status}`,
      message: `${job.kind} ${job.status}.`,
      createdAt: nowIso,
      userId: job.userId,
      ...(job.relatedRecordId ? { recordId: job.relatedRecordId } : {}),
      metadata: {
        attempts: job.attempts,
        ...(job.lastResult ? { result: job.lastResult } : {}),
      },
    });
  }

  operationalState.lastSweepAt = nowIso;
  syncOperationalDomainSchemas(operationalState, {
    userId: input.userId,
    userState,
    nowIso,
  });
  await store.saveUserState(input.userId, userState);
  await store.saveOperationalState(operationalState);

  return {
    userState,
    operationalState,
    jobs: runnable,
  };
}

function createOperationalDiagnosticsResponse(
  userState: UserState,
  operationalState: OperationalState,
  input: {
    limit?: number;
    includeCompletedJobs?: boolean;
  } = {},
) {
  const limit = input.limit ?? 20;
  const backgroundJobs = operationalState.backgroundJobs
    .filter((job) => input.includeCompletedJobs || (job.status !== "completed" && job.status !== "skipped"))
    .slice(0, limit);
  return {
    schemaVersion: operationalState.schemaVersion,
    ...(operationalState.lastSweepAt ? { lastSweepAt: operationalState.lastSweepAt } : {}),
    domainSchemas: operationalState.domainSchemas,
    migrations: operationalState.migrations.slice(0, limit),
    backgroundJobs,
    monitoringEvents: operationalState.monitoringEvents.slice(0, limit),
    auditTrail: operationalState.auditTrail.slice(0, limit),
    governance: {
      queuedJobs: operationalState.backgroundJobs.filter((job) => job.status === "queued").length,
      failedJobs: operationalState.backgroundJobs.filter((job) => job.status === "failed").length,
      retryableNotifications: countFailedNotificationRetries(userState),
      appliedMigrations: operationalState.migrations.filter((migration) => migration.status === "completed").length,
    },
  };
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

function createOAuthIndexUserId(provider: string, providerUserId: string): string {
  return `oauth_index_${createOAuthSubject(provider, providerUserId)}`;
}

function createOAuthProviderLabel(provider: string): string {
  if (provider === "wechat-open-platform") {
    return "WeChat Open Platform";
  }

  return provider
    .split(/[-_]+/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function createOAuthCredentialRecord(input: {
  provider: string;
  providerUserId: string;
  userId: string;
  tokenHash: string;
  now: number;
  authorizationStatus?: AuthOAuthCredentialRecord["authorizationStatus"];
  revokedAt?: number;
  revocationReason?: string;
  existing?: AuthOAuthCredentialRecord;
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

async function loadOAuthCredentialLink(
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

async function saveOAuthCredentialLink(input: {
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
    ...(input.authorizationStatus && input.authorizationStatus !== "active" ? { revokedAt: input.now } : {}),
    ...(input.revocationReason ? { revocationReason: input.revocationReason } : {}),
    ...(record ? { existing: record } : {}),
  });
  ensureAuthSecurityState(indexState).oauthCredentialsByProviderSubject[subject] = nextRecord;
  await input.store.saveUserState(indexUserId, indexState);
  return { subject, indexUserId, indexState, record: nextRecord };
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
      ...(asset.metadata.checksum !== undefined ? { checksum: asset.metadata.checksum } : {}),
      ...(asset.metadata.checksumAlgorithm !== undefined ? { checksumAlgorithm: asset.metadata.checksumAlgorithm } : {}),
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

function normalizeUploadSelectionResult(payload: z.infer<typeof uploadSelectionResultSchema>) {
  return {
    uploadTask: {
      taskId: payload.uploadTask.taskId,
      scenario: payload.uploadTask.scenario,
      fileType: payload.uploadTask.fileType,
      stage: payload.uploadTask.stage,
      ...(payload.uploadTask.fileName !== undefined ? { fileName: payload.uploadTask.fileName } : {}),
      progress: {
        completedBytes: payload.uploadTask.progress.completedBytes,
        totalBytes: payload.uploadTask.progress.totalBytes,
        percentage: payload.uploadTask.progress.percentage,
      },
      chunkingReserved: payload.uploadTask.chunkingReserved,
      ...(payload.uploadTask.transferMode !== undefined ? { transferMode: payload.uploadTask.transferMode } : {}),
      ...(payload.uploadTask.sessionId !== undefined ? { sessionId: payload.uploadTask.sessionId } : {}),
      ...(payload.uploadTask.chunkCount !== undefined ? { chunkCount: payload.uploadTask.chunkCount } : {}),
      ...(payload.uploadTask.uploadedChunkCount !== undefined
        ? { uploadedChunkCount: payload.uploadTask.uploadedChunkCount }
        : {}),
      ...(payload.uploadTask.integrity !== undefined
        ? {
            integrity: {
              checksumAlgorithm: payload.uploadTask.integrity.checksumAlgorithm,
              fileChecksum: payload.uploadTask.integrity.fileChecksum,
              expectedSizeBytes: payload.uploadTask.integrity.expectedSizeBytes,
            },
          }
        : {}),
      governance: {
        maxSizeBytes: payload.uploadTask.governance.maxSizeBytes,
        acceptedFileTypes: [...payload.uploadTask.governance.acceptedFileTypes],
        sensitiveReviewRequired: payload.uploadTask.governance.sensitiveReviewRequired,
        ...(payload.uploadTask.governance.expiresInDays !== undefined
          ? { expiresInDays: payload.uploadTask.governance.expiresInDays }
          : {}),
      },
      reviewStatus: payload.uploadTask.reviewStatus,
      ...(payload.uploadTask.reviewMessage !== undefined ? { reviewMessage: payload.uploadTask.reviewMessage } : {}),
      lifecycle: {
        backendBacked: payload.uploadTask.lifecycle.backendBacked,
        retentionStatus: payload.uploadTask.lifecycle.retentionStatus,
        retryCount: payload.uploadTask.lifecycle.retryCount,
        canRetry: payload.uploadTask.lifecycle.canRetry,
        canCancel: payload.uploadTask.lifecycle.canCancel,
        ...(payload.uploadTask.lifecycle.lastTransitionAt !== undefined
          ? { lastTransitionAt: payload.uploadTask.lifecycle.lastTransitionAt }
          : {}),
        ...(payload.uploadTask.lifecycle.expiresAt !== undefined
          ? { expiresAt: payload.uploadTask.lifecycle.expiresAt }
          : {}),
      },
    },
    ...(payload.uploadAsset !== undefined ? { uploadAsset: normalizeUploadAsset(payload.uploadAsset) } : {}),
    ...(payload.uploadError !== undefined
      ? {
          uploadError: {
            code: payload.uploadError.code,
            message: payload.uploadError.message,
            recoverable: payload.uploadError.recoverable,
            retryable: payload.uploadError.retryable,
            stage: payload.uploadError.stage,
          },
        }
      : {}),
    ...(payload.transfer !== undefined
      ? {
          transfer: {
            mode: payload.transfer.mode,
            checksumAlgorithm: payload.transfer.checksumAlgorithm,
            fileChecksum: payload.transfer.fileChecksum,
            totalBytes: payload.transfer.totalBytes,
            chunkSizeBytes: payload.transfer.chunkSizeBytes,
            chunks: payload.transfer.chunks.map((chunk) => ({
              chunkIndex: chunk.chunkIndex,
              byteOffset: chunk.byteOffset,
              byteLength: chunk.byteLength,
              checksum: chunk.checksum,
              checksumAlgorithm: chunk.checksumAlgorithm,
              dataBase64: chunk.dataBase64,
            })),
          },
        }
      : {}),
  };
}

function normalizeUploadSessionRequest(
  payload: z.infer<typeof uploadSessionRequestSchema>,
): UploadPipelineRequest {
  return {
    scenario: payload.scenario,
    selection: normalizeUploadSelectionResult(payload.selection),
  };
}

function normalizeUploadChunkRequest(payload: z.infer<typeof uploadChunkRequestSchema>) {
  return {
    taskId: payload.taskId,
    sessionId: payload.sessionId,
    chunk: {
      chunkIndex: payload.chunk.chunkIndex,
      byteOffset: payload.chunk.byteOffset,
      byteLength: payload.chunk.byteLength,
      checksum: payload.chunk.checksum,
      checksumAlgorithm: payload.chunk.checksumAlgorithm,
      dataBase64: payload.chunk.dataBase64,
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
        ...(payload.sharePayload.landingTarget.shortCode !== undefined
          ? { shortCode: payload.sharePayload.landingTarget.shortCode }
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
      returnCount: payload.shareAttribution.returnCount,
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

  if (kind === "oauth_binding") {
    return status === "completed"
      ? targetLabel
        ? `${targetLabel} is now linked to the current account.`
        : "The OAuth provider is now linked to the current account."
      : "The OAuth provider requires account merge confirmation.";
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
    deviceIdentity?: AuthDeviceIdentity | undefined;
    identityWorkflow?: AuthIdentityWorkflow | undefined;
    rateLimitState?: AuthRateLimitState | undefined;
    redirectTarget?: AuthRedirectTarget | undefined;
    riskDecision?: AuthRiskDecision | undefined;
    securityAuditEvents?: AuthSecurityAuditEvent[] | undefined;
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
    ...(options.deviceIdentity ? { deviceIdentity: options.deviceIdentity } : {}),
    ...(options.identityWorkflow ? { identityWorkflow: options.identityWorkflow } : {}),
    ...(options.rateLimitState ? { rateLimitState: options.rateLimitState } : {}),
    ...(options.redirectTarget ? { redirectTarget: options.redirectTarget } : {}),
    ...(options.riskDecision ? { riskDecision: options.riskDecision } : {}),
    ...(options.securityAuditEvents ? { securityAuditEvents: options.securityAuditEvents } : {}),
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

function createOperationBlockedResponse(input: {
  userState: UserState;
  kind: "change_phone" | "unbind_wechat" | "unlink_provider" | "revoke_provider" | "request_cancellation" | "revoke_cancellation";
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

  return createAccountOperationResponse(input.session, input.userState, input.requestUrl, input.message);
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
  const latestPrompt = target.authSecurity?.latestPrompt ?? source.authSecurity?.latestPrompt;
  return {
    ...(target.membershipPlanId ?? source.membershipPlanId
      ? { membershipPlanId: target.membershipPlanId ?? source.membershipPlanId }
      : {}),
    assetLedgerEntries: [...(source.assetLedgerEntries ?? []), ...(target.assetLedgerEntries ?? [])],
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
    threadRecordsById: {
      ...source.threadRecordsById,
      ...target.threadRecordsById,
    },
    operationRecords: [...(target.operationRecords ?? []), ...(source.operationRecords ?? [])].slice(0, 20),
    operationCooldownsByKind: {
      ...(source.operationCooldownsByKind ?? {}),
      ...(target.operationCooldownsByKind ?? {}),
    },
    ...(target.pendingCancellation ?? source.pendingCancellation
      ? { pendingCancellation: target.pendingCancellation ?? source.pendingCancellation }
      : {}),
    feedbackDetailsById: {
      ...source.feedbackDetailsById,
      ...target.feedbackDetailsById,
    },
    feedbackTicketIds: [...(source.feedbackTicketIds ?? []), ...(target.feedbackTicketIds ?? [])].filter(
      (ticketId, index, values) => values.indexOf(ticketId) === index,
    ),
    feedbackFaqCatalog:
      (target.feedbackFaqCatalog?.length ?? 0) > 0
        ? target.feedbackFaqCatalog
        : source.feedbackFaqCatalog,
    feedbackSupportEntries:
      (target.feedbackSupportEntries?.length ?? 0) > 0
        ? target.feedbackSupportEntries
        : source.feedbackSupportEntries,
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
    afterSalesById: {
      ...source.afterSalesById,
      ...target.afterSalesById,
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
    ...(target.relationRecordsByUserId ?? source.relationRecordsByUserId
      ? {
          relationRecordsByUserId: {
            ...(source.relationRecordsByUserId ?? {}),
            ...(target.relationRecordsByUserId ?? {}),
          },
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
            devicesById: {
              ...(source.authSecurity?.devicesById ?? {}),
              ...(target.authSecurity?.devicesById ?? {}),
            },
            auditEvents: [...(target.authSecurity?.auditEvents ?? []), ...(source.authSecurity?.auditEvents ?? [])].slice(0, 50),
            rateLimitStatesByScope: {
              ...(source.authSecurity?.rateLimitStatesByScope ?? {}),
              ...(target.authSecurity?.rateLimitStatesByScope ?? {}),
            },
            ...(latestPrompt ? { latestPrompt } : {}),
          },
        }
      : {}),
  };
}

function cloneOrderDetail(detail: OrderDetailResponse): OrderDetailResponse {
  return structuredClone(detail);
}

function createPaymentWebhookSignature(input: {
  secret: string;
  orderId: string;
  outcome: string;
  callbackReference: string;
  nonce: string;
  timestamp: number;
  gatewayTransactionId?: string | undefined;
}): string {
  return createHmac("sha256", input.secret)
    .update([
      input.orderId,
      input.outcome,
      input.callbackReference,
      input.nonce,
      String(input.timestamp),
      input.gatewayTransactionId ?? "",
    ].join("\n"))
    .digest("hex");
}

function createLedgerId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function createPaymentLedgerEntry(input: {
  kind: PaymentLedgerEntry["kind"];
  order: OrderDetailResponse["order"];
  status: string;
  message: string;
  createdAt: string;
  gatewayReference?: PaymentGatewayReference | undefined;
}): PaymentLedgerEntry {
  return {
    ledgerId: createLedgerId("ledger"),
    kind: input.kind,
    orderId: input.order.orderId,
    amountCents: input.order.totalAmountCents,
    currency: input.order.currency,
    status: input.status,
    ...(input.gatewayReference ? { gatewayReference: input.gatewayReference } : {}),
    message: input.message,
    createdAt: input.createdAt,
  };
}

function appendOperationLedger(detail: OrderDetailResponse, entry: PaymentLedgerEntry) {
  detail.operationLedger = [...(detail.operationLedger ?? []), entry];
}

function appendPaymentLedger(detail: OrderDetailResponse, entry: PaymentLedgerEntry) {
  detail.paymentLedger = [...(detail.paymentLedger ?? []), entry];
}

function appendReconciliationLedger(detail: OrderDetailResponse, entry: PaymentReconciliationLedgerEntry) {
  detail.reconciliationLedger = [...(detail.reconciliationLedger ?? []), entry];
}

function appendCallbackLedger(detail: OrderDetailResponse, entry: PaymentCallbackLedgerEntry) {
  detail.callbackLedger = [...(detail.callbackLedger ?? []), entry];
}

function resolveMembershipPlanIdFromOrder(detail: OrderDetailResponse): PurchaseMembershipRequest["planId"] | undefined {
  const membershipSkuId = detail.sku?.skuId ?? detail.order.lineItems.find((item) => item.productType === "membership")?.skuId ?? "";
  return membershipSkuId.endsWith("_annual")
    ? "annual"
    : membershipSkuId.endsWith("_monthly")
      ? "monthly"
      : membershipSkuId.endsWith("_quarterly")
        ? "quarterly"
        : undefined;
}

function createAssetLedgerEntitlement(detail: OrderDetailResponse, status: NonNullable<UserAssetLedgerEntry["entitlement"]>["status"]) {
  if (!detail.entitlement) {
    return undefined;
  }

  const planId = resolveMembershipPlanIdFromOrder(detail);
  const membershipEntitlement =
    detail.entitlement.productType === "membership" && "overview" in detail.entitlement
      ? (detail.entitlement as MembershipEntitlement)
      : undefined;
  return {
    entitlementId: detail.entitlement.entitlementId,
    key: detail.sku?.entitlementKey ?? `${detail.entitlement.productType}:${detail.order.orderId}`,
    label:
      membershipEntitlement && planId
        ? membershipEntitlement.overview.headline
        : detail.product?.title ?? detail.order.title,
    status,
    active: status === "active",
    productType: detail.entitlement.productType,
    ...(planId ? { planId } : {}),
    sourceOrderId: detail.order.orderId,
    ...(detail.subscription?.renewsAt ? { expiresAt: detail.subscription.renewsAt } : {}),
  } satisfies NonNullable<UserAssetLedgerEntry["entitlement"]>;
}

function resolveEntitlementLedgerSubject(detail: OrderDetailResponse): UserAssetLedgerEntry["subject"] {
  return detail.entitlement?.productType === "membership" ? "membership" : "entitlement";
}

function appendPaymentAssetLedgerEntries(input: {
  userState: UserState;
  detail: OrderDetailResponse;
  action: "purchase_paid" | "purchase_pending" | "cancel_pending" | "refund_paid" | "callback_success" | "callback_failure" | "callback_cancelled";
}): string[] {
  const planId = resolveMembershipPlanIdFromOrder(input.detail);
  const amountCents = input.detail.order.totalAmountCents;
  const createdAt = input.detail.order.updatedAt;
  const ledgerIds: string[] = [];
  const append = (entry: Omit<UserAssetLedgerEntry, "ledgerId">) => {
    const next = createAssetLedgerEntry(entry);
    appendUserAssetLedgerEntry(input.userState, next);
    ledgerIds.push(next.ledgerId);
  };

  if (input.action === "purchase_paid") {
    append({
      subject: "balance",
      kind: "consume",
      title: `${input.detail.order.title} payment captured`,
      message: `${input.detail.order.title} order ${input.detail.order.orderId} consumed wallet balance.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      balanceDeltaCents: -amountCents,
    });
    const grantedEntitlement = createAssetLedgerEntitlement(input.detail, "active");
    if (grantedEntitlement) {
      append({
        subject: resolveEntitlementLedgerSubject(input.detail),
        kind: "grant",
        title: `${input.detail.order.title} granted`,
        message: `${input.detail.order.title} entitlement was granted after successful payment.`,
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        ...(planId ? { membershipPlanId: planId } : {}),
        entitlement: grantedEntitlement,
      });
    }
    if (input.detail.order.productType === "membership") {
      append({
        subject: "points",
        kind: "grant",
        title: "Membership purchase reward",
        message: "Membership purchase granted loyalty points.",
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        pointsDelta: 30,
      });
    }
    return ledgerIds;
  }

  if (input.action === "purchase_pending") {
    append({
      subject: "balance",
      kind: "freeze",
      title: "Payment hold created",
      message: `Pending order ${input.detail.order.orderId} froze wallet balance until callback confirmation.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      frozenBalanceDeltaCents: amountCents,
    });
    const frozenEntitlement = createAssetLedgerEntitlement(input.detail, "frozen");
    if (frozenEntitlement) {
      append({
        subject: "entitlement",
        kind: "freeze",
        title: `${input.detail.order.title} entitlement pending`,
        message: `${input.detail.order.title} entitlement is pending payment confirmation.`,
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        entitlement: frozenEntitlement,
      });
    }
    return ledgerIds;
  }

  if (input.action === "cancel_pending") {
    append({
      subject: "balance",
      kind: "unfreeze",
      title: "Payment hold released",
      message: `Pending order ${input.detail.order.orderId} was cancelled and the wallet hold was released.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      frozenBalanceDeltaCents: -amountCents,
    });
    return ledgerIds;
  }

  if (input.action === "callback_success") {
    append({
      subject: "balance",
      kind: "unfreeze",
      title: "Payment hold settled",
      message: `Callback success settled the frozen wallet amount for ${input.detail.order.orderId}.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      frozenBalanceDeltaCents: -amountCents,
    });
    append({
      subject: "balance",
      kind: "consume",
      title: `${input.detail.order.title} payment captured`,
      message: `Confirmed callback consumed the wallet amount for ${input.detail.order.orderId}.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      balanceDeltaCents: -amountCents,
    });
    const activatedEntitlement = createAssetLedgerEntitlement(input.detail, "active");
    if (activatedEntitlement) {
      append({
        subject: resolveEntitlementLedgerSubject(input.detail),
        kind: "grant",
        title: `${input.detail.order.title} activated`,
        message: `${input.detail.order.title} entitlement moved from pending to active after callback success.`,
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        ...(planId ? { membershipPlanId: planId } : {}),
        entitlement: activatedEntitlement,
      });
    }
    return ledgerIds;
  }

  if (input.action === "callback_failure" || input.action === "callback_cancelled") {
    append({
      subject: "balance",
      kind: "unfreeze",
      title: "Payment hold released",
      message: `Payment callback released the frozen wallet amount for ${input.detail.order.orderId}.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      frozenBalanceDeltaCents: -amountCents,
    });
    const revokedEntitlement = createAssetLedgerEntitlement(
      input.detail,
      input.action === "callback_failure" ? "revoked" : "expired",
    );
    if (revokedEntitlement) {
      append({
        subject: "entitlement",
        kind: input.action === "callback_failure" ? "revoke" : "expire",
        title: input.action === "callback_failure" ? `${input.detail.order.title} entitlement revoked` : `${input.detail.order.title} entitlement cancelled`,
        message:
          input.action === "callback_failure"
            ? `Pending ${input.detail.order.title} entitlement was revoked after callback failure.`
            : `Pending ${input.detail.order.title} entitlement was cancelled before activation.`,
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        entitlement: revokedEntitlement,
      });
    }
    return ledgerIds;
  }

  if (input.action === "refund_paid") {
    append({
      subject: "balance",
      kind: "refund",
      title: `${input.detail.order.title} refund credited`,
      message: `Refund for ${input.detail.order.orderId} returned wallet balance.`,
      createdAt,
      sourceType: "refund",
      sourceId: input.detail.order.orderId,
      balanceDeltaCents: amountCents,
    });
    const refundedEntitlement = createAssetLedgerEntitlement(input.detail, "refunded");
    if (refundedEntitlement) {
      append({
        subject: resolveEntitlementLedgerSubject(input.detail),
        kind: "refund",
        title: `${input.detail.order.title} refunded`,
        message: `${input.detail.order.title} entitlement was refunded and revoked.`,
        createdAt,
        sourceType: "refund",
        sourceId: input.detail.order.orderId,
        ...(planId ? { membershipPlanId: planId } : {}),
        entitlement: refundedEntitlement,
      });
    }
  }

  return ledgerIds;
}

function verifyPaymentCallback(input: {
  detail: OrderDetailResponse;
  payload: PaymentCallbackRequest;
  secret: string;
  now: number;
}): {
  ok: boolean;
  callbackReference: string;
  message: string;
  signatureDigest?: string | undefined;
} {
  const providerMode = input.detail.paymentIntent.gatewayReference?.providerMode ?? "sample";
  const callbackReference = input.payload.callbackReference ?? `cb_${input.payload.orderId}`;
  if (providerMode === "sample") {
    return {
      ok: input.payload.verified !== false,
      callbackReference,
      message: input.payload.verified === false ? "Sample callback was explicitly rejected." : "Sample callback verification succeeded.",
    };
  }

  if (!input.payload.nonce || !input.payload.timestamp || !input.payload.signature) {
    return {
      ok: false,
      callbackReference,
      message: "Production payment callback is missing nonce, timestamp, or signature.",
    };
  }

  const ageMs = Math.abs(input.now - input.payload.timestamp);
  if (ageMs > 5 * 60_000) {
    return {
      ok: false,
      callbackReference,
      message: "Production payment callback timestamp is outside the accepted replay window.",
    };
  }

  const replayed = (input.detail.callbackLedger ?? []).some((entry) => {
    return entry.callbackReference === callbackReference || (input.payload.nonce ? entry.nonce === input.payload.nonce : false);
  });
  if (replayed) {
    return {
      ok: false,
      callbackReference,
      message: "Production payment callback was rejected by replay protection.",
    };
  }

  const expected = createPaymentWebhookSignature({
    secret: input.secret,
    orderId: input.payload.orderId,
    outcome: input.payload.outcome,
    callbackReference,
    nonce: input.payload.nonce,
    timestamp: input.payload.timestamp,
    ...(input.payload.gatewayTransactionId ? { gatewayTransactionId: input.payload.gatewayTransactionId } : {}),
  });
  const matches = expected === input.payload.signature;
  return {
    ok: matches,
    callbackReference,
    message: matches ? "Production payment callback signature verified." : "Production payment callback signature mismatch.",
    signatureDigest: expected,
  };
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
  appendOperationLedger(next, createPaymentLedgerEntry({
    kind: "operation",
    order: next.order,
    status: next.order.status,
    message: next.operationResult.message,
    createdAt: processedAt,
    ...(next.paymentIntent.gatewayReference ? { gatewayReference: next.paymentIntent.gatewayReference } : {}),
  }));
  appendReconciliationLedger(next, {
    reconciliationId: createLedgerId("recon"),
    orderId: next.order.orderId,
    status: next.reconciliation.status,
    ...(next.paymentIntent.gatewayReference ? { gatewayReference: next.paymentIntent.gatewayReference } : {}),
    message: next.reconciliation.message,
    checkedAt: processedAt,
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
  appendOperationLedger(next, createPaymentLedgerEntry({
    kind: "refund",
    order: next.order,
    status: next.order.status,
    message: next.operationResult.message,
    createdAt: processedAt,
    ...(next.paymentIntent.gatewayReference ? { gatewayReference: next.paymentIntent.gatewayReference } : {}),
  }));
  appendPaymentLedger(next, createPaymentLedgerEntry({
    kind: "refund",
    order: next.order,
    status: next.paymentResult.status,
    message: next.operationResult.message,
    createdAt: processedAt,
    ...(next.paymentIntent.gatewayReference
      ? {
          gatewayReference: {
            ...next.paymentIntent.gatewayReference,
            gatewayRefundId: `refund_${next.order.orderId}`,
          },
        }
      : {}),
  }));
  appendReconciliationLedger(next, {
    reconciliationId: createLedgerId("recon"),
    orderId: next.order.orderId,
    status: next.reconciliation.status,
    ...(next.paymentIntent.gatewayReference ? { gatewayReference: next.paymentIntent.gatewayReference } : {}),
    message: next.reconciliation.message,
    checkedAt: processedAt,
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
  if (payload.gatewayTransactionId && next.paymentIntent.gatewayReference) {
    next.paymentIntent.gatewayReference = {
      ...next.paymentIntent.gatewayReference,
      gatewayTransactionId: payload.gatewayTransactionId,
    };
  }
  appendPaymentLedger(next, createPaymentLedgerEntry({
    kind: "callback",
    order: next.order,
    status: next.paymentResult.status,
    message: next.paymentResult.message,
    createdAt: processedAt,
    ...(next.paymentIntent.gatewayReference ? { gatewayReference: next.paymentIntent.gatewayReference } : {}),
  }));
  appendOperationLedger(next, createPaymentLedgerEntry({
    kind: "operation",
    order: next.order,
    status: next.order.status,
    message: next.operationResult.message,
    createdAt: processedAt,
    ...(next.paymentIntent.gatewayReference ? { gatewayReference: next.paymentIntent.gatewayReference } : {}),
  }));
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
  appendOperationLedger(next, createPaymentLedgerEntry({
    kind: "reconciliation",
    order: next.order,
    status: next.reconciliation.status,
    message: next.reconciliation.message,
    createdAt: processedAt,
    ...(next.paymentIntent.gatewayReference ? { gatewayReference: next.paymentIntent.gatewayReference } : {}),
  }));
  appendReconciliationLedger(next, {
    reconciliationId: createLedgerId("recon"),
    orderId: next.order.orderId,
    status: next.reconciliation.status,
    ...(next.paymentIntent.gatewayReference ? { gatewayReference: next.paymentIntent.gatewayReference } : {}),
    message: next.reconciliation.message,
    checkedAt: processedAt,
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

function setRateLimitHeaders(response: Response, decision: AuthRateLimitDecision) {
  response.headers.set("X-RateLimit-Limit", String(decision.limit));
  response.headers.set("X-RateLimit-Remaining", String(decision.remaining));
  response.headers.set("X-RateLimit-Reset", String(decision.resetAt));
  if (decision.limited) {
    response.headers.set("Retry-After", String(decision.retryAfterSeconds));
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

  app.get("/share-posters/:shortCode.svg", (c) => {
    const traceId = c.get("traceId");
    const svg = renderSharePosterSvg({
      title: "MiniX Share Poster",
      summary: "Open the short link to continue into the attributed share flow.",
      shortCode: c.req.param("shortCode") ?? "share",
      channelLabel: "Poster",
    });

    return createSvgResponse(svg, traceId);
  });

  app.post("/auth/verification-code/request", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, phoneVerificationRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const store = getStore(c.env, options.store);
    const clientId = resolveClientId(c.req.raw);
    let userId = createUserIdFromCredential({ method: "phone_code", phoneNumber: payload.phoneNumber });
    let platform: LoginPlatformKind = "h5";
    if (payload.purpose === "account_security") {
      const accessToken = resolveBearerToken(c.req.header("authorization"));
      if (accessToken) {
        const session = await store.getSessionByAccessToken(accessToken);
        if (session) {
          userId = session.userId;
          platform = session.platform;
        }
      }
    }
    const userState = await store.getUserState(userId);
    const guard = await guardSecurityRateLimit({
      c,
      store,
      userId,
      userState,
      action: "verification",
      scope: "verification",
      platform,
      clientId,
      deviceId: payload.deviceId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "verification_rate_limited",
      blockedMessage: "Too many verification requests. Retry later.",
      ...(payload.riskContext?.frequencyKey ? { frequencyKey: payload.riskContext.frequencyKey } : {}),
      ...(payload.riskContext?.scene ? { scene: payload.riskContext.scene } : {}),
    });
    const now = Date.now();
    const nowIso = guard.nowIso;
    const rateLimitState = guard.rateLimitState;
    const securityDecision = evaluateSecurityDecision({
      userState,
      platform,
      riskContext: payload.riskContext,
      scope: "verification",
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
    });
    const verificationAuditBase = {
      userState,
      scope: "verification" as const,
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      clientId,
      platform,
      ...(securityDecision.riskDecision.reason ? { reason: securityDecision.riskDecision.reason } : {}),
      ...(securityDecision.riskDecision.frequencyKey ? { frequencyKey: securityDecision.riskDecision.frequencyKey } : {}),
      ...(securityDecision.riskDecision.scene ? { scene: securityDecision.riskDecision.scene } : {}),
      traceId,
    };
    if (!guard.allowed) {
      return guard.response;
    }
    const challenge = await createPhoneVerificationChallenge({
      userState,
      phoneNumber: payload.phoneNumber,
      purpose: payload.purpose,
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      now,
    });
    appendSecurityAuditEvent({
      ...verificationAuditBase,
      action: "verification_code_issued",
      result: securityDecision.riskDecision.level === "review" ? "review" : "allowed",
      message: `Verification code issued for ${payload.purpose}.`,
      createdAt: nowIso,
    });
    await store.saveUserState(userId, userState);

    const maskedTarget = maskPhoneNumber(payload.phoneNumber);
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
      riskDecision: securityDecision.riskDecision,
      ...(securityDecision.deviceIdentity ? { deviceIdentity: securityDecision.deviceIdentity } : {}),
      rateLimitState,
      securityAuditEvents: getRecentSecurityAuditEvents(userState),
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
      ...(payload.purpose ? { purpose: payload.purpose } : {}),
      ...(payload.purpose === "bind"
        ? (() => {
            const accessToken = resolveBearerToken(c.req.header("authorization"));
            return accessToken ? { ownerUserId: "__deferred__" } : {};
          })()
        : {}),
      expiresAt,
      createdAt: Date.now(),
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
      ...(redirectTarget ? { redirectTarget } : {}),
    };
    if (payload.purpose === "bind") {
      const accessToken = resolveBearerToken(c.req.header("authorization"));
      if (accessToken) {
        const session = await store.getSessionByAccessToken(accessToken);
        if (session) {
          const stateSecurity = ensureAuthSecurityState(stateStore);
          const pendingState = stateSecurity.oauthStatesByState[state];
          if (pendingState) {
            pendingState.ownerUserId = session.userId;
          }
        }
      }
    }
    await store.saveUserState(stateUserId, stateStore);

    const response: AuthOAuthAuthorizeResponse = {
      provider: payload.provider,
      ...(payload.purpose ? { purpose: payload.purpose } : {}),
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

    const now = Date.now();
    const providerSubject = createOAuthSubject(payload.provider, payload.providerUserId);
    const linked = await loadOAuthCredentialLink(store, payload.provider, payload.providerUserId);
    const userId =
      linked.record && linked.record.authorizationStatus !== "unlinked"
        ? linked.record.userId
        : `user_oauth_${providerKey}_${sanitizeUserKey(payload.providerUserId)}`;
    const userState = await store.getUserState(userId);
    const tokenHash = await hashSecret(payload.providerToken, payload.state);
    const record = createOAuthCredentialRecord({
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      userId,
      tokenHash,
      now,
      ...(linked.record ? { existing: linked.record } : {}),
    });
    ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[providerSubject] = record;
    ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[providerSubject] = record;
    delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    await store.saveUserState(stateUserId, stateStore);
    await store.saveUserState(linked.indexUserId, linked.indexState);
    await store.saveUserState(userId, userState);

    const session = await store.createSession({
      platform: payload.platform,
      userId,
      authStatus: "authenticated",
      identity: { userId },
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
    let userState = await store.getUserState(userId);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId,
      userState,
      action: "login",
      scope: "auth",
      platform: payload.platform,
      clientId,
      deviceId: payload.credential.deviceId ?? payload.riskContext?.deviceId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "login_rate_limited",
      blockedMessage: "Too many login attempts. Retry later.",
      ...(payload.riskContext?.frequencyKey ? { frequencyKey: payload.riskContext.frequencyKey } : {}),
      ...(payload.riskContext?.scene ? { scene: payload.riskContext.scene } : {}),
    });
    setAuthRateLimitHeaders(c, {
      limited: !rateLimitGuard.allowed,
      limit: rateLimitGuard.rateLimitState.limit,
      remaining: rateLimitGuard.rateLimitState.remaining,
      resetAt: rateLimitGuard.rateLimitState.resetAt,
      retryAfterSeconds: rateLimitGuard.rateLimitState.retryAfterSeconds,
    });
    if (!rateLimitGuard.allowed) {
      logAuthEvent("login_rate_limited", {
        clientId,
        platform: payload.platform,
        retryAfterSeconds: rateLimitGuard.rateLimitState.retryAfterSeconds,
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return rateLimitGuard.response;
    }
    const securityDecision = evaluateSecurityDecision({
      userState,
      platform: payload.platform,
      riskContext: payload.riskContext,
      scope: "auth",
      ...(payload.credential.deviceId ? { deviceId: payload.credential.deviceId } : {}),
    });
    let credentialProtection: AuthCredentialProtection | undefined;
    const loginAuditBase = {
      userState,
      scope: "auth" as const,
      actorUserId: userId,
      clientId,
      platform: payload.platform,
      ...(securityDecision.riskDecision.deviceId ? { deviceId: securityDecision.riskDecision.deviceId } : {}),
      ...(securityDecision.riskDecision.reason ? { reason: securityDecision.riskDecision.reason } : {}),
      ...(securityDecision.riskDecision.frequencyKey ? { frequencyKey: securityDecision.riskDecision.frequencyKey } : {}),
      ...(securityDecision.riskDecision.scene ? { scene: securityDecision.riskDecision.scene } : {}),
      traceId,
    };

    if (loginMethod === "phone_code") {
      const verified = await consumePhoneVerification({
        userState,
        phoneNumber: payload.credential.phoneNumber!,
        purpose: "login",
        verificationCode: payload.credential.verificationCode!,
        now: Date.now(),
      });
      if (!verified.ok) {
        appendSecurityAuditEvent({
          ...loginAuditBase,
          action: "phone_code_login",
          result: "blocked",
          message: verified.message,
          createdAt: new Date().toISOString(),
        });
        await store.saveUserState(userId, userState);
        return c.json({ code: "LOGIN_FAILED", message: verified.message, credentialProtection: verified.protection }, verified.status);
      }
    }

    if (loginMethod === "password") {
      const subject = createCredentialSubject(payload.credential);
      if (!subject) {
        return jsonError("LOGIN_FAILED", "password login requires an account identifier and password", 400, traceId);
      }
      const verified = await verifyPasswordCredential({
        userState,
        subject,
        password: payload.credential.password!,
        now: Date.now(),
      });
      if (!verified.ok) {
        appendSecurityAuditEvent({
          ...loginAuditBase,
          action: "password_login",
          result: "blocked",
          message: verified.message,
          createdAt: new Date().toISOString(),
        });
        await store.saveUserState(userId, userState);
        return c.json({ code: "LOGIN_FAILED", message: verified.message, credentialProtection: verified.protection }, verified.status);
      }
      userId = verified.userId;
      credentialProtection = verified.protection;
      if (userId !== loginAuditBase.actorUserId) {
        userState = await store.getUserState(userId);
      }
    }

    if (loginMethod === "oauth") {
      const providerKey = sanitizeUserKey(payload.credential.provider!.toLowerCase());
      const stateStore = await store.getUserState(`oauth_state_${providerKey}`);
      const stateRecord = ensureAuthSecurityState(stateStore).oauthStatesByState[payload.credential.oauthState!];
      if (!stateRecord || stateRecord.provider !== payload.credential.provider || stateRecord.expiresAt <= Date.now()) {
        appendSecurityAuditEvent({
          ...loginAuditBase,
          action: "oauth_login",
          result: "blocked",
          message: "oauth state is invalid or expired",
          createdAt: new Date().toISOString(),
          reason: "oauth_state_invalid",
        });
        await store.saveUserState(userId, userState);
        return c.json(
          {
            code: "LOGIN_FAILED",
            message: "oauth state is invalid or expired",
            credentialProtection: { failureReason: "oauth_state_invalid" },
          },
          400,
        );
      }
      const now = Date.now();
      const providerSubject = createOAuthSubject(payload.credential.provider!, payload.credential.providerUserId!);
      const linked = await loadOAuthCredentialLink(store, payload.credential.provider!, payload.credential.providerUserId!);
      userId =
        linked.record && linked.record.authorizationStatus !== "unlinked"
          ? linked.record.userId
          : `user_oauth_${providerKey}_${sanitizeUserKey(payload.credential.providerUserId!)}`;
      userState = await store.getUserState(userId);
      const tokenHash = await hashSecret(payload.credential.providerToken!, payload.credential.oauthState!);
      const record = createOAuthCredentialRecord({
        provider: payload.credential.provider!,
        providerUserId: payload.credential.providerUserId!,
        userId,
        tokenHash,
        now,
        ...(linked.record ? { existing: linked.record } : {}),
      });
      ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[providerSubject] = record;
      ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[providerSubject] = record;
      delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.credential.oauthState!];
      await store.saveUserState(`oauth_state_${providerKey}`, stateStore);
      await store.saveUserState(linked.indexUserId, linked.indexState);
    }

    const session = await store.createSession({
      platform: payload.platform,
      userId,
      authStatus: resolveAuthStatus(loginMethod),
      identity: resolveIdentity(payload, userId, loginMethod),
      loginMethod,
    });
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const abnormalLoginPrompt = securityDecision.prompt ?? resolveAbnormalLoginPrompt(payload, loginMethod);
    appendSecurityAuditEvent({
      userState,
      scope: "auth",
      action: `${loginMethod}_login`,
      result: securityDecision.riskDecision.level === "review" ? "review" : "allowed",
      message: `Login completed through ${loginMethod}.`,
      createdAt: new Date().toISOString(),
      actorUserId: userId,
      ...(securityDecision.riskDecision.deviceId ? { deviceId: securityDecision.riskDecision.deviceId } : {}),
      clientId,
      platform: payload.platform,
      ...(securityDecision.riskDecision.reason ? { reason: securityDecision.riskDecision.reason } : {}),
      ...(securityDecision.riskDecision.frequencyKey ? { frequencyKey: securityDecision.riskDecision.frequencyKey } : {}),
      ...(securityDecision.riskDecision.scene ? { scene: securityDecision.riskDecision.scene } : {}),
      traceId,
    });
    await store.saveUserState(userId, userState);
    const response: LoginResponse = createAuthResponseFromSession(session, c.req.url, {
      ...(abnormalLoginPrompt ? { abnormalLoginPrompt } : {}),
      ...(credentialProtection ? { credentialProtection } : {}),
      ...(redirectTarget ? { redirectTarget } : {}),
      ...(securityDecision.deviceIdentity ? { deviceIdentity: securityDecision.deviceIdentity } : {}),
      rateLimitState: rateLimitGuard.rateLimitState,
      riskDecision: securityDecision.riskDecision,
      securityAuditEvents: getRecentSecurityAuditEvents(userState),
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
    const store = getStore(c.env, options.store);
    const refreshStateKey = `refresh_${sanitizeUserKey(clientId)}`;
    const refreshUserState = await store.getUserState(refreshStateKey);
    const refreshGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: refreshStateKey,
      userState: refreshUserState,
      action: "refresh",
      scope: "auth",
      platform: payload.platform,
      clientId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "refresh_rate_limited",
      blockedMessage: "Too many refresh attempts. Retry later.",
    });
    setAuthRateLimitHeaders(c, {
      limited: !refreshGuard.allowed,
      limit: refreshGuard.rateLimitState.limit,
      remaining: refreshGuard.rateLimitState.remaining,
      resetAt: refreshGuard.rateLimitState.resetAt,
      retryAfterSeconds: refreshGuard.rateLimitState.retryAfterSeconds,
    });
    if (!refreshGuard.allowed) {
      logAuthEvent("refresh_rate_limited", {
        clientId,
        platform: payload.platform,
        retryAfterSeconds: refreshGuard.rateLimitState.retryAfterSeconds,
        deployEnv: c.env?.MINIX_DEPLOY_ENV,
        traceId,
      });
      return refreshGuard.response;
    }
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
    const userState = await store.getUserState(session.userId);
    appendSecurityAuditEvent({
      userState,
      scope: "auth",
      action: "refresh_session",
      result: "allowed",
      message: "Session refresh completed.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);

    const response: RefreshTokenResponse = createAuthResponseFromSession(session, c.req.url, {
      rateLimitState: refreshGuard.rateLimitState,
      securityAuditEvents: getRecentSecurityAuditEvents(userState),
    });

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

  app.post("/auth/identity/bind-oauth", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, identityBindOAuthSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const redirectTarget = resolveRedirectTarget(payload.redirectTarget);
    const store = getStore(c.env, options.store);
    const providerKey = sanitizeUserKey(payload.provider.toLowerCase());
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

    const linked = await loadOAuthCredentialLink(store, payload.provider, payload.providerUserId);
    const sourceState = await store.getUserState(session.userId);
    if (stateRecord.purpose === "bind" && stateRecord.ownerUserId && stateRecord.ownerUserId !== session.userId) {
      return jsonError("FORBIDDEN", "oauth authorization state belongs to another account session", 403, traceId);
    }
    const tokenHash = await hashSecret(payload.providerToken, payload.state);
    if (linked.record && linked.record.userId !== session.userId && linked.record.authorizationStatus !== "unlinked") {
      const targetState = await store.getUserState(linked.record.userId);
      const workflowId = createRandomId("identity_workflow");
      const targetLabel = `${createOAuthProviderLabel(payload.provider)} account ${linked.record.userId}`;
      const mergePreview = createMergePreview({
        sourceUserId: session.userId,
        targetUserId: linked.record.userId,
        targetLabel,
        sourceState,
        targetState,
      });
      const workflow = createIdentityWorkflow({
        kind: "oauth_binding",
        status: payload.mergeStrategy === "merge" ? "completed" : "merge_required",
        workflowId,
        stage: payload.mergeStrategy === "merge" ? "completed" : "preview",
        sourceUserId: session.userId,
        continueTarget: redirectTarget,
        targetUserId: linked.record.userId,
        targetLabel,
        ...(payload.mergeStrategy === "merge" ? {} : { failureReason: "merge_confirmation_required" }),
        mergePreview,
        audit: [
          createIdentityAuditRecord({
            action: "preview_created",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: linked.record.userId,
            message: "OAuth provider binding merge preview created.",
          }),
          createIdentityAuditRecord({
            action: payload.mergeStrategy === "merge" ? "merge_completed" : "merge_required",
            workflowId,
            actorUserId: session.userId,
            sourceUserId: session.userId,
            targetUserId: linked.record.userId,
            message:
              payload.mergeStrategy === "merge"
                ? "OAuth provider binding completed through account merge."
                : "OAuth provider binding requires explicit merge confirmation.",
          }),
        ],
      });

      if (payload.mergeStrategy !== "merge") {
        sourceState.pendingIdentityWorkflow = workflow;
        sourceState.lastIdentityWorkflow = workflow;
        appendSecurityAuditEvent({
          userState: sourceState,
          scope: "auth",
          action: "oauth_bind_merge_required",
          result: "review",
          message: `${createOAuthProviderLabel(payload.provider)} is already linked to another account and needs merge confirmation.`,
          createdAt: new Date().toISOString(),
          actorUserId: session.userId,
          platform: session.platform,
          traceId,
        });
        await store.saveUserState(session.userId, sourceState);
        return c.json(
          createAuthResponseFromSession(session, c.req.url, {
            identityWorkflow: workflow,
            redirectTarget,
          }),
        );
      }

      const nextState = mergeUserStates(targetState, {
        ...sourceState,
        lastIdentityWorkflow: workflow,
      });
      const record = createOAuthCredentialRecord({
        provider: payload.provider,
        providerUserId: payload.providerUserId,
        userId: linked.record.userId,
        tokenHash,
        now: Date.now(),
        ...(linked.record ? { existing: linked.record } : {}),
      });
      ensureAuthSecurityState(nextState).oauthCredentialsByProviderSubject[linked.subject] = record;
      ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] = record;
      delete nextState.pendingIdentityWorkflow;
      nextState.lastIdentityWorkflow = workflow;
      appendSecurityAuditEvent({
        userState: nextState,
        scope: "auth",
        action: "oauth_bind_merge_completed",
        result: "allowed",
        message: `${createOAuthProviderLabel(payload.provider)} binding completed through account merge.`,
        createdAt: new Date().toISOString(),
        actorUserId: linked.record.userId,
        platform: session.platform,
        traceId,
      });
      await store.saveUserState(linked.record.userId, nextState);
      await store.saveUserState(linked.indexUserId, linked.indexState);
      delete sourceState.pendingIdentityWorkflow;
      sourceState.lastIdentityWorkflow = workflow;
      await store.saveUserState(session.userId, sourceState);
      delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
      await store.saveUserState(stateUserId, stateStore);
      await store.revokeSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      const nextSession = await store.createSession({
        platform: session.platform,
        userId: linked.record.userId,
        profile: session.profile,
        authStatus: "authenticated",
        identity: {
          userId: linked.record.userId,
          ...(session.identity.phoneBound ? { phoneBound: true } : {}),
          ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
        },
        loginMethod: "oauth",
      });
      const response: IdentityTransitionResponse = {
        ...createAuthResponseFromSession(nextSession, c.req.url, {
          identityWorkflow: workflow,
          redirectTarget,
        }),
        identityWorkflow: workflow,
      };
      return c.json(response);
    }

    const workflowId = createRandomId("identity_workflow");
    const workflow = createIdentityWorkflow({
      kind: "oauth_binding",
      status: "completed",
      workflowId,
      stage: "completed",
      sourceUserId: session.userId,
      continueTarget: redirectTarget,
      targetUserId: session.userId,
      targetLabel: `${createOAuthProviderLabel(payload.provider)} linked`,
      audit: [
        createIdentityAuditRecord({
          action: "merge_completed",
          workflowId,
          actorUserId: session.userId,
          sourceUserId: session.userId,
          targetUserId: session.userId,
          message: "OAuth provider linked to the current account.",
        }),
      ],
    });
    const record = createOAuthCredentialRecord({
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      userId: session.userId,
      tokenHash,
      now: Date.now(),
      ...(linked.record ? { existing: linked.record } : {}),
    });
    ensureAuthSecurityState(sourceState).oauthCredentialsByProviderSubject[linked.subject] = record;
    ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] = record;
    delete ensureAuthSecurityState(stateStore).oauthStatesByState[payload.state];
    sourceState.lastIdentityWorkflow = workflow;
    appendSecurityAuditEvent({
      userState: sourceState,
      scope: "auth",
      action: "oauth_bind",
      result: "allowed",
      message: `${createOAuthProviderLabel(payload.provider)} linked to the current account.`,
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, sourceState);
    await store.saveUserState(linked.indexUserId, linked.indexState);
    await store.saveUserState(stateUserId, stateStore);
    const nextSession = await store.createSession({
      platform: session.platform,
      userId: session.userId,
      profile: session.profile,
      authStatus: "authenticated",
      identity: {
        userId: session.userId,
        ...(session.identity.phoneBound ? { phoneBound: true } : {}),
        ...(session.identity.realNameVerified !== undefined ? { realNameVerified: session.identity.realNameVerified } : {}),
      },
      loginMethod: "oauth",
    });
    await store.revokeSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
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
      kind: pendingWorkflow.kind === "oauth_binding" ? "oauth_binding" : "account_merge",
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
  app.use("/subscriptions", requireSession);
  app.use("/subscriptions/*", requireSession);
  app.use("/after-sales", requireSession);
  app.use("/after-sales/*", requireSession);
  app.use("/share", requireSession);
  app.use("/share/*", requireSession);
  app.use("/uploads", requireSession);
  app.use("/uploads/*", requireSession);
  app.use("/reading-progress", requireSession);
  app.use("/settings", requireSession);
  app.use("/ops", requireSession);
  app.use("/ops/*", requireSession);

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

  app.post("/settings", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, settingsUpdateSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const update = payload as UpdateSettingsRequest;
    applySettingsUpdate(userState, update, c.env?.MINIX_DEPLOY_ENV);
    await store.saveUserState(session.userId, userState);
    return c.json(createSettingsResponse(session, userState, c.env?.MINIX_DEPLOY_ENV));
  });

  app.get("/ops/diagnostics", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), opsDiagnosticsQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const operationalState = cloneOperationalState(await store.getOperationalState());
    const nowIso = new Date().toISOString();
    ensureOperationalBackfill(operationalState, nowIso);
    syncOperationalDomainSchemas(operationalState, {
      userId: session.userId,
      userState,
      nowIso,
    });
    await store.saveOperationalState(operationalState);
    return c.json(
      createOperationalDiagnosticsResponse(userState, operationalState, {
        ...(query.limit !== undefined ? { limit: query.limit } : {}),
        ...(query.includeCompletedJobs !== undefined ? { includeCompletedJobs: query.includeCompletedJobs } : {}),
      }),
    );
  });

  app.post("/ops/jobs/run", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, opsRunJobsRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const result = await runOperationalJobs(store, {
      userId: session.userId,
      ...(payload.kind ? { kind: payload.kind } : {}),
      ...(payload.limit !== undefined ? { limit: payload.limit } : {}),
    });
    appendOperationalAuditRecord(result.operationalState, {
      category: "governance",
      action: "jobs_run_requested",
      message: `Manual operational job run processed ${result.jobs.length} jobs.`,
      createdAt: new Date().toISOString(),
      userId: session.userId,
      metadata: {
        processedJobs: result.jobs.length,
        ...(payload.kind ? { filtered: true, jobKind: payload.kind } : { filtered: false }),
      },
    });
    await store.saveOperationalState(result.operationalState);
    return c.json({
      processedJobs: result.jobs,
      diagnostics: createOperationalDiagnosticsResponse(result.userState, result.operationalState, {
        limit: Math.max(payload.limit ?? 20, result.jobs.length || 1),
        includeCompletedJobs: true,
      }),
    });
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
      ...(payload.avatarAssetId ? { avatarAssetId: payload.avatarAssetId } : {}),
    };
    if (payload.avatarAssetId) {
      bindUploadAssetsToOwner(userState, {
        assetIds: [payload.avatarAssetId],
        ownerType: "avatar",
        ownerId: session.userId,
        role: "avatar",
      });
    }
    await store.saveUserState(session.userId, userState);
    return c.json(createAccountOperationResponse(session, userState, c.req.url, "Profile updated."));
  });

  app.post("/account/change-phone", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, changeAccountPhoneSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "change_phone_rate_limited",
      blockedMessage: "Too many sensitive account operations. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "change_phone");
    if (!operation?.available) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "change_phone",
        actorLabel: "MiniX Account Center",
        message: operation?.blockedReason ?? "Phone binding changes are unavailable.",
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (operation.riskPrompt && !payload.riskConfirmed) {
      return jsonError("INVALID_ARGUMENT", "Phone change requires explicit risk confirmation.", 400, traceId);
    }

    const currentSecurityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (operation.verificationRequired) {
      if (!currentSecurityPhone) {
        return jsonError("FORBIDDEN", "Phone change requires an existing verified phone security credential.", 409, traceId);
      }
      if (!payload.securityVerificationCode) {
        return jsonError("INVALID_ARGUMENT", "Phone change requires the current phone security verification code.", 400, traceId);
      }
      const verifiedCurrentCredential = await consumePhoneVerification({
        userState,
        phoneNumber: currentSecurityPhone,
        purpose: "account_security",
        verificationCode: payload.securityVerificationCode,
        now: Date.now(),
      });
      if (!verifiedCurrentCredential.ok) {
        await store.saveUserState(session.userId, userState);
        return c.json(
          {
            code: "INVALID_ARGUMENT",
            message: verifiedCurrentCredential.message,
            credentialProtection: verifiedCurrentCredential.protection,
          },
          verifiedCurrentCredential.status,
        );
      }
    }

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
      await store.saveUserState(session.userId, userState);
      return c.json({ code: "INVALID_ARGUMENT", message: verified.message, credentialProtection: verified.protection }, verified.status);
    }

    userState.boundPhoneNumber = payload.phoneNumber;
    setAccountOperationCooldown(userState, {
      kind: "change_phone",
      label: "Phone changes are temporarily locked while the new credential propagates.",
      durationMs:  ACCOUNT_OPERATION_COOLDOWN_MS,
    });
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "change_phone",
      status: "completed",
      actorLabel: "MiniX Account Center",
      message: `Bound phone updated to ${maskPhoneNumber(payload.phoneNumber)}.`,
      verificationPurpose: currentSecurityPhone ? "account_security" : "change_phone",
      notificationHookLabel: "notify:phone_changed",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "change_phone",
      result: "allowed",
      message: "Bound phone updated after security verification.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(createAccountOperationResponse(session, userState, c.req.url, "Phone binding updated.", operationRecord));
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
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "unbind_wechat_rate_limited",
      blockedMessage: "Too many sensitive account operations. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const operation = current.accountOperations.find((item) => item.kind === "unbind_wechat");
    if (!operation?.available) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "unbind_wechat",
        actorLabel: "MiniX Account Center",
        message: operation?.blockedReason ?? "WeChat unbinding is unavailable.",
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (!payload.riskConfirmed) {
      return jsonError("INVALID_ARGUMENT", "WeChat unbinding requires explicit risk confirmation.", 400, traceId);
    }

    if (payload.provider !== "wechat") {
      return jsonError("INVALID_ARGUMENT", "Non-WeChat providers must use the provider unlink route.", 400, traceId);
    }

    const securityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (!securityPhone) {
      return jsonError("FORBIDDEN", "WeChat unbinding requires a verified phone security credential.", 409, traceId);
    }
    if (!payload.verificationCode) {
      return jsonError("INVALID_ARGUMENT", "WeChat unbinding requires a security verification code.", 400, traceId);
    }
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: securityPhone,
      purpose: "account_security",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(session.userId, userState);
      return c.json({ code: "INVALID_ARGUMENT", message: verified.message, credentialProtection: verified.protection }, verified.status);
    }

    if (payload.provider === "wechat") {
      userState.wechatBoundOverride = false;
    }
    setAccountOperationCooldown(userState, {
      kind: "unbind_wechat",
      label: "WeChat binding changes are temporarily locked while device sign-in state settles.",
      durationMs: ACCOUNT_OPERATION_COOLDOWN_MS,
    });
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "unbind_wechat",
      status: "completed",
      actorLabel: "MiniX Account Center",
      message: "WeChat binding removed after fallback credential verification.",
      verificationPurpose: "account_security",
      notificationHookLabel: "notify:wechat_unbound",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "unbind_wechat",
      result: "allowed",
      message: "WeChat binding removed after fallback credential verification.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(createAccountOperationResponse(session, userState, c.req.url, "WeChat binding removed.", operationRecord));
  });

  app.post("/account/provider/unlink", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, accountUnbindSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "unlink_provider_rate_limited",
      blockedMessage: "Too many sensitive account operations. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }

    if (payload.provider === "wechat") {
      return jsonError("INVALID_ARGUMENT", "Native WeChat binding must use /account/unbind.", 400, traceId);
    }
    if (!payload.providerUserId) {
      return jsonError("INVALID_ARGUMENT", "Provider unlink requires providerUserId.", 400, traceId);
    }

    const linked = await loadOAuthCredentialLink(store, payload.provider, payload.providerUserId);
    if (!linked.record || linked.record.userId !== session.userId || linked.record.authorizationStatus === "unlinked") {
      return jsonError("NOT_FOUND", "Provider identity is not linked to the current account.", 404, traceId);
    }

    const providerLabel = createOAuthProviderLabel(payload.provider);
    const canUnlink = hasFallbackCredential(session, userState, {
      excludingProvider: {
        provider: payload.provider,
        providerUserId: payload.providerUserId,
      },
    });
    if (!canUnlink) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "unlink_provider",
        actorLabel: "MiniX Account Center",
        message: `${providerLabel} cannot be unlinked because it is the last usable login method.`,
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (!payload.riskConfirmed) {
      return jsonError("INVALID_ARGUMENT", `${providerLabel} unlink requires explicit risk confirmation.`, 400, traceId);
    }
    const securityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (!securityPhone) {
      return jsonError("FORBIDDEN", `${providerLabel} unlink requires a verified phone security credential.`, 409, traceId);
    }
    if (!payload.verificationCode) {
      return jsonError("INVALID_ARGUMENT", `${providerLabel} unlink requires a security verification code.`, 400, traceId);
    }
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: securityPhone,
      purpose: "account_security",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(session.userId, userState);
      return c.json({ code: "INVALID_ARGUMENT", message: verified.message, credentialProtection: verified.protection }, verified.status);
    }

    const nextRecord = createOAuthCredentialRecord({
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      userId: session.userId,
      tokenHash: linked.record.tokenHash,
      now: Date.now(),
      authorizationStatus: "unlinked",
      revocationReason: "user_unlinked",
      ...(linked.record ? { existing: linked.record } : {}),
    });
    ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[linked.subject] = nextRecord;
    ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] = nextRecord;
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "unlink_provider",
      status: "completed",
      actorLabel: "MiniX Account Center",
      message: `${providerLabel} was unlinked after fallback credential verification.`,
      verificationPurpose: "account_security",
      notificationHookLabel: "notify:provider_unlinked",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "unlink_provider",
      result: "allowed",
      message: `${providerLabel} was unlinked from the current account.`,
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    await store.saveUserState(linked.indexUserId, linked.indexState);
    return c.json(createAccountOperationResponse(session, userState, c.req.url, `${providerLabel} unlinked.`, operationRecord));
  });

  app.post("/account/provider/revoke", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, accountProviderRevokeSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "revoke_provider_rate_limited",
      blockedMessage: "Too many sensitive account operations. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }

    const linked = await loadOAuthCredentialLink(store, payload.provider, payload.providerUserId);
    if (!linked.record || linked.record.userId !== session.userId || linked.record.authorizationStatus === "unlinked") {
      return jsonError("NOT_FOUND", "Provider identity is not linked to the current account.", 404, traceId);
    }

    const providerLabel = createOAuthProviderLabel(payload.provider);
    const active = (linked.record.authorizationStatus ?? "active") === "active";
    if (!active) {
      return jsonError("INVALID_ARGUMENT", `${providerLabel} authorization is already inactive.`, 409, traceId);
    }
    const canRevoke = hasFallbackCredential(session, userState, {
      excludingProvider: {
        provider: payload.provider,
        providerUserId: payload.providerUserId,
      },
    });
    if (!canRevoke) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "revoke_provider",
        actorLabel: "MiniX Account Center",
        message: `${providerLabel} cannot be revoked because it is the last usable login method.`,
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (!payload.riskConfirmed) {
      return jsonError("INVALID_ARGUMENT", `${providerLabel} revoke requires explicit risk confirmation.`, 400, traceId);
    }
    const securityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (!securityPhone) {
      return jsonError("FORBIDDEN", `${providerLabel} revoke requires a verified phone security credential.`, 409, traceId);
    }
    if (!payload.verificationCode) {
      return jsonError("INVALID_ARGUMENT", `${providerLabel} revoke requires a security verification code.`, 400, traceId);
    }
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: securityPhone,
      purpose: "account_security",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(session.userId, userState);
      return c.json({ code: "INVALID_ARGUMENT", message: verified.message, credentialProtection: verified.protection }, verified.status);
    }

    const nextRecord = createOAuthCredentialRecord({
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      userId: session.userId,
      tokenHash: linked.record.tokenHash,
      now: Date.now(),
      authorizationStatus: "revoked",
      revocationReason: payload.reason?.trim() || "user_revoked",
      ...(linked.record ? { existing: linked.record } : {}),
    });
    ensureAuthSecurityState(userState).oauthCredentialsByProviderSubject[linked.subject] = nextRecord;
    ensureAuthSecurityState(linked.indexState).oauthCredentialsByProviderSubject[linked.subject] = nextRecord;
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "revoke_provider",
      status: "completed",
      actorLabel: "MiniX Account Center",
      message: `${providerLabel} authorization was revoked for this account.`,
      verificationPurpose: "account_security",
      notificationHookLabel: "notify:provider_revoked",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "revoke_provider",
      result: "allowed",
      message: `${providerLabel} authorization was revoked.`,
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    await store.saveUserState(linked.indexUserId, linked.indexState);
    return c.json(createAccountOperationResponse(session, userState, c.req.url, `${providerLabel} authorization revoked.`, operationRecord));
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
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "account",
      scope: "account",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "cancellation_rate_limited",
      blockedMessage: "Too many sensitive account operations. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const action = payload.action ?? "request";

    if (action === "revoke") {
      const operation = current.accountOperations.find((item) => item.kind === "revoke_cancellation");
      if (!operation?.available) {
        const response = createOperationBlockedResponse({
          userState,
          kind: "revoke_cancellation",
          actorLabel: "MiniX Account Center",
          message: operation?.blockedReason ?? "Cancellation revoke is unavailable.",
          session,
          requestUrl: c.req.url,
          traceId,
          clientId,
          ...(deviceId ? { deviceId } : {}),
        });
        await store.saveUserState(session.userId, userState);
        return c.json(response, 409);
      }

      userState.availabilityStatus = "enabled";
      delete userState.pendingCancellation;
      clearAccountOperationCooldown(userState, "request_cancellation");
      const operationRecord = appendAccountOperationRecord(userState, {
        kind: "revoke_cancellation",
        status: "revoked",
        actorLabel: "MiniX Account Center",
        message: "Cancellation request revoked during the cooling-off window.",
        notificationHookLabel: "notify:cancellation_revoked",
      });
      appendSecurityAuditEvent({
        userState,
        scope: "account",
        action: "revoke_cancellation",
        result: "allowed",
        message: "Cancellation request revoked during the cooling-off window.",
        createdAt: new Date().toISOString(),
        actorUserId: session.userId,
        ...(deviceId ? { deviceId } : {}),
        clientId,
        platform: session.platform,
        traceId,
      });
      await store.saveUserState(session.userId, userState);
      return c.json(
        createAccountOperationResponse(
          session,
          userState,
          c.req.url,
          "Cancellation request revoked.",
          operationRecord,
        ),
      );
    }

    const operation = current.accountOperations.find((item) => item.kind === "request_cancellation");
    if (!operation?.available) {
      const response = createOperationBlockedResponse({
        userState,
        kind: "request_cancellation",
        actorLabel: "MiniX Account Center",
        message: operation?.blockedReason ?? "Cancellation is unavailable.",
        session,
        requestUrl: c.req.url,
        traceId,
        clientId,
        ...(deviceId ? { deviceId } : {}),
      });
      await store.saveUserState(session.userId, userState);
      return c.json(response, 409);
    }

    if (!payload.riskConfirmed) {
      return jsonError("INVALID_ARGUMENT", "Cancellation requires explicit risk confirmation.", 400, traceId);
    }
    const securityPhone = resolveAccountSecurityPhoneNumber(session, userState);
    if (!securityPhone) {
      return jsonError("FORBIDDEN", "Cancellation requires a verified phone security credential.", 409, traceId);
    }
    if (!payload.verificationCode) {
      return jsonError("INVALID_ARGUMENT", "Cancellation requires a security verification code.", 400, traceId);
    }
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: securityPhone,
      purpose: "account_security",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(session.userId, userState);
      return c.json({ code: "INVALID_ARGUMENT", message: verified.message, credentialProtection: verified.protection }, verified.status);
    }

    const requestedAt = new Date().toISOString();
    const effectiveAt = new Date(Date.now() + ACCOUNT_CANCELLATION_COOLING_OFF_MS).toISOString();
    userState.availabilityStatus = "cancellation_pending";
    userState.pendingCancellation = {
      requestedAt,
      effectiveAt,
      revokeUntil: effectiveAt,
      ...(payload.reason ? { reason: payload.reason } : {}),
      ...(payload.details ? { details: payload.details } : {}),
    };
    setAccountOperationCooldown(userState, {
      kind: "request_cancellation",
      label: "Cancellation is in the cooling-off window and can still be revoked.",
      durationMs: ACCOUNT_CANCELLATION_COOLING_OFF_MS,
    });
    const operationRecord = appendAccountOperationRecord(userState, {
      kind: "request_cancellation",
      status: "pending",
      actorLabel: "MiniX Account Center",
      message: `Cancellation requested and revocable until ${effectiveAt}.`,
      verificationPurpose: "account_security",
      notificationHookLabel: "notify:cancellation_requested",
    });
    appendSecurityAuditEvent({
      userState,
      scope: "account",
      action: "request_cancellation",
      result: "review",
      message: "Cancellation request entered the cooling-off window.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await scheduleOperationalJobForUser(store, {
      userId: session.userId,
      userState,
      kind: "cancellation_expiry",
      dedupeKey: `cancellation_expiry:${session.userId}`,
      relatedRecordId: session.userId,
      scheduledAt: effectiveAt,
      maxAttempts: 1,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(
      createAccountOperationResponse(
        session,
        userState,
        c.req.url,
        "Cancellation request submitted.",
        operationRecord,
      ),
    );
  });

  app.get("/account/relations/list", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), relationListQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const current = createCurrentUserResponse(session, userState, c.req.url);
    const response: UserRelationListResponse = {
      accountSummary: current.accountSummary,
      userStatus: current.userStatus,
      relationList: listUserRelations(userState, current.userStatus.availability, {
        kind: query.kind,
        ...(query.page ? { page: query.page } : {}),
        ...(query.pageSize ? { pageSize: query.pageSize } : {}),
        ...(query.keyword ? { keyword: query.keyword } : {}),
      }),
    };
    return c.json(response);
  });

  app.get("/account/assets/history", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), assetHistoryQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const response: UserAssetHistoryResponse = listUserAssetHistory(session, userState, {
      ...(query.page ? { page: query.page } : {}),
      ...(query.pageSize ? { pageSize: query.pageSize } : {}),
      ...(query.subject ? { subject: query.subject } : {}),
    } satisfies ListUserAssetHistoryRequest);
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
    const relationRecord = userState.relationRecordsByUserId?.[payload.targetUserId];
    const target =
      current.relationTargets.find((item) => item.targetUserId === payload.targetUserId) ??
      listUserRelations(userState, current.userStatus.availability, {
        kind: payload.listKind ?? "following",
        page: 1,
        pageSize: 100,
        ...(payload.keyword ? { keyword: payload.keyword } : {}),
      }).items.find((item) => item.targetUserId === payload.targetUserId);
    if (!target || !relationRecord) {
      return jsonError("NOT_FOUND", "Relation target not found.", 404, traceId);
    }

    const action = target.actions.find((item) => item.kind === payload.action);
    if (!action?.available) {
      return jsonError("FORBIDDEN", action?.blockedReason ?? "Relation action is unavailable.", 409, traceId);
    }

    switch (payload.action) {
      case "follow":
        relationRecord.following = true;
        relationRecord.friend = relationRecord.followedBy;
        relationRecord.friendState = relationRecord.followedBy ? "mutual" : "outgoing_request";
        break;
      case "unfollow":
        relationRecord.following = false;
        relationRecord.friend = false;
        relationRecord.friendState = relationRecord.followedBy ? "incoming_request" : "none";
        break;
      case "block":
        relationRecord.blocked = true;
        relationRecord.following = false;
        relationRecord.friend = false;
        relationRecord.friendState = "none";
        break;
      case "unblock":
        relationRecord.blocked = false;
        break;
      case "set_remark":
        if (!payload.remarkName) {
          return jsonError("INVALID_ARGUMENT", "remark name is required when setting a remark", 400, traceId);
        }
        relationRecord.remarkName = payload.remarkName;
        break;
      case "clear_remark":
        delete relationRecord.remarkName;
        break;
    }

    relationRecord.lastInteractionAt = new Date().toISOString();
    if (userState.relationTarget?.targetUserId === relationRecord.targetUserId) {
      userState.relationTarget = {
        ...userState.relationTarget,
        following: relationRecord.following,
        followedBy: relationRecord.followedBy,
        friend: relationRecord.friend,
        ...(relationRecord.friendState ? { friendState: relationRecord.friendState } : {}),
        blocked: relationRecord.blocked,
        ...(relationRecord.remarkName ? { remarkName: relationRecord.remarkName } : {}),
      };
    }

    await store.saveUserState(session.userId, userState);
    const next = createCurrentUserResponse(session, userState, c.req.url);
    const response: UserRelationMutationResponse = {
      accountSummary: next.accountSummary,
      userStatus: next.userStatus,
      relationTargets: next.relationTargets,
      ...(payload.listKind
        ? {
            relationList: listUserRelations(userState, next.userStatus.availability, {
              kind: payload.listKind,
              ...(payload.page ? { page: payload.page } : {}),
              ...(payload.pageSize ? { pageSize: payload.pageSize } : {}),
              ...(payload.keyword ? { keyword: payload.keyword } : {}),
            }),
          }
        : {}),
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
    const response = getManagedContentDetail(
      {
        contentId: query.contentId,
        ...(query.actorRole ? { actorRole: query.actorRole as ContentActorRole } : {}),
      },
      userState,
    );
    if (!response) {
      return jsonError("NOT_FOUND", "Managed content not found.", 404, c.get("traceId"));
    }

    return c.json(response satisfies ContentDetailResponse);
  });

  app.get("/content/review-queue", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), contentReviewQueueQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const request: ListContentReviewQueueRequest = {
      ...(query.page !== undefined ? { page: query.page } : {}),
      ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
      ...(query.state !== undefined ? { state: query.state } : {}),
      ...(query.actorRole !== undefined ? { actorRole: query.actorRole } : {}),
    };
    return c.json(listManagedContentReviewQueue(userState, request) satisfies ContentReviewQueueResponse);
  });

  app.post("/content/save-draft", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, contentDraftSaveSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const request: SaveContentDraftRequest = {
      model: payload.model,
      title: payload.title,
      summary: payload.summary,
      visibility: payload.visibility,
      categoryKey: payload.categoryKey,
      categoryLabel: payload.categoryLabel,
      tags: payload.tags,
      ...(payload.contentId ? { contentId: payload.contentId } : {}),
      ...(payload.subtitle ? { subtitle: payload.subtitle } : {}),
      ...(payload.bodyPreview ? { bodyPreview: payload.bodyPreview } : {}),
      ...(payload.coverAssetId ? { coverAssetId: payload.coverAssetId } : {}),
      ...(payload.attachmentAssetIds ? { attachmentAssetIds: payload.attachmentAssetIds } : {}),
      ...(payload.actorRole ? { actorRole: payload.actorRole } : {}),
    };
    const response = saveManagedContentDraft(userState, request);
    if (!response.ok) {
      return jsonError(response.code, response.message, response.code === "FORBIDDEN" ? 403 : 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response.value satisfies SaveContentDraftResponse);
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
      ...(payload.actorRole ? { actorRole: payload.actorRole } : {}),
    });
    if (!response.ok) {
      return jsonError(response.code, response.message, response.code === "FORBIDDEN" ? 403 : 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response.value satisfies ContentLifecycleMutationResponse);
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

  app.get("/messages/threads", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), messageThreadListQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const request: ListMessageThreadsRequest = {
      ...(query.page !== undefined ? { page: query.page } : {}),
      ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
      ...(query.type !== undefined ? { type: query.type } : {}),
      ...(query.onlyUnread !== undefined ? { onlyUnread: query.onlyUnread } : {}),
      ...(query.sort !== undefined ? { sort: query.sort } : {}),
      ...(query.sourceTicketId !== undefined ? { sourceTicketId: query.sourceTicketId } : {}),
    };
    return c.json(listMessageThreadResponse(userState, request));
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
    const response = getMessageThread(userState, {
      threadId: query.threadId,
      ...(query.cursor !== undefined ? { cursor: query.cursor } : {}),
    });
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }

    return c.json(response);
  });

  app.post("/messages/thread/create", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, createMessageThreadSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "messages",
      scope: "messages",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "messages_thread_create_rate_limited",
      blockedMessage: "Too many message operations. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const request: CreateMessageThreadRequest = {
      type: payload.type,
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.participantUserIds !== undefined ? { participantUserIds: payload.participantUserIds } : {}),
      ...(payload.sourceTicketId !== undefined ? { sourceTicketId: payload.sourceTicketId } : {}),
      ...(payload.replyPolicy !== undefined ? { replyPolicy: payload.replyPolicy } : {}),
    };
    const response = createMessageThread(userState, request);
    appendSecurityAuditEvent({
      userState,
      scope: "messages",
      action: "thread_create",
      result: "allowed",
      message: "Message thread created.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies CreateMessageThreadResponse);
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
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "messages",
      scope: "messages",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "messages_send_rate_limited",
      blockedMessage: "Too many message operations. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const request: SendMessageRequest = {
      threadId: payload.threadId,
      body: payload.body,
    };
    const response = sendThreadMessage(userState, request);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }
    if (response.messageItem.deliveryStatus === "failed") {
      await scheduleOperationalJobForUser(store, {
        userId: session.userId,
        userState,
        kind: "notification_retry",
        dedupeKey: `message_retry:${response.messageItem.messageId}`,
        relatedRecordId: response.messageItem.messageId,
      });
    }

    appendSecurityAuditEvent({
      userState,
      scope: "messages",
      action: "thread_send",
      result: "allowed",
      message: "Message sent into thread.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies SendMessageResponse);
  });

  app.post("/messages/thread/retry", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, retryMessageSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const request: RetryMessageRequest = {
      threadId: payload.threadId,
      messageId: payload.messageId,
    };
    const response = retryThreadMessage(userState, request);
    if (!response) {
      return jsonError("NOT_FOUND", "Retryable message not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies RetryMessageResponse);
  });

  app.get("/messages/thread/sync", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), threadIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const request: SyncMessageThreadRequest = {
      threadId: query.threadId,
      ...(query.cursor !== undefined ? { cursor: query.cursor } : {}),
    };
    const response = syncMessageThread(userState, request);
    if (!response) {
      return jsonError("NOT_FOUND", "Message thread not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response);
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
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "share",
      scope: "share",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "share_prepare_rate_limited",
      blockedMessage: "Too many share preparations. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const response = createSharePrepareResponse(normalizeSharePrepareRequest(payload), c.req.url);
    userState.sharePreparesById[response.shareAttribution.attributionId ?? response.sharePayload.shareToken ?? response.sharePayload.title] = response;
    appendSecurityAuditEvent({
      userState,
      scope: "share",
      action: "share_prepare",
      result: "allowed",
      message: "Share payload prepared.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.get("/share/resolve", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), shareResolveSchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing =
      (query.attributionId ? userState.sharePreparesById[query.attributionId] : undefined) ??
      Object.values(userState.sharePreparesById).find((entry) => entry.shortLinkRecord?.shortCode === query.shortCode);
    if (!existing) {
      return jsonError("NOT_FOUND", "Share short link was not found.", 404, traceId);
    }

    const response = resolveShareShortLink(existing);
    const nextKey = response.shareAttribution.attributionId ?? response.sharePayload.shareToken ?? existing.sharePayload.title;
    userState.sharePreparesById[nextKey] = {
      ...existing,
      sharePayload: response.sharePayload,
      shareChannel: response.shareChannel,
      shareAttribution: response.shareAttribution,
      landingTarget: response.landingTarget,
      shortLinkRecord: response.shortLinkRecord,
      ...(response.posterAsset ? { posterAsset: response.posterAsset } : {}),
      attributionReport: response.attributionReport,
    };
    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies ShareShortLinkResolveResponse);
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
      ...existing,
      sharePayload: response.sharePayload,
      shareChannel: response.shareChannel,
      shareAttribution: response.shareAttribution,
      landingTarget: response.landingTarget ?? existing.landingTarget,
      ...(response.shortLinkRecord ? { shortLinkRecord: response.shortLinkRecord } : {}),
      ...(response.posterAsset ? { posterAsset: response.posterAsset } : {}),
      attributionReport: response.attributionReport,
    };
    await store.saveUserState(session.userId, userState);
    return c.json(response);
  });

  app.get("/share/report", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), shareAttributionReportSchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const request: ShareAttributionReportRequest = {
      attributionId: query.attributionId,
    };
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = userState.sharePreparesById[request.attributionId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Share attribution was not found.", 404, traceId);
    }

    const response = createShareAttributionReport(existing);
    return c.json(response satisfies ShareAttributionReportResponse);
  });

  app.post("/uploads", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, uploadSessionRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    let record = createUploadSessionRecord(normalizeUploadSessionRequest(payload), c.req.url, userState);
    const initialTransfer = record.transfer;
    const initialSession = record.session;
    if (initialTransfer && !record.uploadError && initialSession) {
      for (const chunk of initialTransfer.chunks) {
        record = appendUploadChunkRecord(record, {
          taskId: record.uploadTask.taskId,
          sessionId: initialSession.sessionId,
          chunk,
        });
        if (record.uploadError) {
          break;
        }
      }
      if (!record.uploadError) {
        record = completeUploadRecord(
          record,
          {
            taskId: record.uploadTask.taskId,
            sessionId: initialSession.sessionId,
            fileChecksum: initialTransfer.fileChecksum,
            checksumAlgorithm: initialTransfer.checksumAlgorithm,
          },
          c.req.url,
        );
      }
    }
    userState.uploadsByTaskId[record.uploadTask.taskId] = record;
    if (record.cleanupRecord?.retentionStatus === "scheduled_cleanup") {
      await scheduleOperationalJobForUser(store, {
        userId: session.userId,
        userState,
        kind: "upload_cleanup",
        dedupeKey: `upload_cleanup:${record.uploadTask.taskId}`,
        relatedRecordId: record.uploadTask.taskId,
        ...(record.cleanupRecord.cleanupScheduledAt ? { scheduledAt: record.cleanupRecord.cleanupScheduledAt } : {}),
      });
    }
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/session", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, uploadSessionRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "upload",
      scope: "upload",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "upload_session_rate_limited",
      blockedMessage: "Too many upload sessions. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
    const record = createUploadSessionRecord(normalizeUploadSessionRequest(payload), c.req.url, userState);
    userState.uploadsByTaskId[record.uploadTask.taskId] = record;
    appendSecurityAuditEvent({
      userState,
      scope: "upload",
      action: "upload_session_create",
      result: "allowed",
      message: "Upload session created.",
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/chunk", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, uploadChunkRequestSchema, traceId);
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

    const request: UploadChunkRequest = normalizeUploadChunkRequest(payload);
    const record = appendUploadChunkRecord(existing, request);
    userState.uploadsByTaskId[payload.taskId] = record;
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/complete", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, uploadCompleteSchema, traceId);
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

    const request: UploadCompleteRequest = {
      taskId: payload.taskId,
      sessionId: payload.sessionId,
      fileChecksum: payload.fileChecksum,
      checksumAlgorithm: payload.checksumAlgorithm,
    };
    const record = completeUploadRecord(existing, request, c.req.url);
    userState.uploadsByTaskId[payload.taskId] = record;
    if (record.cleanupRecord?.retentionStatus === "scheduled_cleanup") {
      await scheduleOperationalJobForUser(store, {
        userId: session.userId,
        userState,
        kind: "upload_cleanup",
        dedupeKey: `upload_cleanup:${record.uploadTask.taskId}`,
        relatedRecordId: record.uploadTask.taskId,
        ...(record.cleanupRecord.cleanupScheduledAt ? { scheduledAt: record.cleanupRecord.cleanupScheduledAt } : {}),
      });
    }
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.post("/uploads/attach", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, uploadAttachSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = payload.taskId
      ? userState.uploadsByTaskId[payload.taskId]
      : payload.assetId
        ? findUploadRecordByAssetId(userState, payload.assetId)
        : undefined;
    if (!existing) {
      return jsonError("NOT_FOUND", "Upload task not found.", 404, traceId);
    }

    const request: UploadAttachRequest = {
      ...(payload.taskId ? { taskId: payload.taskId } : {}),
      ...(payload.assetId ? { assetId: payload.assetId } : {}),
      reference: {
        ownerType: payload.reference.ownerType,
        ownerId: payload.reference.ownerId,
        role: payload.reference.role,
      },
    };
    const record = attachUploadRecord(existing, request);
    userState.uploadsByTaskId[record.uploadTask.taskId] = record;
    if (request.reference.ownerType === "avatar" && record.uploadAsset?.assetId) {
      userState.profileOverrides = {
        ...(userState.profileOverrides ?? {}),
        avatarAssetId: record.uploadAsset.assetId,
      };
    }
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
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
    const record = retryUploadPipeline(existing, request);
    userState.uploadsByTaskId[payload.taskId] = record;
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
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
    const record = cancelUploadPipeline(existing, request);
    userState.uploadsByTaskId[payload.taskId] = record;
    await scheduleOperationalJobForUser(store, {
      userId: session.userId,
      userState,
      kind: "upload_cleanup",
      dedupeKey: `upload_cleanup:${record.uploadTask.taskId}`,
      relatedRecordId: record.uploadTask.taskId,
      ...(record.cleanupRecord?.cleanupScheduledAt ? { scheduledAt: record.cleanupRecord.cleanupScheduledAt } : {}),
    });
    await store.saveUserState(session.userId, userState);
    return c.json(createUploadResponse(record));
  });

  app.get("/uploads/assets/:assetId", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const assetId = c.req.param("assetId");
    const binary = readUploadedAssetBinary(userState, assetId);
    if (!binary) {
      return jsonError("NOT_FOUND", "Upload asset not found.", 404, c.get("traceId"));
    }
    return new Response(Buffer.from(binary.body), {
      headers: {
        "content-type": binary.contentType,
        "cache-control": "private, max-age=60",
      },
    });
  });

  app.get("/uploads/assets/:assetId/thumb", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const assetId = c.req.param("assetId");
    const asset = resolveUploadAssetForUser(userState, assetId);
    if (!asset) {
      return jsonError("NOT_FOUND", "Upload asset not found.", 404, c.get("traceId"));
    }
    const title = encodeURIComponent(asset.fileName);
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#0f172a"/><text x="24" y="84" fill="#f8fafc" font-size="22" font-family="sans-serif">Preview</text><text x="24" y="116" fill="#cbd5e1" font-size="14" font-family="sans-serif">${title}</text></svg>`,
      {
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "private, max-age=60",
        },
      },
    );
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

  app.get("/feedback/tickets", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), feedbackTicketListQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const request: ListFeedbackTicketsRequest = {
      ...(query.page !== undefined ? { page: query.page } : {}),
      ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
      ...(query.state !== undefined ? { state: query.state } : {}),
      ...(query.categoryKey !== undefined ? { categoryKey: query.categoryKey } : {}),
      ...(query.keyword !== undefined ? { keyword: query.keyword } : {}),
    };
    return c.json(listFeedbackTickets(userState, request) satisfies ListFeedbackTicketsResponse);
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

  app.post("/feedback/ticket/action", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, feedbackTicketActionSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const request: FeedbackTicketActionRequest = {
      ticketId: payload.ticketId,
      ...(payload.state !== undefined ? { state: payload.state } : {}),
      ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
      ...(payload.labels !== undefined ? { labels: payload.labels } : {}),
      ...(payload.assignee !== undefined
        ? {
            assignee: {
              userId: payload.assignee.userId,
              label: payload.assignee.label,
              ...(payload.assignee.teamLabel !== undefined ? { teamLabel: payload.assignee.teamLabel } : {}),
              ...(payload.assignee.assignedAt !== undefined ? { assignedAt: payload.assignee.assignedAt } : {}),
            },
          }
        : {}),
      ...(payload.queueKey !== undefined ? { queueKey: payload.queueKey } : {}),
      ...(payload.queueLabel !== undefined ? { queueLabel: payload.queueLabel } : {}),
      ...(payload.sla !== undefined
        ? {
            sla: {
              policyKey: payload.sla.policyKey,
              label: payload.sla.label,
              deadlineAt: payload.sla.deadlineAt,
              breached: payload.sla.breached,
              ...(payload.sla.updatedAt !== undefined ? { updatedAt: payload.sla.updatedAt } : {}),
            },
          }
        : {}),
      ...(payload.note !== undefined ? { note: payload.note } : {}),
      ...(payload.supportReply !== undefined ? { supportReply: payload.supportReply } : {}),
    };
    const response = applyFeedbackTicketAction(userState, request);
    if (!response) {
      return jsonError("NOT_FOUND", "Feedback ticket not found.", 404, traceId);
    }

    await store.saveUserState(session.userId, userState);
    return c.json(response satisfies FeedbackTicketActionResponse);
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
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "feedback",
      scope: "feedback",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "feedback_submit_rate_limited",
      blockedMessage: "Too many feedback submissions. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }
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
    appendSecurityAuditEvent({
      userState,
      scope: "feedback",
      action: "feedback_submit",
      result: "allowed",
      message: `Feedback ticket ${response.feedbackTicket.ticketId} submitted.`,
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
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
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, purchaseMembershipSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    const purchasePayload: PurchaseMembershipRequest = {
      planId: payload.planId,
      ...(payload.channel ? { channel: payload.channel } : {}),
      ...(payload.providerMode ? { providerMode: payload.providerMode } : {}),
      ...(payload.paymentScenario ? { paymentScenario: payload.paymentScenario } : {}),
      ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
      ...(payload.source ? { source: payload.source } : {}),
      ...(payload.novelId ? { novelId: payload.novelId } : {}),
      ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    };

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardSecurityRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      action: "payment",
      scope: "payment",
      platform: session.platform,
      clientId,
      deviceId,
      actorUserId: session.userId,
      traceId,
      ...(options.authRateLimitConfig ? { config: options.authRateLimitConfig } : {}),
      ...(options.authRateLimitStore ? { counterStore: options.authRateLimitStore } : {}),
      blockedAction: "payment_purchase_rate_limited",
      blockedMessage: "Too many payment attempts. Retry later.",
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }

    const existingOrderId = purchasePayload.idempotencyKey ? userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey] : undefined;
    const existingOrder = existingOrderId ? userState.ordersById[existingOrderId] : undefined;
    if (existingOrder?.entitlement && "overview" in existingOrder.entitlement) {
      const message = existingOrder.order.status === "paid"
        ? "Idempotency key matched an existing paid order. Returning the stored result without another charge."
        : "Idempotency key matched an existing order. Returning the stored gateway intent without creating another charge.";
      return c.json(
        createMembershipPurchaseResponse(
          {
            order: {
              ...existingOrder.order,
              duplicateProtected: true,
            },
            paymentIntent: existingOrder.paymentIntent,
            paymentResult: {
              ...existingOrder.paymentResult,
              duplicateProtected: true,
              message,
            },
            callbackVerification: existingOrder.callbackVerification,
            reconciliation: existingOrder.reconciliation,
            ...(existingOrder.paymentLedger ? { paymentLedger: existingOrder.paymentLedger } : {}),
            ...(existingOrder.operationLedger ? { operationLedger: existingOrder.operationLedger } : {}),
            ...(existingOrder.callbackLedger ? { callbackLedger: existingOrder.callbackLedger } : {}),
            ...(existingOrder.reconciliationLedger ? { reconciliationLedger: existingOrder.reconciliationLedger } : {}),
            entitlement: existingOrder.entitlement as MembershipEntitlement,
          },
          purchasePayload,
        ) satisfies PurchaseMembershipResponse,
      );
    }
    const duplicateProtected = Boolean(userState.latestPaidOrderId);
    const orderDetail = createMembershipOrderDetail(session, purchasePayload, duplicateProtected);
    const assetLedgerIds = appendPaymentAssetLedgerEntries({
      userState,
      detail: orderDetail,
      action: orderDetail.order.status === "paid" ? "purchase_paid" : "purchase_pending",
    });
    if (orderDetail.operationResult) {
      orderDetail.operationResult.assetLedgerIds = assetLedgerIds;
    }
    userState.ordersById[orderDetail.order.orderId] = orderDetail;
    if (orderDetail.order.status === "paid") {
      userState.membershipPlanId = purchasePayload.planId;
      userState.latestPaidOrderId = orderDetail.order.orderId;
    }
    if (purchasePayload.idempotencyKey) {
      userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey] = orderDetail.order.orderId;
    }
    appendSecurityAuditEvent({
      userState,
      scope: "payment",
      action: "membership_purchase",
      result: orderDetail.order.status === "paid" ? "allowed" : "review",
      message: `Membership purchase ${orderDetail.order.status} for ${purchasePayload.planId}.`,
      createdAt: new Date().toISOString(),
      actorUserId: session.userId,
      ...(deviceId ? { deviceId } : {}),
      clientId,
      platform: session.platform,
      traceId,
    });
    if (orderDetail.reconciliation.status !== "reconciled") {
      await scheduleOperationalJobForUser(store, {
        userId: session.userId,
        userState,
        kind: "payment_reconciliation",
        dedupeKey: `payment_reconciliation:${orderDetail.order.orderId}`,
        relatedRecordId: orderDetail.order.orderId,
      });
    }
    await store.saveUserState(session.userId, userState);

    return c.json(createMembershipPurchaseResponse(orderDetail, purchasePayload) satisfies PurchaseMembershipResponse);
  });

  app.get("/orders/catalog", async (c) => {
    return c.json(createPaymentCatalogResponse() satisfies PaymentCatalogResponse);
  });

  app.post("/orders/purchase", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, purchaseOrderSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    const purchasePayload: PurchaseOrderRequest = {
      skuId: payload.skuId,
      ...(payload.channel ? { channel: payload.channel } : {}),
      ...(payload.providerMode ? { providerMode: payload.providerMode } : {}),
      ...(payload.paymentScenario ? { paymentScenario: payload.paymentScenario } : {}),
      ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
      ...(payload.source ? { source: payload.source } : {}),
      ...(payload.novelId ? { novelId: payload.novelId } : {}),
      ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
      ...(payload.subscriptionId ? { subscriptionId: payload.subscriptionId } : {}),
    };

    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existingOrderId = purchasePayload.idempotencyKey ? userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey] : undefined;
    const existingOrder = existingOrderId ? userState.ordersById[existingOrderId] : undefined;
    if (existingOrder?.product && existingOrder.sku) {
      return c.json({
        order: existingOrder.order,
        product: existingOrder.product,
        sku: existingOrder.sku,
        paymentIntent: existingOrder.paymentIntent,
        paymentResult: existingOrder.paymentResult,
        callbackVerification: existingOrder.callbackVerification,
        reconciliation: existingOrder.reconciliation,
        ...(existingOrder.operationResult ? { operationResult: existingOrder.operationResult } : {}),
        ...(existingOrder.entitlement ? { entitlement: existingOrder.entitlement } : {}),
        ...(existingOrder.subscription ? { subscription: existingOrder.subscription } : {}),
      } satisfies PurchaseOrderResponse);
    }

    const duplicateProtected = Boolean(userState.latestPaidOrderId);
    const orderDetail = createProductOrderDetail(session, purchasePayload, duplicateProtected);
    if (!orderDetail?.product || !orderDetail.sku) {
      return jsonError("BAD_REQUEST", "Unknown SKU.", 400, traceId);
    }
    const assetLedgerIds = appendPaymentAssetLedgerEntries({
      userState,
      detail: orderDetail,
      action: orderDetail.order.status === "paid" ? "purchase_paid" : "purchase_pending",
    });
    if (orderDetail.operationResult) {
      orderDetail.operationResult.assetLedgerIds = assetLedgerIds;
    }
    userState.ordersById[orderDetail.order.orderId] = orderDetail;
    if (purchasePayload.idempotencyKey) {
      userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey] = orderDetail.order.orderId;
    }
    if (orderDetail.reconciliation.status !== "reconciled") {
      await scheduleOperationalJobForUser(store, {
        userId: session.userId,
        userState,
        kind: "payment_reconciliation",
        dedupeKey: `payment_reconciliation:${orderDetail.order.orderId}`,
        relatedRecordId: orderDetail.order.orderId,
      });
    }
    await store.saveUserState(session.userId, userState);
    return c.json({
      order: orderDetail.order,
      product: orderDetail.product,
      sku: orderDetail.sku,
      paymentIntent: orderDetail.paymentIntent,
      paymentResult: orderDetail.paymentResult,
      callbackVerification: orderDetail.callbackVerification,
      reconciliation: orderDetail.reconciliation,
      ...(orderDetail.operationResult ? { operationResult: orderDetail.operationResult } : {}),
      ...(orderDetail.entitlement ? { entitlement: orderDetail.entitlement } : {}),
      ...(orderDetail.subscription ? { subscription: orderDetail.subscription } : {}),
    } satisfies PurchaseOrderResponse);
  });

  app.get("/orders/list", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), listOrdersQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }
    const request: ListOrdersRequest = {
      ...(query.page ? { page: query.page } : {}),
      ...(query.pageSize ? { pageSize: query.pageSize } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.productType ? { productType: query.productType } : {}),
    };
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(listOrders(userState, request) satisfies OrderListResponse);
  });

  app.get("/subscriptions", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(listSubscriptions(userState) satisfies SubscriptionListResponse);
  });

  app.post("/subscriptions/cancel", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, subscriptionOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const targetEntry = Object.entries(userState.ordersById).find(([, detail]) => detail.subscription?.subscriptionId === payload.subscriptionId);
    if (!targetEntry) {
      return jsonError("NOT_FOUND", "Subscription not found.", 404, traceId);
    }
    const [orderId, existing] = targetEntry;
    if (!existing.subscription) {
      return jsonError("BAD_REQUEST", "Subscription not found.", 400, traceId);
    }
    const processedAt = new Date().toISOString();
    const nextOrder: OrderDetailResponse = {
      ...existing,
      subscription: {
        ...existing.subscription,
        status: "cancelled",
        statusLabel: "Auto-renew disabled. Access remains until the current term ends.",
        autoRenew: false,
        cancelledAt: processedAt,
        ...(existing.subscription.renewsAt ? { graceEndsAt: existing.subscription.renewsAt } : {}),
      },
      operationResult: createPaymentOperationResult({
        operation: "cancel",
        applied: true,
        orderStatus: existing.order.status,
        paymentStatus: existing.paymentResult.status,
        message: "Subscription auto-renew was disabled for the current term.",
        processedAt,
      }),
    };
    userState.ordersById[orderId] = nextOrder;
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
  });

  app.post("/subscriptions/renew", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, subscriptionOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const existing = Object.values(userState.ordersById).find((detail) => detail.subscription?.subscriptionId === payload.subscriptionId);
    if (!existing?.sku) {
      return jsonError("NOT_FOUND", "Subscription not found.", 404, traceId);
    }
    const renewalDetail = createProductOrderDetail(
      session,
      {
        skuId: payload.skuId ?? existing.sku.skuId,
        subscriptionId: payload.subscriptionId,
        paymentScenario: "instant_success",
        ...(existing.order.source ? { source: existing.order.source } : {}),
        ...(existing.order.novelId ? { novelId: existing.order.novelId } : {}),
        ...(existing.order.chapterId ? { chapterId: existing.order.chapterId } : {}),
      },
      Boolean(userState.latestPaidOrderId),
    );
    if (!renewalDetail?.subscription) {
      return jsonError("BAD_REQUEST", "Subscription renewal failed.", 400, traceId);
    }
    renewalDetail.subscription = {
      ...renewalDetail.subscription,
      subscriptionId: payload.subscriptionId,
      status: "active",
      statusLabel: "Renewal succeeded for the next subscription term.",
    };
    const assetLedgerIds = appendPaymentAssetLedgerEntries({
      userState,
      detail: renewalDetail,
      action: "purchase_paid",
    });
    renewalDetail.operationResult = createPaymentOperationResult({
      operation: "reconcile",
      applied: true,
      orderStatus: renewalDetail.order.status,
      paymentStatus: renewalDetail.paymentResult.status,
      message: "Subscription renewal created the next paid term.",
    });
    renewalDetail.operationResult.assetLedgerIds = assetLedgerIds;
    userState.ordersById[renewalDetail.order.orderId] = renewalDetail;
    await store.saveUserState(session.userId, userState);
    return c.json({
      order: renewalDetail.order,
      product: renewalDetail.product!,
      sku: renewalDetail.sku!,
      paymentIntent: renewalDetail.paymentIntent,
      paymentResult: renewalDetail.paymentResult,
      callbackVerification: renewalDetail.callbackVerification,
      reconciliation: renewalDetail.reconciliation,
      ...(renewalDetail.operationResult ? { operationResult: renewalDetail.operationResult } : {}),
      ...(renewalDetail.entitlement ? { entitlement: renewalDetail.entitlement } : {}),
      subscription: renewalDetail.subscription,
    } satisfies PurchaseOrderResponse);
  });

  app.get("/after-sales/list", async (c) => {
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    return c.json(listAfterSalesCases(userState) satisfies AfterSalesListResponse);
  });

  app.get("/after-sales/detail", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), afterSalesDetailQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }
    const session = c.get("session");
    const store = getStore(c.env, options.store);
    const userState = await store.getUserState(session.userId);
    const detail = getAfterSalesCaseDetail(userState, query.caseId);
    if (!detail) {
      return jsonError("NOT_FOUND", "After-sales case not found.", 404, traceId);
    }
    return c.json(detail satisfies AfterSalesDetailResponse);
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
    if (nextOrder.order.status === "cancelled") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "cancel_pending",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
      const caseItem = createAfterSalesCaseRecord({
        kind: "cancel",
        detail: nextOrder,
        ...(payload.reason ? { reason: payload.reason } : {}),
        processedAt: nextOrder.operationResult?.processedAt ?? nextOrder.order.updatedAt,
      });
      userState.afterSalesById[caseItem.caseId] = caseItem;
      userState.ordersById[payload.orderId] = attachAfterSalesCase(nextOrder, caseItem);
      await store.saveUserState(session.userId, userState);
      const response = userState.ordersById[payload.orderId]!;
      return c.json(response satisfies OrderDetailResponse);
    }
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
    if (nextOrder.order.status === "refunded") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "refund_paid",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
      const caseItem = createAfterSalesCaseRecord({
        kind: "refund",
        detail: nextOrder,
        ...(payload.reason ? { reason: payload.reason } : {}),
        processedAt: nextOrder.operationResult?.processedAt ?? nextOrder.order.updatedAt,
      });
      userState.afterSalesById[caseItem.caseId] = caseItem;
      userState.ordersById[payload.orderId] = attachAfterSalesCase(nextOrder, caseItem);
      if (nextOrder.order.status === "refunded" && userState.latestPaidOrderId === payload.orderId) {
        delete userState.latestPaidOrderId;
        delete userState.membershipPlanId;
      }
      await store.saveUserState(session.userId, userState);
      const response = userState.ordersById[payload.orderId]!;
      return c.json(response satisfies OrderDetailResponse);
    }
    userState.ordersById[payload.orderId] = nextOrder;
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

    const now = Date.now();
    const verification = verifyPaymentCallback({
      detail: existing,
      payload: {
        orderId: payload.orderId,
        outcome: payload.outcome,
        ...(payload.verified !== undefined ? { verified: payload.verified } : {}),
        ...(payload.callbackReference ? { callbackReference: payload.callbackReference } : {}),
        ...(payload.provider ? { provider: payload.provider } : {}),
        ...(payload.gatewayTransactionId ? { gatewayTransactionId: payload.gatewayTransactionId } : {}),
        ...(payload.nonce ? { nonce: payload.nonce } : {}),
        ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
        ...(payload.signature ? { signature: payload.signature } : {}),
      },
      secret: typeof c.env?.MINIX_PAYMENT_WEBHOOK_SECRET === "string"
        ? c.env.MINIX_PAYMENT_WEBHOOK_SECRET
        : "minix-local-payment-secret",
      now,
    });
    if (!verification.ok) {
      const rejected = cloneOrderDetail(existing);
      const receivedAt = new Date(now).toISOString();
      rejected.callbackVerification = {
        status: "rejected",
        message: verification.message,
        callbackReference: verification.callbackReference,
      };
      appendCallbackLedger(rejected, {
        callbackReference: verification.callbackReference,
        orderId: payload.orderId,
        outcome: payload.outcome,
        verificationStatus: "rejected",
        ...(payload.nonce ? { nonce: payload.nonce } : {}),
        ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
        ...(verification.signatureDigest ? { signatureDigest: verification.signatureDigest } : {}),
        replayProtected: true,
        message: verification.message,
        receivedAt,
      });
      userState.ordersById[payload.orderId] = rejected;
      const operationalState = cloneOperationalState(await store.getOperationalState());
      appendOperationalMonitoringEvent(operationalState, {
        level: "warn",
        scope: "security",
        message: `Payment callback rejected for order ${payload.orderId}: ${verification.message}`,
        createdAt: receivedAt,
        userId: session.userId,
        dedupeKey: verification.callbackReference,
      });
      appendOperationalAuditRecord(operationalState, {
        category: "governance",
        action: "payment_callback_rejected",
        message: verification.message,
        createdAt: receivedAt,
        userId: session.userId,
        recordId: payload.orderId,
        metadata: {
          callbackVerified: false,
        },
      });
      await store.saveOperationalState(operationalState);
      await store.saveUserState(session.userId, userState);
      return jsonError("PAYMENT_CALLBACK_REJECTED", verification.message, 400, traceId);
    }

    const callbackPayload: PaymentCallbackRequest = {
      orderId: payload.orderId,
      outcome: payload.outcome,
      verified: true,
      callbackReference: verification.callbackReference,
      ...(payload.provider ? { provider: payload.provider } : {}),
      ...(payload.gatewayTransactionId ? { gatewayTransactionId: payload.gatewayTransactionId } : {}),
      ...(payload.nonce ? { nonce: payload.nonce } : {}),
      ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
      ...(payload.signature ? { signature: payload.signature } : {}),
    };
    const nextOrder = applyPaymentCallback(existing, callbackPayload);
    if (payload.outcome === "success" && nextOrder.order.status === "paid") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "callback_success",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
    } else if (payload.outcome === "failure") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "callback_failure",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
    } else if (payload.outcome === "cancelled") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "callback_cancelled",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
    }
    appendCallbackLedger(nextOrder, {
      callbackReference: verification.callbackReference,
      orderId: payload.orderId,
      outcome: payload.outcome,
      verificationStatus: "verified",
      ...(payload.nonce ? { nonce: payload.nonce } : {}),
      ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
      ...(verification.signatureDigest ? { signatureDigest: verification.signatureDigest } : {}),
      replayProtected: true,
      message: verification.message,
      receivedAt: new Date(now).toISOString(),
    });
    userState.ordersById[payload.orderId] = nextOrder;
    if (nextOrder.order.status === "paid" && nextOrder.entitlement && "overview" in nextOrder.entitlement) {
      userState.membershipPlanId = resolveMembershipPlanIdFromOrder(nextOrder) ?? "quarterly";
      userState.latestPaidOrderId = payload.orderId;
    }
    if (nextOrder.reconciliation.status !== "reconciled") {
      await scheduleOperationalJobForUser(store, {
        userId: session.userId,
        userState,
        kind: "payment_reconciliation",
        dedupeKey: `payment_reconciliation:${nextOrder.order.orderId}`,
        relatedRecordId: nextOrder.order.orderId,
      });
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
