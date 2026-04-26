import type {
  ContentAuditEntry,
  ContentAuthoringData,
  ContentLifecycle,
  ContentReviewRecord,
} from "@minix/contracts";

import { cloneDomainSnapshot, cloneDomainSnapshotArray } from "../snapshot";

export function cloneManagedContentReviewRecord(reviewRecord: ContentReviewRecord): ContentReviewRecord {
  return cloneDomainSnapshot(reviewRecord);
}

export function cloneManagedContentAuditHistory(auditHistory: ContentAuditEntry[]): ContentAuditEntry[] {
  return cloneDomainSnapshotArray(auditHistory);
}

export function cloneManagedContentLifecycle(lifecycle: ContentLifecycle): ContentLifecycle {
  return {
    state: lifecycle.state,
    availableActions: [...lifecycle.availableActions],
    ...(lifecycle.publishedAt !== undefined ? { publishedAt: lifecycle.publishedAt } : {}),
    ...(lifecycle.updatedAt !== undefined ? { updatedAt: lifecycle.updatedAt } : {}),
    ...(lifecycle.offlineAt !== undefined ? { offlineAt: lifecycle.offlineAt } : {}),
    ...(lifecycle.reviewMessage !== undefined ? { reviewMessage: lifecycle.reviewMessage } : {}),
    ...(lifecycle.moderationSummary !== undefined ? { moderationSummary: lifecycle.moderationSummary } : {}),
  };
}

export function cloneManagedContentAuthoring(authoring: ContentAuthoringData): ContentAuthoringData {
  return {
    title: authoring.title,
    ...(authoring.subtitle !== undefined ? { subtitle: authoring.subtitle } : {}),
    summary: authoring.summary,
    ...(authoring.bodyPreview !== undefined ? { bodyPreview: authoring.bodyPreview } : {}),
    visibility: authoring.visibility,
    category: cloneDomainSnapshot(authoring.category),
    tags: cloneDomainSnapshotArray(authoring.tags),
    ...(authoring.coverAssetId !== undefined ? { coverAssetId: authoring.coverAssetId } : {}),
    attachmentAssetIds: [...authoring.attachmentAssetIds],
  };
}
