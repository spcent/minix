import type { UploadAsset, UploadPipelineRequest } from "@minix/contracts";
import { z } from "zod";

const uploadProgressSchema = z.object({
  completedBytes: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative(),
  percentage: z.number().int().min(0).max(100),
});

const uploadGovernanceSchema = z.object({
  maxSizeBytes: z.number().int().positive(),
  acceptedFileTypes: z.array(z.enum(["image", "audio", "video", "pdf", "avatar", "attachment"])),
  sensitiveReviewRequired: z.boolean(),
  expiresInDays: z.number().int().positive().optional(),
  governanceSummary: z.string().min(1).optional(),
});

const uploadLifecycleSchema = z.object({
  backendBacked: z.boolean(),
  retentionStatus: z.enum(["active", "scheduled_cleanup", "expired"]),
  retryCount: z.number().int().nonnegative(),
  canRetry: z.boolean(),
  canCancel: z.boolean(),
  lastTransitionAt: z.string().min(1).optional(),
  expiresAt: z.string().min(1).optional(),
  retentionSummary: z.string().min(1).optional(),
  cleanupSummary: z.string().min(1).optional(),
});

const uploadDerivedAssetVariantSchema = z.object({
  kind: z.enum(["original", "thumbnail", "cover", "preview"]),
  url: z.string().min(1),
  label: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationSeconds: z.number().positive().optional(),
  pageCount: z.number().int().positive().optional(),
});

export const uploadAssetSchema = z.object({
  assetId: z.string().min(1),
  fileType: z.enum(["image", "audio", "video", "pdf", "avatar", "attachment"]),
  fileName: z.string().min(1),
  url: z.string().min(1),
  thumbnailUrl: z.string().min(1).optional(),
  coverImageUrl: z.string().min(1).optional(),
  metadata: z.object({
    sizeBytes: z.number().int().nonnegative(),
    mimeType: z.string().min(1).optional(),
    checksum: z.string().min(1).optional(),
    checksumAlgorithm: z.enum(["sha256"]).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    durationSeconds: z.number().positive().optional(),
    pageCount: z.number().int().positive().optional(),
    variants: z.array(uploadDerivedAssetVariantSchema).optional(),
    reviewAnnotations: z.array(z.string().min(1)).optional(),
  }),
  derivedAssetSummary: z.string().min(1).optional(),
  ownershipSummary: z.string().min(1).optional(),
});

const uploadTaskSchema = z.object({
  taskId: z.string().min(1),
  scenario: z.enum(["content", "avatar", "attachment"]),
  fileType: z.enum(["image", "audio", "video", "pdf", "avatar", "attachment"]),
  stage: z.enum(["idle", "choosing", "compressing", "chunking_reserved", "uploading", "reviewing", "completed", "failed", "canceled"]),
  fileName: z.string().min(1).optional(),
  progress: uploadProgressSchema,
  uploadedChunkCount: z.number().int().nonnegative().optional(),
  chunkingReserved: z.boolean(),
  governance: uploadGovernanceSchema,
  reviewStatus: z.enum(["not_required", "pending", "approved", "rejected"]),
  reviewMessage: z.string().min(1).optional(),
  lifecycle: uploadLifecycleSchema,
  ownershipSummary: z.string().min(1).optional(),
});

const uploadErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  recoverable: z.boolean(),
  retryable: z.boolean(),
  stage: z.enum(["idle", "choosing", "compressing", "chunking_reserved", "uploading", "reviewing", "completed", "failed", "canceled"]),
});

export const uploadSelectionResultSchema = z.object({
  uploadTask: uploadTaskSchema,
  uploadAsset: uploadAssetSchema.optional(),
  uploadError: uploadErrorSchema.optional(),
  transfer: z
    .object({
      mode: z.enum(["single_part", "chunked"]),
      checksumAlgorithm: z.enum(["sha256"]),
      fileChecksum: z.string().min(1),
      totalBytes: z.number().int().nonnegative(),
      chunkSizeBytes: z.number().int().positive(),
      chunks: z.array(
        z.object({
          chunkIndex: z.number().int().nonnegative(),
          byteOffset: z.number().int().nonnegative(),
          byteLength: z.number().int().nonnegative(),
          checksum: z.string().min(1),
          checksumAlgorithm: z.enum(["sha256"]),
          dataBase64: z.string().min(1),
        }),
      ),
    })
    .optional(),
});

export const uploadSessionRequestSchema = z.object({
  scenario: z.enum(["content", "avatar", "attachment"]),
  selection: uploadSelectionResultSchema,
});

export const uploadChunkRequestSchema = z.object({
  taskId: z.string().min(1),
  sessionId: z.string().min(1),
  chunk: z.object({
    chunkIndex: z.number().int().nonnegative(),
    byteOffset: z.number().int().nonnegative(),
    byteLength: z.number().int().nonnegative(),
    checksum: z.string().min(1),
    checksumAlgorithm: z.enum(["sha256"]),
    dataBase64: z.string().min(1),
  }),
});

export const uploadCompleteSchema = z.object({
  taskId: z.string().min(1),
  sessionId: z.string().min(1),
  fileChecksum: z.string().min(1),
  checksumAlgorithm: z.enum(["sha256"]),
});

export const uploadAttachSchema = z
  .object({
    taskId: z.string().min(1).optional(),
    assetId: z.string().min(1).optional(),
    reference: z.object({
      ownerType: z.enum(["feedback", "content", "avatar"]),
      ownerId: z.string().min(1),
      role: z.string().min(1),
      sourceContext: z
        .object({
          pagePath: z.string().min(1).optional(),
          routeId: z.string().min(1).optional(),
          label: z.string().min(1).optional(),
          params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
        })
        .optional(),
      actorContext: z
        .object({
          userId: z.string().min(1).optional(),
          platform: z.string().min(1).optional(),
          appVersion: z.string().min(1).optional(),
          deviceSummary: z.string().min(1).optional(),
        })
        .optional(),
    }),
  })
  .refine((value) => Boolean(value.taskId || value.assetId), {
    message: "Either taskId or assetId is required.",
    path: ["taskId"],
  });

export const uploadRetrySchema = z.object({
  taskId: z.string().min(1),
});

export const uploadCancelSchema = z.object({
  taskId: z.string().min(1),
  reason: z.string().min(1).optional(),
});

export function normalizeUploadAsset(asset: z.infer<typeof uploadAssetSchema>): UploadAsset {
  return {
    assetId: asset.assetId,
    fileType: asset.fileType,
    fileName: asset.fileName,
    url: asset.url,
    ...(asset.thumbnailUrl !== undefined ? { thumbnailUrl: asset.thumbnailUrl } : {}),
    ...(asset.coverImageUrl !== undefined ? { coverImageUrl: asset.coverImageUrl } : {}),
    metadata: {
      sizeBytes: asset.metadata.sizeBytes,
      ...(asset.metadata.mimeType !== undefined ? { mimeType: asset.metadata.mimeType } : {}),
      ...(asset.metadata.checksum !== undefined ? { checksum: asset.metadata.checksum } : {}),
      ...(asset.metadata.checksumAlgorithm !== undefined ? { checksumAlgorithm: asset.metadata.checksumAlgorithm } : {}),
      ...(asset.metadata.width !== undefined ? { width: asset.metadata.width } : {}),
      ...(asset.metadata.height !== undefined ? { height: asset.metadata.height } : {}),
      ...(asset.metadata.durationSeconds !== undefined ? { durationSeconds: asset.metadata.durationSeconds } : {}),
      ...(asset.metadata.pageCount !== undefined ? { pageCount: asset.metadata.pageCount } : {}),
      ...(asset.metadata.variants !== undefined
        ? {
            variants: asset.metadata.variants.map((variant) => ({
              kind: variant.kind,
              url: variant.url,
              label: variant.label,
              ...(variant.width !== undefined ? { width: variant.width } : {}),
              ...(variant.height !== undefined ? { height: variant.height } : {}),
              ...(variant.durationSeconds !== undefined ? { durationSeconds: variant.durationSeconds } : {}),
              ...(variant.pageCount !== undefined ? { pageCount: variant.pageCount } : {}),
            })),
          }
        : {}),
      ...(asset.metadata.reviewAnnotations !== undefined ? { reviewAnnotations: asset.metadata.reviewAnnotations } : {}),
    },
    ...(asset.derivedAssetSummary !== undefined ? { derivedAssetSummary: asset.derivedAssetSummary } : {}),
    ...(asset.ownershipSummary !== undefined ? { ownershipSummary: asset.ownershipSummary } : {}),
  };
}

export function normalizeUploadSelectionResult(payload: z.infer<typeof uploadSelectionResultSchema>) {
  return {
    uploadTask: {
      taskId: payload.uploadTask.taskId,
      scenario: payload.uploadTask.scenario,
      fileType: payload.uploadTask.fileType,
      stage: payload.uploadTask.stage,
      ...(payload.uploadTask.fileName !== undefined ? { fileName: payload.uploadTask.fileName } : {}),
      progress: {
        completedBytes: payload.uploadTask.progress.completedBytes,
        totalBytes: payload.uploadTask.progress.totalBytes,
        percentage: payload.uploadTask.progress.percentage,
      },
      ...(payload.uploadTask.uploadedChunkCount !== undefined
        ? { uploadedChunkCount: payload.uploadTask.uploadedChunkCount }
        : {}),
      chunkingReserved: payload.uploadTask.chunkingReserved,
      governance: {
        maxSizeBytes: payload.uploadTask.governance.maxSizeBytes,
        acceptedFileTypes: payload.uploadTask.governance.acceptedFileTypes,
        sensitiveReviewRequired: payload.uploadTask.governance.sensitiveReviewRequired,
        ...(payload.uploadTask.governance.expiresInDays !== undefined
          ? { expiresInDays: payload.uploadTask.governance.expiresInDays }
          : {}),
        ...(payload.uploadTask.governance.governanceSummary !== undefined
          ? { governanceSummary: payload.uploadTask.governance.governanceSummary }
          : {}),
      },
      reviewStatus: payload.uploadTask.reviewStatus,
      ...(payload.uploadTask.reviewMessage !== undefined ? { reviewMessage: payload.uploadTask.reviewMessage } : {}),
      lifecycle: {
        backendBacked: payload.uploadTask.lifecycle.backendBacked,
        retentionStatus: payload.uploadTask.lifecycle.retentionStatus,
        retryCount: payload.uploadTask.lifecycle.retryCount,
        canRetry: payload.uploadTask.lifecycle.canRetry,
        canCancel: payload.uploadTask.lifecycle.canCancel,
        ...(payload.uploadTask.lifecycle.lastTransitionAt !== undefined
          ? { lastTransitionAt: payload.uploadTask.lifecycle.lastTransitionAt }
          : {}),
        ...(payload.uploadTask.lifecycle.expiresAt !== undefined ? { expiresAt: payload.uploadTask.lifecycle.expiresAt } : {}),
        ...(payload.uploadTask.lifecycle.retentionSummary !== undefined
          ? { retentionSummary: payload.uploadTask.lifecycle.retentionSummary }
          : {}),
        ...(payload.uploadTask.lifecycle.cleanupSummary !== undefined
          ? { cleanupSummary: payload.uploadTask.lifecycle.cleanupSummary }
          : {}),
      },
      ...(payload.uploadTask.ownershipSummary !== undefined ? { ownershipSummary: payload.uploadTask.ownershipSummary } : {}),
    },
    ...(payload.uploadAsset !== undefined ? { uploadAsset: normalizeUploadAsset(payload.uploadAsset) } : {}),
    ...(payload.uploadError !== undefined
      ? {
          uploadError: {
            code: payload.uploadError.code,
            message: payload.uploadError.message,
            recoverable: payload.uploadError.recoverable,
            retryable: payload.uploadError.retryable,
            stage: payload.uploadError.stage,
          },
        }
      : {}),
    ...(payload.transfer !== undefined
      ? {
          transfer: {
            mode: payload.transfer.mode,
            checksumAlgorithm: payload.transfer.checksumAlgorithm,
            fileChecksum: payload.transfer.fileChecksum,
            totalBytes: payload.transfer.totalBytes,
            chunkSizeBytes: payload.transfer.chunkSizeBytes,
            chunks: payload.transfer.chunks.map((chunk) => ({
              chunkIndex: chunk.chunkIndex,
              byteOffset: chunk.byteOffset,
              byteLength: chunk.byteLength,
              checksum: chunk.checksum,
              checksumAlgorithm: chunk.checksumAlgorithm,
              dataBase64: chunk.dataBase64,
            })),
          },
        }
      : {}),
  };
}

export function normalizeUploadSessionRequest(
  payload: z.infer<typeof uploadSessionRequestSchema>,
): UploadPipelineRequest {
  return {
    scenario: payload.scenario,
    selection: normalizeUploadSelectionResult(payload.selection),
  };
}

export function normalizeUploadChunkRequest(payload: z.infer<typeof uploadChunkRequestSchema>) {
  return {
    taskId: payload.taskId,
    sessionId: payload.sessionId,
    chunk: {
      chunkIndex: payload.chunk.chunkIndex,
      byteOffset: payload.chunk.byteOffset,
      byteLength: payload.chunk.byteLength,
      checksum: payload.chunk.checksum,
      checksumAlgorithm: payload.chunk.checksumAlgorithm,
      dataBase64: payload.chunk.dataBase64,
    },
  };
}
