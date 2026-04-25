import type {
  CapabilityHealthSnapshot,
  CapabilityStatus,
  ShareAttribution,
  ShareChannel,
  SharePayload,
  SharePosterAsset,
  ShareShortLinkRecord,
  UploadAsset,
  UploadCleanupRecord,
  UploadError,
  UploadGovernance,
  UploadProviderPosture,
  UploadReference,
  UploadReviewRecord,
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
  locationAvailable: boolean;
  uploadCapabilityStatus: CapabilityStatus | undefined;
  shareCapabilityStatus: CapabilityStatus | undefined;
  clipboardCapabilityStatus: CapabilityStatus | undefined;
  locationCapabilityStatus: CapabilityStatus | undefined;
  uploadCapabilitySnapshot: CapabilityHealthSnapshot;
  shareCapabilitySnapshot: CapabilityHealthSnapshot;
  clipboardCapabilitySnapshot: CapabilityHealthSnapshot;
  locationCapabilitySnapshot: CapabilityHealthSnapshot;
  uploadCapabilitySummary: string;
  shareCapabilitySummary: string;
  uploadProviderSummary: string;
  uploadProviderPosture: UploadProviderPosture | undefined;
  shareProviderSummary: string;
  uploadTask: UploadTask;
  uploadAsset: UploadAsset | undefined;
  uploadReviewRecord: UploadReviewRecord | undefined;
  uploadCleanupRecord: UploadCleanupRecord | undefined;
  uploadReferences: UploadReference[];
  uploadError: UploadError | undefined;
  uploadGovernanceSummary: string;
  uploadOwnershipSummary: string;
  uploadRetentionSummary: string;
  uploadDerivedAssetSummary: string;
  sharePayload: SharePayload;
  shareChannel: ShareChannel;
  shareAttribution: ShareAttribution;
  shareShortLinkRecord: ShareShortLinkRecord | undefined;
  sharePosterAsset: SharePosterAsset | undefined;
  shareChannelReadinessSummary: string;
  shareFallbackSummary: string;
  shareAttributionDiagnosticsSummary: string;
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
  return "Upload review and storage posture remains sample-backed through sample-upload-policy and sample-object-storage until production review and storage providers are configured.";
}

export function createDefaultUploadGovernanceSummary(): string {
  return "Upload governance details will appear after the shared upload pipeline returns a task.";
}

export function createDefaultUploadOwnershipSummary(): string {
  return "Upload ownership details will appear after the asset is attached to a business record.";
}

export function createDefaultUploadRetentionSummary(): string {
  return "Upload retention details will appear after the shared upload pipeline returns lifecycle data.";
}

export function createDefaultUploadDerivedAssetSummary(): string {
  return "Derived asset details will appear after the shared upload pipeline returns asset metadata.";
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

export function createDefaultShareChannelReadinessSummary(): string {
  return "Share channel readiness details will appear after the shared share flow returns channel metadata.";
}

export function createDefaultShareFallbackSummary(): string {
  return "Share fallback details will appear after the shared share flow resolves channel posture.";
}

export function createDefaultShareAttributionDiagnosticsSummary(): string {
  return "Share attribution diagnostics will appear after the shared share flow records replay and return signals.";
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
    locationAvailable: false,
    uploadCapabilityStatus: undefined,
    shareCapabilityStatus: undefined,
    clipboardCapabilityStatus: undefined,
    locationCapabilityStatus: undefined,
    uploadCapabilitySnapshot: {
      capability: "upload",
      available: false,
      mode: "unknown",
      summary: "Upload capability status is unavailable until the host runtime reports it.",
    },
    shareCapabilitySnapshot: {
      capability: "share",
      available: false,
      mode: "unknown",
      summary: "Share capability status is unavailable until the host runtime reports it.",
    },
    clipboardCapabilitySnapshot: {
      capability: "clipboard",
      available: false,
      mode: "unknown",
      summary: "Clipboard capability status is unavailable until the host runtime reports it.",
    },
    locationCapabilitySnapshot: {
      capability: "location",
      available: false,
      mode: "unknown",
      summary: "Location capability status is unavailable until the host runtime reports it.",
    },
    uploadCapabilitySummary: "Upload capability status is unavailable until the host runtime reports it.",
    shareCapabilitySummary: "Share capability status is unavailable until the host runtime reports it.",
    uploadProviderSummary: createDefaultUploadProviderSummary(),
    uploadProviderPosture: undefined,
    shareProviderSummary: createDefaultShareProviderSummary(),
    uploadTask: createDefaultUploadTask(),
    uploadAsset: undefined,
    uploadReviewRecord: undefined,
    uploadCleanupRecord: undefined,
    uploadReferences: [],
    uploadError: undefined,
    uploadGovernanceSummary: createDefaultUploadGovernanceSummary(),
    uploadOwnershipSummary: createDefaultUploadOwnershipSummary(),
    uploadRetentionSummary: createDefaultUploadRetentionSummary(),
    uploadDerivedAssetSummary: createDefaultUploadDerivedAssetSummary(),
    sharePayload: createDefaultSharePayload(),
    shareChannel: createDefaultShareChannel(),
    shareAttribution: createDefaultShareAttribution(),
    shareShortLinkRecord: undefined,
    sharePosterAsset: undefined,
    shareChannelReadinessSummary: createDefaultShareChannelReadinessSummary(),
    shareFallbackSummary: createDefaultShareFallbackSummary(),
    shareAttributionDiagnosticsSummary: createDefaultShareAttributionDiagnosticsSummary(),
    lastResult: undefined,
    errorText: undefined,
  };
}
