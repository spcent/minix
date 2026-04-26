import type {
  ContentAuditEntry,
  ContentAuthoringData,
  ContentLifecycle,
  ContentReviewRecord,
} from "@minix/contracts";

import type { UserState } from "../../types";
import { cloneDomainSnapshot, cloneDomainSnapshotArray } from "../snapshot";

export type ManagedContentEntrySnapshot = NonNullable<UserState["managedContentById"]>[string];

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

export function cloneManagedContentEntry(entry: ManagedContentEntrySnapshot): ManagedContentEntrySnapshot {
  return {
    authorUserId: entry.authorUserId,
    model: entry.model,
    visibility: entry.visibility,
    lifecycle: cloneManagedContentLifecycle(entry.lifecycle),
    authorLabel: entry.authorLabel,
    title: entry.title,
    ...(entry.subtitle !== undefined ? { subtitle: entry.subtitle } : {}),
    summary: entry.summary,
    ...(entry.bodyPreview !== undefined ? { bodyPreview: entry.bodyPreview } : {}),
    categoryKey: entry.categoryKey,
    categoryLabel: entry.categoryLabel,
    tags: cloneDomainSnapshotArray(entry.tags),
    ...(entry.coverAssetId !== undefined ? { coverAssetId: entry.coverAssetId } : {}),
    attachments: cloneDomainSnapshotArray(entry.attachments),
    reviewRecord: cloneManagedContentReviewRecord(entry.reviewRecord),
    auditHistory: cloneManagedContentAuditHistory(entry.auditHistory),
    actorRoles: [...entry.actorRoles],
    authoring: cloneManagedContentAuthoring(entry.authoring),
  };
}
