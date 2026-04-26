import assert from "node:assert/strict";
import test from "node:test";

import { cloneUploadGovernance, cloneUploadLifecycle, cloneUploadProgress } from "./tasks";

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
