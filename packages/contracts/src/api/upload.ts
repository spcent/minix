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

export const UPLOAD_PIPELINE_SOURCES = ["adapter_selection", "backend_retry", "backend_cancel"] as const;
export type UploadPipelineSource = (typeof UPLOAD_PIPELINE_SOURCES)[number];

export interface UploadGovernance {
  maxSizeBytes: number;
  acceptedFileTypes: UploadFileType[];
  sensitiveReviewRequired: boolean;
  expiresInDays?: number;
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
}

export interface UploadAssetMetadata {
  mimeType?: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  pageCount?: number;
}

export interface UploadAsset {
  assetId: string;
  fileType: UploadFileType;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  metadata: UploadAssetMetadata;
}

export interface UploadError {
  code: string;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  stage: UploadStage;
}

export interface UploadTask {
  taskId: string;
  scenario: UploadScenario;
  fileType: UploadFileType;
  stage: UploadStage;
  fileName?: string;
  progress: UploadProgress;
  chunkingReserved: boolean;
  governance: UploadGovernance;
  reviewStatus: UploadReviewStatus;
  reviewMessage?: string;
  lifecycle: UploadLifecycle;
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
}

export interface UploadPipelineRequest {
  scenario: UploadScenario;
  selection: UploadSelectionResult;
}

export interface UploadPipelineResponse extends UploadSelectionResult {
  source: UploadPipelineSource;
}

export interface UploadRetryRequest {
  taskId: string;
}

export interface UploadCancelRequest {
  taskId: string;
  reason?: string;
}
