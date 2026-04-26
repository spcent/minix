import type {
  UploadChecksumAlgorithm,
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
} from "@minix/contracts";

type UploadGovernanceInput = {
  maxSizeBytes: number;
  acceptedFileTypes: UploadFileType[];
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
    ...(governance.expiresInDays !== undefined ? { expiresInDays: governance.expiresInDays } : {}),
    ...(governance.governanceSummary !== undefined ? { governanceSummary: governance.governanceSummary } : {}),
  };
}

export function cloneUploadLifecycle(lifecycle: UploadLifecycleInput): UploadLifecycle {
  return {
    backendBacked: lifecycle.backendBacked,
    retentionStatus: lifecycle.retentionStatus,
    retryCount: lifecycle.retryCount,
    canRetry: lifecycle.canRetry,
    canCancel: lifecycle.canCancel,
    ...(lifecycle.lastTransitionAt !== undefined ? { lastTransitionAt: lifecycle.lastTransitionAt } : {}),
    ...(lifecycle.expiresAt !== undefined ? { expiresAt: lifecycle.expiresAt } : {}),
    ...(lifecycle.retentionSummary !== undefined ? { retentionSummary: lifecycle.retentionSummary } : {}),
    ...(lifecycle.cleanupSummary !== undefined ? { cleanupSummary: lifecycle.cleanupSummary } : {}),
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
    ...(task.fileName !== undefined ? { fileName: task.fileName } : {}),
    progress: cloneUploadProgress(task.progress),
    chunkingReserved: task.chunkingReserved,
    ...(task.transferMode !== undefined ? { transferMode: task.transferMode } : {}),
    ...(task.sessionId !== undefined ? { sessionId: task.sessionId } : {}),
    ...(task.chunkCount !== undefined ? { chunkCount: task.chunkCount } : {}),
    ...(task.uploadedChunkCount !== undefined ? { uploadedChunkCount: task.uploadedChunkCount } : {}),
    ...(task.integrity !== undefined ? { integrity: cloneUploadIntegrity(task.integrity) } : {}),
    governance: cloneUploadGovernance(task.governance),
    reviewStatus: task.reviewStatus,
    ...(task.reviewMessage !== undefined ? { reviewMessage: task.reviewMessage } : {}),
    lifecycle: cloneUploadLifecycle(task.lifecycle),
    ...(task.ownershipSummary !== undefined ? { ownershipSummary: task.ownershipSummary } : {}),
  };
}
