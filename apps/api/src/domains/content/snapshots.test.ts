import assert from "node:assert/strict";
import test from "node:test";

import { cloneManagedContentAuditHistory, cloneManagedContentReviewRecord } from "./snapshots";

test("managed content review snapshot helper clones review records", () => {
  const reviewRecord = {
    reviewId: "review_1",
    status: "queued" as const,
    queueLabel: "Editorial review",
    reviewerLabel: "Reviewer Mina",
    submittedAt: "2026-04-26T00:00:00.000Z",
    assignedAt: "2026-04-26T00:01:00.000Z",
    message: "Waiting for review.",
    moderationSummary: "Queued for editorial review.",
  };

  const snapshot = cloneManagedContentReviewRecord(reviewRecord);

  assert.deepEqual(snapshot, reviewRecord);
  assert.notEqual(snapshot, reviewRecord);
});

test("managed content audit history snapshot helper clones arrays and entries", () => {
  const auditHistory = [
    {
      auditId: "audit_1",
      action: "create" as const,
      actorRole: "author" as const,
      actorLabel: "MiniX Author",
      createdAt: "2026-04-26T00:00:00.000Z",
      message: "Draft created.",
    },
  ];

  const snapshot = cloneManagedContentAuditHistory(auditHistory);

  assert.deepEqual(snapshot, auditHistory);
  assert.notEqual(snapshot, auditHistory);
  assert.notEqual(snapshot[0], auditHistory[0]);
});
