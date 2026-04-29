import type {
  UploadAsset,
  UploadCleanupRecord,
  UploadReference,
  UploadTask,
} from "@minix/contracts";

import type { StoredUploadRecord } from "../../types";
import { createUploadAssetVariant } from "./assets";

function formatAcceptedFileTypes(fileTypes: UploadTask["governance"]["acceptedFileTypes"]): string {
  if (fileTypes.length === 0) {
    return "configured asset types";
  }
  if (fileTypes.length === 1) {
    return fileTypes[0] ?? "configured asset type";
  }
  if (fileTypes.length === 2) {
    return `${fileTypes[0] ?? "configured asset type"} and ${fileTypes[1] ?? "configured asset type"}`;
  }
  const lastFileType = fileTypes[fileTypes.length - 1] ?? "configured asset type";
  return `${fileTypes.slice(0, -1).join(", ")}, and ${lastFileType}`;
}

function createUploadGovernanceSummary(task: UploadTask): string {
  const sizeLimitMb = Math.round((task.governance.maxSizeBytes / (1024 * 1024)) * 10) / 10;
  const reviewClause = task.governance.sensitiveReviewRequired
    ? "Sensitive review remains enabled for this upload flow."
    : "No additional sensitive review is required for this upload flow.";
  const retentionClause =
    task.governance.expiresInDays !== undefined
      ? `Retention expires after ${task.governance.expiresInDays} days unless a business reference keeps the asset active.`
      : "Retention remains active until the business flow clears the asset.";
  return `Upload accepts ${formatAcceptedFileTypes(task.governance.acceptedFileTypes)} up to ${sizeLimitMb} MB. ${reviewClause} ${retentionClause}`;
}

function createUploadOwnershipSummary(references: UploadReference[]): string {
  if (references.length === 0) {
    return "Asset ownership is not yet bound to a business record.";
  }
  const [primaryReference, ...rest] = references;
  if (!primaryReference) {
    return "Asset ownership is not yet bound to a business record.";
  }
  return rest.length > 0
    ? `Asset is bound to ${primaryReference.ownerType} ${primaryReference.ownerId} as ${primaryReference.role}, plus ${rest.length} additional reference${rest.length === 1 ? "" : "s"}.`
    : `Asset is bound to ${primaryReference.ownerType} ${primaryReference.ownerId} as ${primaryReference.role}.`;
}

function createUploadReferenceOwnerSummary(reference: UploadReference): string {
  const sourceLabel = reference.sourceContext?.label ?? reference.sourceContext?.routeId ?? reference.sourceContext?.pagePath;
  return sourceLabel
    ? `${reference.ownerType} ${reference.ownerId} uses this asset as ${reference.role} from ${sourceLabel}.`
    : `${reference.ownerType} ${reference.ownerId} uses this asset as ${reference.role}.`;
}

function createUploadRetentionSummary(task: UploadTask, cleanupRecord?: UploadCleanupRecord): string {
  if (task.lifecycle.retentionStatus === "expired") {
    return cleanupRecord?.cleanupScheduledAt
      ? `Retention expired and cleanup completed after ${cleanupRecord.cleanupScheduledAt}.`
      : "Retention expired and the upload is no longer active.";
  }
  if (task.lifecycle.retentionStatus === "scheduled_cleanup") {
    return cleanupRecord?.cleanupScheduledAt
      ? `Retention is scheduled for cleanup at ${cleanupRecord.cleanupScheduledAt}.`
      : "Retention is scheduled for cleanup.";
  }
  if (task.lifecycle.expiresAt) {
    return `Retention remains active until ${task.lifecycle.expiresAt} unless the asset is cleaned earlier.`;
  }
  return "Retention remains active for this upload.";
}

function createUploadCleanupSummary(cleanupRecord: UploadCleanupRecord | undefined, task: UploadTask): string {
  if (cleanupRecord?.retentionStatus === "scheduled_cleanup") {
    const scheduledAt = cleanupRecord.cleanupScheduledAt
      ? ` Cleanup is queued for ${cleanupRecord.cleanupScheduledAt}.`
      : " Cleanup is queued.";
    const reason = cleanupRecord.cleanupReason ? ` Reason: ${cleanupRecord.cleanupReason}.` : "";
    return `Cleanup is pending for this upload.${scheduledAt}${reason}`;
  }
  if (cleanupRecord?.retentionStatus === "expired") {
    return "Cleanup completed and the upload has expired.";
  }
  if (task.lifecycle.canCancel) {
    return "Cleanup is not scheduled while the upload remains active or under review.";
  }
  return "Cleanup is idle until retention changes or the asset loses its references.";
}

function createDerivedAssetVariants(asset: UploadAsset): NonNullable<UploadAsset["metadata"]["variants"]> {
  const variants: NonNullable<UploadAsset["metadata"]["variants"]> = [
    createUploadAssetVariant({
      kind: "original",
      url: asset.url,
      label: "Original asset",
      width: asset.metadata.width,
      height: asset.metadata.height,
      durationSeconds: asset.metadata.durationSeconds,
      pageCount: asset.metadata.pageCount,
    }),
  ];

  if (asset.thumbnailUrl) {
    variants.push(createUploadAssetVariant({
      kind: "thumbnail",
      url: asset.thumbnailUrl,
      label: "Thumbnail",
      width: asset.metadata.width !== undefined ? Math.max(1, Math.round(asset.metadata.width / 4)) : undefined,
      height: asset.metadata.height !== undefined ? Math.max(1, Math.round(asset.metadata.height / 4)) : undefined,
    }));
  }

  if (asset.coverImageUrl) {
    variants.push(createUploadAssetVariant({
      kind: "cover",
      url: asset.coverImageUrl,
      label: "Cover image",
      width: asset.metadata.width,
      height: asset.metadata.height,
    }));
  }

  return variants;
}

function createUploadReviewAnnotations(record: StoredUploadRecord): string[] {
  const annotations: string[] = [`Review status: ${record.uploadTask.reviewStatus}.`];
  if (record.reviewRecord?.provider) {
    annotations.push(`Provider: ${record.reviewRecord.provider}.`);
  }
  if (record.reviewRecord?.message) {
    annotations.push(record.reviewRecord.message);
  }
  if (record.reviewRecord?.reasonCodes?.length) {
    annotations.push(`Reason codes: ${record.reviewRecord.reasonCodes.join(", ")}.`);
  }
  if (record.cleanupRecord?.cleanupReason) {
    annotations.push(`Cleanup reason: ${record.cleanupRecord.cleanupReason}.`);
  }
  return annotations;
}

function createDerivedAssetSummary(asset: UploadAsset): string {
  const variantCount = asset.metadata.variants?.length ?? 0;
  const physicalSummary =
    asset.metadata.width !== undefined && asset.metadata.height !== undefined
      ? `Primary dimensions are ${asset.metadata.width}x${asset.metadata.height}.`
      : asset.metadata.durationSeconds !== undefined
        ? `Primary duration is ${asset.metadata.durationSeconds} seconds.`
        : asset.metadata.pageCount !== undefined
          ? `Primary document length is ${asset.metadata.pageCount} pages.`
          : "Primary asset metadata is file-level only.";
  return variantCount > 0
    ? `${variantCount} derived asset variant${variantCount === 1 ? "" : "s"} are available. ${physicalSummary}`
    : physicalSummary;
}

export function synchronizeUploadRecordSummaries(record: StoredUploadRecord) {
  const ownershipSummary = createUploadOwnershipSummary(record.references);
  record.uploadTask.governance.governanceSummary = createUploadGovernanceSummary(record.uploadTask);
  record.uploadTask.ownershipSummary = ownershipSummary;
  record.uploadTask.lifecycle.retentionSummary = createUploadRetentionSummary(record.uploadTask, record.cleanupRecord);
  record.uploadTask.lifecycle.cleanupSummary = createUploadCleanupSummary(record.cleanupRecord, record.uploadTask);

  record.references = record.references.map((reference) => ({
    ...reference,
    ownerSummary: createUploadReferenceOwnerSummary(reference),
  }));

  if (record.cleanupRecord) {
    record.cleanupRecord.ownershipSummary = ownershipSummary;
    record.cleanupRecord.retentionSummary = createUploadRetentionSummary(record.uploadTask, record.cleanupRecord);
    record.cleanupRecord.cleanupSummary = createUploadCleanupSummary(record.cleanupRecord, record.uploadTask);
  }

  const reviewAnnotations = createUploadReviewAnnotations(record);
  if (record.reviewRecord) {
    if (reviewAnnotations.length > 0) {
      record.reviewRecord.annotationSummary = reviewAnnotations.join(" ");
    } else {
      delete record.reviewRecord.annotationSummary;
    }
  }

  if (record.uploadAsset) {
    record.uploadAsset.ownershipSummary = ownershipSummary;
    record.uploadAsset.metadata.variants = createDerivedAssetVariants(record.uploadAsset);
    if (reviewAnnotations.length > 0) {
      record.uploadAsset.metadata.reviewAnnotations = reviewAnnotations;
    } else {
      delete record.uploadAsset.metadata.reviewAnnotations;
    }
    record.uploadAsset.derivedAssetSummary = createDerivedAssetSummary(record.uploadAsset);
  }
}

export function updateUploadRetention(record: StoredUploadRecord, input: {
  retentionStatus: UploadCleanupRecord["retentionStatus"];
  referenced?: boolean;
  cleanupReason?: string;
  cleanupScheduledAt?: string;
}) {
  record.uploadTask.lifecycle.retentionStatus = input.retentionStatus;
  record.cleanupRecord = {
    retentionStatus: input.retentionStatus,
    ...(input.cleanupScheduledAt ? { cleanupScheduledAt: input.cleanupScheduledAt } : {}),
    ...(input.cleanupReason ? { cleanupReason: input.cleanupReason } : {}),
    referenced: input.referenced ?? record.cleanupRecord?.referenced ?? false,
  };
  synchronizeUploadRecordSummaries(record);
}
