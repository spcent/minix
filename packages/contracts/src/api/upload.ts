import type { ActorContextSnapshot, SourceContextSnapshot } from "./context";
import type { ProviderPostureBase, ProviderPostureMode } from "../kernel/capability";

export const UPLOAD_FILE_TYPES = ["image", "audio", "video", "pdf", "avatar", "attachment"] as const;
export type UploadFileType = (typeof UPLOAD_FILE_TYPES)[number];

export const UPLOAD_STAGES = [
  "idle",
  "choosing",
  "compressing",
  "chunking_reserved",
  "uploading",
  "reviewing",
  "completed",
  "failed",
  "canceled",
] as const;
export type UploadStage = (typeof UPLOAD_STAGES)[number];

export const UPLOAD_REVIEW_STATUSES = ["not_required", "pending", "approved", "rejected"] as const;
export type UploadReviewStatus = (typeof UPLOAD_REVIEW_STATUSES)[number];

export const UPLOAD_SCENARIOS = ["content", "avatar", "attachment"] as const;
export type UploadScenario = (typeof UPLOAD_SCENARIOS)[number];

export const UPLOAD_RETENTION_STATUSES = ["active", "scheduled_cleanup", "expired"] as const;
export type UploadRetentionStatus = (typeof UPLOAD_RETENTION_STATUSES)[number];

export const UPLOAD_PIPELINE_SOURCES = [
  "adapter_selection",
  "backend_session",
  "backend_chunk",
  "backend_complete",
  "backend_retry",
  "backend_cancel",
  "backend_attach",
] as const;
export type UploadPipelineSource = (typeof UPLOAD_PIPELINE_SOURCES)[number];

export const UPLOAD_CHECKSUM_ALGORITHMS = ["sha256"] as const;
export type UploadChecksumAlgorithm = (typeof UPLOAD_CHECKSUM_ALGORITHMS)[number];

export const UPLOAD_TRANSFER_MODES = ["single_part", "chunked"] as const;
export type UploadTransferMode = (typeof UPLOAD_TRANSFER_MODES)[number];

export const UPLOAD_REFERENCE_OWNER_TYPES = ["feedback", "content", "avatar"] as const;
export type UploadReferenceOwnerType = (typeof UPLOAD_REFERENCE_OWNER_TYPES)[number];

export interface UploadGovernance {
  maxSizeBytes: number;
  acceptedFileTypes: UploadFileType[];
  sensitiveReviewRequired: boolean;
  expiresInDays?: number;
  governanceSummary?: string;
}

export interface UploadProgress {
  completedBytes: number;
  totalBytes: number;
  percentage: number;
}

export interface UploadLifecycle {
  backendBacked: boolean;
  retentionStatus: UploadRetentionStatus;
  retryCount: number;
  canRetry: boolean;
  canCancel: boolean;
  lastTransitionAt?: string;
  expiresAt?: string;
  retentionSummary?: string;
  cleanupSummary?: string;
}

export interface UploadDerivedAssetVariant {
  kind: "original" | "thumbnail" | "cover" | "preview";
  url: string;
  label: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  pageCount?: number;
}

export interface UploadAssetMetadata {
  mimeType?: string;
  sizeBytes: number;
  checksum?: string;
  checksumAlgorithm?: UploadChecksumAlgorithm;
  width?: number;
  height?: number;
  durationSeconds?: number;
  pageCount?: number;
  variants?: UploadDerivedAssetVariant[];
  reviewAnnotations?: string[];
}

export interface UploadAsset {
  assetId: string;
  fileType: UploadFileType;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  metadata: UploadAssetMetadata;
  derivedAssetSummary?: string;
  ownershipSummary?: string;
}

export interface UploadError {
  code: string;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  stage: UploadStage;
}

export interface UploadIntegrity {
  checksumAlgorithm: UploadChecksumAlgorithm;
  fileChecksum: string;
  expectedSizeBytes: number;
}

export interface UploadChunkTransfer {
  chunkIndex: number;
  byteOffset: number;
  byteLength: number;
  checksum: string;
  checksumAlgorithm: UploadChecksumAlgorithm;
  dataBase64: string;
}

export interface UploadTransferPayload {
  mode: UploadTransferMode;
  checksumAlgorithm: UploadChecksumAlgorithm;
  fileChecksum: string;
  totalBytes: number;
  chunkSizeBytes: number;
  chunks: UploadChunkTransfer[];
}

export interface UploadChunkReceipt {
  chunkIndex: number;
  byteOffset: number;
  byteLength: number;
  checksum: string;
  checksumAlgorithm: UploadChecksumAlgorithm;
  receivedAt: string;
}

export interface UploadSession {
  sessionId: string;
  uploadToken: string;
  objectKey: string;
  mode: UploadTransferMode;
  checksumAlgorithm: UploadChecksumAlgorithm;
  chunkSizeBytes: number;
  chunkCount: number;
  receivedChunkCount: number;
  nextChunkIndex: number;
  resumeSupported: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface UploadReviewRecord {
  status: UploadReviewStatus;
  provider: string;
  providerMode?: ProviderPostureMode;
  storageProvider?: string;
  reviewedAt?: string;
  message?: string;
  reasonCodes?: string[];
  annotationSummary?: string;
}

export interface UploadProviderPosture extends ProviderPostureBase {
  storageProvider: string;
  reviewProvider: string;
  assetHost?: string;
  postureSummary: string;
}

export interface UploadCleanupRecord {
  retentionStatus: UploadRetentionStatus;
  cleanupScheduledAt?: string;
  cleanupReason?: string;
  referenced: boolean;
  ownershipSummary?: string;
  retentionSummary?: string;
  cleanupSummary?: string;
}

export interface UploadReference {
  ownerType: UploadReferenceOwnerType;
  ownerId: string;
  role: string;
  sourceContext?: SourceContextSnapshot;
  actorContext?: ActorContextSnapshot;
  attachedAt: string;
  ownerSummary?: string;
}

export interface UploadTask {
  taskId: string;
  scenario: UploadScenario;
  fileType: UploadFileType;
  stage: UploadStage;
  fileName?: string;
  progress: UploadProgress;
  chunkingReserved: boolean;
  transferMode?: UploadTransferMode;
  sessionId?: string;
  chunkCount?: number;
  uploadedChunkCount?: number;
  integrity?: UploadIntegrity;
  governance: UploadGovernance;
  reviewStatus: UploadReviewStatus;
  reviewMessage?: string;
  lifecycle: UploadLifecycle;
  ownershipSummary?: string;
}

export interface UploadSelectionRequest {
  scenario: UploadScenario;
  preferredFileType: UploadFileType;
  acceptedFileTypes: UploadFileType[];
  maxSelectCount: number;
  governance: UploadGovernance;
}

export interface UploadSelectionResult {
  uploadTask: UploadTask;
  uploadAsset?: UploadAsset;
  uploadError?: UploadError;
  transfer?: UploadTransferPayload;
}

export interface UploadSessionRequest {
  scenario: UploadScenario;
  selection: UploadSelectionResult;
}

export interface UploadChunkRequest {
  taskId: string;
  sessionId: string;
  chunk: UploadChunkTransfer;
}

export interface UploadCompleteRequest {
  taskId: string;
  sessionId: string;
  fileChecksum: string;
  checksumAlgorithm: UploadChecksumAlgorithm;
}

export interface UploadAttachRequest {
  taskId?: string;
  assetId?: string;
  reference: {
    ownerType: UploadReferenceOwnerType;
    ownerId: string;
    role: string;
    sourceContext?: SourceContextSnapshot;
    actorContext?: ActorContextSnapshot;
  };
}

export interface UploadPipelineRequest {
  scenario: UploadScenario;
  selection: UploadSelectionResult;
}

export interface UploadPipelineResponse extends UploadSelectionResult {
  source: UploadPipelineSource;
  session?: UploadSession;
  receivedChunk?: UploadChunkReceipt;
  reviewRecord?: UploadReviewRecord;
  cleanupRecord?: UploadCleanupRecord;
  providerPosture?: UploadProviderPosture;
  references?: UploadReference[];
}

export interface UploadRetryRequest {
  taskId: string;
}

export interface UploadCancelRequest {
  taskId: string;
  reason?: string;
}
