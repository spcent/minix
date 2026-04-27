import type {
  ContentAuditEntry,
  ContentAuthoringData,
  ContentLifecycle,
  ContentReviewRecord,
} from "@minix/contracts";

import type { UserState } from "../../types";
import { cloneDefinedDomainFields, cloneDomainSnapshot, cloneDomainSnapshotArray } from "../snapshot";

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
    ...cloneDefinedDomainFields(lifecycle, [
      "publishedAt",
      "updatedAt",
      "offlineAt",
      "reviewMessage",
      "moderationSummary",
    ]),
  };
}

export function cloneManagedContentAuthoring(authoring: ContentAuthoringData): ContentAuthoringData {
  return {
    title: authoring.title,
    ...cloneDefinedDomainFields(authoring, ["subtitle"]),
    summary: authoring.summary,
    ...cloneDefinedDomainFields(authoring, ["bodyPreview"]),
    visibility: authoring.visibility,
    category: cloneDomainSnapshot(authoring.category),
    tags: cloneDomainSnapshotArray(authoring.tags),
    ...cloneDefinedDomainFields(authoring, ["coverAssetId"]),
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
    ...cloneDefinedDomainFields(entry, ["subtitle"]),
    summary: entry.summary,
    ...cloneDefinedDomainFields(entry, ["bodyPreview"]),
    categoryKey: entry.categoryKey,
    categoryLabel: entry.categoryLabel,
    tags: cloneDomainSnapshotArray(entry.tags),
    ...cloneDefinedDomainFields(entry, ["coverAssetId"]),
    attachments: cloneDomainSnapshotArray(entry.attachments),
    reviewRecord: cloneManagedContentReviewRecord(entry.reviewRecord),
    auditHistory: cloneManagedContentAuditHistory(entry.auditHistory),
    actorRoles: [...entry.actorRoles],
    authoring: cloneManagedContentAuthoring(entry.authoring),
  };
}
