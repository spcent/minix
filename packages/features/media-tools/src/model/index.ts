import type {
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
    chunkingReserved: true,
    governance: createDefaultUploadGovernance(),
    reviewStatus: "not_required",
  };
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
    channelMarker: "host-h5-demo",
    inviteBindingEnabled: true,
    returnFlowRecognized: true,
    shareCount: 0,
    clickCount: 0,
    conversionCount: 0,
  };
}

export function createDefaultMediaToolsState(
  options: CreateDefaultMediaToolsStateOptions = {},
): MediaToolsState {
  return {
    ready: false,
    loading: false,
    title: options.title ?? "Media Tools",
    subtitle: options.subtitle ?? "Reserved upload and share orchestration workspace for cross-host contract proof.",
    primaryActionLabel: options.primaryActionLabel ?? "Select Upload Asset",
    secondaryActionLabel: options.secondaryActionLabel ?? "Dispatch Share Payload",
    capabilityHint:
      options.capabilityHint ??
      "This workspace proves upload and share contracts through platform capability adapters without leaking file-picker or share APIs into shared code.",
    resultLabel: options.resultLabel ?? "Latest capability result",
    usageExamples: options.usageExamples ?? ["upload", "share", "attribution"],
    uploadAvailable: false,
    shareAvailable: false,
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
