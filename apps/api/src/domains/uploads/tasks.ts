import type { UploadFileType, UploadGovernance, UploadLifecycle, UploadProgress } from "@minix/contracts";

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
