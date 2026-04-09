import type {
  AppRouteId,
  SharePrepareRequest,
  SharePrepareResponse,
  ShareDispatchResult,
  ShareReturnRecognitionRequest,
  ShareReturnRecognitionResponse,
  UploadCancelRequest,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadRetryRequest,
  UploadSelectionResult,
} from "@minix/contracts";
import { createStore, ok, type AppKernel } from "@minix/core";

import {
  createDefaultMediaToolsState,
  createDefaultShareAttribution,
  type MediaToolsResult,
  type MediaToolsState,
} from "../model";

export interface CreateMediaToolsControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  uploadRequestPath?: string;
  retryUploadPath?: string;
  cancelUploadPath?: string;
  sharePreparePath?: string;
  shareReturnPath?: string;
  initialState?: Partial<MediaToolsState>;
}

function cloneState(state: MediaToolsState): MediaToolsState {
  return {
    ...state,
    uploadTask: structuredClone(state.uploadTask),
    ...(state.uploadAsset ? { uploadAsset: structuredClone(state.uploadAsset) } : {}),
    ...(state.uploadError ? { uploadError: structuredClone(state.uploadError) } : {}),
    sharePayload: structuredClone(state.sharePayload),
    shareChannel: structuredClone(state.shareChannel),
    shareAttribution: structuredClone(state.shareAttribution),
    usageExamples: [...state.usageExamples],
    ...(state.lastResult ? { lastResult: { ...state.lastResult } } : {}),
  };
}

export function createMediaToolsController(options: CreateMediaToolsControllerOptions) {
  const {
    kernel,
    loginRouteId,
    settingsRouteId,
    uploadRequestPath = "/uploads",
    retryUploadPath = "/uploads/retry",
    cancelUploadPath = "/uploads/cancel",
    sharePreparePath = "/share/prepare",
    shareReturnPath = "/share/return",
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
    store.setState({
      uploadAvailable: uploadStatus?.ok ? uploadStatus.value : false,
      shareAvailable: shareStatus?.ok ? shareStatus.value : Boolean(clipboardStatus?.ok && clipboardStatus.value),
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
        createUploadFailure("Upload capability is unavailable on this host.");
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
        return ok(undefined);
      }

      const pipelineRequest: UploadPipelineRequest = {
        scenario: current.uploadTask.scenario,
        selection: value,
      };
      const pipeline = await kernel.request.post<UploadPipelineResponse>(uploadRequestPath, pipelineRequest);
      if (!pipeline.ok) {
        createUploadFailure(pipeline.error.message);
        return pipeline;
      }

      applyUploadResponse(pipeline.value, result.value.detail);
      return pipeline;
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
        createShareFailure("Share capability is unavailable on this host.");
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorText: undefined,
      });

      const current = store.getState();
      const currentRoute = kernel.router.current();
      const prepareRequest: SharePrepareRequest = {
        sharePayload: current.sharePayload,
        shareChannel: current.shareChannel,
        shareAttribution: current.shareAttribution,
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

      const dispatchCapability = prepared.value.shareChannel.kind === "copy_link" ? "clipboard" : "share";
      const dispatchAvailable = kernel.capability.status(dispatchCapability);
      if (!dispatchAvailable.ok || !dispatchAvailable.value) {
        createShareFailure(
          dispatchCapability === "clipboard"
            ? "Clipboard capability is unavailable for the copy-link share flow."
            : "Native share capability is unavailable on this host.",
        );
        return ok(undefined);
      }
      const dispatchPayload =
        dispatchCapability === "clipboard"
          ? {
              text:
                prepared.value.sharePayload.shortLink ??
                prepared.value.landingTarget.shortLink ??
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
      const recognizedPath =
        prepared.value.landingTarget.path ??
        prepared.value.sharePayload.landingPath ??
        (currentRoute.ok ? currentRoute.value?.path : undefined);
      const session = await kernel.session.get();
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
        lastResult: {
          status: "succeeded",
          message:
            dispatchCapability === "clipboard"
              ? "Share link copied and attribution returned through the shared backend flow."
              : "Native share dispatched and attribution returned through the shared backend flow.",
          ...(result.value.detail ? { detail: result.value.detail } : {}),
        },
      });

      return recognized;
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
