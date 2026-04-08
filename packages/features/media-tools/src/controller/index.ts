import type {
  AppRouteId,
  ShareDispatchResult,
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
  const { kernel, loginRouteId, settingsRouteId, initialState } = options;
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
    store.setState({
      uploadAvailable: uploadStatus?.ok ? uploadStatus.value : false,
      shareAvailable: shareStatus?.ok ? shareStatus.value : false,
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

      store.setState({
        loading: false,
        errorText: undefined,
        uploadTask: value.uploadTask,
        ...(value.uploadAsset ? { uploadAsset: value.uploadAsset } : {}),
        ...(value.uploadError ? { uploadError: value.uploadError } : {}),
        lastResult: {
          status: value.uploadError ? "failed" : "succeeded",
          message: value.uploadError ? value.uploadError.message : "Upload reservation completed.",
          ...(result.value.detail ? { detail: result.value.detail } : {}),
        },
      });

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
      const result = await kernel.capability.execute<ShareDispatchResult>({
        capability: "share",
        action: "dispatchShare",
        payload: {
          sharePayload: current.sharePayload,
          shareChannel: current.shareChannel,
          shareAttribution: current.shareAttribution,
        },
      });

      if (!result.ok) {
        createShareFailure(result.error.message);
        return result;
      }

      const sharedAt = new Date().toISOString();
      const value = result.value.value;
      const nextAttribution = value?.shareAttribution ?? {
        ...current.shareAttribution,
        shareCount: current.shareAttribution.shareCount + 1,
        lastSharedAt: sharedAt,
      };

      store.setState({
        loading: false,
        errorText: undefined,
        sharePayload: value?.sharePayload ?? current.sharePayload,
        shareChannel: value?.shareChannel ?? current.shareChannel,
        shareAttribution: nextAttribution,
        lastResult: {
          status: "succeeded",
          message: "Share payload dispatched through the platform capability adapter.",
          ...(result.value.detail ? { detail: result.value.detail } : {}),
        },
      });

      return result;
    },

    retryPrimaryAction() {
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
