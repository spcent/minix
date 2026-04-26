import type { UploadChunkReceipt, UploadCleanupRecord, UploadReviewRecord, UploadSession } from "@minix/contracts";

export function cloneUploadChunkReceipt(receipt: UploadChunkReceipt): UploadChunkReceipt {
  return {
    chunkIndex: receipt.chunkIndex,
    byteOffset: receipt.byteOffset,
    byteLength: receipt.byteLength,
    checksum: receipt.checksum,
    checksumAlgorithm: receipt.checksumAlgorithm,
    receivedAt: receipt.receivedAt,
  };
}

export function cloneUploadSession(session: UploadSession): UploadSession {
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

export function cloneUploadReviewRecord(reviewRecord: UploadReviewRecord): UploadReviewRecord {
  return {
    status: reviewRecord.status,
    provider: reviewRecord.provider,
    ...(reviewRecord.providerMode !== undefined ? { providerMode: reviewRecord.providerMode } : {}),
    ...(reviewRecord.storageProvider !== undefined ? { storageProvider: reviewRecord.storageProvider } : {}),
    ...(reviewRecord.reviewedAt !== undefined ? { reviewedAt: reviewRecord.reviewedAt } : {}),
    ...(reviewRecord.message !== undefined ? { message: reviewRecord.message } : {}),
    ...(reviewRecord.reasonCodes !== undefined ? { reasonCodes: [...reviewRecord.reasonCodes] } : {}),
    ...(reviewRecord.annotationSummary !== undefined ? { annotationSummary: reviewRecord.annotationSummary } : {}),
  };
}

export function cloneUploadCleanupRecord(cleanupRecord: UploadCleanupRecord): UploadCleanupRecord {
  return {
    retentionStatus: cleanupRecord.retentionStatus,
    ...(cleanupRecord.cleanupScheduledAt !== undefined ? { cleanupScheduledAt: cleanupRecord.cleanupScheduledAt } : {}),
    ...(cleanupRecord.cleanupReason !== undefined ? { cleanupReason: cleanupRecord.cleanupReason } : {}),
    referenced: cleanupRecord.referenced,
    ...(cleanupRecord.ownershipSummary !== undefined ? { ownershipSummary: cleanupRecord.ownershipSummary } : {}),
    ...(cleanupRecord.retentionSummary !== undefined ? { retentionSummary: cleanupRecord.retentionSummary } : {}),
    ...(cleanupRecord.cleanupSummary !== undefined ? { cleanupSummary: cleanupRecord.cleanupSummary } : {}),
  };
}
