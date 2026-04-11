import { createHash } from "node:crypto";

import { APP_ROUTE_IDS, NOTIFICATION_TYPES } from "@minix/contracts";
import type {
  AccountOperation,
  BookshelfItem,
  BookshelfResponse,
  ChapterContent,
  ChapterListResponse,
  ChapterSummary,
  ContentAccess,
  ContentCard,
  ContentDetail,
  ContentDetailResponse,
  ContentDisplay,
  ContentLifecycleAction,
  ContentLifecycleMutationRequest,
  ContentLifecycleMutationResponse,
  ContentLifecycle,
  CurrentUserResponse,
  FeedbackBootstrapResponse,
  FeedbackCategory,
  FeedbackFaqEntry,
  FeedbackPriority,
  FeedbackRevisitAction,
  FeedbackRevisitRequest,
  FeedbackRevisitResponse,
  FeedbackStatus,
  FeedbackSupportEntry,
  FeedbackTicket,
  FeedbackTicketDetailResponse,
  FeedbackType,
  FeedItem,
  FeedListResponse,
  FeedTag,
  ItemsListResponse,
  MarkNotificationsReadResponse,
  MarkThreadReadRequest,
  MessageBodyItem,
  MessageThreadActions,
  MessageThread,
  MessageThreadResponse,
  MessageTouchpoint,
  MembershipOverview,
  MembershipEntitlement,
  NovelCard,
  NovelDetail,
  NovelListResponse,
  NotificationFilterGroup,
  NotificationGroupSummary,
  NotificationItem,
  NotificationList,
  NotificationListResponse,
  NotificationType,
  Order,
  OrderDetailResponse,
  PaymentCallbackVerification,
  PaymentChannel,
  PaymentGatewayExecutionRequest,
  PaymentGatewayExecutionResponse,
  PaymentGatewayProvider,
  PaymentIntent,
  PaymentLedgerEntry,
  PaymentOperationResult,
  PaymentProviderMode,
  PaymentReconciliation,
  PaymentReconciliationLedgerEntry,
  PaymentResult,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  RelatedNovelSummary,
  SearchDomain,
  SearchFilterGroup,
  SearchResults,
  SearchSortOption,
  SharePrepareRequest,
  SharePrepareResponse,
  ShareReturnRecognitionRequest,
  ShareReturnRecognitionResponse,
  SendMessageRequest,
  SendMessageResponse,
  SettingsResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  UserAvailabilityStatus,
  UserRelationAction,
  UserRelationTarget,
  UnreadBadge,
  UploadAsset,
  UploadAttachRequest,
  UploadCancelRequest,
  UploadChunkReceipt,
  UploadChunkRequest,
  UploadCleanupRecord,
  UploadError,
  UploadPipelineSource,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadProgress,
  UploadReference,
  UploadReviewRecord,
  UploadRetryRequest,
  UploadReviewStatus,
  UploadScenario,
  UploadSelectionResult,
  UploadSession,
  UploadSessionRequest,
  UploadTask,
  UploadTransferPayload,
} from "@minix/contracts";

import {
  CHAPTER_CONTENT,
  CHAPTER_LISTS,
  DEFAULT_BOOKSHELF_NOVEL_IDS,
  DEFAULT_MEMBERSHIP_OVERVIEW,
  DEFAULT_PROGRESS_BY_NOVEL_ID,
  HOST_ITEMS,
  MEMBER_RENEWAL_LABELS,
  NOVELS,
} from "./content";
import { resolveSampleMediaUrl } from "./sample-assets";
import type { SessionRecord, StoredUploadRecord, UserState } from "./types";

export { CHAPTER_CONTENT, CHAPTER_LISTS, DEFAULT_MEMBERSHIP_OVERVIEW, NOVELS } from "./content";

function resolveMaskedPhoneNumber(phoneNumber: string | undefined): string | undefined {
  if (!phoneNumber) {
    return undefined;
  }

  const normalized = phoneNumber.replace(/[^\d]/g, "");
  if (normalized.length < 7) {
    return undefined;
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
}

function createDefaultManagedContentEntries(): NonNullable<UserState["managedContentById"]> {
  return {
    lesson_1: {
      model: "article",
      visibility: "public",
      lifecycle: {
        state: "published",
        availableActions: ["update", "archive", "delete", "change_visibility"],
        publishedAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-01T08:00:00.000Z",
      },
      authorLabel: "MiniX Editorial",
      summary: HOST_ITEMS[0]?.subtitle ?? "Warm-up content block.",
      categoryKey: "warm-up",
      categoryLabel: "Warm-up",
      tags: [{ key: "article", label: "Article" }],
    },
    lesson_2: {
      model: "course",
      visibility: "login_required",
      lifecycle: {
        state: "draft",
        availableActions: ["publish", "submit_review", "delete", "change_visibility"],
        updatedAt: "2026-04-02T08:00:00.000Z",
      },
      authorLabel: "MiniX Curriculum",
      summary: HOST_ITEMS[1]?.subtitle ?? "Dialogue content block.",
      categoryKey: "input",
      categoryLabel: "Input",
      tags: [{ key: "course", label: "Course" }],
    },
    lesson_3: {
      model: "post",
      visibility: "member_only",
      lifecycle: {
        state: "under_review",
        availableActions: ["approve_review", "reject_review", "change_visibility"],
        updatedAt: "2026-04-03T08:00:00.000Z",
        reviewMessage: "Waiting for review approval before publishing.",
      },
      authorLabel: "MiniX Review Queue",
      summary: HOST_ITEMS[2]?.subtitle ?? "Practice content block.",
      categoryKey: "practice",
      categoryLabel: "Practice",
      tags: [{ key: "review", label: "Review" }],
    },
    lesson_4: {
      model: "consultation_service",
      visibility: "purchased_only",
      lifecycle: {
        state: "review_rejected",
        availableActions: ["update", "submit_review", "delete", "change_visibility"],
        updatedAt: "2026-04-04T08:00:00.000Z",
        reviewMessage: "Needs a clearer service scope before approval.",
      },
      authorLabel: "MiniX Coaching",
      summary: HOST_ITEMS[3]?.subtitle ?? "Speaking content block.",
      categoryKey: "speaking",
      categoryLabel: "Speaking",
      tags: [{ key: "service", label: "Service" }],
    },
    lesson_5: {
      model: "tool_config",
      visibility: "public",
      lifecycle: {
        state: "offline",
        availableActions: ["restore", "delete", "change_visibility"],
        updatedAt: "2026-04-05T08:00:00.000Z",
        offlineAt: "2026-04-05T08:00:00.000Z",
      },
      authorLabel: "MiniX Operations",
      summary: HOST_ITEMS[4]?.subtitle ?? "Review content block.",
      categoryKey: "wrap-up",
      categoryLabel: "Wrap-up",
      tags: [{ key: "tool", label: "Tool" }],
    },
  };
}

export function createDefaultUserState(): UserState {
  return {
    bookshelfNovelIds: new Set(DEFAULT_BOOKSHELF_NOVEL_IDS),
    progressByNovelId: structuredClone(DEFAULT_PROGRESS_BY_NOVEL_ID),
    notificationReadAtById: {},
    threadReadAtById: {},
    threadMessagesByThreadId: {},
    feedbackDetailsById: {},
    ordersById: {},
    orderIdByIdempotencyKey: {},
    sharePreparesById: {},
    uploadsByTaskId: {},
    profileOverrides: {
      region: "Shanghai, CN",
      bio: "Sample user profile for shared account-domain integration.",
    },
    relationTarget: {
      targetUserId: "creator_sample",
      displayName: "MiniX Mentor",
      following: true,
      followedBy: true,
      friend: true,
      blocked: false,
      remarkName: "MiniX User",
    },
    managedContentById: createDefaultManagedContentEntries(),
  };
}

function resolveUserAvailability(session: SessionRecord, userState: UserState): UserAvailabilityStatus {
  if (session.authStatus === "guest") {
    return "guest";
  }

  return userState.availabilityStatus ?? "enabled";
}

function createAccountOperations(
  session: SessionRecord,
  userState: UserState,
  availability: UserAvailabilityStatus,
): AccountOperation[] {
  const restrictedReason =
    availability === "frozen"
      ? "This account is frozen and cannot change account settings right now."
      : availability === "blacklisted"
        ? "This account is blacklisted and account operations are locked."
        : availability === "cancellation_pending"
          ? "Cancellation is already pending for this account."
          : undefined;

  return [
    {
      kind: "edit_profile",
      label: "Edit profile",
      available: availability === "enabled",
      statusLabel:
        availability === "enabled"
          ? "You can update nickname, region, and bio."
          : restrictedReason ?? "Unavailable",
      ...(availability === "enabled" ? {} : { blockedReason: restrictedReason ?? "Unavailable" }),
    },
    {
      kind: "change_phone",
      label: session.identity.phoneBound || Boolean(userState.boundPhoneNumber) ? "Change phone" : "Bind phone",
      available: availability === "enabled",
      statusLabel:
        availability === "enabled"
          ? (session.identity.phoneBound || Boolean(userState.boundPhoneNumber))
            ? "A verified phone can be replaced."
            : "No verified phone is currently bound."
          : restrictedReason ?? "Unavailable",
      ...(availability === "enabled" ? {} : { blockedReason: restrictedReason ?? "Unavailable" }),
    },
    {
      kind: "unbind_wechat",
      label: "Unbind WeChat",
      available: availability === "enabled" && Boolean(userState.wechatBoundOverride ?? session.identity.wechatBound),
      statusLabel: Boolean(userState.wechatBoundOverride ?? session.identity.wechatBound)
        ? availability === "enabled"
          ? "WeChat binding can be removed from the current account."
          : restrictedReason ?? "Unavailable"
        : "No WeChat binding is active.",
      ...(availability === "enabled" && Boolean(userState.wechatBoundOverride ?? session.identity.wechatBound)
        ? {}
        : {
            blockedReason:
              restrictedReason ??
              (Boolean(userState.wechatBoundOverride ?? session.identity.wechatBound)
                ? "Unavailable"
                : "No WeChat binding is active."),
          }),
    },
    {
      kind: "request_cancellation",
      label: "Request cancellation",
      available: availability === "enabled",
      statusLabel:
        availability === "cancellation_pending"
          ? "Cancellation has already been requested."
          : availability === "enabled"
            ? "Submit a cancellation request for the current account."
            : restrictedReason ?? "Unavailable",
      ...(availability === "enabled" ? {} : { blockedReason: restrictedReason ?? "Unavailable" }),
    },
  ];
}

function createPrimaryRelationTarget(
  userState: UserState,
  availability: UserAvailabilityStatus,
): UserRelationTarget[] {
  const relation = userState.relationTarget;
  if (!relation) {
    return [];
  }

  const actionBlockedReason =
    availability === "enabled" ? undefined : "Relationship actions are unavailable for the current account status.";

  const actions: UserRelationAction[] = [
    {
      kind: relation.following ? "unfollow" : "follow",
      label: relation.following ? "Unfollow" : "Follow",
      available: availability === "enabled" && !relation.blocked,
      active: relation.following,
      ...(availability === "enabled" && !relation.blocked
        ? {}
        : { blockedReason: actionBlockedReason ?? "Blocked users cannot be followed." }),
    },
    {
      kind: relation.blocked ? "unblock" : "block",
      label: relation.blocked ? "Unblock" : "Block",
      available: availability === "enabled",
      active: relation.blocked,
      ...(availability === "enabled" || !actionBlockedReason ? {} : { blockedReason: actionBlockedReason }),
    },
    {
      kind: "set_remark",
      label: relation.remarkName ? "Update remark" : "Set remark",
      available: availability === "enabled",
      active: Boolean(relation.remarkName),
      requiresInput: true,
      ...(availability === "enabled" || !actionBlockedReason ? {} : { blockedReason: actionBlockedReason }),
    },
  ];

  if (relation.remarkName) {
    actions.push({
      kind: "clear_remark",
      label: "Clear remark",
      available: availability === "enabled",
      active: true,
      ...(availability === "enabled" || !actionBlockedReason ? {} : { blockedReason: actionBlockedReason }),
    });
  }

  return [
    {
      targetUserId: relation.targetUserId,
      displayName: relation.displayName,
      relationshipSummary: relation.blocked
        ? "Blocked contact"
        : relation.friend
          ? "Mutual connection"
          : relation.following
            ? "Following"
            : "Not following",
      following: relation.following,
      followedBy: relation.followedBy,
      friend: relation.friend,
      blocked: relation.blocked,
      ...(relation.remarkName ? { remarkName: relation.remarkName } : {}),
      actions,
    },
  ];
}

export function createSharePrepareResponse(
  request: SharePrepareRequest,
  requestUrl: string,
  now = new Date().toISOString(),
): SharePrepareResponse {
  const attributionId = request.shareAttribution.attributionId ?? `share_${crypto.randomUUID()}`;
  const channelMarker =
    request.shareChannel.channelMarker ??
    request.sharePayload.channelMarker ??
    request.shareAttribution.channelMarker ??
    "minix-share";
  const landingPath = request.sharePayload.landingPath ?? "/login";
  const landingUrl = request.sharePayload.landingUrl ?? new URL(landingPath, requestUrl).toString();
  const shortLink = request.sharePayload.shortLink ?? `https://mini.x/s/${attributionId.slice(-8)}`;

  const landingTarget = {
    ...(request.sharePayload.landingTarget?.routeId ? { routeId: request.sharePayload.landingTarget.routeId } : {}),
    path: landingPath,
    url: landingUrl,
    shortLink,
    ...(request.sharePayload.landingTarget?.params ? { params: request.sharePayload.landingTarget.params } : {}),
    channelMarker,
    ...(request.redirectTarget ? { authRedirect: request.redirectTarget } : {}),
  };

  return {
    sharePayload: {
      ...request.sharePayload,
      landingPath,
      landingUrl,
      shortLink,
      channelMarker,
      shareToken: attributionId,
      landingTarget,
      ...(request.redirectTarget ? { returnTarget: request.redirectTarget } : {}),
    },
    shareChannel: {
      ...request.shareChannel,
      channelMarker,
    },
    shareAttribution: {
      ...request.shareAttribution,
      attributionId,
      channelMarker,
      returnFlowRecognized: false,
      shareCount: request.shareAttribution.shareCount + 1,
      preparedAt: now,
      lastSharedAt: now,
      ...(request.redirectTarget ? { returnTarget: request.redirectTarget } : {}),
    },
    landingTarget,
  };
}

export function recognizeShareReturn(
  existing: SharePrepareResponse,
  request: ShareReturnRecognitionRequest,
  now = new Date().toISOString(),
): ShareReturnRecognitionResponse {
  const next = structuredClone(existing);
  next.shareAttribution.returnFlowRecognized = request.outcome === "return" || request.outcome === "conversion";
  next.shareAttribution.clickCount += 1;
  next.shareAttribution.lastClickAt = now;
  next.shareAttribution.lastReturnAt = now;
  const lastLandingPath = request.recognizedPath ?? next.landingTarget.path;
  if (lastLandingPath) {
    next.shareAttribution.lastLandingPath = lastLandingPath;
  }

  if (request.outcome === "conversion") {
    next.shareAttribution.conversionCount += 1;
    next.shareAttribution.lastConversionAt = now;
    if (request.recognizedUserId) {
      next.shareAttribution.inviteBoundUserId = request.recognizedUserId;
    }
  }

  return {
    sharePayload: next.sharePayload,
    shareChannel: next.shareChannel,
    shareAttribution: next.shareAttribution,
    landingTarget: next.landingTarget,
  };
}

function cloneUploadProgress(progress: UploadProgress): UploadProgress {
  return {
    completedBytes: progress.completedBytes,
    totalBytes: progress.totalBytes,
    percentage: progress.percentage,
  };
}

function cloneUploadAsset(asset: UploadAsset): UploadAsset {
  return {
    assetId: asset.assetId,
    fileType: asset.fileType,
    fileName: asset.fileName,
    url: asset.url,
    ...(asset.thumbnailUrl ? { thumbnailUrl: asset.thumbnailUrl } : {}),
    ...(asset.coverImageUrl ? { coverImageUrl: asset.coverImageUrl } : {}),
    metadata: {
      sizeBytes: asset.metadata.sizeBytes,
      ...(asset.metadata.checksum ? { checksum: asset.metadata.checksum } : {}),
      ...(asset.metadata.checksumAlgorithm ? { checksumAlgorithm: asset.metadata.checksumAlgorithm } : {}),
      ...(asset.metadata.mimeType ? { mimeType: asset.metadata.mimeType } : {}),
      ...(asset.metadata.width !== undefined ? { width: asset.metadata.width } : {}),
      ...(asset.metadata.height !== undefined ? { height: asset.metadata.height } : {}),
      ...(asset.metadata.durationSeconds !== undefined ? { durationSeconds: asset.metadata.durationSeconds } : {}),
      ...(asset.metadata.pageCount !== undefined ? { pageCount: asset.metadata.pageCount } : {}),
    },
  };
}

function cloneUploadTask(task: UploadTask): UploadTask {
  return {
    taskId: task.taskId,
    scenario: task.scenario,
    fileType: task.fileType,
    stage: task.stage,
    ...(task.fileName ? { fileName: task.fileName } : {}),
    progress: cloneUploadProgress(task.progress),
    chunkingReserved: task.chunkingReserved,
    ...(task.transferMode ? { transferMode: task.transferMode } : {}),
    ...(task.sessionId ? { sessionId: task.sessionId } : {}),
    ...(task.chunkCount !== undefined ? { chunkCount: task.chunkCount } : {}),
    ...(task.uploadedChunkCount !== undefined ? { uploadedChunkCount: task.uploadedChunkCount } : {}),
    ...(task.integrity
      ? {
          integrity: {
            checksumAlgorithm: task.integrity.checksumAlgorithm,
            fileChecksum: task.integrity.fileChecksum,
            expectedSizeBytes: task.integrity.expectedSizeBytes,
          },
        }
      : {}),
    governance: {
      maxSizeBytes: task.governance.maxSizeBytes,
      acceptedFileTypes: [...task.governance.acceptedFileTypes],
      sensitiveReviewRequired: task.governance.sensitiveReviewRequired,
      ...(task.governance.expiresInDays !== undefined ? { expiresInDays: task.governance.expiresInDays } : {}),
    },
    reviewStatus: task.reviewStatus,
    ...(task.reviewMessage ? { reviewMessage: task.reviewMessage } : {}),
    lifecycle: {
      backendBacked: task.lifecycle.backendBacked,
      retentionStatus: task.lifecycle.retentionStatus,
      retryCount: task.lifecycle.retryCount,
      canRetry: task.lifecycle.canRetry,
      canCancel: task.lifecycle.canCancel,
      ...(task.lifecycle.lastTransitionAt ? { lastTransitionAt: task.lifecycle.lastTransitionAt } : {}),
      ...(task.lifecycle.expiresAt ? { expiresAt: task.lifecycle.expiresAt } : {}),
    },
  };
}

function cloneUploadError(uploadError: UploadError): UploadError {
  return {
    code: uploadError.code,
    message: uploadError.message,
    recoverable: uploadError.recoverable,
    retryable: uploadError.retryable,
    stage: uploadError.stage,
  };
}

function cloneUploadTransferPayload(transfer: UploadTransferPayload): UploadTransferPayload {
  return {
    mode: transfer.mode,
    checksumAlgorithm: transfer.checksumAlgorithm,
    fileChecksum: transfer.fileChecksum,
    totalBytes: transfer.totalBytes,
    chunkSizeBytes: transfer.chunkSizeBytes,
    chunks: transfer.chunks.map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      byteOffset: chunk.byteOffset,
      byteLength: chunk.byteLength,
      checksum: chunk.checksum,
      checksumAlgorithm: chunk.checksumAlgorithm,
      dataBase64: chunk.dataBase64,
    })),
  };
}

function cloneUploadChunkReceipt(receipt: UploadChunkReceipt): UploadChunkReceipt {
  return {
    chunkIndex: receipt.chunkIndex,
    byteOffset: receipt.byteOffset,
    byteLength: receipt.byteLength,
    checksum: receipt.checksum,
    checksumAlgorithm: receipt.checksumAlgorithm,
    receivedAt: receipt.receivedAt,
  };
}

function cloneUploadSession(session: UploadSession): UploadSession {
  return {
    sessionId: session.sessionId,
    uploadToken: session.uploadToken,
    objectKey: session.objectKey,
    mode: session.mode,
    checksumAlgorithm: session.checksumAlgorithm,
    chunkSizeBytes: session.chunkSizeBytes,
    chunkCount: session.chunkCount,
    receivedChunkCount: session.receivedChunkCount,
    nextChunkIndex: session.nextChunkIndex,
    resumeSupported: session.resumeSupported,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };
}

function cloneUploadReviewRecord(reviewRecord: UploadReviewRecord): UploadReviewRecord {
  return {
    status: reviewRecord.status,
    provider: reviewRecord.provider,
    ...(reviewRecord.reviewedAt ? { reviewedAt: reviewRecord.reviewedAt } : {}),
    ...(reviewRecord.message ? { message: reviewRecord.message } : {}),
    ...(reviewRecord.reasonCodes ? { reasonCodes: [...reviewRecord.reasonCodes] } : {}),
  };
}

function cloneUploadCleanupRecord(cleanupRecord: UploadCleanupRecord): UploadCleanupRecord {
  return {
    retentionStatus: cleanupRecord.retentionStatus,
    ...(cleanupRecord.cleanupScheduledAt ? { cleanupScheduledAt: cleanupRecord.cleanupScheduledAt } : {}),
    ...(cleanupRecord.cleanupReason ? { cleanupReason: cleanupRecord.cleanupReason } : {}),
    referenced: cleanupRecord.referenced,
  };
}

function cloneUploadReference(reference: UploadReference): UploadReference {
  return {
    ownerType: reference.ownerType,
    ownerId: reference.ownerId,
    role: reference.role,
    attachedAt: reference.attachedAt,
  };
}

function cloneUploadSelectionResult(selection: UploadSelectionResult): UploadSelectionResult {
  return {
    uploadTask: cloneUploadTask(selection.uploadTask),
    ...(selection.uploadAsset ? { uploadAsset: cloneUploadAsset(selection.uploadAsset) } : {}),
    ...(selection.uploadError ? { uploadError: cloneUploadError(selection.uploadError) } : {}),
    ...(selection.transfer ? { transfer: cloneUploadTransferPayload(selection.transfer) } : {}),
  };
}

function cloneStoredUploadRecord(record: StoredUploadRecord): StoredUploadRecord {
  return {
    source: record.source,
    selection: cloneUploadSelectionResult(record.selection),
    uploadTask: cloneUploadTask(record.uploadTask),
    ...(record.uploadAsset ? { uploadAsset: cloneUploadAsset(record.uploadAsset) } : {}),
    ...(record.uploadError ? { uploadError: cloneUploadError(record.uploadError) } : {}),
    ...(record.transfer ? { transfer: cloneUploadTransferPayload(record.transfer) } : {}),
    ...(record.session ? { session: cloneUploadSession(record.session) } : {}),
    ...(record.receivedChunk ? { receivedChunk: cloneUploadChunkReceipt(record.receivedChunk) } : {}),
    ...(record.reviewRecord ? { reviewRecord: cloneUploadReviewRecord(record.reviewRecord) } : {}),
    ...(record.cleanupRecord ? { cleanupRecord: cloneUploadCleanupRecord(record.cleanupRecord) } : {}),
    references: record.references.map(cloneUploadReference),
    chunksByIndex: Object.fromEntries(
      Object.entries(record.chunksByIndex).map(([key, value]) => [key, cloneUploadChunkReceipt(value)]),
    ),
    binaryByChunkIndex: { ...record.binaryByChunkIndex },
    ...(record.binaryObjectKey ? { binaryObjectKey: record.binaryObjectKey } : {}),
  };
}

function buildUploadedAssetUrl(assetId: string, requestUrl: string): string {
  return new URL(`/uploads/assets/${assetId}`, requestUrl).toString();
}

function buildUploadedThumbnailUrl(assetId: string, requestUrl: string): string {
  return new URL(`/uploads/assets/${assetId}/thumb`, requestUrl).toString();
}

function createUploadHash(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function decodeBase64ToBuffer(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

function createSyntheticTransferPayload(task: UploadTask, selectedAsset: UploadAsset): UploadTransferPayload {
  const totalBytes = selectedAsset.metadata.sizeBytes;
  const seed = `${task.scenario}:${task.fileType}:${task.fileName ?? selectedAsset.fileName}:`;
  const repeated = seed.repeat(Math.ceil(totalBytes / Math.max(seed.length, 1))).slice(0, totalBytes);
  const chunkSizeBytes = Math.min(64 * 1024, Math.max(totalBytes, 1));
  const chunks: UploadTransferPayload["chunks"] = [];
  let byteOffset = 0;
  while (byteOffset < totalBytes) {
    const nextLength = Math.min(chunkSizeBytes, totalBytes - byteOffset);
    const chunkBytes = Buffer.from(repeated.slice(byteOffset, byteOffset + nextLength), "utf8");
    chunks.push({
      chunkIndex: chunks.length,
      byteOffset,
      byteLength: nextLength,
      checksum: createUploadHash(chunkBytes),
      checksumAlgorithm: "sha256",
      dataBase64: chunkBytes.toString("base64"),
    });
    byteOffset += nextLength;
  }

  return {
    mode: chunks.length > 1 ? "chunked" : "single_part",
    checksumAlgorithm: "sha256",
    fileChecksum: createUploadHash(Buffer.from(repeated, "utf8")),
    totalBytes,
    chunkSizeBytes,
    chunks,
  };
}

function resolveSelectionTransfer(selection: UploadSelectionResult): UploadTransferPayload | undefined {
  if (selection.transfer) {
    return cloneUploadTransferPayload(selection.transfer);
  }
  if (!selection.uploadAsset) {
    return undefined;
  }
  return createSyntheticTransferPayload(selection.uploadTask, selection.uploadAsset);
}

function createUploadLifecycle(task: UploadTask, input: {
  backendBacked: boolean;
  retryCount?: number;
  canRetry: boolean;
  canCancel: boolean;
  lastTransitionAt: string;
  expiresAt?: string;
}): UploadTask["lifecycle"] {
  return {
    backendBacked: input.backendBacked,
    retentionStatus: task.stage === "canceled" ? "scheduled_cleanup" : "active",
    retryCount: input.retryCount ?? task.lifecycle.retryCount,
    canRetry: input.canRetry,
    canCancel: input.canCancel,
    lastTransitionAt: input.lastTransitionAt,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
  };
}

function createUploadErrorRecord(
  selection: UploadSelectionResult,
  source: UploadPipelineSource,
  message: string,
  code: string,
  now: string,
): StoredUploadRecord {
  const failedTask = cloneUploadTask(selection.uploadTask);
  failedTask.stage = "failed";
  failedTask.reviewStatus = "rejected";
  failedTask.reviewMessage = message;
  failedTask.lifecycle = createUploadLifecycle(failedTask, {
    backendBacked: true,
    canRetry: true,
    canCancel: false,
    lastTransitionAt: now,
    ...(failedTask.governance.expiresInDays !== undefined
      ? { expiresAt: new Date(Date.parse(now) + failedTask.governance.expiresInDays * 24 * 60 * 60 * 1000).toISOString() }
      : {}),
  });
  return {
    source,
    selection: cloneUploadSelectionResult(selection),
    uploadTask: failedTask,
    ...(selection.uploadAsset ? { uploadAsset: cloneUploadAsset(selection.uploadAsset) } : {}),
    uploadError: {
      code,
      message,
      recoverable: true,
      retryable: true,
      stage: "failed",
    },
    reviewRecord: {
      status: "rejected",
      provider: "sample-upload-policy",
      reviewedAt: now,
      message,
      reasonCodes: [code],
    },
    cleanupRecord: {
      retentionStatus: "scheduled_cleanup",
      cleanupScheduledAt: now,
      cleanupReason: "failed_upload",
      referenced: false,
    },
    references: [],
    chunksByIndex: {},
    binaryByChunkIndex: {},
  };
}

export function createUploadResponse(record: StoredUploadRecord): UploadPipelineResponse {
  return {
    source: record.source,
    uploadTask: cloneUploadTask(record.uploadTask),
    ...(record.uploadAsset ? { uploadAsset: cloneUploadAsset(record.uploadAsset) } : {}),
    ...(record.uploadError ? { uploadError: cloneUploadError(record.uploadError) } : {}),
    ...(record.transfer ? { transfer: cloneUploadTransferPayload(record.transfer) } : {}),
    ...(record.session ? { session: cloneUploadSession(record.session) } : {}),
    ...(record.receivedChunk ? { receivedChunk: cloneUploadChunkReceipt(record.receivedChunk) } : {}),
    ...(record.reviewRecord ? { reviewRecord: cloneUploadReviewRecord(record.reviewRecord) } : {}),
    ...(record.cleanupRecord ? { cleanupRecord: cloneUploadCleanupRecord(record.cleanupRecord) } : {}),
    ...(record.references.length > 0 ? { references: record.references.map(cloneUploadReference) } : {}),
  };
}

function updateUploadTaskProgress(task: UploadTask, completedBytes: number, totalBytes: number, uploadedChunkCount: number) {
  task.progress = {
    completedBytes,
    totalBytes,
    percentage: totalBytes > 0 ? Math.min(100, Math.round((completedBytes / totalBytes) * 100)) : 0,
  };
  task.uploadedChunkCount = uploadedChunkCount;
}

function calculateUploadExpiresAt(task: UploadTask, now: string): string | undefined {
  return task.governance.expiresInDays !== undefined
    ? new Date(Date.parse(now) + task.governance.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
}

function updateUploadRetention(record: StoredUploadRecord, input: {
  retentionStatus: UploadCleanupRecord["retentionStatus"];
  referenced?: boolean;
  cleanupReason?: string;
  cleanupScheduledAt?: string;
}) {
  record.uploadTask.lifecycle.retentionStatus = input.retentionStatus;
  record.cleanupRecord = {
    retentionStatus: input.retentionStatus,
    ...(input.cleanupScheduledAt ? { cleanupScheduledAt: input.cleanupScheduledAt } : {}),
    ...(input.cleanupReason ? { cleanupReason: input.cleanupReason } : {}),
    referenced: input.referenced ?? record.cleanupRecord?.referenced ?? false,
  };
}

export function createUploadSessionRecord(
  request: UploadSessionRequest,
  requestUrl: string,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const selection = cloneUploadSelectionResult(request.selection);
  const task = cloneUploadTask(selection.uploadTask);
  const selectedAsset = selection.uploadAsset ? cloneUploadAsset(selection.uploadAsset) : undefined;
  if (!selectedAsset) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset is required to open an upload session.", "UPLOAD_ASSET_REQUIRED", now);
  }
  const transfer = resolveSelectionTransfer(selection);
  if (!transfer) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset did not include upload transfer data.", "UPLOAD_TRANSFER_REQUIRED", now);
  }
  if (selectedAsset.metadata.sizeBytes !== transfer.totalBytes) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset size does not match the prepared upload transfer.", "UPLOAD_SIZE_MISMATCH", now);
  }
  if (selectedAsset.metadata.sizeBytes > task.governance.maxSizeBytes) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset exceeds the configured upload size limit.", "UPLOAD_TOO_LARGE", now);
  }
  if (!task.governance.acceptedFileTypes.includes(selectedAsset.fileType)) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset type is not accepted for this upload flow.", "UPLOAD_TYPE_REJECTED", now);
  }

  const assetId = selectedAsset.assetId && selectedAsset.assetId !== "upload_asset_idle" ? selectedAsset.assetId : `upl_${crypto.randomUUID()}`;
  const taskId = task.taskId && task.taskId !== "upload_task_idle" ? task.taskId : `upload_${crypto.randomUUID()}`;
  const sessionId = `us_${crypto.randomUUID()}`;
  const expiresAt = calculateUploadExpiresAt(task, now);
  const session: UploadSession = {
    sessionId,
    uploadToken: `ut_${crypto.randomUUID()}`,
    objectKey: `object/${assetId}/${sessionId}`,
    mode: transfer.mode,
    checksumAlgorithm: transfer.checksumAlgorithm,
    chunkSizeBytes: transfer.chunkSizeBytes,
    chunkCount: transfer.chunks.length,
    receivedChunkCount: 0,
    nextChunkIndex: 0,
    resumeSupported: transfer.mode === "chunked",
    createdAt: now,
    expiresAt: new Date(Date.parse(now) + 60 * 60 * 1000).toISOString(),
  };
  const uploadAsset: UploadAsset = {
    ...selectedAsset,
    assetId,
    url: buildUploadedAssetUrl(assetId, requestUrl),
    metadata: {
      ...selectedAsset.metadata,
      checksum: transfer.fileChecksum,
      checksumAlgorithm: transfer.checksumAlgorithm,
    },
    ...(selectedAsset.fileType === "image" || selectedAsset.fileType === "avatar"
      ? { thumbnailUrl: buildUploadedThumbnailUrl(assetId, requestUrl) }
      : {}),
  };

  task.taskId = taskId;
  task.stage = "uploading";
  task.chunkingReserved = false;
  task.transferMode = transfer.mode;
  task.sessionId = sessionId;
  task.chunkCount = transfer.chunks.length;
  task.integrity = {
    checksumAlgorithm: transfer.checksumAlgorithm,
    fileChecksum: transfer.fileChecksum,
    expectedSizeBytes: transfer.totalBytes,
  };
  task.reviewStatus = "not_required";
  task.reviewMessage = "Upload session created. Transfer chunks to continue.";
  updateUploadTaskProgress(task, 0, transfer.totalBytes, 0);
  task.lifecycle = createUploadLifecycle(task, {
    backendBacked: true,
    canRetry: false,
    canCancel: true,
    lastTransitionAt: now,
    ...(expiresAt ? { expiresAt } : {}),
  });

  return {
    source: "backend_session",
    selection: {
      ...selection,
      uploadTask: cloneUploadTask(task),
      uploadAsset,
      transfer: cloneUploadTransferPayload(transfer),
    },
    uploadTask: task,
    uploadAsset,
    transfer,
    session,
    reviewRecord: {
      status: "not_required",
      provider: "sample-upload-policy",
      message: "Upload session created.",
    },
    cleanupRecord: {
      retentionStatus: "active",
      referenced: false,
    },
    references: [],
    chunksByIndex: {},
    binaryByChunkIndex: {},
  };
}

export function appendUploadChunkRecord(
  existing: StoredUploadRecord,
  request: UploadChunkRequest,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  if (!record.session || !record.transfer) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload session is unavailable for this task.", "UPLOAD_SESSION_NOT_FOUND", now);
  }
  if (record.uploadTask.taskId !== request.taskId || record.session.sessionId !== request.sessionId) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload session identifiers do not match the active task.", "UPLOAD_SESSION_MISMATCH", now);
  }
  const expectedChunk = record.transfer.chunks[request.chunk.chunkIndex];
  if (!expectedChunk) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload chunk index is out of range.", "UPLOAD_CHUNK_RANGE", now);
  }
  const chunkBytes = decodeBase64ToBuffer(request.chunk.dataBase64);
  const chunkChecksum = createUploadHash(chunkBytes);
  if (chunkChecksum !== request.chunk.checksum || chunkChecksum !== expectedChunk.checksum) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload chunk checksum verification failed.", "UPLOAD_CHECKSUM_MISMATCH", now);
  }
  if (chunkBytes.byteLength !== expectedChunk.byteLength || request.chunk.byteOffset !== expectedChunk.byteOffset) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload chunk metadata did not match the prepared manifest.", "UPLOAD_CHUNK_INVALID", now);
  }

  const receipt: UploadChunkReceipt = {
    chunkIndex: request.chunk.chunkIndex,
    byteOffset: request.chunk.byteOffset,
    byteLength: request.chunk.byteLength,
    checksum: request.chunk.checksum,
    checksumAlgorithm: request.chunk.checksumAlgorithm,
    receivedAt: now,
  };
  record.chunksByIndex[String(receipt.chunkIndex)] = receipt;
  record.binaryByChunkIndex[String(receipt.chunkIndex)] = request.chunk.dataBase64;
  record.receivedChunk = receipt;
  record.source = "backend_chunk";
  record.uploadTask.stage = "uploading";
  record.uploadTask.reviewStatus = "not_required";
  record.uploadTask.reviewMessage = `Chunk ${receipt.chunkIndex + 1} uploaded.`;
  const uploadedChunkCount = Object.keys(record.chunksByIndex).length;
  const completedBytes = Object.values(record.chunksByIndex).reduce((sum, item) => sum + item.byteLength, 0);
  updateUploadTaskProgress(record.uploadTask, completedBytes, record.transfer.totalBytes, uploadedChunkCount);
  record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
    backendBacked: true,
    retryCount: record.uploadTask.lifecycle.retryCount,
    canRetry: false,
    canCancel: true,
    lastTransitionAt: now,
    ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
  });
  record.session.receivedChunkCount = uploadedChunkCount;
  record.session.nextChunkIndex =
    record.transfer.chunks.find((chunk) => !record.chunksByIndex[String(chunk.chunkIndex)])?.chunkIndex ?? record.transfer.chunks.length;
  record.reviewRecord = {
    status: "not_required",
    provider: "sample-upload-policy",
    message: `${uploadedChunkCount}/${record.transfer.chunks.length} chunks uploaded.`,
  };
  return record;
}

export function completeUploadRecord(
  existing: StoredUploadRecord,
  request: { taskId: string; sessionId: string; fileChecksum: string; checksumAlgorithm: "sha256" },
  requestUrl: string,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  if (!record.session || !record.transfer || !record.uploadAsset) {
    return createUploadErrorRecord(record.selection, "backend_complete", "Upload session is unavailable for completion.", "UPLOAD_SESSION_NOT_FOUND", now);
  }
  if (record.uploadTask.taskId !== request.taskId || record.session.sessionId !== request.sessionId) {
    return createUploadErrorRecord(record.selection, "backend_complete", "Upload session identifiers do not match the active task.", "UPLOAD_SESSION_MISMATCH", now);
  }
  const missingChunk = record.transfer.chunks.find((chunk) => !record.chunksByIndex[String(chunk.chunkIndex)]);
  if (missingChunk) {
    return createUploadErrorRecord(record.selection, "backend_complete", "Upload completion requires every chunk to be transferred first.", "UPLOAD_INCOMPLETE", now);
  }

  const buffers = record.transfer.chunks.map((chunk) =>
    decodeBase64ToBuffer(record.binaryByChunkIndex[String(chunk.chunkIndex)] ?? ""),
  );
  const merged = Buffer.concat(buffers.map((buffer) => Buffer.from(buffer)));
  const fileChecksum = createUploadHash(merged);
  if (fileChecksum !== request.fileChecksum || fileChecksum !== record.transfer.fileChecksum) {
    return createUploadErrorRecord(record.selection, "backend_complete", "Upload file checksum verification failed.", "UPLOAD_CHECKSUM_MISMATCH", now);
  }

  record.binaryObjectKey = record.session.objectKey;
  record.uploadAsset = {
    ...record.uploadAsset,
    url: buildUploadedAssetUrl(record.uploadAsset.assetId, requestUrl),
    ...(record.uploadAsset.fileType === "image" || record.uploadAsset.fileType === "avatar"
      ? { thumbnailUrl: buildUploadedThumbnailUrl(record.uploadAsset.assetId, requestUrl) }
      : {}),
    metadata: {
      ...record.uploadAsset.metadata,
      sizeBytes: merged.byteLength,
      checksum: fileChecksum,
      checksumAlgorithm: request.checksumAlgorithm,
    },
  };

  const rejectedByPolicy = /blocked|reject|sensitive/i.test(record.uploadTask.fileName ?? record.uploadAsset.fileName);
  const requiresReview = record.uploadTask.governance.sensitiveReviewRequired;
  record.source = "backend_complete";
  updateUploadTaskProgress(record.uploadTask, merged.byteLength, merged.byteLength, record.transfer.chunks.length);
  if (rejectedByPolicy) {
    record.uploadTask.stage = "failed";
    record.uploadTask.reviewStatus = "rejected";
    record.uploadTask.reviewMessage = "The sample upload policy rejected this asset during review.";
    record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
      backendBacked: true,
      retryCount: record.uploadTask.lifecycle.retryCount,
      canRetry: true,
      canCancel: false,
      lastTransitionAt: now,
      ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
    });
    record.uploadError = {
      code: "UPLOAD_REVIEW_REJECTED",
      message: record.uploadTask.reviewMessage,
      recoverable: true,
      retryable: true,
      stage: "failed",
    };
    record.reviewRecord = {
      status: "rejected",
      provider: "sample-upload-policy",
      reviewedAt: now,
      message: record.uploadTask.reviewMessage,
      reasonCodes: ["blocked_filename"],
    };
    updateUploadRetention(record, {
      retentionStatus: "scheduled_cleanup",
      cleanupScheduledAt: now,
      cleanupReason: "review_rejected",
      referenced: record.references.length > 0,
    });
    return record;
  }

  delete record.uploadError;
  record.uploadTask.reviewStatus = requiresReview ? "pending" : "approved";
  record.uploadTask.stage = requiresReview ? "reviewing" : "completed";
  record.uploadTask.reviewMessage = requiresReview
    ? "Sensitive review is pending in the upload pipeline."
    : "The asset cleared validation and is ready for downstream business use.";
  record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
    backendBacked: true,
    retryCount: record.uploadTask.lifecycle.retryCount,
    canRetry: false,
    canCancel: requiresReview,
    lastTransitionAt: now,
    ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
  });
  record.reviewRecord = {
    status: requiresReview ? "pending" : "approved",
    provider: "sample-upload-policy",
    ...(requiresReview ? {} : { reviewedAt: now }),
    message: record.uploadTask.reviewMessage,
  };
  updateUploadRetention(record, {
    retentionStatus: "active",
    referenced: record.references.length > 0,
  });
  return record;
}

export function attachUploadRecord(
  existing: StoredUploadRecord,
  request: UploadAttachRequest,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  const reference: UploadReference = {
    ownerType: request.reference.ownerType,
    ownerId: request.reference.ownerId,
    role: request.reference.role,
    attachedAt: now,
  };
  const duplicate = record.references.find(
    (item) => item.ownerType === reference.ownerType && item.ownerId === reference.ownerId && item.role === reference.role,
  );
  if (!duplicate) {
    record.references = [...record.references, reference];
  }
  record.source = "backend_attach";
  updateUploadRetention(record, {
    retentionStatus: "active",
    referenced: true,
  });
  return record;
}

export function createUploadPipelineResponse(
  request: UploadPipelineRequest,
  requestUrl: string,
  now = new Date().toISOString(),
): UploadPipelineResponse {
  let record = createUploadSessionRecord(request, requestUrl, now);
  const initialTransfer = record.transfer;
  const initialSession = record.session;
  if (!initialTransfer || record.uploadError || !initialSession) {
    return createUploadResponse(record);
  }
  for (const chunk of initialTransfer.chunks) {
    record = appendUploadChunkRecord(
      record,
      {
        taskId: record.uploadTask.taskId,
        sessionId: initialSession.sessionId,
        chunk,
      },
      now,
    );
    if (record.uploadError) {
      return createUploadResponse(record);
    }
  }
  return createUploadResponse(
    completeUploadRecord(
      record,
      {
        taskId: record.uploadTask.taskId,
        sessionId: initialSession.sessionId,
        fileChecksum: initialTransfer.fileChecksum,
        checksumAlgorithm: initialTransfer.checksumAlgorithm,
      },
      requestUrl,
      now,
    ),
  );
}

export function retryUploadPipeline(
  existing: StoredUploadRecord,
  _request: UploadRetryRequest,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  record.source = "backend_retry";
  if (!record.session && record.transfer) {
    record.session = {
      sessionId: `us_${crypto.randomUUID()}`,
      uploadToken: `ut_${crypto.randomUUID()}`,
      objectKey: record.binaryObjectKey ?? `object/${record.uploadAsset?.assetId ?? crypto.randomUUID()}/${crypto.randomUUID()}`,
      mode: record.transfer.mode,
      checksumAlgorithm: record.transfer.checksumAlgorithm,
      chunkSizeBytes: record.transfer.chunkSizeBytes,
      chunkCount: record.transfer.chunks.length,
      receivedChunkCount: Object.keys(record.chunksByIndex).length,
      nextChunkIndex:
        record.transfer.chunks.find((chunk) => !record.chunksByIndex[String(chunk.chunkIndex)])?.chunkIndex ?? record.transfer.chunks.length,
      resumeSupported: record.transfer.mode === "chunked",
      createdAt: now,
      expiresAt: new Date(Date.parse(now) + 60 * 60 * 1000).toISOString(),
    };
  } else if (record.session) {
    record.session = {
      ...record.session,
      receivedChunkCount: Object.keys(record.chunksByIndex).length,
      nextChunkIndex:
        record.transfer?.chunks.find((chunk) => !record.chunksByIndex[String(chunk.chunkIndex)])?.chunkIndex ??
        record.session.chunkCount,
      expiresAt: new Date(Date.parse(now) + 60 * 60 * 1000).toISOString(),
    };
  }
  record.uploadTask.stage = "uploading";
  record.uploadTask.reviewStatus = "not_required";
  record.uploadTask.reviewMessage = "Upload retry prepared. Resume remaining chunks.";
  record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
    backendBacked: true,
    retryCount: record.uploadTask.lifecycle.retryCount + 1,
    canRetry: false,
    canCancel: true,
    lastTransitionAt: now,
    ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
  });
  delete record.uploadError;
  record.reviewRecord = {
    status: "not_required",
    provider: "sample-upload-policy",
    message: "Upload retry prepared.",
  };
  return record;
}

export function cancelUploadPipeline(
  existing: StoredUploadRecord,
  request: UploadCancelRequest,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  record.source = "backend_cancel";
  record.uploadTask.stage = "canceled";
  record.uploadTask.reviewMessage = request.reason ? `Upload cancelled: ${request.reason}.` : "Upload cancelled.";
  record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
    backendBacked: true,
    retryCount: record.uploadTask.lifecycle.retryCount,
    canRetry: true,
    canCancel: false,
    lastTransitionAt: now,
    ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
  });
  record.uploadError = {
    code: "UPLOAD_CANCELLED",
    message: record.uploadTask.reviewMessage,
    recoverable: true,
    retryable: true,
    stage: "canceled",
  };
  record.reviewRecord = {
    status: record.uploadTask.reviewStatus,
    provider: "sample-upload-policy",
    message: record.uploadTask.reviewMessage,
  };
  updateUploadRetention(record, {
    retentionStatus: "scheduled_cleanup",
    cleanupScheduledAt: now,
    cleanupReason: "user_cancelled",
    referenced: record.references.length > 0,
  });
  return record;
}

export function findUploadRecordByAssetId(userState: UserState, assetId: string): StoredUploadRecord | undefined {
  return Object.values(userState.uploadsByTaskId).find((record) => record.uploadAsset?.assetId === assetId);
}

export function resolveUploadAssetForUser(userState: UserState, assetId: string): UploadAsset | undefined {
  return findUploadRecordByAssetId(userState, assetId)?.uploadAsset;
}

export function readUploadedAssetBinary(userState: UserState, assetId: string): { contentType: string; body: Uint8Array } | undefined {
  const record = findUploadRecordByAssetId(userState, assetId);
  if (!record?.transfer || !record.uploadAsset) {
    return undefined;
  }
  const buffers = record.transfer.chunks
    .map((chunk) => record.binaryByChunkIndex[String(chunk.chunkIndex)])
    .filter((value): value is string => typeof value === "string")
    .map(decodeBase64ToBuffer);
  if (buffers.length === 0) {
    return undefined;
  }
  return {
    contentType: record.uploadAsset.metadata.mimeType ?? "application/octet-stream",
    body: Uint8Array.from(Buffer.concat(buffers.map((buffer) => Buffer.from(buffer)))),
  };
}

export function bindUploadAssetsToOwner(
  userState: UserState,
  input: {
    assetIds: string[];
    ownerType: UploadAttachRequest["reference"]["ownerType"];
    ownerId: string;
    role: string;
    now?: string;
  },
) {
  const now = input.now ?? new Date().toISOString();
  for (const assetId of input.assetIds) {
    const record = findUploadRecordByAssetId(userState, assetId);
    if (!record) {
      continue;
    }
    const next = attachUploadRecord(
      record,
      {
        assetId,
        reference: {
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          role: input.role,
        },
      },
      now,
    );
    userState.uploadsByTaskId[next.uploadTask.taskId] = next;
  }
}

export function createMembershipOverview(
  planId?: PurchaseMembershipRequest["planId"],
): MembershipOverview {
  if (!planId) {
    return DEFAULT_MEMBERSHIP_OVERVIEW;
  }

  return {
    active: true,
    tier: "member",
    entitlementScope: "membership",
    statusLabel: "Membership active with premium reading unlocked",
    renewalLabel: MEMBER_RENEWAL_LABELS[planId],
    headline: "Membership Active",
    subheadline:
      "Premium reading is now unlocked. You can return to the blocked title and keep going without losing context.",
    benefits: DEFAULT_MEMBERSHIP_OVERVIEW.benefits,
  };
}

function createMembershipAmountCents(planId: PurchaseMembershipRequest["planId"]): number {
  if (planId === "monthly") {
    return 1900;
  }

  if (planId === "annual") {
    return 15900;
  }

  return 4900;
}

function createMembershipProductLabel(planId: PurchaseMembershipRequest["planId"]): string {
  if (planId === "monthly") {
    return "Monthly Membership";
  }

  if (planId === "annual") {
    return "Annual Membership";
  }

  return "Quarterly Membership";
}

function createPaymentChannel(channel: PaymentChannel | undefined, platform: SessionRecord["platform"]): PaymentChannel {
  if (channel) {
    return channel;
  }

  return platform === "wechat" ? "wechat_pay" : "h5_pay";
}

function createMembershipEntitlement(
  planId: PurchaseMembershipRequest["planId"],
  orderId: string,
): MembershipEntitlement {
  const overview = createMembershipOverview(planId);
  return {
    entitlementId: `ent_membership_${orderId}`,
    productType: "membership",
    active: true,
    statusLabel: overview.statusLabel,
    sourceOrderId: orderId,
    overview,
  };
}

function createPendingCallbackVerification(): PaymentCallbackVerification {
  return {
    status: "pending",
    message: "The sample gateway callback has not been verified yet.",
  };
}

function createPendingReconciliation(): PaymentReconciliation {
  return {
    status: "pending",
    message: "The sample order has not been reconciled yet.",
  };
}

function createPaymentProviderMode(payload: PurchaseMembershipRequest): PaymentProviderMode {
  return payload.providerMode ?? "sample";
}

function createPaymentGatewayProvider(channel: PaymentChannel, providerMode: PaymentProviderMode): PaymentGatewayProvider {
  if (providerMode === "sample") {
    return "sample";
  }

  return channel === "wechat_pay" ? "wechat_pay" : "h5_gateway";
}

function createGatewayExecution(input: {
  order: Order;
  providerMode: PaymentProviderMode;
  now: string;
}): {
  request: PaymentGatewayExecutionRequest;
  response: PaymentGatewayExecutionResponse;
} {
  const provider = createPaymentGatewayProvider(input.order.channel, input.providerMode);
  const timestamp = Date.parse(input.now);
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const gatewayOrderId = `${provider}_${input.order.orderId}`;
  const request: PaymentGatewayExecutionRequest = {
    provider,
    providerMode: input.providerMode,
    orderId: input.order.orderId,
    amountCents: input.order.totalAmountCents,
    currency: input.order.currency,
    notifyUrl: "/payments/callback",
    ...(input.order.source ? { returnUrl: `/${input.order.source}` } : {}),
  };
  const response: PaymentGatewayExecutionResponse = {
    provider,
    providerMode: input.providerMode,
    gatewayOrderId,
    ...(provider === "wechat_pay" ? { prepayId: `prepay_${input.order.orderId}` } : {}),
    ...(provider === "h5_gateway" ? { paymentUrl: `https://pay.minix.local/orders/${input.order.orderId}` } : {}),
    nonce,
    timestamp,
    signature: `sig_${provider}_${input.order.orderId}_${nonce.slice(0, 8)}`,
    expiresAt: new Date(timestamp + 15 * 60_000).toISOString(),
  };

  return { request, response };
}

function createPaymentLedgerEntry(input: {
  kind: PaymentLedgerEntry["kind"];
  order: Order;
  status: string;
  message: string;
  createdAt: string;
  gatewayReference?: PaymentLedgerEntry["gatewayReference"];
}): PaymentLedgerEntry {
  return {
    ledgerId: `ledger_${crypto.randomUUID()}`,
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

export function createPaymentOperationResult(input: {
  operation: PaymentOperationResult["operation"];
  applied: boolean;
  orderStatus: PaymentOperationResult["orderStatus"];
  paymentStatus: PaymentOperationResult["paymentStatus"];
  message: string;
  processedAt?: string;
}): PaymentOperationResult {
  return {
    operation: input.operation,
    applied: input.applied,
    orderStatus: input.orderStatus,
    paymentStatus: input.paymentStatus,
    message: input.message,
    processedAt: input.processedAt ?? new Date().toISOString(),
  };
}

export function createMembershipOrderDetail(
  session: SessionRecord,
  payload: PurchaseMembershipRequest,
  duplicateProtected = false,
  now = new Date().toISOString(),
): OrderDetailResponse & { entitlement: MembershipEntitlement } {
  const orderId = `ord_${crypto.randomUUID()}`;
  const amountCents = createMembershipAmountCents(payload.planId);
  const title = createMembershipProductLabel(payload.planId);
  const channel = createPaymentChannel(payload.channel, session.platform);
  const providerMode = createPaymentProviderMode(payload);
  const pending = payload.paymentScenario === "pending";
  const order: Order = {
    orderId,
    title,
    status: pending ? "pending_payment" : "paid",
    productType: "membership",
    channel,
    currency: "CNY",
    totalAmountCents: amountCents,
    ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    duplicateProtected,
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    createdAt: now,
    updatedAt: now,
    lineItems: [
      {
        productId: `membership_${payload.planId}`,
        productType: "membership",
        title,
        quantity: 1,
        unitAmountCents: amountCents,
        totalAmountCents: amountCents,
      },
    ],
  };
  const gatewayExecution = createGatewayExecution({ order, providerMode, now });
  const gatewayReference = {
    provider: gatewayExecution.response.provider,
    providerMode,
    gatewayOrderId: gatewayExecution.response.gatewayOrderId,
  };
  const paymentIntent: PaymentIntent = {
    intentId: `pi_${orderId}`,
    orderId,
    channel,
    status: pending ? "processing" : "succeeded",
    clientAction: session.platform === "wechat" ? "wechat_sdk" : "h5_redirect",
    clientPayload: {
      orderId,
      channel,
      provider: gatewayExecution.response.provider,
      providerMode,
      gatewayOrderId: gatewayExecution.response.gatewayOrderId,
      nonce: gatewayExecution.response.nonce,
      timestamp: gatewayExecution.response.timestamp,
      signature: gatewayExecution.response.signature,
      ...(gatewayExecution.response.prepayId ? { prepayId: gatewayExecution.response.prepayId } : {}),
      ...(gatewayExecution.response.paymentUrl ? { paymentUrl: gatewayExecution.response.paymentUrl } : {}),
    },
    gatewayReference,
    gatewayRequest: gatewayExecution.request,
    gatewayResponse: gatewayExecution.response,
    expiresAt: now,
  };
  const paymentResult: PaymentResult = {
    orderId,
    status: pending ? "pending" : "success",
    paid: !pending,
    duplicateProtected,
    callbackVerified: false,
    message: pending
      ? "Payment is pending gateway confirmation in the sample payment domain."
      : duplicateProtected
        ? "Duplicate payment protection kept the active entitlement and returned the existing paid outcome."
        : "Payment completed in the sample payment domain.",
    ...(pending ? {} : { polledAt: now }),
  };
  const entitlement = createMembershipEntitlement(payload.planId, orderId);
  if (pending) {
    entitlement.active = false;
    entitlement.statusLabel = "Pending payment confirmation";
    entitlement.overview = {
      ...entitlement.overview,
      active: false,
      tier: "signed-in",
      entitlementScope: "none",
      statusLabel: "Payment pending",
      headline: "Awaiting Payment",
      subheadline: "The order is created but membership is not active until the callback is verified.",
    };
  }

  return {
    order,
    paymentIntent,
    paymentResult,
    callbackVerification: createPendingCallbackVerification(),
    reconciliation: createPendingReconciliation(),
    paymentLedger: [
      createPaymentLedgerEntry({
        kind: "payment",
        order,
        status: paymentResult.status,
        message: paymentResult.message,
        createdAt: now,
        gatewayReference,
      }),
    ],
    operationLedger: [],
    callbackLedger: [],
    reconciliationLedger: [
      {
        reconciliationId: `recon_${crypto.randomUUID()}`,
        orderId,
        status: "pending",
        gatewayReference,
        message: "Initial reconciliation is pending gateway callback or explicit reconciliation.",
        checkedAt: now,
      } satisfies PaymentReconciliationLedgerEntry,
    ],
    entitlement,
  };
}

export function createMembershipPurchaseResponse(
  detail: OrderDetailResponse & { entitlement: MembershipEntitlement },
  payload: PurchaseMembershipRequest,
): PurchaseMembershipResponse {
  return {
    purchased: true,
    overview: detail.entitlement.overview,
    order: detail.order,
    paymentIntent: detail.paymentIntent,
    paymentResult: detail.paymentResult,
    entitlement: detail.entitlement,
    returnTarget: deriveReturnTarget(payload.source),
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
  };
}

export function createCurrentUserResponse(
  session: SessionRecord,
  userState: UserState,
  requestUrl?: string,
): CurrentUserResponse {
  const membership = createMembershipOverview(userState.membershipPlanId);
  const uploadedAvatarUrl = userState.profileOverrides?.avatarAssetId
    ? resolveUploadAssetForUser(userState, userState.profileOverrides.avatarAssetId)?.url
    : undefined;
  const avatarUrl = uploadedAvatarUrl ??
    (session.profile.avatarUrl && requestUrl ? resolveSampleMediaUrl(session.profile.avatarUrl, requestUrl) : session.profile.avatarUrl);
  const availability = resolveUserAvailability(session, userState);
  const relationTargets = createPrimaryRelationTarget(userState, availability);
  const relation = relationTargets[0];
  const followingCount = 11 + (relation?.following ? 1 : 0);
  const blockedCount = relation?.blocked ? 1 : 0;
  const displayNickname = userState.profileOverrides?.nickname ?? session.profile.nickname;
  const region = userState.profileOverrides?.region ?? (session.platform === "wechat" ? "Shanghai, CN" : "Web session");
  const bio = userState.profileOverrides?.bio ?? "Sample user profile for shared account-domain integration.";
  const phoneBound = Boolean(userState.boundPhoneNumber || session.identity.phoneBound);
  const wechatBound = userState.wechatBoundOverride ?? Boolean(session.identity.wechatBound);

  return {
    userProfile: {
      nickname: displayNickname,
      ...(avatarUrl ? { avatarUrl } : {}),
      gender: "unknown",
      region,
      bio,
      tags: session.authStatus === "guest" ? ["guest", "trial"] : ["member-ready", "cross-host"],
    },
    accountSummary: {
      userId: session.userId,
      phoneBound,
      ...(phoneBound
        ? { phoneNumberMasked: resolveMaskedPhoneNumber(userState.boundPhoneNumber) ?? "138****0001" }
        : {}),
      wechatBound,
      realNameStatus: session.identity.realNameVerified ? "verified" : "unverified",
      assets: {
        points: session.authStatus === "guest" ? 0 : availability === "cancellation_pending" ? 980 : 1280,
        level: session.authStatus === "guest" ? 1 : 4,
        membership,
        entitlementLabels: membership.active ? ["premium-reading", "priority-support"] : ["basic-access"],
        balanceCents: 0,
      },
      relations: {
        followingCount,
        followerCount: 28,
        friendCount: relation?.friend ? 6 : 5,
        blockedCount,
        remarkName: relation?.remarkName ?? (session.authStatus === "guest" ? "Guest session" : "MiniX User"),
      },
    },
    userStatus: {
      availability,
      enabled: availability === "enabled",
      frozen: availability === "frozen",
      cancellationInProgress: availability === "cancellation_pending",
      blacklisted: availability === "blacklisted",
      guest: session.authStatus === "guest",
    },
    identityWorkflows: {
      canUpgradeGuest: session.authStatus === "guest" || Boolean(session.identity.anonymous),
      canBindPhone:
        session.authStatus === "authenticated" &&
        Boolean(session.identity.wechatBound || session.platform === "wechat") &&
        !phoneBound,
      mergePending: Boolean(userState.pendingIdentityWorkflow),
      ...(userState.pendingIdentityWorkflow ? { pendingWorkflow: userState.pendingIdentityWorkflow } : {}),
      ...(userState.lastIdentityWorkflow ? { lastWorkflow: userState.lastIdentityWorkflow } : {}),
    },
    accountOperations: createAccountOperations(session, userState, availability),
    relationTargets,
  };
}

export function createSettingsResponse(
  session: SessionRecord,
  userState: UserState,
  deployEnv: string | undefined,
): SettingsResponse {
  const availability = resolveUserAvailability(session, userState);
  const phoneBound = Boolean(session.identity.phoneBound || userState.boundPhoneNumber);
  const wechatBound = userState.wechatBoundOverride ?? Boolean(session.identity.wechatBound);
  return {
    preferences: {
      language: "zh-CN",
      theme: session.platform === "wechat" ? "light" : "system",
      fontScale: "md",
      notificationsEnabled: true,
      device: {
        cacheLabel: "Clear local cache only",
        networkStrategy: "balanced",
        autoplay: true,
        weakNetworkMode: false,
      },
      account: {
        profileEntryLabel: "Edit profile",
        phoneEntryLabel: phoneBound ? "Change phone" : "Bind phone",
        unbindEntryLabel: wechatBound ? "Unbind WeChat" : "Bind WeChat",
        cancellationEntryLabel: availability === "cancellation_pending" ? "Cancellation requested" : "Cancellation entry",
      },
      content: {
        sortOrder: "recommended",
        filterMode: "all",
        readingMode: "scroll",
        historyEnabled: true,
      },
      developerOptions: {
        logsEnabled: Boolean(deployEnv !== "production"),
        experimentsEnabled: true,
      },
    },
    featureToggles: {
      pushEnabled: true,
      smsEnabled: false,
      emailEnabled: false,
      accountCenterEnabled: true,
      readingSyncEnabled: true,
      experimentsEnabled: true,
    },
    privacyOptions: {
      profileVisibilityLabel: "Private to signed-in session",
      personalizedRecommendations: true,
      searchHistoryEnabled: true,
      analyticsEnabled: true,
      screenshotFeedbackEnabled: true,
    },
  };
}

function isPurchasedByMembership(
  record: { requiresMembership: boolean; isPurchased?: boolean },
  membershipActive: boolean,
): boolean {
  return Boolean(record.isPurchased || (record.requiresMembership && membershipActive));
}

function resolveNovelAccess(detail: NovelDetail, membershipActive: boolean): NovelDetail {
  return {
    ...detail,
    isPurchased: isPurchasedByMembership(detail, membershipActive),
  };
}

function createBookshelfCountResolver(bookshelfNovelIds: Set<string>) {
  const initialBookshelfNovelIds = new Set<string>(DEFAULT_BOOKSHELF_NOVEL_IDS);

  return (detail: NovelDetail): number | undefined => {
    if (detail.bookshelfCount === undefined) {
      return detail.bookshelfCount;
    }

    if (bookshelfNovelIds.has(detail.id) && !initialBookshelfNovelIds.has(detail.id)) {
      return detail.bookshelfCount + 1;
    }

    if (!bookshelfNovelIds.has(detail.id) && initialBookshelfNovelIds.has(detail.id)) {
      return Math.max(0, detail.bookshelfCount - 1);
    }

    return detail.bookshelfCount;
  };
}

function createNovelContentLifecycle(detail: NovelDetail): ContentLifecycle {
  const updatedAt = detail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z";
  return {
    state: "published",
    availableActions: ["update", "archive", "delete"],
    publishedAt: updatedAt,
    updatedAt,
  };
}

function createNovelContentDisplay(
  detail: NovelDetail,
  slot: ContentDisplay["recommendationSlot"],
  slotLabel: string,
): ContentDisplay {
  return {
    category: {
      key: detail.categoryKey,
      label: detail.categoryLabel,
    },
    tags: detail.tags.map((tag) => ({ key: tag.key, label: tag.label })),
    topics: detail.tags.slice(0, 2).map((tag) => ({ key: tag.key, label: tag.label })),
    ...(slot ? { recommendationSlot: slot } : {}),
    recommendationSlotLabel: slotLabel,
    pinned: detail.status === "serializing",
    featured: detail.requiresMembership || detail.status === "serializing",
  };
}

function createNovelContentAccess(detail: NovelDetail): ContentAccess {
  const purchased = Boolean(detail.isPurchased);
  return {
    visibility: detail.requiresMembership ? "member_only" : "public",
    accessible: !detail.requiresMembership || purchased || detail.isFree,
    previewAvailable: Boolean(detail.isFree || detail.isTrial),
    requiresLogin: false,
    requiresMembership: detail.requiresMembership,
    requiresPurchase: false,
    purchased,
    summaryLabel:
      detail.accessRuleSummaryLabel ??
      (detail.requiresMembership
        ? "This title stays in the premium lane until membership unlocks the complete reading route after the visible preview boundary."
        : "Open-access reading continues without a paywall in the current sample surface."),
    ...(detail.requiresMembership ? { gateLabel: "Membership required for full reading" } : {}),
    ...(detail.requiresMembership ? { entitlementLabel: "Membership unlock" } : {}),
  };
}

function createNovelContentDetail(detail: NovelDetail): ContentDetail {
  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(
      detail,
      detail.requiresMembership ? "premium" : detail.status === "serializing" ? "frontlist" : "ranking",
      detail.requiresMembership
        ? "Premium Spotlight"
        : detail.status === "serializing"
          ? "Frontlist Serial"
          : "Completed Archive",
    ),
    lifecycle: createNovelContentLifecycle(detail),
    ...(detail.relatedLaneLabel ? { recommendationReason: detail.relatedLaneLabel } : {}),
  };
}

function createNovelContentCard(
  detail: NovelDetail,
  continueChapterId: string | undefined,
  continueChapterTitle: string | undefined,
): ContentCard {
  const slot = continueChapterId
    ? "continue_reading"
    : detail.requiresMembership
      ? "premium"
      : detail.status === "serializing"
        ? "frontlist"
        : "ranking";
  const slotLabel = continueChapterId
    ? continueChapterTitle
      ? `Continue · ${continueChapterTitle}`
      : "Continue Reading"
    : detail.requiresMembership
      ? "Premium Spotlight"
      : detail.status === "serializing"
        ? "Frontlist Serial"
        : "Completed Archive";

  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(detail, slot, slotLabel),
    lifecycle: createNovelContentLifecycle(detail),
  };
}

function createRelatedNovelSummaries(detail: NovelDetail, membershipActive: boolean): RelatedNovelSummary[] {
  return NOVELS.filter((candidate) => candidate.id !== detail.id)
    .sort((left, right) => {
      const leftScore = Number(left.categoryKey === detail.categoryKey) * 2 + Number(left.status === detail.status);
      const rightScore = Number(right.categoryKey === detail.categoryKey) * 2 + Number(right.status === detail.status);
      return rightScore - leftScore;
    })
    .slice(0, 3)
    .map((candidate) => {
      const resolvedCandidate = resolveNovelAccess(candidate, membershipActive);
      return {
        id: resolvedCandidate.id,
        title: resolvedCandidate.title,
        authorName: resolvedCandidate.author.name,
        categoryLabel: resolvedCandidate.categoryLabel,
        status: resolvedCandidate.status,
        requiresMembership: resolvedCandidate.requiresMembership && !resolvedCandidate.isPurchased,
        highlight:
          resolvedCandidate.categoryKey === detail.categoryKey
            ? `Shared ${resolvedCandidate.categoryLabel.toLowerCase()} lane`
            : resolvedCandidate.status === detail.status
              ? `Similar ${resolvedCandidate.status} rhythm`
              : "Editorially adjacent pick",
      };
    });
}

export function resolveNovelDetail(
  detail: NovelDetail,
  membershipActive: boolean,
  bookshelfNovelIds?: Set<string>,
  requestUrl?: string,
): NovelDetail {
  const resolveBookshelfCount = bookshelfNovelIds ? createBookshelfCountResolver(bookshelfNovelIds) : undefined;
  const bookshelfCount = resolveBookshelfCount?.(detail);
  const resolvedCoverUrl =
    detail.coverUrl && requestUrl ? resolveSampleMediaUrl(detail.coverUrl, requestUrl) : detail.coverUrl;

  const resolvedDetail = {
    ...detail,
    ...(resolvedCoverUrl ? { coverUrl: resolvedCoverUrl } : {}),
    isPurchased: isPurchasedByMembership(detail, membershipActive),
    ...(bookshelfCount !== undefined ? { bookshelfCount } : {}),
    ...(bookshelfNovelIds ? { inBookshelf: bookshelfNovelIds.has(detail.id) } : {}),
    relatedNovels: createRelatedNovelSummaries(detail, membershipActive),
  };

  return {
    ...resolvedDetail,
    contentDetail: createNovelContentDetail(resolvedDetail),
    contentAccess: createNovelContentAccess(resolvedDetail),
  };
}

export function resolveChapterSummary(chapter: ChapterSummary, membershipActive: boolean): ChapterSummary {
  return {
    ...chapter,
    isPurchased: isPurchasedByMembership(chapter, membershipActive),
  };
}

export function resolveChapterList(
  response: ChapterListResponse,
  membershipActive: boolean,
): ChapterListResponse {
  return {
    ...response,
    volumes: response.volumes.map((volume) => ({
      ...volume,
      chapters: volume.chapters.map((chapter) => resolveChapterSummary(chapter, membershipActive)),
    })),
  };
}

export function resolveChapterContent(
  chapter: ChapterContent,
  membershipActive: boolean,
): ChapterContent {
  return {
    ...chapter,
    isPurchased: isPurchasedByMembership(chapter, membershipActive),
  };
}

export function toNovelCard(
  detail: NovelDetail,
  membershipActive: boolean,
  userState: UserState,
  requestUrl?: string,
): NovelCard {
  const resolvedDetail = resolveNovelDetail(detail, membershipActive, userState.bookshelfNovelIds, requestUrl);
  const progress = userState.progressByNovelId[resolvedDetail.id];
  const continueChapterId = progress?.chapterId ?? resolvedDetail.continueChapterId ?? resolvedDetail.firstChapterId;
  const continueChapterTitle = continueChapterId ? CHAPTER_CONTENT[continueChapterId]?.title : undefined;

  return {
    id: resolvedDetail.id,
    slug: resolvedDetail.slug,
    title: resolvedDetail.title,
    authorName: resolvedDetail.author.name,
    summary: resolvedDetail.summary,
    categoryKey: resolvedDetail.categoryKey,
    categoryLabel: resolvedDetail.categoryLabel,
    tags: resolvedDetail.tags,
    status: resolvedDetail.status,
    updatedAt: resolvedDetail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z",
    wordCount: resolvedDetail.wordCount,
    isFree: resolvedDetail.isFree,
    isTrial: resolvedDetail.isTrial,
    requiresMembership: resolvedDetail.requiresMembership,
    ...(resolvedDetail.latestChapter?.id ? { latestChapterId: resolvedDetail.latestChapter.id } : {}),
    ...(resolvedDetail.latestChapter?.title ? { latestChapterTitle: resolvedDetail.latestChapter.title } : {}),
    ...(resolvedDetail.latestChapter?.order !== undefined
      ? { latestChapterOrder: resolvedDetail.latestChapter.order }
      : {}),
    ...(continueChapterId ? { continueChapterId } : {}),
    ...(continueChapterTitle ? { continueChapterTitle } : {}),
    ...(resolvedDetail.readingCount !== undefined ? { readingCount: resolvedDetail.readingCount } : {}),
    ...(resolvedDetail.bookshelfCount !== undefined ? { bookshelfCount: resolvedDetail.bookshelfCount } : {}),
    ...(resolvedDetail.coverUrl ? { coverUrl: resolvedDetail.coverUrl } : {}),
    ...(resolvedDetail.isPurchased !== undefined ? { isPurchased: resolvedDetail.isPurchased } : {}),
    contentCard: createNovelContentCard(resolvedDetail, continueChapterId, continueChapterTitle),
    contentAccess: createNovelContentAccess(resolvedDetail),
  };
}

export function listItems(page = 1, pageSize = 2): ItemsListResponse {
  const start = (page - 1) * pageSize;
  return {
    items: HOST_ITEMS.slice(start, start + pageSize),
    page,
    pageSize,
    hasMore: start + pageSize < HOST_ITEMS.length,
  };
}

function resolveFeedTag(itemId: string): FeedTag {
  if (itemId === "lesson_1") {
    return { key: "warmup", label: "Warm-up" };
  }

  if (itemId === "lesson_2") {
    return { key: "input", label: "Input" };
  }

  if (itemId === "lesson_3") {
    return { key: "practice", label: "Practice" };
  }

  if (itemId === "lesson_4") {
    return { key: "speaking", label: "Speaking" };
  }

  return { key: "review", label: "Review" };
}

function createFeedItems(userState?: UserState): FeedItem[] {
  return HOST_ITEMS.map((item, index) => {
    const tag = resolveFeedTag(item.id);
    const managedContent = createManagedContentCard(item.id, userState);
    const managedAccess = createManagedContentAccess(item.id, userState);
    return {
      id: item.id,
      title: item.title,
      ...(item.subtitle ? { subtitle: item.subtitle } : {}),
      ...(item.categoryLabel ? { eyebrow: item.categoryLabel } : {}),
      ...(item.recommendedReason ? { recommendedReason: item.recommendedReason } : {}),
      updatedAt: `2026-04-0${Math.min(index + 1, 8)}T08:00:00.000Z`,
      tag: tag.key,
      ...(managedContent ? { contentCard: managedContent } : {}),
      ...(managedAccess ? { contentAccess: managedAccess } : {}),
    };
  });
}

function createSuggestionTerms(keyword: string | undefined, fallbackTerms: string[]): string[] {
  const normalized = keyword?.trim().toLowerCase();
  if (!normalized) {
    return fallbackTerms.slice(0, 3);
  }

  const matched = fallbackTerms.filter((term) => term.toLowerCase().includes(normalized));
  if (matched.length > 0) {
    return matched.slice(0, 3);
  }

  return fallbackTerms.slice(0, 3);
}

function createFeedSearchFilters(items: FeedItem[], activeTag?: string): SearchFilterGroup[] {
  const tagCounts = new Map<string, number>();
  const allTags = items.map((item) => resolveFeedTag(item.id));

  for (const tag of allTags) {
    tagCounts.set(tag.key, (tagCounts.get(tag.key) ?? 0) + 1);
  }

  return [
    {
      key: "tag",
      label: "Content type",
      selectedKeys: activeTag && activeTag !== "all" ? [activeTag] : [],
      options: [
        { key: "all", label: "All", count: items.length },
        ...Array.from(new Map(allTags.map((tag) => [tag.key, tag])).values()).map((tag) => ({
          key: tag.key,
          label: tag.label,
          count: tagCounts.get(tag.key) ?? 0,
        })),
      ],
    },
  ];
}

function createNovelSearchFilters(
  allCards: NovelCard[],
  input: {
    categoryKey?: string | undefined;
    status?: string | undefined;
  },
): SearchFilterGroup[] {
  const categoryCounts = new Map<string, { label: string; count: number }>();
  const statusCounts = new Map<string, number>();

  for (const card of allCards) {
    const existingCategory = categoryCounts.get(card.categoryKey);
    categoryCounts.set(card.categoryKey, {
      label: card.categoryLabel,
      count: (existingCategory?.count ?? 0) + 1,
    });
    statusCounts.set(card.status, (statusCounts.get(card.status) ?? 0) + 1);
  }

  return [
    {
      key: "category",
      label: "Category",
      selectedKeys: input.categoryKey && input.categoryKey !== "all" ? [input.categoryKey] : [],
      options: [
        { key: "all", label: "All", count: allCards.length },
        ...Array.from(categoryCounts.entries()).map(([key, value]) => ({
          key,
          label: value.label,
          count: value.count,
        })),
      ],
    },
    {
      key: "status",
      label: "Status",
      selectedKeys: input.status && input.status !== "all" ? [input.status] : [],
      options: [
        { key: "all", label: "Any status", count: allCards.length },
        { key: "serializing", label: "Serializing", count: statusCounts.get("serializing") ?? 0 },
        { key: "completed", label: "Completed", count: statusCounts.get("completed") ?? 0 },
        { key: "paused", label: "Paused", count: statusCounts.get("paused") ?? 0 },
      ],
    },
  ];
}

function createNovelSortOptions(): SearchSortOption[] {
  return [
    { key: "recommended", label: "Recommended" },
    { key: "updatedAt", label: "Latest" },
    { key: "popular", label: "Popular" },
    { key: "wordCount", label: "Length" },
  ];
}

function createFeedSortOptions(): SearchSortOption[] {
  return [
    { key: "recommended", label: "Recommended" },
    { key: "updatedAt", label: "Latest" },
  ];
}

function createFeedSearchResults(
  items: FeedItem[],
  total: number,
  hasMore: boolean,
  emptyText: string,
  hotKeywords: string[],
  activeSortKey: string,
  keyword: string,
): SearchResults<FeedItem> {
  const featuredReason = items[0]?.recommendedReason;

  return {
    items,
    total,
    hasMore,
    emptyText,
    ...(featuredReason ? { featuredReason } : {}),
    suggestionTerms: createSuggestionTerms(keyword, hotKeywords),
    hotKeywords,
    recentKeywords: [],
    sortOptions: createFeedSortOptions(),
    activeSortKey,
  };
}

function filterSearchItems<TItem>(
  items: TItem[],
  keyword: string,
  project: (item: TItem) => Array<string | undefined>,
): TItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return items;
  }

  return items.filter((item) =>
    project(item).some((value) => value?.toLowerCase().includes(normalizedKeyword)),
  );
}

function createUserSearchItems(userState?: UserState): FeedItem[] {
  const relation = userState?.relationTarget;
  const items: FeedItem[] = [
    {
      id: "user_current",
      title: userState?.profileOverrides?.nickname ?? "MiniX User",
      subtitle: "Current signed-in account",
      eyebrow: "User",
      recommendedReason: "Use the shared search center to jump between account, creator, and domain surfaces.",
      tag: "user",
    },
  ];

  if (relation) {
    items.push({
      id: relation.targetUserId,
      title: relation.displayName,
      subtitle: relation.friend ? "Mutual connection" : relation.following ? "Following" : "Suggested user",
      eyebrow: "User",
      recommendedReason: relation.remarkName
        ? `Remark: ${relation.remarkName}`
        : relation.blocked
          ? "Blocked relation target"
          : "Shared relation surface sample result",
      tag: "user",
    });
  }

  return items;
}

function createNovelFeedItems(userState?: UserState): FeedItem[] {
  return NOVELS.slice(0, 4).map((detail) => ({
    id: detail.id,
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    eyebrow: "Novel",
    recommendedReason: detail.relatedLaneLabel ?? detail.summary,
    ...(detail.latestChapter?.updatedAt ? { updatedAt: detail.latestChapter.updatedAt } : {}),
    tag: "novel",
    contentCard: createNovelContentCard(detail, detail.continueChapterId, detail.latestChapter?.title),
    contentAccess: createNovelContentAccess(detail),
  }));
}

function createContentSearchItems(userState?: UserState): FeedItem[] {
  return HOST_ITEMS.map((item, index) => {
    const contentCard = createManagedContentCard(item.id, userState);
    const contentAccess = createManagedContentAccess(item.id, userState);
    return {
      id: item.id,
      title: item.title,
      ...(item.subtitle ? { subtitle: item.subtitle } : {}),
      eyebrow: "Content",
      ...(contentCard?.lifecycle.reviewMessage ?? item.recommendedReason
        ? { recommendedReason: contentCard?.lifecycle.reviewMessage ?? item.recommendedReason }
        : {}),
      updatedAt: `2026-04-1${Math.min(index, 8)}T08:00:00.000Z`,
      tag: "content",
      ...(contentCard ? { contentCard } : {}),
      ...(contentAccess ? { contentAccess } : {}),
    };
  });
}

function createSearchDomainTabs(input: Array<{ domain: SearchDomain; label: string; total: number }>, activeDomain: SearchDomain) {
  return input.map((item) => ({
    ...item,
    active: item.domain === activeDomain,
  }));
}

function createSearchResultGroups(
  input: Array<{ domain: SearchDomain; label: string; items: FeedItem[] }>,
) {
  return input.map((group) => ({
    domain: group.domain,
    label: group.label,
    total: group.items.length,
    items: group.items,
    ...(group.items[0]?.recommendedReason ? { featuredReason: group.items[0].recommendedReason } : {}),
  }));
}

function createUnifiedFeedResults(
  input: {
    keyword: string;
    page: number;
    pageSize: number;
    mode: FeedListResponse["searchQuery"]["mode"];
    domain: SearchDomain;
    tag?: string | undefined;
  },
  userState?: UserState,
): FeedListResponse {
  const hotKeywords = ["travel", "speaking", "listening", "review", "user", "novel"];
  const feedItems = filterSearchItems(createFeedItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.eyebrow,
    item.recommendedReason,
  ]);
  const contentItems = filterSearchItems(createContentSearchItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.eyebrow,
    item.recommendedReason,
    item.contentCard?.lifecycle.state,
  ]);
  const novelItems = filterSearchItems(createNovelFeedItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.recommendedReason,
  ]);
  const userItems = filterSearchItems(createUserSearchItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.recommendedReason,
  ]);

  const searchMode = input.mode;
  const requestedDomain = input.domain;
  const scopedGroups =
    searchMode === "user" || requestedDomain === "user"
      ? [{ domain: "user" as const, label: "Users", items: userItems }]
      : searchMode === "content"
        ? [
            { domain: "content" as const, label: "Content", items: contentItems },
            { domain: "novel" as const, label: "Novels", items: novelItems },
          ]
        : requestedDomain === "all"
          ? [
              { domain: "feed" as const, label: "Feed", items: feedItems },
              { domain: "content" as const, label: "Content", items: contentItems },
              { domain: "novel" as const, label: "Novels", items: novelItems },
              { domain: "user" as const, label: "Users", items: userItems },
            ]
          : requestedDomain === "content"
            ? [{ domain: "content" as const, label: "Content", items: contentItems }]
            : requestedDomain === "novel"
              ? [{ domain: "novel" as const, label: "Novels", items: novelItems }]
              : [{ domain: "feed" as const, label: "Feed", items: feedItems }];

  const flattened = scopedGroups.flatMap((group) => group.items);
  const start = (input.page - 1) * input.pageSize;
  const pagedItems = flattened.slice(start, start + input.pageSize);
  const hasMore = start + input.pageSize < flattened.length;
  const activeDomain =
    requestedDomain === "all"
      ? searchMode === "user"
        ? "user"
        : searchMode === "content"
          ? "content"
          : "all"
      : requestedDomain;

  const tags = [
    { key: "all", label: "All" },
    { key: "feed", label: "Feed" },
    { key: "content", label: "Content" },
    { key: "novel", label: "Novel" },
    { key: "user", label: "User" },
  ];

  const resultGroups = createSearchResultGroups(scopedGroups);
  return {
    items: pagedItems,
    page: input.page,
    pageSize: input.pageSize,
    hasMore,
    tags,
    ...(pagedItems[0]?.recommendedReason ? { featuredReason: pagedItems[0].recommendedReason } : {}),
    searchQuery: {
      keyword: input.keyword,
      mode: searchMode,
      domain: requestedDomain,
      page: input.page,
      pageSize: input.pageSize,
    },
    searchFilters: [
      {
        key: "domain",
        label: "Search domain",
        selectedKeys: activeDomain === "all" ? [] : [activeDomain],
        options: [
          { key: "all", label: "All", count: flattened.length },
          { key: "feed", label: "Feed", count: feedItems.length },
          { key: "content", label: "Content", count: contentItems.length },
          { key: "novel", label: "Novel", count: novelItems.length },
          { key: "user", label: "User", count: userItems.length },
        ],
      },
    ],
    searchResults: {
      items: pagedItems,
      total: flattened.length,
      hasMore,
      emptyText:
        searchMode === "user" || requestedDomain === "user"
          ? "No user results matched this search."
          : searchMode === "content" || requestedDomain === "content"
            ? "No content results matched this search."
            : "No cross-domain results matched this search.",
      ...(pagedItems[0]?.recommendedReason ? { featuredReason: pagedItems[0].recommendedReason } : {}),
      suggestionTerms: createSuggestionTerms(input.keyword, hotKeywords),
      hotKeywords,
      recentKeywords: [],
      sortOptions: createFeedSortOptions(),
      activeSortKey: "recommended",
      domainTabs: createSearchDomainTabs(
        [
          { domain: "all", label: "All", total: feedItems.length + contentItems.length + novelItems.length + userItems.length },
          { domain: "feed", label: "Feed", total: feedItems.length },
          { domain: "content", label: "Content", total: contentItems.length },
          { domain: "novel", label: "Novel", total: novelItems.length },
          { domain: "user", label: "User", total: userItems.length },
        ],
        activeDomain,
      ),
      activeDomain,
      resultGroups,
    },
  };
}

function createNovelSearchResults(
  items: NovelCard[],
  total: number,
  hasMore: boolean,
  emptyText: string,
  hotKeywords: string[],
  activeSortKey: string,
  keyword: string,
): SearchResults<NovelCard> {
  const featuredReason = items[0]?.recommendedReason;

  return {
    items,
    total,
    hasMore,
    emptyText,
    ...(featuredReason ? { featuredReason } : {}),
    suggestionTerms: createSuggestionTerms(keyword, hotKeywords),
    hotKeywords,
    recentKeywords: [],
    sortOptions: createNovelSortOptions(),
    activeSortKey,
  };
}

function resolveManagedContentEntry(contentId: string, userState?: UserState) {
  return userState?.managedContentById?.[contentId] ?? createDefaultManagedContentEntries()[contentId];
}

function createManagedContentDisplay(contentId: string, userState?: UserState): ContentDisplay | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  if (!entry) {
    return undefined;
  }

  return {
    category: {
      key: entry.categoryKey,
      label: entry.categoryLabel,
    },
    tags: entry.tags.map((tag) => ({ ...tag })),
    topics: entry.tags.map((tag) => ({ ...tag })),
    recommendationSlot: entry.lifecycle.state === "published" ? "editorial" : "related",
    recommendationSlotLabel: entry.lifecycle.state === "published" ? "Managed Frontlist" : "Lifecycle Queue",
    pinned: entry.lifecycle.state === "published",
    featured: entry.lifecycle.state === "under_review" || entry.lifecycle.state === "review_rejected",
  };
}

function createManagedContentCard(contentId: string, userState?: UserState): ContentCard | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  const base = HOST_ITEMS.find((item) => item.id === contentId);
  const display = createManagedContentDisplay(contentId, userState);
  if (!entry || !base || !display) {
    return undefined;
  }

  return {
    contentId,
    model: entry.model,
    title: base.title,
    ...(base.subtitle ? { subtitle: base.subtitle } : {}),
    summary: entry.summary,
    authorLabel: entry.authorLabel,
    display,
    lifecycle: {
      ...entry.lifecycle,
      availableActions: [...entry.lifecycle.availableActions],
    },
  };
}

function createManagedContentAccess(contentId: string, userState?: UserState): ContentAccess | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  if (!entry) {
    return undefined;
  }

  return {
    visibility: entry.visibility,
    accessible: entry.visibility === "public",
    previewAvailable: entry.lifecycle.state !== "deleted",
    requiresLogin: entry.visibility === "login_required",
    requiresMembership: entry.visibility === "member_only",
    requiresPurchase: entry.visibility === "purchased_only",
    summaryLabel:
      entry.visibility === "public"
        ? "Visible to everyone."
        : entry.visibility === "login_required"
          ? "Visible after sign-in."
          : entry.visibility === "member_only"
            ? "Visible to members only."
            : "Visible after purchase only.",
    ...(entry.visibility === "member_only"
      ? { entitlementLabel: "Membership access" }
      : entry.visibility === "purchased_only"
        ? { entitlementLabel: "Purchase access" }
        : {}),
    ...(entry.visibility !== "public" ? { gateLabel: "Access is gated by the current visibility rule." } : {}),
  };
}

function createManagedContentDetail(contentId: string, userState?: UserState): ContentDetail | undefined {
  const card = createManagedContentCard(contentId, userState);
  if (!card) {
    return undefined;
  }

  return {
    ...card,
    recommendationReason: `Lifecycle status: ${card.lifecycle.state}.`,
    bodyPreview: `${card.summary} Lifecycle state: ${card.lifecycle.state}.`,
  };
}

export function getManagedContentDetail(contentId: string, userState: UserState): ContentDetailResponse | undefined {
  const contentDetail = createManagedContentDetail(contentId, userState);
  const contentAccess = createManagedContentAccess(contentId, userState);
  if (!contentDetail || !contentAccess) {
    return undefined;
  }

  return {
    contentDetail,
    contentAccess,
  };
}

export function applyManagedContentLifecycle(
  userState: UserState,
  input: ContentLifecycleMutationRequest,
): ContentLifecycleMutationResponse | undefined {
  const current = resolveManagedContentEntry(input.contentId, userState);
  if (!current) {
    return undefined;
  }

  if (!userState.managedContentById) {
    userState.managedContentById = createDefaultManagedContentEntries();
  }

  const next = structuredClone(current);
  const now = new Date().toISOString();

  switch (input.action) {
    case "publish":
      next.lifecycle.state = "published";
      next.lifecycle.availableActions = ["update", "archive", "delete", "change_visibility"];
      next.lifecycle.publishedAt = next.lifecycle.publishedAt ?? now;
      delete next.lifecycle.offlineAt;
      delete next.lifecycle.reviewMessage;
      break;
    case "archive":
      next.lifecycle.state = "offline";
      next.lifecycle.availableActions = ["restore", "delete", "change_visibility"];
      next.lifecycle.offlineAt = now;
      break;
    case "delete":
      next.lifecycle.state = "deleted";
      next.lifecycle.availableActions = ["restore"];
      break;
    case "restore":
      next.lifecycle.state = "published";
      next.lifecycle.availableActions = ["update", "archive", "delete", "change_visibility"];
      next.lifecycle.publishedAt = next.lifecycle.publishedAt ?? now;
      delete next.lifecycle.offlineAt;
      break;
    case "submit_review":
      next.lifecycle.state = "under_review";
      next.lifecycle.availableActions = ["approve_review", "reject_review", "change_visibility"];
      next.lifecycle.reviewMessage = input.reviewMessage ?? "Submitted for review.";
      break;
    case "approve_review":
      next.lifecycle.state = "published";
      next.lifecycle.availableActions = ["update", "archive", "delete", "change_visibility"];
      next.lifecycle.publishedAt = next.lifecycle.publishedAt ?? now;
      delete next.lifecycle.reviewMessage;
      break;
    case "reject_review":
      next.lifecycle.state = "review_rejected";
      next.lifecycle.availableActions = ["update", "submit_review", "delete", "change_visibility"];
      next.lifecycle.reviewMessage = input.reviewMessage ?? "Review rejected in sample workflow.";
      break;
    case "change_visibility":
      if (input.visibility) {
        next.visibility = input.visibility;
      }
      break;
    case "update":
      if (input.reviewMessage) {
        next.summary = input.reviewMessage;
      }
      break;
  }

  next.lifecycle.updatedAt = now;
  userState.managedContentById[input.contentId] = next;

  const contentCard = createManagedContentCard(input.contentId, userState);
  const contentDetail = createManagedContentDetail(input.contentId, userState);
  const contentAccess = createManagedContentAccess(input.contentId, userState);
  if (!contentCard || !contentDetail || !contentAccess) {
    return undefined;
  }

  return {
    contentCard,
    contentDetail,
    contentAccess,
    transitionMessage:
      input.action === "change_visibility"
        ? "Content visibility updated."
        : input.action === "submit_review"
          ? "Content submitted for review."
          : input.action === "approve_review"
            ? "Content review approved."
            : input.action === "reject_review"
              ? "Content review rejected."
              : input.action === "archive"
                ? "Content archived."
                : input.action === "restore"
                  ? "Content restored."
                  : input.action === "delete"
                    ? "Content deleted."
                    : input.action === "publish"
                      ? "Content published."
                      : "Content updated.",
  };
}

function resolveSearchDomain(inputDomain: string | undefined, fallback: SearchDomain): SearchDomain {
  if (inputDomain === "all" || inputDomain === "content" || inputDomain === "user" || inputDomain === "novel" || inputDomain === "feed") {
    return inputDomain;
  }

  return fallback;
}

export function listFeed(input: {
  page?: number | undefined;
  pageSize?: number | undefined;
  keyword?: string | undefined;
  tag?: string | undefined;
  mode?: string | undefined;
  domain?: string | undefined;
}, userState?: UserState): FeedListResponse {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const keyword = input.keyword?.trim() ?? "";
  const normalizedKeyword = keyword.toLowerCase();
  const mode = input.mode === "content" || input.mode === "user" || input.mode === "domain" ? input.mode : "global";
  const domain = resolveSearchDomain(input.domain, "feed");

  if (mode !== "global" || domain !== "feed") {
    return createUnifiedFeedResults(
      {
        page,
        pageSize,
        keyword,
        mode,
        domain,
        ...(input.tag ? { tag: input.tag } : {}),
      },
      userState,
    );
  }

  const hotKeywords = ["travel", "speaking", "listening", "review"];
  const allItems = createFeedItems(userState);
  const allTags = [{ key: "all", label: "All" }, ...Array.from(new Map(allItems.map((item) => {
    const tag = resolveFeedTag(item.id);
    return [tag.key, tag];
  })).values())];

  let filteredItems = allItems;
  if (input.tag && input.tag !== "all") {
    filteredItems = filteredItems.filter((item) => item.tag === input.tag);
  }

  if (normalizedKeyword) {
    filteredItems = filteredItems.filter((item) =>
      [item.title, item.subtitle, item.eyebrow, item.recommendedReason].some((value) =>
        value?.toLowerCase().includes(normalizedKeyword),
      ),
    );
  }

  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);
  const hasMore = start + pageSize < filteredItems.length;

  return {
    items,
    page,
    pageSize,
    hasMore,
    tags: allTags,
    ...(items[0]?.recommendedReason ? { featuredReason: items[0].recommendedReason } : {}),
    searchQuery: {
      keyword,
      mode,
      domain,
      page,
      pageSize,
    },
    searchFilters: createFeedSearchFilters(allItems, input.tag),
    searchResults: createFeedSearchResults(
      items,
      filteredItems.length,
      hasMore,
      keyword ? `No feed results matched "${keyword}".` : "No feed items are available yet.",
      hotKeywords,
      "recommended",
      keyword,
    ),
  };
}

export function listNovels(
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    categoryKey?: string | undefined;
    status?: string | undefined;
    keyword?: string | undefined;
    sort?: string | undefined;
  },
  membershipActive: boolean,
  userState: UserState,
  requestUrl?: string,
): NovelListResponse {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const keyword = input.keyword?.trim() ?? "";
  const normalizedKeyword = keyword.toLowerCase();
  const sort = input.sort ?? "recommended";

  const allCards = NOVELS.map((detail) => toNovelCard(detail, membershipActive, userState, requestUrl));
  let cards = [...allCards];

  if (input.categoryKey && input.categoryKey !== "all") {
    cards = cards.filter((item) => item.categoryKey === input.categoryKey);
  }

  if (input.status && input.status !== "all") {
    cards = cards.filter((item) => item.status === input.status);
  }

  if (normalizedKeyword) {
    cards = cards.filter((item) =>
      [item.title, item.authorName, item.summary].some((value) => value.toLowerCase().includes(normalizedKeyword)),
    );
  }

  if (sort === "updatedAt") {
    cards.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } else if (sort === "popular") {
    cards.sort((left, right) => (right.readingCount ?? 0) - (left.readingCount ?? 0));
  } else if (sort === "wordCount") {
    cards.sort((left, right) => right.wordCount - left.wordCount);
  }

  const start = (page - 1) * pageSize;
  const items = cards.slice(start, start + pageSize);
  const hasMore = start + pageSize < cards.length;
  const hotKeywords = ["lantern", "brocade", "sword", "orchid"];
  return {
    items,
    page,
    pageSize,
    hasMore,
    searchQuery: {
      keyword,
      mode: "domain",
      domain: "novel",
      page,
      pageSize,
    },
    searchFilters: createNovelSearchFilters(allCards, input),
    searchResults: createNovelSearchResults(
      items,
      cards.length,
      hasMore,
      keyword ? `No novels matched "${keyword}".` : "No novels found yet.",
      hotKeywords,
      sort,
      keyword,
    ),
  };
}

function createBookshelfItem(
  detail: NovelDetail,
  userState: UserState,
  membershipActive: boolean,
  requestUrl?: string,
): BookshelfItem {
  const resolvedDetail = resolveNovelDetail(detail, membershipActive, userState.bookshelfNovelIds, requestUrl);
  const progress = userState.progressByNovelId[detail.id];
  const continueChapterId = progress?.chapterId ?? resolvedDetail.continueChapterId ?? resolvedDetail.firstChapterId;
  const continueChapterTitle = continueChapterId ? CHAPTER_CONTENT[continueChapterId]?.title : undefined;
  const latestChapterId = resolvedDetail.latestChapter?.id;

  return {
    novelId: resolvedDetail.id,
    title: resolvedDetail.title,
    authorName: resolvedDetail.author.name,
    ...(resolvedDetail.coverUrl ? { coverUrl: resolvedDetail.coverUrl } : {}),
    ...(resolvedDetail.latestChapter?.title ? { latestChapterTitle: resolvedDetail.latestChapter.title } : {}),
    ...(continueChapterId ? { continueChapterId } : {}),
    ...(continueChapterTitle ? { continueChapterTitle } : {}),
    ...(progress?.progressPercent !== undefined ? { progressPercent: progress.progressPercent } : {}),
    updatedAt: progress?.updatedAt ?? resolvedDetail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z",
    hasUpdate: Boolean(latestChapterId && continueChapterId && latestChapterId !== continueChapterId),
  };
}

export function createBookshelf(
  userState: UserState,
  membershipActive: boolean,
  requestUrl?: string,
): BookshelfResponse {
  return {
    items: NOVELS.filter((detail) => userState.bookshelfNovelIds.has(detail.id))
      .map((detail) => createBookshelfItem(detail, userState, membershipActive, requestUrl))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}

export function deriveReturnTarget(source?: string): "catalog" | "detail" | "reader" {
  if (source === "reader") {
    return "reader";
  }

  if (source === "detail") {
    return "detail";
  }

  return "catalog";
}

interface NotificationSeed {
  id: string;
  type: NotificationType;
  groupKey: string;
  groupLabel: string;
  title: string;
  summary: string;
  bodyPreview?: string;
  createdAt: string;
  updatedAt?: string;
  pinned: boolean;
  doNotDisturb: boolean;
  tagLabels: string[];
  threadId?: string;
}

const DEFAULT_MESSAGE_TOUCHPOINTS: MessageTouchpoint[] = [
  {
    channel: "in_app",
    executable: true,
    enabled: true,
    delivered: true,
    statusLabel: "Visible in the in-app inbox",
  },
  {
    channel: "subscription_message",
    executable: false,
    enabled: true,
    statusLabel: "Reserved subscription-message abstraction",
  },
  {
    channel: "sms",
    executable: false,
    enabled: false,
    statusLabel: "Contract-only SMS fallback",
  },
  {
    channel: "email",
    executable: false,
    enabled: true,
    statusLabel: "Email touchpoint reserved for future delivery",
  },
  {
    channel: "push",
    executable: false,
    enabled: false,
    statusLabel: "Push abstraction reserved for vendor integration",
  },
];

const RESERVED_THREADS: MessageThread[] = [
  {
    threadId: "thread_private_tutor",
    type: "private",
    title: "Tutor Mila",
    subtitle: "Private coaching thread",
    participantLabels: ["Tutor Mila", "You"],
    pinned: true,
    doNotDisturb: false,
    unreadCount: 2,
    lastMessagePreview: "I left pronunciation notes on your latest speaking task.",
    lastMessageAt: "2026-04-08T09:10:00.000Z",
    lastReadAt: "2026-04-08T08:40:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
  },
  {
    threadId: "thread_consultation_case",
    type: "consultation",
    title: "Consultation Desk",
    subtitle: "Reserved consultation workflow thread",
    participantLabels: ["Consultation Desk", "You"],
    pinned: false,
    doNotDisturb: false,
    unreadCount: 1,
    lastMessagePreview: "Your consultation request is queued for an advisor reply.",
    lastMessageAt: "2026-04-08T07:55:00.000Z",
    lastReadAt: "2026-04-08T06:30:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
  },
  {
    threadId: "thread_customer_service",
    type: "customer_service",
    title: "Customer Support",
    subtitle: "Reserved customer-service thread",
    participantLabels: ["Support Bot", "You"],
    pinned: false,
    doNotDisturb: true,
    unreadCount: 0,
    lastMessagePreview: "Your billing question was marked resolved.",
    lastMessageAt: "2026-04-07T18:20:00.000Z",
    lastReadAt: "2026-04-07T18:25:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
  },
  {
    threadId: "thread_group_members",
    type: "group",
    title: "Member Circle (Reserved)",
    subtitle: "Reserved group-chat contract surface",
    participantLabels: ["Community Host", "You", "12 members"],
    pinned: false,
    doNotDisturb: true,
    unreadCount: 3,
    lastMessagePreview: "Weekly challenge picks are ready to review.",
    lastMessageAt: "2026-04-08T08:05:00.000Z",
    lastReadAt: "2026-04-07T21:20:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
  },
];

const THREAD_MESSAGE_SEEDS: Record<string, MessageBodyItem[]> = {
  thread_private_tutor: [
    {
      messageId: "msg_private_1",
      threadId: "thread_private_tutor",
      direction: "inbound",
      senderRole: "advisor",
      senderLabel: "Tutor Mila",
      body: "I left pronunciation notes on your latest speaking task.",
      createdAt: "2026-04-08T09:10:00.000Z",
      deliveryStatus: "delivered",
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
    {
      messageId: "msg_private_2",
      threadId: "thread_private_tutor",
      direction: "inbound",
      senderRole: "advisor",
      senderLabel: "Tutor Mila",
      body: "Reply here if you want me to review your next recording tonight.",
      createdAt: "2026-04-08T09:12:00.000Z",
      deliveryStatus: "delivered",
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
  thread_consultation_case: [
    {
      messageId: "msg_consult_1",
      threadId: "thread_consultation_case",
      direction: "outbound",
      senderRole: "self",
      senderLabel: "You",
      body: "I need advice on the premium reading workflow for our consultation flow.",
      createdAt: "2026-04-08T07:42:00.000Z",
      deliveryStatus: "read",
      readAt: "2026-04-08T07:44:00.000Z",
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
    {
      messageId: "msg_consult_2",
      threadId: "thread_consultation_case",
      direction: "inbound",
      senderRole: "advisor",
      senderLabel: "Consultation Desk",
      body: "Your consultation request is queued for an advisor reply.",
      createdAt: "2026-04-08T07:55:00.000Z",
      deliveryStatus: "delivered",
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
  thread_customer_service: [
    {
      messageId: "msg_support_1",
      threadId: "thread_customer_service",
      direction: "outbound",
      senderRole: "self",
      senderLabel: "You",
      body: "Can you confirm whether my billing question was resolved?",
      createdAt: "2026-04-07T18:10:00.000Z",
      deliveryStatus: "read",
      readAt: "2026-04-07T18:12:00.000Z",
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
    {
      messageId: "msg_support_2",
      threadId: "thread_customer_service",
      direction: "inbound",
      senderRole: "support",
      senderLabel: "Support Bot",
      body: "Your billing question was marked resolved.",
      createdAt: "2026-04-07T18:20:00.000Z",
      deliveryStatus: "read",
      readAt: "2026-04-07T18:25:00.000Z",
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
  thread_group_members: [
    {
      messageId: "msg_group_1",
      threadId: "thread_group_members",
      direction: "inbound",
      senderRole: "peer",
      senderLabel: "Community Host",
      body: "Weekly challenge picks are ready to review.",
      createdAt: "2026-04-08T08:05:00.000Z",
      deliveryStatus: "delivered",
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
};

const NOTIFICATION_SEEDS: NotificationSeed[] = [
  {
    id: "notice_system_security",
    type: "system",
    groupKey: "security",
    groupLabel: "Security",
    title: "New device sign-in detected",
    summary: "A new H5 session was created for your account. Review the session if this was not you.",
    bodyPreview: "Security events surface here before vendor-backed push or SMS delivery is added.",
    createdAt: "2026-04-08T09:25:00.000Z",
    updatedAt: "2026-04-08T09:25:00.000Z",
    pinned: true,
    doNotDisturb: false,
    tagLabels: ["security", "session"],
    threadId: "thread_customer_service",
  },
  {
    id: "notice_business_payment",
    type: "business",
    groupKey: "orders",
    groupLabel: "Orders",
    title: "Membership payment confirmed",
    summary: "Your membership entitlement is active and premium reading has been unlocked.",
    bodyPreview: "This item links the order/payment foundation into the shared inbox model.",
    createdAt: "2026-04-08T08:50:00.000Z",
    updatedAt: "2026-04-08T08:52:00.000Z",
    pinned: true,
    doNotDisturb: false,
    tagLabels: ["payment", "entitlement"],
  },
  {
    id: "notice_campaign_challenge",
    type: "campaign",
    groupKey: "growth",
    groupLabel: "Growth",
    title: "Seven-day speaking challenge is live",
    summary: "Invite a friend or join the reserved member group to start the next challenge.",
    bodyPreview: "Campaign notices keep attribution-friendly metadata in a shared structure.",
    createdAt: "2026-04-08T07:40:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["campaign", "invite"],
    threadId: "thread_group_members",
  },
  {
    id: "notice_review_article",
    type: "review",
    groupKey: "moderation",
    groupLabel: "Moderation",
    title: "Your draft feedback was approved",
    summary: "The editorial review step is complete and the content is now visible.",
    bodyPreview: "Review notices reserve the moderation lane before the general content workflow lands.",
    createdAt: "2026-04-08T07:05:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["review", "content"],
  },
  {
    id: "notice_business_consultation",
    type: "business",
    groupKey: "consultation",
    groupLabel: "Consultation",
    title: "Consultation reply received",
    summary: "An advisor replied to your latest consultation request.",
    bodyPreview: "Conversation threads stay separate from notifications, but this notice can reference one.",
    createdAt: "2026-04-07T21:15:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["consultation", "advisor"],
    threadId: "thread_consultation_case",
  },
  {
    id: "notice_system_learning",
    type: "system",
    groupKey: "learning",
    groupLabel: "Learning",
    title: "Daily plan is ready",
    summary: "Overview and today's plan have been refreshed with a new practice queue.",
    createdAt: "2026-04-07T20:45:00.000Z",
    pinned: false,
    doNotDisturb: true,
    tagLabels: ["plan", "overview"],
  },
  {
    id: "notice_review_profile",
    type: "review",
    groupKey: "account",
    groupLabel: "Account",
    title: "Profile update under review",
    summary: "Your new profile description is being reviewed before it appears publicly.",
    createdAt: "2026-04-07T18:10:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["profile", "review"],
  },
];

function cloneTouchpoints(touchpoints: MessageTouchpoint[]): MessageTouchpoint[] {
  return touchpoints.map((touchpoint) => ({ ...touchpoint }));
}

function cloneMessageBodyItem(message: MessageBodyItem): MessageBodyItem {
  return {
    ...message,
    ...(message.updatedAt ? { updatedAt: message.updatedAt } : {}),
    ...(message.readAt ? { readAt: message.readAt } : {}),
    touchpoints: cloneTouchpoints(message.touchpoints),
  };
}

function cloneMessageItems(messages: MessageBodyItem[]): MessageBodyItem[] {
  return messages.map((message) => cloneMessageBodyItem(message));
}

function cloneReservedThreads(): MessageThread[] {
  return RESERVED_THREADS.map((thread) => ({
    ...thread,
    participantLabels: [...thread.participantLabels],
    touchpoints: cloneTouchpoints(thread.touchpoints),
  }));
}

function getThreadMessages(userState: UserState, threadId: string): MessageBodyItem[] {
  const seeded = THREAD_MESSAGE_SEEDS[threadId] ? cloneMessageItems(THREAD_MESSAGE_SEEDS[threadId]) : [];
  const appended = userState.threadMessagesByThreadId[threadId] ? cloneMessageItems(userState.threadMessagesByThreadId[threadId]) : [];
  const lastReadAt = userState.threadReadAtById[threadId];

  return [...seeded, ...appended]
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((message) => {
      if (message.direction === "inbound" && lastReadAt && message.createdAt <= lastReadAt) {
        return {
          ...message,
          deliveryStatus: "read",
          readAt: lastReadAt,
        };
      }

      return message;
    });
}

function countUnreadThreadMessages(userState: UserState, threadId: string): number {
  const lastReadAt = userState.threadReadAtById[threadId];
  const messages = getThreadMessages(userState, threadId);
  return messages.filter((message) => {
    if (message.direction !== "inbound") {
      return false;
    }

    if (!lastReadAt) {
      return true;
    }

    return message.createdAt > lastReadAt;
  }).length;
}

function createMessageThreadActions(thread: MessageThread): MessageThreadActions {
  return {
    canReply: thread.type !== "group",
    canMarkRead: thread.unreadCount > 0,
    deliveryLabel:
      thread.type === "customer_service"
        ? "Customer-service delivery lane"
        : thread.type === "consultation"
          ? "Consultation thread delivery lane"
          : thread.type === "private"
            ? "Private message delivery lane"
            : "Reserved group delivery lane",
  };
}

function deriveThreadState(userState: UserState, thread: MessageThread): MessageThread {
  const messages = getThreadMessages(userState, thread.threadId);
  const lastMessage = messages[messages.length - 1];
  const unreadCount = countUnreadThreadMessages(userState, thread.threadId);

  return {
    ...thread,
    participantLabels: [...thread.participantLabels],
    touchpoints: cloneTouchpoints(thread.touchpoints),
    unreadCount,
    ...(lastMessage ? { lastMessagePreview: lastMessage.body } : {}),
    ...(lastMessage ? { lastMessageAt: lastMessage.createdAt } : {}),
    ...(userState.threadReadAtById[thread.threadId] ? { lastReadAt: userState.threadReadAtById[thread.threadId] } : {}),
  };
}

function createNotificationItem(seed: NotificationSeed, userState: UserState): NotificationItem {
  const readAt = userState.notificationReadAtById[seed.id];
  const threadSeed = seed.threadId ? RESERVED_THREADS.find((item) => item.threadId === seed.threadId) : undefined;
  const thread = threadSeed ? deriveThreadState(userState, threadSeed) : undefined;

  return {
    id: seed.id,
    type: seed.type,
    groupKey: seed.groupKey,
    groupLabel: seed.groupLabel,
    title: seed.title,
    summary: seed.summary,
    ...(seed.bodyPreview ? { bodyPreview: seed.bodyPreview } : {}),
    createdAt: seed.createdAt,
    ...(seed.updatedAt ? { updatedAt: seed.updatedAt } : {}),
    pinned: seed.pinned,
    doNotDisturb: seed.doNotDisturb,
    receipt: {
      read: Boolean(readAt),
      ...(readAt ? { readAt } : {}),
      readReceiptRequired: true,
    },
    touchpoints: cloneTouchpoints(DEFAULT_MESSAGE_TOUCHPOINTS),
    tagLabels: [...seed.tagLabels],
    ...(thread
      ? {
          thread: {
            threadId: thread.threadId,
            type: thread.type,
            title: thread.title,
            ...(thread.lastMessagePreview ? { lastMessagePreview: thread.lastMessagePreview } : {}),
            reserved: thread.reserved,
          },
        }
      : {}),
  };
}

function sortNotifications(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function createNotificationGroups(items: NotificationItem[]): NotificationGroupSummary[] {
  return Array.from(
    items.reduce((map, item) => {
      const existing = map.get(item.groupKey);
      map.set(item.groupKey, {
        key: item.groupKey,
        label: item.groupLabel,
        count: (existing?.count ?? 0) + 1,
      });
      return map;
    }, new Map<string, NotificationGroupSummary>()),
  )
    .map(([, value]) => value)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function createNotificationFilters(
  allItems: NotificationItem[],
  activeType: string | undefined,
  activeGroupKey: string | undefined,
  onlyUnread: boolean,
): NotificationFilterGroup[] {
  const typeCounts = NOTIFICATION_SEEDS.reduce<Record<string, number>>((counts, seed) => {
    counts[seed.type] = (counts[seed.type] ?? 0) + 1;
    return counts;
  }, {});
  const groupCounts = NOTIFICATION_SEEDS.reduce<Record<string, number>>((counts, seed) => {
    counts[seed.groupKey] = (counts[seed.groupKey] ?? 0) + 1;
    return counts;
  }, {});
  const groupLabels = new Map(NOTIFICATION_SEEDS.map((seed) => [seed.groupKey, seed.groupLabel]));

  return [
    {
      key: "type",
      label: "Type",
      selectedKeys: activeType && activeType !== "all" ? [activeType] : [],
      options: [
        { key: "all", label: "All", count: allItems.length },
        { key: "system", label: "System", count: typeCounts.system ?? 0 },
        { key: "business", label: "Business", count: typeCounts.business ?? 0 },
        { key: "campaign", label: "Campaign", count: typeCounts.campaign ?? 0 },
        { key: "review", label: "Review", count: typeCounts.review ?? 0 },
      ],
    },
    {
      key: "group",
      label: "Group",
      selectedKeys: activeGroupKey && activeGroupKey !== "all" ? [activeGroupKey] : [],
      options: [
        { key: "all", label: "All groups", count: allItems.length },
        ...Object.entries(groupCounts)
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .map(([key, count]) => ({
            key,
            label: groupLabels.get(key) ?? key,
            count,
          })),
      ],
    },
    {
      key: "state",
      label: "State",
      selectedKeys: onlyUnread ? ["unread"] : [],
      options: [
        { key: "all", label: "All", count: allItems.length },
        { key: "unread", label: "Unread", count: allItems.filter((item) => !item.receipt.read).length },
      ],
    },
  ];
}

function createUnreadBadge(userState: UserState): UnreadBadge {
  const notifications = sortNotifications(NOTIFICATION_SEEDS.map((seed) => createNotificationItem(seed, userState)));
  const notificationUnread = notifications.filter((item) => !item.receipt.read).length;
  const threadUnread = cloneReservedThreads()
    .map((thread) => deriveThreadState(userState, thread))
    .reduce((total, thread) => total + thread.unreadCount, 0);
  const breakdown: Array<{ key: string; label: string; count: number }> = NOTIFICATION_TYPES
    .map((type) => ({
      key: type,
      label: `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`,
      count: notifications.filter((item) => item.type === type && !item.receipt.read).length,
    }))
    .filter((entry) => entry.count > 0);

  if (threadUnread > 0) {
    breakdown.push({
      key: "threads",
      label: "Threads",
      count: threadUnread,
    });
  }

  return {
    totalUnread: notificationUnread + threadUnread,
    notificationUnread,
    threadUnread,
    breakdown,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function createNotificationList(
  userState: UserState,
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
  },
): NotificationList {
  const allItems = sortNotifications(NOTIFICATION_SEEDS.map((seed) => createNotificationItem(seed, userState)));
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const activeType = input.type && input.type !== "all" ? input.type : undefined;
  const activeGroupKey = input.groupKey && input.groupKey !== "all" ? input.groupKey : undefined;
  const onlyUnread = Boolean(input.onlyUnread);

  let filteredItems = allItems;
  if (activeType) {
    filteredItems = filteredItems.filter((item) => item.type === activeType);
  }
  if (activeGroupKey) {
    filteredItems = filteredItems.filter((item) => item.groupKey === activeGroupKey);
  }
  if (onlyUnread) {
    filteredItems = filteredItems.filter((item) => !item.receipt.read);
  }

  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);

  return {
    items,
    page,
    pageSize,
    total: filteredItems.length,
    hasMore: start + pageSize < filteredItems.length,
    grouping: "type",
    groups: createNotificationGroups(filteredItems),
    filters: createNotificationFilters(allItems, activeType, activeGroupKey, onlyUnread),
    onlyUnread,
    ...(items[0] ? { selectedNotificationId: items[0].id } : {}),
  };
}

export function listNotifications(
  userState: UserState,
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
    threadId?: string | undefined;
  },
): NotificationListResponse {
  const notificationList = createNotificationList(userState, input);
  const reservedThreads = cloneReservedThreads().map((thread) => deriveThreadState(userState, thread));
  const selectedThread =
    (input.threadId ? reservedThreads.find((thread) => thread.threadId === input.threadId) : undefined) ??
    reservedThreads.find((thread) => thread.unreadCount > 0) ??
    reservedThreads[0];

  return {
    notificationList,
    messageThread: selectedThread ? { ...selectedThread, participantLabels: [...selectedThread.participantLabels], touchpoints: cloneTouchpoints(selectedThread.touchpoints) } : undefined,
    unreadBadge: createUnreadBadge(userState),
    reservedThreads,
  };
}

export function markNotificationsRead(
  userState: UserState,
  input: {
    notificationIds: string[];
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
  },
): MarkNotificationsReadResponse {
  const updatedIds = input.notificationIds.filter((notificationId) =>
    NOTIFICATION_SEEDS.some((seed) => seed.id === notificationId),
  );
  const timestamp = new Date().toISOString();

  for (const notificationId of updatedIds) {
    userState.notificationReadAtById[notificationId] = timestamp;
  }

  return {
    updatedIds,
    notificationList: createNotificationList(userState, input),
    unreadBadge: createUnreadBadge(userState),
  };
}

export function getUnreadBadge(userState: UserState): UnreadBadge {
  return createUnreadBadge(userState);
}

export function getMessageThread(userState: UserState, threadId: string): MessageThreadResponse | null {
  const threadSeed = cloneReservedThreads().find((thread) => thread.threadId === threadId);
  const messageThread = threadSeed ? deriveThreadState(userState, threadSeed) : undefined;
  if (!messageThread) {
    return null;
  }

  return {
    messageThread,
    messageItems: getThreadMessages(userState, threadId),
    detailActions: createMessageThreadActions(messageThread),
    unreadBadge: createUnreadBadge(userState),
  };
}

export function markThreadRead(userState: UserState, input: MarkThreadReadRequest): MessageThreadResponse | null {
  const existing = getMessageThread(userState, input.threadId);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  userState.threadReadAtById[input.threadId] = now;
  return getMessageThread(userState, input.threadId);
}

export function sendThreadMessage(userState: UserState, input: SendMessageRequest): SendMessageResponse | null {
  const threadSeed = cloneReservedThreads().find((thread) => thread.threadId === input.threadId);
  if (!threadSeed) {
    return null;
  }
  if (!createMessageThreadActions(threadSeed).canReply) {
    return null;
  }

  const sentAt = new Date().toISOString();
  const messageItem: MessageBodyItem = {
    messageId: `msg_${crypto.randomUUID()}`,
    threadId: input.threadId,
    direction: "outbound",
    senderRole: "self",
    senderLabel: "You",
    body: input.body,
    createdAt: sentAt,
    deliveryStatus: "sent",
    touchpoints: cloneTouchpoints(threadSeed.touchpoints),
  };
  const existingMessages = userState.threadMessagesByThreadId[input.threadId] ?? [];
  const nextMessages = [...existingMessages];
  nextMessages.push(messageItem);
  userState.threadMessagesByThreadId[input.threadId] = nextMessages;

  const messageThread = getMessageThread(userState, input.threadId)?.messageThread;
  if (!messageThread) {
    return null;
  }

  return {
    messageThread,
    messageItem,
    detailActions: createMessageThreadActions(messageThread),
    unreadBadge: createUnreadBadge(userState),
  };
}

const FEEDBACK_FAQ_ENTRIES: Record<string, FeedbackFaqEntry> = {
  account: {
    entryId: "faq_account_recovery",
    title: "Account Recovery FAQ",
    summary: "Use the shared account recovery lane before opening a duplicate support ticket.",
    linkLabel: "Open FAQ",
    linkUrl: "https://example.test/faq/account-recovery",
  },
  payment: {
    entryId: "faq_payment_status",
    title: "Payment Status FAQ",
    summary: "Check order and payment status before escalating duplicate billing questions.",
    linkLabel: "Open FAQ",
    linkUrl: "https://example.test/faq/payment-status",
  },
  content: {
    entryId: "faq_content_review",
    title: "Content Review FAQ",
    summary: "Review content moderation expectations and publication timing.",
    linkLabel: "Open FAQ",
    linkUrl: "https://example.test/faq/content-review",
  },
};

function createFeedbackSupportEntry(label: string, summary: string): FeedbackSupportEntry {
  return {
    entryId: `support_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    label,
    summary,
    channel: "messages",
    routeId: APP_ROUTE_IDS.messages,
    threadId: "thread_customer_service",
  };
}

function createFeedbackFaqEntries(keys: Array<keyof typeof FEEDBACK_FAQ_ENTRIES>): FeedbackFaqEntry[] {
  return keys.map((key) => ({ ...FEEDBACK_FAQ_ENTRIES[key]! }));
}

const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  {
    key: "product_issue",
    label: "Product Issue",
    type: "issue_report",
    description: "Use for broken flows, rendering issues, or session recovery problems.",
    defaultPriority: "high",
    labels: ["product", "bug"],
    supportsAttachments: true,
    faqEntry: FEEDBACK_FAQ_ENTRIES.account!,
    faqEntries: createFeedbackFaqEntries(["account"]),
    customerServiceEntryLabel: "Open Support Desk",
    supportEntry: createFeedbackSupportEntry(
      "Open Support Desk",
      "Route this ticket into the shared customer-service inbox thread for follow-up.",
    ),
  },
  {
    key: "improvement",
    label: "Suggestion",
    type: "suggestion",
    description: "Use for ideas, workflow improvements, and missing capabilities.",
    defaultPriority: "medium",
    labels: ["product", "idea"],
    supportsAttachments: true,
    customerServiceEntryLabel: "Open Suggestion Review Queue",
    supportEntry: createFeedbackSupportEntry(
      "Open Suggestion Review Queue",
      "Use the shared inbox thread to clarify product suggestions and expected improvements.",
    ),
  },
  {
    key: "billing",
    label: "Payment Issue",
    type: "complaint",
    description: "Use for billing confusion, refunds, or duplicate payment concerns.",
    defaultPriority: "urgent",
    labels: ["payment", "billing"],
    supportsAttachments: true,
    faqEntry: FEEDBACK_FAQ_ENTRIES.payment!,
    faqEntries: createFeedbackFaqEntries(["payment"]),
    customerServiceEntryLabel: "Open Billing Support",
    supportEntry: createFeedbackSupportEntry(
      "Open Billing Support",
      "Continue billing follow-up in the shared customer-service thread with order context.",
    ),
  },
  {
    key: "abuse",
    label: "Report Abuse",
    type: "abuse_report",
    description: "Use for harmful content, impersonation, or abuse reporting.",
    defaultPriority: "urgent",
    labels: ["abuse", "moderation"],
    supportsAttachments: true,
    faqEntry: FEEDBACK_FAQ_ENTRIES.content!,
    faqEntries: createFeedbackFaqEntries(["content"]),
    customerServiceEntryLabel: "Open Trust and Safety Desk",
    supportEntry: createFeedbackSupportEntry(
      "Open Trust and Safety Desk",
      "Escalate moderation follow-up into the reserved support thread used by the sample inbox.",
    ),
  },
  {
    key: "satisfaction",
    label: "Satisfaction Survey",
    type: "satisfaction",
    description: "Use for structured service satisfaction feedback.",
    defaultPriority: "low",
    labels: ["survey", "quality"],
    supportsAttachments: false,
    customerServiceEntryLabel: "Open Service Quality Desk",
    supportEntry: createFeedbackSupportEntry(
      "Open Service Quality Desk",
      "Continue service-quality follow-up in the shared support inbox thread.",
    ),
  },
];

function cloneFeedbackCategory(category: FeedbackCategory): FeedbackCategory {
  return {
    ...category,
    labels: [...category.labels],
    ...(category.faqEntry ? { faqEntry: { ...category.faqEntry } } : {}),
    ...(category.faqEntries ? { faqEntries: category.faqEntries.map((entry) => ({ ...entry })) } : {}),
    ...(category.supportEntry ? { supportEntry: { ...category.supportEntry } } : {}),
  };
}

function cloneFeedbackStatus(status: FeedbackStatus): FeedbackStatus {
  return {
    ...status,
    handlingProgress: [...status.handlingProgress],
    processingHistory: status.processingHistory.map((record) => ({ ...record })),
    ...(status.faqEntry ? { faqEntry: { ...status.faqEntry } } : {}),
    ...(status.faqEntries ? { faqEntries: status.faqEntries.map((entry) => ({ ...entry })) } : {}),
    ...(status.supportEntry ? { supportEntry: { ...status.supportEntry } } : {}),
    ...(status.revisitAction ? { revisitAction: { ...status.revisitAction } } : {}),
  };
}

function resolveFeedbackCategory(categoryKey: string, type: FeedbackType): FeedbackCategory {
  const fallbackCategory = FEEDBACK_CATEGORIES[0];
  return (
    FEEDBACK_CATEGORIES.find((category) => category.key === categoryKey) ??
    FEEDBACK_CATEGORIES.find((category) => category.type === type) ??
    fallbackCategory!
  );
}

function shiftIsoMinutes(timestamp: string, minutes: number): string {
  return new Date(new Date(timestamp).getTime() + minutes * 60_000).toISOString();
}

function createFeedbackRevisitAction(
  ticketId: string,
  category: FeedbackCategory,
  state: FeedbackStatus["state"],
  revisitRequired: boolean,
): FeedbackRevisitAction {
  return {
    ticketId,
    label:
      state === "waiting_user"
        ? "Reply With Requested Details"
        : state === "resolved" || state === "closed"
          ? "Request Follow-up"
          : "Add More Context",
    summary:
      revisitRequired
        ? "The support lane is waiting for more context before closing the ticket."
        : `Continue follow-up for ${category.label.toLowerCase()} in the shared support lane.`,
    enabled: true,
    ...(category.supportEntry?.routeId ? { routeId: category.supportEntry.routeId } : {}),
    ...(category.supportEntry?.threadId ? { threadId: category.supportEntry.threadId } : {}),
    suggestedReply:
      state === "waiting_user"
        ? "I am following up with the details you requested."
        : `Following up on ${ticketId}: please review the latest update.`,
  };
}

function createFeedbackStatus(
  ticketId: string,
  state: FeedbackStatus["state"],
  category: FeedbackCategory,
  revisitRequired: boolean,
  createdAt: string,
): FeedbackStatus {
  const history: FeedbackStatus["processingHistory"] = [
    {
      recordedAt: createdAt,
      actorLabel: "System Intake",
      actionLabel: "Ticket created",
      note: "Feedback entered the shared support loop foundation.",
      state: "submitted" as const,
    },
  ];

  if (state === "triaged" || state === "in_progress" || state === "waiting_user" || state === "resolved" || state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 10),
      actorLabel: "Support Queue",
      actionLabel: "Ticket triaged",
      note: "The shared support lane assigned the ticket to the right queue.",
      state: "triaged",
    });
  }

  if (state === "in_progress" || state === "waiting_user" || state === "resolved" || state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 25),
      actorLabel: "Support Specialist",
      actionLabel: "Support review started",
      note: "A support agent started reviewing the provided context and attachments.",
      state: "in_progress",
    });
  }

  if (state === "waiting_user") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 35),
      actorLabel: "Support Specialist",
      actionLabel: "Additional context requested",
      note: "The support lane asked for more detail before closing the loop.",
      state: "waiting_user",
    });
  }

  if (state === "resolved" || state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 45),
      actorLabel: "Support Specialist",
      actionLabel: "Resolution posted",
      note: "A sample resolution was attached to the support loop for follow-up confirmation.",
      state: "resolved",
    });
  }

  if (state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 60),
      actorLabel: "System Intake",
      actionLabel: "Ticket closed",
      note: "The feedback service loop completed without additional follow-up.",
      state: "closed",
    });
  }

  return {
    state,
    label:
      state === "submitted"
        ? "Submitted"
        : state === "triaged"
          ? "Triaged"
          : state === "in_progress"
            ? "In Progress"
            : state === "waiting_user"
              ? "Waiting for User"
              : state === "resolved"
                ? "Resolved"
                : "Closed",
    progressLabel:
      state === "submitted"
        ? "Queued for initial review"
        : state === "triaged"
          ? "Assigned to the right support lane"
          : state === "in_progress"
            ? "Being processed by support"
            : state === "waiting_user"
              ? "Waiting for more user context"
              : state === "resolved"
                ? "Handled and ready for confirmation"
                : "Service loop complete",
    nextStepLabel:
      state === "waiting_user"
        ? "Reply from the support entry to continue this ticket."
        : state === "resolved"
          ? "Confirm whether the proposed resolution is sufficient."
          : state === "closed"
            ? "Open a follow-up if the issue returns."
            : "Use the support entry if you need to add more context.",
    revisitRequired,
    ...(category.faqEntry ? { faqEntry: { ...category.faqEntry } } : {}),
    ...(category.faqEntries ? { faqEntries: category.faqEntries.map((entry) => ({ ...entry })) } : {}),
    ...(category.customerServiceEntryLabel
      ? { customerServiceEntryLabel: category.customerServiceEntryLabel }
      : {}),
    ...(category.supportEntry ? { supportEntry: { ...category.supportEntry } } : {}),
    revisitAction: createFeedbackRevisitAction(ticketId, category, state, revisitRequired),
    handlingProgress: [
      "Submitted to intake",
      "Routed to support lane",
      "Support review in progress",
      revisitRequired ? "Waiting for your reply" : "Waiting for support confirmation",
      "Resolved or closed",
    ],
    processingHistory: history,
  };
}

function createFeedbackTicketResponse(
  ticket: FeedbackTicket,
  category: FeedbackCategory,
  status: FeedbackStatus,
): FeedbackTicketDetailResponse {
  return {
    feedbackTicket: structuredClone(ticket),
    feedbackCategory: cloneFeedbackCategory(category),
    feedbackStatus: cloneFeedbackStatus(status),
  };
}

function createDefaultFeedbackContext(
  session: SessionRecord,
  request: SubmitFeedbackRequest["context"],
): FeedbackTicket["context"] {
  return {
    sourcePage: request.sourcePage,
    ...(request.sourceRouteId ? { sourceRouteId: request.sourceRouteId } : {}),
    ...(request.sourceLabel ? { sourceLabel: request.sourceLabel } : {}),
    userId: request.userId ?? session.userId,
    platform: request.platform,
    appVersion: request.appVersion,
    ...(request.deviceSummary ? { deviceSummary: request.deviceSummary } : {}),
    screenshotAssets: request.screenshotAssets.map((asset) => structuredClone(asset)),
    attachmentAssets: request.attachmentAssets.map((asset) => structuredClone(asset)),
  };
}

export function createFeedbackBootstrapResponse(userState: UserState): FeedbackBootstrapResponse {
  const latestDetail = userState.latestFeedbackTicketId
    ? userState.feedbackDetailsById[userState.latestFeedbackTicketId]
    : undefined;
  const referenceCategory = latestDetail?.feedbackCategory ?? FEEDBACK_CATEGORIES[0];
  const serviceLoopSummary =
    latestDetail?.feedbackStatus.nextStepLabel ?? latestDetail?.feedbackStatus.progressLabel ?? referenceCategory?.description;

  return {
    feedbackCategories: FEEDBACK_CATEGORIES.map(cloneFeedbackCategory),
    recommendedFaqEntries:
      referenceCategory?.faqEntries?.map((entry) => ({ ...entry })) ??
      (referenceCategory?.faqEntry ? [{ ...referenceCategory.faqEntry }] : []),
    ...(referenceCategory?.supportEntry ? { supportEntry: { ...referenceCategory.supportEntry } } : {}),
    ...(serviceLoopSummary !== undefined ? { serviceLoopSummary } : {}),
    ...(latestDetail
      ? {
          latestTicket: structuredClone(latestDetail.feedbackTicket),
          latestStatus: cloneFeedbackStatus(latestDetail.feedbackStatus),
          latestCategory: cloneFeedbackCategory(latestDetail.feedbackCategory),
        }
      : {}),
  };
}

export function submitFeedbackTicket(
  session: SessionRecord,
  userState: UserState,
  request: SubmitFeedbackRequest,
  now = new Date().toISOString(),
): SubmitFeedbackResponse {
  const category = resolveFeedbackCategory(request.categoryKey, request.type);
  const ticketId = `fb_${crypto.randomUUID()}`;
  const priority: FeedbackPriority = request.priority ?? category.defaultPriority;
  const revisitRequested = Boolean(request.revisitRequested);
  const ticket: FeedbackTicket = {
    ticketId,
    type: request.type,
    categoryKey: category.key,
    title: request.title,
    description: request.description,
    priority,
    labels: [...new Set([...(request.labels ?? []), ...category.labels])],
    revisitRequested,
    ...(request.satisfactionScore !== undefined ? { satisfactionScore: request.satisfactionScore } : {}),
    createdAt: now,
    updatedAt: now,
    context: createDefaultFeedbackContext(session, request.context),
  };
  const statusState: FeedbackStatus["state"] =
    category.type === "abuse_report" || category.defaultPriority === "urgent" ? "triaged" : "submitted";
  const status = createFeedbackStatus(ticketId, statusState, category, revisitRequested, now);
  const response = createFeedbackTicketResponse(ticket, category, status);

  bindUploadAssetsToOwner(userState, {
    assetIds: ticket.context.screenshotAssets.map((asset) => asset.assetId),
    ownerType: "feedback",
    ownerId: ticketId,
    role: "screenshot",
    now,
  });
  bindUploadAssetsToOwner(userState, {
    assetIds: ticket.context.attachmentAssets.map((asset) => asset.assetId),
    ownerType: "feedback",
    ownerId: ticketId,
    role: "attachment",
    now,
  });
  userState.feedbackDetailsById[ticketId] = response;
  userState.latestFeedbackTicketId = ticketId;
  return response;
}

export function getFeedbackTicket(userState: UserState, ticketId: string): FeedbackTicketDetailResponse | null {
  const detail = userState.feedbackDetailsById[ticketId];
  return detail ? createFeedbackTicketResponse(detail.feedbackTicket, detail.feedbackCategory, detail.feedbackStatus) : null;
}

export function revisitFeedbackTicket(
  userState: UserState,
  request: FeedbackRevisitRequest,
  now = new Date().toISOString(),
): FeedbackRevisitResponse | null {
  const existing = userState.feedbackDetailsById[request.ticketId];
  if (!existing) {
    return null;
  }

  const previousState = existing.feedbackStatus.state;
  const nextState: FeedbackStatus["state"] =
    previousState === "resolved" || previousState === "closed" ? "triaged" : "in_progress";
  const nextTicket: FeedbackTicket = {
    ...structuredClone(existing.feedbackTicket),
    updatedAt: now,
    revisitRequested: true,
  };
  const nextStatus = createFeedbackStatus(nextTicket.ticketId, nextState, existing.feedbackCategory, true, nextTicket.createdAt);
  nextStatus.processingHistory.push({
    recordedAt: now,
    actorLabel: "User Follow-up",
    actionLabel: request.userMessage ? "Revisit requested with context" : "Revisit requested",
    ...(request.userMessage ? { note: request.userMessage } : { note: "The user reopened the support loop from feedback." }),
    state: nextState,
  });

  if (existing.feedbackCategory.supportEntry?.threadId && request.userMessage) {
    sendThreadMessage(userState, {
      threadId: existing.feedbackCategory.supportEntry.threadId,
      body: `[${nextTicket.ticketId}] ${request.userMessage}`,
    });
  }

  const response = createFeedbackTicketResponse(nextTicket, existing.feedbackCategory, nextStatus);
  userState.feedbackDetailsById[request.ticketId] = response;
  userState.latestFeedbackTicketId = request.ticketId;
  return response;
}
