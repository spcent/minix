import assert from "node:assert/strict";
import test from "node:test";

import type { StoredUploadRecord } from "../../types";
import {
  cloneUploadChunkReceipt,
  cloneUploadCleanupRecord,
  cloneUploadReference,
  cloneUploadReviewRecord,
  cloneUploadSession,
  cloneStoredUploadRecord,
} from "./records";

test("upload chunk receipt helper preserves receipt fields", () => {
  assert.deepEqual(
    cloneUploadChunkReceipt({
      chunkIndex: 1,
      byteOffset: 512,
      byteLength: 512,
      checksum: "sha256:chunk-1",
      checksumAlgorithm: "sha256",
      receivedAt: "2026-04-26T00:00:00.000Z",
    }),
    {
      chunkIndex: 1,
      byteOffset: 512,
      byteLength: 512,
      checksum: "sha256:chunk-1",
      checksumAlgorithm: "sha256",
      receivedAt: "2026-04-26T00:00:00.000Z",
    },
  );
});

test("upload session helper preserves session fields", () => {
  assert.deepEqual(
    cloneUploadSession({
      sessionId: "session_1",
      uploadToken: "token_1",
      objectKey: "object/asset_1",
      mode: "chunked",
      checksumAlgorithm: "sha256",
      chunkSizeBytes: 512,
      chunkCount: 2,
      receivedChunkCount: 1,
      nextChunkIndex: 1,
      resumeSupported: true,
      createdAt: "2026-04-26T00:00:00.000Z",
      expiresAt: "2026-04-27T00:00:00.000Z",
    }),
    {
      sessionId: "session_1",
      uploadToken: "token_1",
      objectKey: "object/asset_1",
      mode: "chunked",
      checksumAlgorithm: "sha256",
      chunkSizeBytes: 512,
      chunkCount: 2,
      receivedChunkCount: 1,
      nextChunkIndex: 1,
      resumeSupported: true,
      createdAt: "2026-04-26T00:00:00.000Z",
      expiresAt: "2026-04-27T00:00:00.000Z",
    },
  );
});

test("upload review record helper clones reason codes", () => {
  const reviewRecord = {
    status: "rejected" as const,
    provider: "sample-review",
    providerMode: "sample" as const,
    storageProvider: "sample-storage",
    reviewedAt: "2026-04-26T00:00:00.000Z",
    message: "Rejected by policy.",
    reasonCodes: ["blocked", "sensitive"],
    annotationSummary: "2 reasons.",
  };

  const snapshot = cloneUploadReviewRecord(reviewRecord);

  assert.deepEqual(snapshot, reviewRecord);
  assert.notEqual(snapshot.reasonCodes, reviewRecord.reasonCodes);
});

test("upload cleanup record helper preserves optional retention fields", () => {
  assert.deepEqual(
    cloneUploadCleanupRecord({
      retentionStatus: "scheduled_cleanup",
      cleanupScheduledAt: "2026-05-03T00:00:00.000Z",
      cleanupReason: "No references remain.",
      referenced: false,
      ownershipSummary: "No owner.",
      retentionSummary: "Retained for 7 days.",
      cleanupSummary: "Cleanup queued.",
    }),
    {
      retentionStatus: "scheduled_cleanup",
      cleanupScheduledAt: "2026-05-03T00:00:00.000Z",
      cleanupReason: "No references remain.",
      referenced: false,
      ownershipSummary: "No owner.",
      retentionSummary: "Retained for 7 days.",
      cleanupSummary: "Cleanup queued.",
    },
  );
});

test("upload reference helper clones source and actor context snapshots", () => {
  const reference = {
    ownerType: "feedback" as const,
    ownerId: "ticket_1",
    role: "attachment",
    sourceContext: {
      pagePath: "/feedback",
      routeId: "feedback.form",
      params: { ticketId: "ticket_1" },
    },
    actorContext: {
      userId: "user_1",
      platform: "h5",
      appVersion: "1.0.0",
    },
    attachedAt: "2026-04-26T00:00:00.000Z",
    ownerSummary: "Attached to feedback ticket ticket_1.",
  };

  const snapshot = cloneUploadReference(reference);

  assert.deepEqual(snapshot, reference);
  assert.notEqual(snapshot.sourceContext, reference.sourceContext);
  assert.notEqual(snapshot.actorContext, reference.actorContext);
});

test("stored upload record helper clones nested collections and maps", () => {
  const uploadTask = {
    taskId: "task_1",
    scenario: "attachment" as const,
    fileType: "image" as const,
    stage: "uploading" as const,
    progress: {
      completedBytes: 512,
      totalBytes: 1024,
      percentage: 50,
    },
    chunkingReserved: true,
    governance: {
      maxSizeBytes: 4096,
      acceptedFileTypes: ["image"] as const,
      sensitiveReviewRequired: true,
    },
    reviewStatus: "pending" as const,
    lifecycle: {
      backendBacked: true,
      retentionStatus: "active" as const,
      retryCount: 0,
      canRetry: true,
      canCancel: true,
    },
  };
  const chunk = {
    chunkIndex: 0,
    byteOffset: 0,
    byteLength: 512,
    checksum: "sha256:chunk-0",
    checksumAlgorithm: "sha256" as const,
    receivedAt: "2026-04-26T00:00:00.000Z",
  };
  const record: StoredUploadRecord = {
    source: "backend_chunk",
    selection: { uploadTask },
    uploadTask,
    receivedChunk: chunk,
    references: [
      {
        ownerType: "feedback",
        ownerId: "ticket_1",
        role: "attachment",
        attachedAt: "2026-04-26T00:00:00.000Z",
      },
    ],
    chunksByIndex: { "0": chunk },
    binaryByChunkIndex: { "0": "Zmlyc3Q=" },
    binaryObjectKey: "object/asset_1",
  };

  const snapshot = cloneStoredUploadRecord(record);

  assert.deepEqual(snapshot, record);
  assert.notEqual(snapshot.selection, record.selection);
  assert.notEqual(snapshot.uploadTask, record.uploadTask);
  assert.notEqual(snapshot.receivedChunk, record.receivedChunk);
  assert.notEqual(snapshot.references, record.references);
  assert.notEqual(snapshot.references[0], record.references[0]);
  assert.notEqual(snapshot.chunksByIndex, record.chunksByIndex);
  assert.notEqual(snapshot.chunksByIndex["0"], record.chunksByIndex["0"]);
  assert.notEqual(snapshot.binaryByChunkIndex, record.binaryByChunkIndex);
});
