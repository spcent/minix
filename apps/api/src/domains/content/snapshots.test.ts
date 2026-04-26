import assert from "node:assert/strict";
import test from "node:test";

import type { ContentAuthoringData, ContentLifecycle } from "@minix/contracts";

import {
  cloneManagedContentAuditHistory,
  cloneManagedContentAuthoring,
  cloneManagedContentEntry,
  cloneManagedContentLifecycle,
  cloneManagedContentReviewRecord,
} from "./snapshots";
import type { ManagedContentEntrySnapshot } from "./snapshots";

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
  const lifecycle: ContentLifecycle = {
    state: "under_review" as const,
    availableActions: ["approve_review", "reject_review", "change_visibility"],
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
  const authoring: ContentAuthoringData = {
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

test("managed content entry snapshot helper clones nested runtime state", () => {
  const entry: ManagedContentEntrySnapshot = {
    authorUserId: "author_1",
    model: "article" as const,
    visibility: "public" as const,
    lifecycle: {
      state: "published" as const,
      availableActions: ["update", "archive", "delete", "change_visibility"],
      publishedAt: "2026-04-25T00:00:00.000Z",
      updatedAt: "2026-04-26T00:00:00.000Z",
    },
    authorLabel: "MiniX Author",
    title: "Published article",
    subtitle: "Article subtitle",
    summary: "Article summary",
    bodyPreview: "Article preview",
    categoryKey: "article",
    categoryLabel: "Article",
    tags: [{ key: "lesson", label: "Lesson" }],
    coverAssetId: "asset_cover",
    attachments: [
      {
        assetId: "asset_1",
        kind: "attachment" as const,
        label: "Attachment 1",
        url: "https://example.test/asset_1",
      },
    ],
    reviewRecord: {
      reviewId: "review_1",
      status: "approved" as const,
      queueLabel: "Editorial review",
      decidedAt: "2026-04-26T00:00:00.000Z",
    },
    auditHistory: [
      {
        auditId: "audit_1",
        action: "publish" as const,
        actorRole: "reviewer" as const,
        actorLabel: "Reviewer Mina",
        createdAt: "2026-04-26T00:00:00.000Z",
        message: "Published.",
      },
    ],
    actorRoles: ["author", "reviewer", "admin", "reader"],
    authoring: {
      title: "Published article",
      summary: "Article summary",
      visibility: "public" as const,
      category: { key: "article", label: "Article" },
      tags: [{ key: "lesson", label: "Lesson" }],
      attachmentAssetIds: ["asset_1"],
    },
  };

  const snapshot = cloneManagedContentEntry(entry);

  assert.deepEqual(snapshot, entry);
  assert.notEqual(snapshot.lifecycle, entry.lifecycle);
  assert.notEqual(snapshot.lifecycle.availableActions, entry.lifecycle.availableActions);
  assert.notEqual(snapshot.tags, entry.tags);
  assert.notEqual(snapshot.tags[0], entry.tags[0]);
  assert.notEqual(snapshot.attachments, entry.attachments);
  assert.notEqual(snapshot.attachments[0], entry.attachments[0]);
  assert.notEqual(snapshot.reviewRecord, entry.reviewRecord);
  assert.notEqual(snapshot.auditHistory, entry.auditHistory);
  assert.notEqual(snapshot.auditHistory[0], entry.auditHistory[0]);
  assert.notEqual(snapshot.actorRoles, entry.actorRoles);
  assert.notEqual(snapshot.authoring, entry.authoring);
  assert.notEqual(snapshot.authoring.category, entry.authoring.category);
});

test("managed content snapshot helpers omit absent optional fields", () => {
  const lifecycle: ContentLifecycle = {
    state: "draft",
    availableActions: ["publish"],
  };
  const authoring: ContentAuthoringData = {
    title: "Draft",
    summary: "Draft summary",
    visibility: "public",
    category: { key: "draft", label: "Draft" },
    tags: [],
    attachmentAssetIds: [],
  };

  const lifecycleSnapshot = cloneManagedContentLifecycle(lifecycle);
  const authoringSnapshot = cloneManagedContentAuthoring(authoring);

  assert.equal("publishedAt" in lifecycleSnapshot, false);
  assert.equal("updatedAt" in lifecycleSnapshot, false);
  assert.equal("offlineAt" in lifecycleSnapshot, false);
  assert.equal("reviewMessage" in lifecycleSnapshot, false);
  assert.equal("moderationSummary" in lifecycleSnapshot, false);
  assert.equal("subtitle" in authoringSnapshot, false);
  assert.equal("bodyPreview" in authoringSnapshot, false);
  assert.equal("coverAssetId" in authoringSnapshot, false);
});
