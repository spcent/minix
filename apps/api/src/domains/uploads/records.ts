import type {
  UploadChunkReceipt,
  UploadCleanupRecord,
  UploadReference,
  UploadReviewRecord,
  UploadSession,
  UploadSelectionResult,
} from "@minix/contracts";

import type { StoredUploadRecord } from "../../types";
import { cloneDefinedDomainFields } from "../snapshot";
import { cloneUploadAsset } from "./assets";
import { cloneUploadError, cloneUploadTask, cloneUploadTransferPayload } from "./tasks";

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
    ...cloneDefinedDomainFields(reviewRecord, [
      "providerMode",
      "storageProvider",
      "reviewedAt",
      "message",
      "reasonCodes",
      "annotationSummary",
    ]),
  };
}

export function cloneUploadCleanupRecord(cleanupRecord: UploadCleanupRecord): UploadCleanupRecord {
  return {
    retentionStatus: cleanupRecord.retentionStatus,
    ...cloneDefinedDomainFields(cleanupRecord, ["cleanupScheduledAt", "cleanupReason"]),
    referenced: cleanupRecord.referenced,
    ...cloneDefinedDomainFields(cleanupRecord, [
      "ownershipSummary",
      "retentionSummary",
      "cleanupSummary",
    ]),
  };
}

export function cloneUploadReference(reference: UploadReference): UploadReference {
  return {
    ownerType: reference.ownerType,
    ownerId: reference.ownerId,
    role: reference.role,
    ...cloneDefinedDomainFields(reference, ["sourceContext", "actorContext"]),
    attachedAt: reference.attachedAt,
    ...cloneDefinedDomainFields(reference, ["ownerSummary"]),
  };
}

export function cloneUploadSelectionResult(selection: UploadSelectionResult): UploadSelectionResult {
  return {
    uploadTask: cloneUploadTask(selection.uploadTask),
    ...(selection.uploadAsset !== undefined ? { uploadAsset: cloneUploadAsset(selection.uploadAsset) } : {}),
    ...(selection.uploadError !== undefined ? { uploadError: cloneUploadError(selection.uploadError) } : {}),
    ...(selection.transfer !== undefined ? { transfer: cloneUploadTransferPayload(selection.transfer) } : {}),
  };
}

export function cloneStoredUploadRecord(record: StoredUploadRecord): StoredUploadRecord {
  return {
    source: record.source,
    selection: cloneUploadSelectionResult(record.selection),
    uploadTask: cloneUploadTask(record.uploadTask),
    ...(record.uploadAsset !== undefined ? { uploadAsset: cloneUploadAsset(record.uploadAsset) } : {}),
    ...(record.uploadError !== undefined ? { uploadError: cloneUploadError(record.uploadError) } : {}),
    ...(record.transfer !== undefined ? { transfer: cloneUploadTransferPayload(record.transfer) } : {}),
    ...(record.session !== undefined ? { session: cloneUploadSession(record.session) } : {}),
    ...(record.receivedChunk !== undefined ? { receivedChunk: cloneUploadChunkReceipt(record.receivedChunk) } : {}),
    ...(record.reviewRecord !== undefined ? { reviewRecord: cloneUploadReviewRecord(record.reviewRecord) } : {}),
    ...(record.cleanupRecord !== undefined ? { cleanupRecord: cloneUploadCleanupRecord(record.cleanupRecord) } : {}),
    references: record.references.map(cloneUploadReference),
    chunksByIndex: Object.fromEntries(
      Object.entries(record.chunksByIndex).map(([key, value]) => [key, cloneUploadChunkReceipt(value)]),
    ),
    binaryByChunkIndex: { ...record.binaryByChunkIndex },
    ...cloneDefinedDomainFields(record, ["binaryObjectKey"]),
  };
}
