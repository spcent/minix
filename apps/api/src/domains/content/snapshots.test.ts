import assert from "node:assert/strict";
import test from "node:test";

import {
  cloneManagedContentAuditHistory,
  cloneManagedContentAuthoring,
  cloneManagedContentLifecycle,
  cloneManagedContentReviewRecord,
} from "./snapshots";

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

test("managed content lifecycle snapshot helper clones action arrays", () => {
  const lifecycle = {
    state: "under_review" as const,
    availableActions: ["approve_review", "reject_review", "change_visibility"] as const,
    publishedAt: "2026-04-25T00:00:00.000Z",
    updatedAt: "2026-04-26T00:00:00.000Z",
    offlineAt: "2026-04-27T00:00:00.000Z",
    reviewMessage: "Review pending.",
    moderationSummary: "Queued for review.",
  };

  const snapshot = cloneManagedContentLifecycle(lifecycle);

  assert.deepEqual(snapshot, lifecycle);
  assert.notEqual(snapshot.availableActions, lifecycle.availableActions);
});

test("managed content authoring snapshot helper clones nested facets and attachments", () => {
  const authoring = {
    title: "Draft",
    subtitle: "Draft subtitle",
    summary: "Draft summary",
    bodyPreview: "Draft body preview",
    visibility: "member_only" as const,
    category: { key: "course", label: "Course" },
    tags: [{ key: "lesson", label: "Lesson" }],
    coverAssetId: "asset_cover",
    attachmentAssetIds: ["asset_1"],
  };

  const snapshot = cloneManagedContentAuthoring(authoring);

  assert.deepEqual(snapshot, authoring);
  assert.notEqual(snapshot.category, authoring.category);
  assert.notEqual(snapshot.tags, authoring.tags);
  assert.notEqual(snapshot.tags[0], authoring.tags[0]);
  assert.notEqual(snapshot.attachmentAssetIds, authoring.attachmentAssetIds);
});
