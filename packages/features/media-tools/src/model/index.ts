import type {
  CapabilityStatus,
  ShareAttribution,
  ShareChannel,
  SharePayload,
  UploadAsset,
  UploadError,
  UploadGovernance,
  UploadTask,
} from "@minix/contracts";

export interface MediaToolsResult {
  status: "idle" | "succeeded" | "failed";
  message: string;
  detail?: string;
}

export interface MediaToolsState {
  ready: boolean;
  loading: boolean;
  title: string;
  subtitle: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  capabilityHint: string;
  resultLabel: string;
  usageExamples: string[];
  uploadAvailable: boolean;
  shareAvailable: boolean;
  uploadCapabilityStatus: CapabilityStatus | undefined;
  shareCapabilityStatus: CapabilityStatus | undefined;
  clipboardCapabilityStatus: CapabilityStatus | undefined;
  uploadProviderSummary: string;
  shareProviderSummary: string;
  uploadTask: UploadTask;
  uploadAsset: UploadAsset | undefined;
  uploadError: UploadError | undefined;
  sharePayload: SharePayload;
  shareChannel: ShareChannel;
  shareAttribution: ShareAttribution;
  lastResult: MediaToolsResult | undefined;
  errorText: string | undefined;
}

export interface CreateDefaultMediaToolsStateOptions {
  title?: string;
  subtitle?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  capabilityHint?: string;
  resultLabel?: string;
  usageExamples?: string[];
}

export function createDefaultUploadGovernance(): UploadGovernance {
  return {
    maxSizeBytes: 10_000_000,
    acceptedFileTypes: ["image", "pdf", "attachment"],
    sensitiveReviewRequired: true,
    expiresInDays: 30,
  };
}

export function createDefaultUploadTask(): UploadTask {
  return {
    taskId: "upload_task_idle",
    scenario: "content",
    fileType: "image",
    stage: "idle",
    progress: {
      completedBytes: 0,
      totalBytes: 0,
      percentage: 0,
    },
    chunkingReserved: false,
    governance: createDefaultUploadGovernance(),
    reviewStatus: "not_required",
    lifecycle: {
      backendBacked: false,
      retentionStatus: "active",
      retryCount: 0,
      canRetry: true,
      canCancel: false,
    },
  };
}

export function createDefaultUploadProviderSummary(): string {
  return "Upload review and storage posture remains sample-backed through sample-upload-policy until a production object-storage and review provider is configured.";
}

export function createDefaultSharePayload(): SharePayload {
  return {
    scenario: "invite",
    title: "Invite a friend to MiniX",
    summary: "Shared contract demo for page, content, invite, and poster flows.",
    landingPath: "/inbox",
    landingUrl: "https://example.test/inbox",
    shortLink: "https://mini.x/invite/demo",
    trackingParams: {
      channel: "host-h5",
      campaign: "media-tools",
    },
    channelMarker: "host-h5-demo",
    inviteCode: "MINIX42",
    landingTarget: {
      path: "/inbox",
      url: "https://example.test/inbox",
      shortLink: "https://mini.x/invite/demo",
      channelMarker: "host-h5-demo",
    },
    returnTarget: {
      path: "/workspace/media-tools",
      source: "media-tools",
      reason: "auth-required",
      label: "Media Tools",
    },
  };
}

export function createDefaultShareChannel(): ShareChannel {
  return {
    kind: "copy_link",
    label: "Copy Link",
    executable: true,
    channelMarker: "host-h5-demo",
  };
}

export function createDefaultShareAttribution(): ShareAttribution {
  return {
    attributionId: "share_demo_seed",
    channelMarker: "host-h5-demo",
    inviteBindingEnabled: true,
    returnFlowRecognized: false,
    shareCount: 0,
    clickCount: 0,
    returnCount: 0,
    conversionCount: 0,
  };
}

export function createDefaultShareProviderSummary(): string {
  return "Share landing-target normalization is backend-backed, while poster generation remains sample-backed and channel dispatch still depends on the host native share or clipboard fallback path.";
}

export function createDefaultMediaToolsState(
  options: CreateDefaultMediaToolsStateOptions = {},
): MediaToolsState {
  return {
    ready: false,
    loading: false,
    title: options.title ?? "Media Tools",
    subtitle: options.subtitle ?? "Shared upload and share orchestration workspace for cross-host contract proof.",
    primaryActionLabel: options.primaryActionLabel ?? "Select Upload Asset",
    secondaryActionLabel: options.secondaryActionLabel ?? "Dispatch Share Payload",
    capabilityHint:
      options.capabilityHint ??
      "This workspace proves upload transfer, review governance, and share contracts through platform capability adapters without leaking host APIs into shared code.",
    resultLabel: options.resultLabel ?? "Latest capability result",
    usageExamples: options.usageExamples ?? ["upload", "share", "attribution"],
    uploadAvailable: false,
    shareAvailable: false,
    uploadCapabilityStatus: undefined,
    shareCapabilityStatus: undefined,
    clipboardCapabilityStatus: undefined,
    uploadProviderSummary: createDefaultUploadProviderSummary(),
    shareProviderSummary: createDefaultShareProviderSummary(),
    uploadTask: createDefaultUploadTask(),
    uploadAsset: undefined,
    uploadError: undefined,
    sharePayload: createDefaultSharePayload(),
    shareChannel: createDefaultShareChannel(),
    shareAttribution: createDefaultShareAttribution(),
    lastResult: undefined,
    errorText: undefined,
  };
}
