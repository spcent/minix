import type {
  AppRouteId,
  ShareAttributionReportResponse,
  SharePrepareRequest,
  SharePrepareResponse,
  ShareDispatchResult,
  ShareShortLinkResolveResponse,
  ShareReturnRecognitionRequest,
  ShareReturnRecognitionResponse,
  UploadCancelRequest,
  UploadChunkRequest,
  UploadCompleteRequest,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadRetryRequest,
  UploadSelectionResult,
} from "@minix/contracts";
import { createStore, describeCapabilityStatus, ok, type AppKernel } from "@minix/core";

import {
  createDefaultMediaToolsState,
  createDefaultShareProviderSummary,
  createDefaultShareAttribution,
  createDefaultUploadProviderSummary,
  type MediaToolsResult,
  type MediaToolsState,
} from "../model";

export interface CreateMediaToolsControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  uploadRequestPath?: string;
  uploadSessionPath?: string;
  uploadChunkPath?: string;
  uploadCompletePath?: string;
  retryUploadPath?: string;
  cancelUploadPath?: string;
  sharePreparePath?: string;
  shareResolvePath?: string;
  shareReturnPath?: string;
  shareReportPath?: string;
  initialState?: Partial<MediaToolsState>;
}

function cloneState(state: MediaToolsState): MediaToolsState {
  return {
    ...state,
    uploadTask: structuredClone(state.uploadTask),
    ...(state.uploadCapabilityStatus ? { uploadCapabilityStatus: structuredClone(state.uploadCapabilityStatus) } : {}),
    ...(state.shareCapabilityStatus ? { shareCapabilityStatus: structuredClone(state.shareCapabilityStatus) } : {}),
    ...(state.clipboardCapabilityStatus ? { clipboardCapabilityStatus: structuredClone(state.clipboardCapabilityStatus) } : {}),
    uploadCapabilitySummary: state.uploadCapabilitySummary,
    shareCapabilitySummary: state.shareCapabilitySummary,
    ...(state.uploadAsset ? { uploadAsset: structuredClone(state.uploadAsset) } : {}),
    ...(state.uploadError ? { uploadError: structuredClone(state.uploadError) } : {}),
    sharePayload: structuredClone(state.sharePayload),
    shareChannel: structuredClone(state.shareChannel),
    shareAttribution: structuredClone(state.shareAttribution),
    usageExamples: [...state.usageExamples],
    ...(state.lastResult ? { lastResult: { ...state.lastResult } } : {}),
  };
}

function deriveUploadProviderSummary(response: UploadPipelineResponse): string {
  const provider = response.reviewRecord?.provider;
  const providerMode = response.reviewRecord?.providerMode;
  const storageProvider = response.reviewRecord?.storageProvider;
  if (!provider) {
    return createDefaultUploadProviderSummary();
  }

  return providerMode === "production"
    ? `Upload review is backed by ${provider}, and asset storage resolves through ${storageProvider ?? "configured object storage"} for this workspace.`
    : `Upload review and storage posture remains sample-backed through ${provider} and ${storageProvider ?? "sample-object-storage"} for this workspace.`;
}

function deriveShareProviderSummary(
  response:
    | SharePrepareResponse
    | ShareReturnRecognitionResponse
    | ShareShortLinkResolveResponse
    | ShareAttributionReportResponse,
): string {
  const shortLinkRecord = response.shortLinkRecord ?? response.attributionReport.shortLinkRecord;
  const posterAsset = response.posterAsset ?? response.attributionReport.posterAsset;
  const shortLinkProvider = shortLinkRecord?.provider;
  const shortLinkProviderMode =
    shortLinkRecord?.providerMode ??
    (shortLinkProvider === "provider" ? "production" : shortLinkProvider === "sample" ? "sample" : undefined);
  const posterProvider = posterAsset?.provider;
  const posterProviderMode =
    posterAsset?.providerMode ??
    (posterProvider === "provider" ? "production" : posterProvider === "sample" ? "sample" : undefined);
  if (posterProviderMode === "production" || shortLinkProviderMode === "production") {
    return `Share short-link attribution is backed by ${shortLinkProvider ?? "configured short-link provider"}, and poster generation resolves through ${posterProvider ?? "configured poster provider"} in this workspace.`;
  }

  if (shortLinkRecord ?? posterAsset ?? response.sharePayload.shortLink) {
    return `Share short-link attribution and poster generation remain sample-backed through ${shortLinkProvider ?? "sample-short-link"} and ${posterProvider ?? "sample-poster-provider"}, while landing-target normalization and attribution reporting stay backend-backed.`;
  }

  return createDefaultShareProviderSummary();
}

export function createMediaToolsController(options: CreateMediaToolsControllerOptions) {
  const {
    kernel,
    loginRouteId,
    settingsRouteId,
    uploadRequestPath = "/uploads",
    uploadSessionPath = "/uploads/session",
    uploadChunkPath = "/uploads/chunk",
    uploadCompletePath = "/uploads/complete",
    retryUploadPath = "/uploads/retry",
    cancelUploadPath = "/uploads/cancel",
    sharePreparePath = "/share/prepare",
    shareResolvePath = "/share/resolve",
    shareReturnPath = "/share/return",
    shareReportPath = "/share/report",
    initialState,
  } = options;
  const store = createStore<MediaToolsState>({
    ...cloneState(createDefaultMediaToolsState()),
    ...initialState,
  });

  async function routeToOptional(routeId?: AppRouteId) {
    if (!routeId) {
      return ok(undefined);
    }

    return kernel.router.toRoute(routeId);
  }

  function setResult(result: MediaToolsResult | undefined) {
    store.setState({
      lastResult: result,
      loading: false,
      errorText: undefined,
    });
  }

  function setCapabilityAvailability() {
    const uploadStatus = kernel.capability?.status("upload");
    const shareStatus = kernel.capability?.status("share");
    const clipboardStatus = kernel.capability?.status("clipboard");
    const uploadCapabilityStatus = uploadStatus?.ok ? uploadStatus.value : undefined;
    const shareCapabilityStatus = shareStatus?.ok ? shareStatus.value : undefined;
    const clipboardCapabilityStatus = clipboardStatus?.ok ? clipboardStatus.value : undefined;
    const uploadCapabilitySummary = describeCapabilityStatus(
      uploadCapabilityStatus,
      "Upload capability status is unavailable until the host runtime reports it.",
    );
    const shareCapabilityBaseSummary = describeCapabilityStatus(
      shareCapabilityStatus,
      "Share capability status is unavailable until the host runtime reports it.",
    );
    const shareCapabilitySummary =
      shareCapabilityStatus && !shareCapabilityStatus.available && clipboardCapabilityStatus?.available
        ? `${shareCapabilityBaseSummary} Clipboard fallback remains available for copy-link flows.`
        : shareCapabilityBaseSummary;
    store.setState({
      uploadAvailable: Boolean(uploadCapabilityStatus?.available),
      shareAvailable: Boolean(
        shareCapabilityStatus?.available ||
          clipboardCapabilityStatus?.available,
      ),
      uploadCapabilityStatus,
      shareCapabilityStatus,
      clipboardCapabilityStatus,
      uploadCapabilitySummary,
      shareCapabilitySummary,
    });
  }

  function createUploadFailure(message: string, detail?: string) {
    store.setState({
      loading: false,
      errorText: message,
      uploadError: {
        code: "UPLOAD_UNAVAILABLE",
        message,
        recoverable: true,
        retryable: true,
        stage: "failed",
      },
      uploadTask: {
        ...store.getState().uploadTask,
        stage: "failed",
      },
      lastResult: {
        status: "failed",
        message,
        ...(detail ? { detail } : {}),
      },
    });
  }

  function createShareFailure(message: string, detail?: string) {
    store.setState({
      loading: false,
      errorText: message,
      lastResult: {
        status: "failed",
        message,
        ...(detail ? { detail } : {}),
      },
    });
  }

  function applyUploadResponse(response: UploadPipelineResponse, detail?: string) {
    store.setState({
      loading: false,
      errorText: response.uploadError?.message,
      uploadProviderSummary: deriveUploadProviderSummary(response),
      uploadTask: response.uploadTask,
      uploadAsset: response.uploadAsset,
      uploadError: response.uploadError,
      lastResult: {
        status: response.uploadError ? "failed" : "succeeded",
        message:
          response.uploadError?.message ??
          response.uploadTask.reviewMessage ??
          "Upload pipeline completed through the shared backend-backed flow.",
        ...(detail ? { detail } : {}),
      },
    });
  }

  async function continueUpload(response: UploadPipelineResponse, detail?: string) {
    applyUploadResponse(response, detail);
    if (!response.session || !response.transfer) {
      return ok(response);
    }

    const activeSession = response.session;
    const activeTransfer = response.transfer;
    const nextChunkIndex = activeSession.nextChunkIndex ?? response.uploadTask.uploadedChunkCount ?? 0;
    let current = response;
    for (const chunk of activeTransfer.chunks.slice(nextChunkIndex)) {
      const chunkPayload: UploadChunkRequest = {
        taskId: current.uploadTask.taskId,
        sessionId: current.session?.sessionId ?? activeSession.sessionId,
        chunk,
      };
      const chunkResult = await kernel.request.post<UploadPipelineResponse>(uploadChunkPath, chunkPayload);
      if (!chunkResult.ok) {
        createUploadFailure(chunkResult.error.message);
        return chunkResult;
      }
      current = chunkResult.value;
      applyUploadResponse(current, detail);
    }

    const completionPayload: UploadCompleteRequest = {
      taskId: current.uploadTask.taskId,
      sessionId: current.session?.sessionId ?? activeSession.sessionId,
      fileChecksum: activeTransfer.fileChecksum,
      checksumAlgorithm: activeTransfer.checksumAlgorithm,
    };
    const completion = await kernel.request.post<UploadPipelineResponse>(uploadCompletePath, completionPayload);
    if (!completion.ok) {
      createUploadFailure(completion.error.message);
      return completion;
    }

    applyUploadResponse(completion.value, detail);
    return completion;
  }

  return {
    store,

    loadInitial() {
      setCapabilityAvailability();
      store.setState({
        ready: true,
        loading: false,
        errorText: undefined,
        shareAttribution: store.getState().shareAttribution ?? createDefaultShareAttribution(),
      });
      return ok(undefined);
    },

    async startUpload() {
      setCapabilityAvailability();
      if (!kernel.capability || !store.getState().uploadAvailable) {
        createUploadFailure(
          store.getState().uploadCapabilityStatus?.detail ?? "Upload capability is unavailable on this host.",
          store.getState().uploadCapabilityStatus?.fallbackActionLabel,
        );
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorText: undefined,
        uploadError: undefined,
        uploadTask: {
          ...store.getState().uploadTask,
          stage: "choosing",
        },
      });

      const current = store.getState();
      const result = await kernel.capability.execute<UploadSelectionResult>({
        capability: "upload",
        action: "selectAsset",
        payload: {
          scenario: current.uploadTask.scenario,
          preferredFileType: current.uploadTask.fileType,
          acceptedFileTypes: current.uploadTask.governance.acceptedFileTypes,
          maxSelectCount: 1,
          governance: current.uploadTask.governance,
        },
      });

      if (!result.ok) {
        createUploadFailure(result.error.message);
        return result;
      }

      const value = result.value.value;
      if (!value) {
        createUploadFailure("Upload reservation did not return a task.", result.value.detail);
        if (result.value.degraded) {
          store.setState({
            lastResult: {
              status: "failed",
              message: "Upload selection returned no transferable payload.",
              ...(result.value.detail ? { detail: result.value.detail } : {}),
            },
          });
        }
        return ok(undefined);
      }

      const pipelineRequest: UploadPipelineRequest = {
        scenario: current.uploadTask.scenario,
        selection: value,
      };
      if (uploadRequestPath === uploadSessionPath) {
        createUploadFailure("Upload session path cannot be the same as the legacy upload path.");
        return ok(undefined);
      }

      const sessionResponse = await kernel.request.post<UploadPipelineResponse>(uploadSessionPath, pipelineRequest);
      if (!sessionResponse.ok) {
        const legacyPipeline = await kernel.request.post<UploadPipelineResponse>(uploadRequestPath, pipelineRequest);
        if (!legacyPipeline.ok) {
          createUploadFailure(sessionResponse.error.message);
          return sessionResponse;
        }
        applyUploadResponse(legacyPipeline.value, result.value.detail);
        return legacyPipeline;
      }

      return continueUpload(sessionResponse.value, result.value.detail);
    },

    async retryUpload() {
      const taskId = store.getState().uploadTask.taskId;
      if (!taskId || taskId === "upload_task_idle") {
        return this.startUpload();
      }

      store.setState({
        loading: true,
        errorText: undefined,
      });

      const payload: UploadRetryRequest = { taskId };
      const result = await kernel.request.post<UploadPipelineResponse>(retryUploadPath, payload);
      if (!result.ok) {
        createUploadFailure(result.error.message);
        return result;
      }

      if (result.value.uploadTask.stage === "uploading" && result.value.session && result.value.transfer) {
        return continueUpload(result.value);
      }

      applyUploadResponse(result.value);
      return result;
    },

    async cancelUpload(reason?: string) {
      const taskId = store.getState().uploadTask.taskId;
      if (!taskId || taskId === "upload_task_idle") {
        createUploadFailure("There is no active upload task to cancel.");
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorText: undefined,
      });

      const payload: UploadCancelRequest = {
        taskId,
        ...(reason ? { reason } : {}),
      };
      const result = await kernel.request.post<UploadPipelineResponse>(cancelUploadPath, payload);
      if (!result.ok) {
        createUploadFailure(result.error.message);
        return result;
      }

      applyUploadResponse(result.value);
      return result;
    },

    async startShare() {
      setCapabilityAvailability();
      if (!kernel.capability || !store.getState().shareAvailable) {
        createShareFailure(
          store.getState().shareCapabilityStatus?.detail ??
            store.getState().clipboardCapabilityStatus?.detail ??
            "Share capability is unavailable on this host.",
          store.getState().shareCapabilityStatus?.fallbackActionLabel ?? store.getState().clipboardCapabilityStatus?.fallbackActionLabel,
        );
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorText: undefined,
      });

      const current = store.getState();
      const currentRoute = kernel.router.current();
      const session = await kernel.session.get();
      const prepareRequest: SharePrepareRequest = {
        sharePayload: {
          ...current.sharePayload,
          sourceContext: {
            ...(currentRoute.ok && currentRoute.value?.path ? { pagePath: currentRoute.value.path } : {}),
            ...(currentRoute.ok && typeof currentRoute.value?.path === "string" ? { label: current.title } : {}),
            ...(currentRoute.ok && currentRoute.value?.params ? { params: currentRoute.value.params } : {}),
          },
        },
        shareChannel: current.shareChannel,
        shareAttribution: {
          ...current.shareAttribution,
          actorContext: {
            ...(session.ok && session.value?.identity.userId ? { userId: session.value.identity.userId } : {}),
            platform: kernel.env?.platform ?? "h5",
            appVersion: kernel.env?.version ?? "1.0.0",
          },
        },
        ...(currentRoute.ok && currentRoute.value
          ? {
              redirectTarget: {
                ...(currentRoute.value.path ? { path: currentRoute.value.path } : {}),
                ...(currentRoute.value.params ? { params: currentRoute.value.params } : {}),
                source: "media-tools",
                reason: "auth-required" as const,
                label: "Media Tools",
              },
            }
          : {}),
      };
      const prepared = await kernel.request.post<SharePrepareResponse>(sharePreparePath, prepareRequest);
      if (!prepared.ok) {
        createShareFailure(prepared.error.message);
        return prepared;
      }

      const dispatchCapability =
        prepared.value.shareChannel.kind === "copy_link" || prepared.value.shareChannel.kind === "short_link"
          ? "clipboard"
          : "share";
      const dispatchAvailable = kernel.capability.status(dispatchCapability);
      if (!dispatchAvailable.ok || !dispatchAvailable.value.available) {
        createShareFailure(
          dispatchAvailable.ok
            ? dispatchAvailable.value.detail ?? "Share capability is unavailable on this host."
            : dispatchCapability === "clipboard"
              ? "Clipboard capability is unavailable for the copy-link share flow."
              : "Native share capability is unavailable on this host.",
          dispatchAvailable.ok ? dispatchAvailable.value.fallbackActionLabel : undefined,
        );
        return ok(undefined);
      }
      const dispatchPayload =
        dispatchCapability === "clipboard"
          ? {
              text:
                prepared.value.posterAsset?.url ??
                prepared.value.sharePayload.shortLink ??
                prepared.value.landingTarget.shortLink ??
                prepared.value.sharePayload.posterImageUrl ??
                prepared.value.sharePayload.landingUrl ??
                prepared.value.landingTarget.url ??
                "",
            }
          : {
              sharePayload: prepared.value.sharePayload,
              shareChannel: prepared.value.shareChannel,
              shareAttribution: prepared.value.shareAttribution,
            };
      const result = await kernel.capability.execute<ShareDispatchResult>({
        capability: dispatchCapability,
        action: dispatchCapability === "clipboard" ? "writeText" : "dispatchShare",
        payload: dispatchPayload,
      });

      if (!result.ok) {
        createShareFailure(result.error.message);
        return result;
      }

      const shareOutcome = prepared.value.sharePayload.scenario === "invite" ? "conversion" : "return";
      if (prepared.value.shortLinkRecord?.shortCode) {
        const resolved = await kernel.request.get<ShareShortLinkResolveResponse>(shareResolvePath, {
          shortCode: prepared.value.shortLinkRecord.shortCode,
        });
        if (resolved.ok) {
          store.setState({
            sharePayload: resolved.value.sharePayload,
            shareChannel: resolved.value.shareChannel,
            shareAttribution: resolved.value.shareAttribution,
            shareProviderSummary: deriveShareProviderSummary(resolved.value),
          });
        }
      }
      const recognizedPath =
        prepared.value.landingTarget.path ??
        prepared.value.sharePayload.landingPath ??
        (currentRoute.ok ? currentRoute.value?.path : undefined);
      const returnRequest: ShareReturnRecognitionRequest = {
        attributionId:
          prepared.value.shareAttribution.attributionId ??
          prepared.value.sharePayload.shareToken ??
          current.sharePayload.title,
        outcome: shareOutcome,
        ...(recognizedPath ? { recognizedPath } : {}),
        ...(session.ok && session.value?.identity.userId
          ? { recognizedUserId: session.value.identity.userId }
          : {}),
      };
      const recognized = await kernel.request.post<ShareReturnRecognitionResponse>(shareReturnPath, returnRequest);
      if (!recognized.ok) {
        createShareFailure(recognized.error.message, result.value.detail);
        return recognized;
      }

      store.setState({
        loading: false,
        errorText: undefined,
        sharePayload: recognized.value.sharePayload,
        shareChannel: recognized.value.shareChannel,
        shareAttribution: recognized.value.shareAttribution,
        shareProviderSummary: deriveShareProviderSummary(recognized.value),
        lastResult: {
          status: "succeeded",
          message:
            result.value.degraded
              ? "Native share was unavailable. Fallback dispatch completed and attribution returned through the shared backend flow."
              : dispatchCapability === "clipboard"
              ? "Share link copied and attribution returned through the shared backend flow."
              : "Native share dispatched and attribution returned through the shared backend flow.",
          ...(result.value.detail ? { detail: result.value.detail } : {}),
        },
      });

      return recognized;
    },

    async loadShareReport(attributionId?: string) {
      const targetAttributionId = attributionId ?? store.getState().shareAttribution.attributionId;
      if (!targetAttributionId) {
        createShareFailure("Share attribution report requires an attribution id.");
        return ok(undefined);
      }

      const result = await kernel.request.get<ShareAttributionReportResponse>(shareReportPath, {
        attributionId: targetAttributionId,
      });
      if (!result.ok) {
        createShareFailure(result.error.message);
        return result;
      }

      store.setState({
        loading: false,
        errorText: undefined,
        sharePayload: result.value.sharePayload,
        shareChannel: result.value.shareChannel,
        shareAttribution: result.value.shareAttribution,
        shareProviderSummary: deriveShareProviderSummary(result.value),
        lastResult: {
          status: "succeeded",
          message: "Share attribution report loaded.",
        },
      });
      return result;
    },

    retryPrimaryAction() {
      if (store.getState().uploadTask.lifecycle.canRetry && store.getState().uploadTask.taskId !== "upload_task_idle") {
        return this.retryUpload();
      }

      return this.startUpload();
    },

    clearLastResult() {
      setResult(undefined);
    },

    goToLogin() {
      return routeToOptional(loginRouteId);
    },

    goToSettings() {
      return routeToOptional(settingsRouteId);
    },
  };
}
