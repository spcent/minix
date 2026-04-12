import { createHash } from "node:crypto";

import type {
  UploadAsset,
  UploadAttachRequest,
  UploadCancelRequest,
  UploadChunkReceipt,
  UploadChunkRequest,
  UploadCleanupRecord,
  UploadError,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadPipelineSource,
  UploadReference,
  UploadReviewRecord,
  UploadRetryRequest,
  UploadSelectionResult,
  UploadSession,
  UploadSessionRequest,
  UploadTask,
  UploadTransferPayload,
} from "@minix/contracts";

import type { StoredUploadRecord, UserState } from "../../types";

const DEFAULT_UPLOAD_CHUNK_SIZE_BYTES = 64 * 1024;
const REDUCED_UPLOAD_CHUNK_SIZE_BYTES = 16 * 1024;
const WEAK_NETWORK_UPLOAD_CHUNK_SIZE_BYTES = 8 * 1024;

function cloneUploadProgress(progress: UploadTask["progress"]): UploadTask["progress"] {
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

function createSyntheticTransferPayload(
  task: UploadTask,
  selectedAsset: UploadAsset,
  userState?: UserState,
): UploadTransferPayload {
  const totalBytes = selectedAsset.metadata.sizeBytes;
  const seed = `${task.scenario}:${task.fileType}:${task.fileName ?? selectedAsset.fileName}:`;
  const repeated = seed.repeat(Math.ceil(totalBytes / Math.max(seed.length, 1))).slice(0, totalBytes);
  const configuredChunkSize = resolveUploadChunkSizeBytes(userState);
  const chunkSizeBytes = Math.min(configuredChunkSize, Math.max(totalBytes, 1));
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

function resolveUploadChunkSizeBytes(userState?: UserState): number {
  const networkStrategy = userState?.settingsState?.preferences?.device?.networkStrategy ?? "balanced";
  const weakNetworkMode = userState?.settingsState?.preferences?.device?.weakNetworkMode ?? false;
  if (weakNetworkMode) {
    return WEAK_NETWORK_UPLOAD_CHUNK_SIZE_BYTES;
  }
  if (networkStrategy === "data-saver") {
    return REDUCED_UPLOAD_CHUNK_SIZE_BYTES;
  }
  return DEFAULT_UPLOAD_CHUNK_SIZE_BYTES;
}

function resolveSelectionTransfer(selection: UploadSelectionResult, userState?: UserState): UploadTransferPayload | undefined {
  if (selection.transfer) {
    return cloneUploadTransferPayload(selection.transfer);
  }
  if (!selection.uploadAsset) {
    return undefined;
  }
  return createSyntheticTransferPayload(selection.uploadTask, selection.uploadAsset, userState);
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
  userState?: UserState,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const selection = cloneUploadSelectionResult(request.selection);
  const task = cloneUploadTask(selection.uploadTask);
  const selectedAsset = selection.uploadAsset ? cloneUploadAsset(selection.uploadAsset) : undefined;
  if (!selectedAsset) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset is required to open an upload session.", "UPLOAD_ASSET_REQUIRED", now);
  }
  const transfer = resolveSelectionTransfer(selection, userState);
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
  let record = createUploadSessionRecord(request, requestUrl, undefined, now);
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
