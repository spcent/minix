import type {
  UploadChecksumAlgorithm,
  UploadChunkTransfer,
  UploadError,
  UploadFileType,
  UploadGovernance,
  UploadIntegrity,
  UploadLifecycle,
  UploadProgress,
  UploadReviewStatus,
  UploadScenario,
  UploadStage,
  UploadTask,
  UploadTransferMode,
  UploadTransferPayload,
} from "@minix/contracts";

import { cloneDefinedDomainFields } from "../snapshot";

type UploadGovernanceInput = {
  maxSizeBytes: number;
  acceptedFileTypes: readonly UploadFileType[];
  sensitiveReviewRequired: boolean;
  expiresInDays?: number | undefined;
  governanceSummary?: string | undefined;
};

type UploadLifecycleInput = {
  backendBacked: boolean;
  retentionStatus: UploadLifecycle["retentionStatus"];
  retryCount: number;
  canRetry: boolean;
  canCancel: boolean;
  lastTransitionAt?: string | undefined;
  expiresAt?: string | undefined;
  retentionSummary?: string | undefined;
  cleanupSummary?: string | undefined;
};
type UploadIntegrityInput = {
  checksumAlgorithm: UploadChecksumAlgorithm;
  fileChecksum: string;
  expectedSizeBytes: number;
};
type UploadTaskInput = {
  taskId: string;
  scenario: UploadScenario;
  fileType: UploadFileType;
  stage: UploadStage;
  fileName?: string | undefined;
  progress: UploadProgress;
  chunkingReserved: boolean;
  transferMode?: UploadTransferMode | undefined;
  sessionId?: string | undefined;
  chunkCount?: number | undefined;
  uploadedChunkCount?: number | undefined;
  integrity?: UploadIntegrityInput | undefined;
  governance: UploadGovernanceInput;
  reviewStatus: UploadReviewStatus;
  reviewMessage?: string | undefined;
  lifecycle: UploadLifecycleInput;
  ownershipSummary?: string | undefined;
};
type UploadChunkTransferInput = {
  chunkIndex: number;
  byteOffset: number;
  byteLength: number;
  checksum: string;
  checksumAlgorithm: UploadChecksumAlgorithm;
  dataBase64: string;
};
type UploadTransferPayloadInput = {
  mode: UploadTransferMode;
  checksumAlgorithm: UploadChecksumAlgorithm;
  fileChecksum: string;
  totalBytes: number;
  chunkSizeBytes: number;
  chunks: UploadChunkTransferInput[];
};

export function cloneUploadProgress(progress: UploadProgress): UploadProgress {
  return {
    completedBytes: progress.completedBytes,
    totalBytes: progress.totalBytes,
    percentage: progress.percentage,
  };
}

export function cloneUploadGovernance(governance: UploadGovernanceInput): UploadGovernance {
  return {
    maxSizeBytes: governance.maxSizeBytes,
    acceptedFileTypes: [...governance.acceptedFileTypes],
    sensitiveReviewRequired: governance.sensitiveReviewRequired,
    ...cloneDefinedDomainFields(governance, ["expiresInDays", "governanceSummary"]),
  };
}

export function cloneUploadLifecycle(lifecycle: UploadLifecycleInput): UploadLifecycle {
  return {
    backendBacked: lifecycle.backendBacked,
    retentionStatus: lifecycle.retentionStatus,
    retryCount: lifecycle.retryCount,
    canRetry: lifecycle.canRetry,
    canCancel: lifecycle.canCancel,
    ...cloneDefinedDomainFields(lifecycle, [
      "lastTransitionAt",
      "expiresAt",
      "retentionSummary",
      "cleanupSummary",
    ]),
  };
}

export function cloneUploadIntegrity(integrity: UploadIntegrityInput): UploadIntegrity {
  return {
    checksumAlgorithm: integrity.checksumAlgorithm,
    fileChecksum: integrity.fileChecksum,
    expectedSizeBytes: integrity.expectedSizeBytes,
  };
}

export function cloneUploadTask(task: UploadTaskInput): UploadTask {
  return {
    taskId: task.taskId,
    scenario: task.scenario,
    fileType: task.fileType,
    stage: task.stage,
    ...cloneDefinedDomainFields(task, ["fileName"]),
    progress: cloneUploadProgress(task.progress),
    chunkingReserved: task.chunkingReserved,
    ...cloneDefinedDomainFields(task, [
      "transferMode",
      "sessionId",
      "chunkCount",
      "uploadedChunkCount",
    ]),
    ...(task.integrity !== undefined ? { integrity: cloneUploadIntegrity(task.integrity) } : {}),
    governance: cloneUploadGovernance(task.governance),
    reviewStatus: task.reviewStatus,
    ...cloneDefinedDomainFields(task, ["reviewMessage"]),
    lifecycle: cloneUploadLifecycle(task.lifecycle),
    ...cloneDefinedDomainFields(task, ["ownershipSummary"]),
  };
}

export function cloneUploadError(uploadError: UploadError): UploadError {
  return {
    code: uploadError.code,
    message: uploadError.message,
    recoverable: uploadError.recoverable,
    retryable: uploadError.retryable,
    stage: uploadError.stage,
  };
}

export function cloneUploadChunkTransfer(chunk: UploadChunkTransferInput): UploadChunkTransfer {
  return {
    chunkIndex: chunk.chunkIndex,
    byteOffset: chunk.byteOffset,
    byteLength: chunk.byteLength,
    checksum: chunk.checksum,
    checksumAlgorithm: chunk.checksumAlgorithm,
    dataBase64: chunk.dataBase64,
  };
}

export function cloneUploadTransferPayload(transfer: UploadTransferPayloadInput): UploadTransferPayload {
  return {
    mode: transfer.mode,
    checksumAlgorithm: transfer.checksumAlgorithm,
    fileChecksum: transfer.fileChecksum,
    totalBytes: transfer.totalBytes,
    chunkSizeBytes: transfer.chunkSizeBytes,
    chunks: transfer.chunks.map(cloneUploadChunkTransfer),
  };
}
