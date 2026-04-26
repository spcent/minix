import assert from "node:assert/strict";
import test from "node:test";

import {
  cloneUploadError,
  cloneUploadGovernance,
  cloneUploadLifecycle,
  cloneUploadProgress,
  cloneUploadTask,
  cloneUploadTransferPayload,
} from "./tasks";

test("upload progress helper preserves scalar fields", () => {
  assert.deepEqual(
    cloneUploadProgress({
      completedBytes: 256,
      totalBytes: 1024,
      percentage: 25,
    }),
    {
      completedBytes: 256,
      totalBytes: 1024,
      percentage: 25,
    },
  );
});

test("upload governance helper clones accepted file types", () => {
  const governance = {
    maxSizeBytes: 1024,
    acceptedFileTypes: ["image", "avatar"] as const,
    sensitiveReviewRequired: true,
    expiresInDays: 7,
    governanceSummary: "Images only.",
  };

  const snapshot = cloneUploadGovernance(governance);

  assert.deepEqual(snapshot, governance);
  assert.notEqual(snapshot.acceptedFileTypes, governance.acceptedFileTypes);
});

test("upload lifecycle helper preserves defined optional fields", () => {
  assert.deepEqual(
    cloneUploadLifecycle({
      backendBacked: true,
      retentionStatus: "scheduled_cleanup",
      retryCount: 1,
      canRetry: false,
      canCancel: true,
      lastTransitionAt: "2026-04-26T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
      retentionSummary: "Retained for 7 days.",
      cleanupSummary: "Cleanup queued.",
    }),
    {
      backendBacked: true,
      retentionStatus: "scheduled_cleanup",
      retryCount: 1,
      canRetry: false,
      canCancel: true,
      lastTransitionAt: "2026-04-26T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
      retentionSummary: "Retained for 7 days.",
      cleanupSummary: "Cleanup queued.",
    },
  );
});

test("upload task helper preserves optional fields and clones nested objects", () => {
  const task = {
    taskId: "task_1",
    scenario: "attachment" as const,
    fileType: "image" as const,
    stage: "uploading" as const,
    fileName: "demo.png",
    progress: {
      completedBytes: 512,
      totalBytes: 1024,
      percentage: 50,
    },
    chunkingReserved: true,
    transferMode: "chunked" as const,
    sessionId: "session_1",
    chunkCount: 4,
    uploadedChunkCount: 2,
    integrity: {
      checksumAlgorithm: "sha256" as const,
      fileChecksum: "sha256:demo",
      expectedSizeBytes: 1024,
    },
    governance: {
      maxSizeBytes: 4096,
      acceptedFileTypes: ["image", "attachment"] as const,
      sensitiveReviewRequired: true,
      expiresInDays: 7,
    },
    reviewStatus: "pending" as const,
    reviewMessage: "Review queued.",
    lifecycle: {
      backendBacked: true,
      retentionStatus: "active" as const,
      retryCount: 0,
      canRetry: true,
      canCancel: true,
    },
    ownershipSummary: "Attached to feedback.",
  };

  const snapshot = cloneUploadTask(task);

  assert.deepEqual(snapshot, task);
  assert.notEqual(snapshot.progress, task.progress);
  assert.notEqual(snapshot.governance, task.governance);
  assert.notEqual(snapshot.governance.acceptedFileTypes, task.governance.acceptedFileTypes);
  assert.notEqual(snapshot.lifecycle, task.lifecycle);
  assert.notEqual(snapshot.integrity, task.integrity);
});

test("upload error helper preserves error fields", () => {
  assert.deepEqual(
    cloneUploadError({
      code: "upload_failed",
      message: "Upload failed.",
      recoverable: true,
      retryable: true,
      stage: "failed",
    }),
    {
      code: "upload_failed",
      message: "Upload failed.",
      recoverable: true,
      retryable: true,
      stage: "failed",
    },
  );
});

test("upload transfer helper clones chunk arrays", () => {
  const transfer = {
    mode: "chunked" as const,
    checksumAlgorithm: "sha256" as const,
    fileChecksum: "sha256:demo",
    totalBytes: 1024,
    chunkSizeBytes: 512,
    chunks: [
      {
        chunkIndex: 0,
        byteOffset: 0,
        byteLength: 512,
        checksum: "sha256:chunk-0",
        checksumAlgorithm: "sha256" as const,
        dataBase64: "Zmlyc3Q=",
      },
    ],
  };

  const snapshot = cloneUploadTransferPayload(transfer);

  assert.deepEqual(snapshot, transfer);
  assert.notEqual(snapshot.chunks, transfer.chunks);
  assert.notEqual(snapshot.chunks[0], transfer.chunks[0]);
});
