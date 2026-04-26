import type { ContentAuditEntry, ContentReviewRecord } from "@minix/contracts";

import { cloneDomainSnapshot, cloneDomainSnapshotArray } from "../snapshot";

export function cloneManagedContentReviewRecord(reviewRecord: ContentReviewRecord): ContentReviewRecord {
  return cloneDomainSnapshot(reviewRecord);
}

export function cloneManagedContentAuditHistory(auditHistory: ContentAuditEntry[]): ContentAuditEntry[] {
  return cloneDomainSnapshotArray(auditHistory);
}
