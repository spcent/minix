import type {
  AppRouteId,
  FeedbackBootstrapResponse,
  FeedbackCategory,
  FeedbackFaqEntry,
  FeedbackRevisitResponse,
  FeedbackTicketDetailResponse,
  FormValidationError,
  SubmitFeedbackRequest,
  UploadAsset,
  UploadChunkRequest,
  UploadCompleteRequest,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadSelectionResult,
} from "@minix/contracts";
import { createAuthRedirectParams, createStore, ok, type AppKernel, type Result } from "@minix/core";

import {
  applyFeedbackBootstrap,
  createDefaultFeedbackState,
  type FeedbackState,
  type FeedbackValues,
} from "../model";

export interface CreateFeedbackControllerOptions {
  kernel: AppKernel;
  feedbackRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  messagesRouteId?: AppRouteId;
  cancelRouteId?: AppRouteId;
  bootstrapPath?: string;
  submitPath?: string;
  detailPath?: string;
  revisitPath?: string;
  uploadRequestPath?: string;
  uploadSessionPath?: string;
  uploadChunkPath?: string;
  uploadCompletePath?: string;
  authRedirectSource?: string;
  initialState?: Partial<FeedbackState>;
}

type FailedFeedbackResult =
  | Extract<Result<FeedbackBootstrapResponse>, { ok: false }>
  | Extract<Result<FeedbackTicketDetailResponse>, { ok: false }>
  | Extract<Result<FeedbackRevisitResponse>, { ok: false }>;

function cloneState(state: FeedbackState): FeedbackState {
  return {
    ...state,
    formValues: structuredClone(state.formValues),
    initialFormValues: structuredClone(state.initialFormValues),
    validationErrors: state.validationErrors.map((error) => ({ ...error })),
    submitState: { ...state.submitState },
    workflow: {
      ...state.workflow,
      stepKeys: [...state.workflow.stepKeys],
      visibleFieldKeys: [...state.workflow.visibleFieldKeys],
      dynamicFieldKeys: [...state.workflow.dynamicFieldKeys],
      conditionalFieldKeys: [...state.workflow.conditionalFieldKeys],
    },
    values: structuredClone(state.values),
    initialValues: structuredClone(state.initialValues),
    fieldErrors: state.fieldErrors.map((error) => ({ ...error })),
    lastSubmission: state.lastSubmission ? structuredClone(state.lastSubmission) : undefined,
    categories: state.categories.map((category) => structuredClone(category)),
    latestTicket: state.latestTicket ? structuredClone(state.latestTicket) : undefined,
    latestStatus: state.latestStatus ? structuredClone(state.latestStatus) : undefined,
    latestCategory: state.latestCategory ? structuredClone(state.latestCategory) : undefined,
    recommendedFaqEntries: state.recommendedFaqEntries.map((entry) => structuredClone(entry)),
    supportEntry: state.supportEntry ? structuredClone(state.supportEntry) : undefined,
    revisitAction: state.revisitAction ? structuredClone(state.revisitAction) : undefined,
    serviceLoopSummary: state.serviceLoopSummary,
  };
}

function buildDeviceSummary(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => typeof entry === "string" || typeof entry === "number")
    .slice(0, 4)
    .map(([key, entry]) => `${key}:${String(entry)}`);
  return entries.length > 0 ? entries.join(" · ") : undefined;
}

function resolveFaqEntries(category: FeedbackCategory | undefined, state: FeedbackState): FeedbackFaqEntry[] {
  if (state.latestStatus?.faqEntries && state.latestStatus.faqEntries.length > 0) {
    return state.latestStatus.faqEntries.map((entry) => structuredClone(entry));
  }

  if (state.recommendedFaqEntries.length > 0) {
    return state.recommendedFaqEntries.map((entry) => structuredClone(entry));
  }

  if (category?.faqEntries && category.faqEntries.length > 0) {
    return category.faqEntries.map((entry) => structuredClone(entry));
  }

  if (category?.faqEntry) {
    return [structuredClone(category.faqEntry)];
  }

  return [];
}

export function createFeedbackController(options: CreateFeedbackControllerOptions) {
  const {
    kernel,
    feedbackRouteId,
    loginRouteId,
    settingsRouteId,
    messagesRouteId,
    cancelRouteId,
    bootstrapPath = "/feedback/bootstrap",
    submitPath = "/feedback",
    detailPath = "/feedback/ticket",
    revisitPath = "/feedback/ticket/revisit",
    uploadRequestPath = "/uploads",
    uploadSessionPath = "/uploads/session",
    uploadChunkPath = "/uploads/chunk",
    uploadCompletePath = "/uploads/complete",
    authRedirectSource = "feedback",
    initialState,
  } = options;
  const store = createStore<FeedbackState>({
    ...cloneState(createDefaultFeedbackState()),
    ...initialState,
  });

  async function routeToOptional(routeId?: AppRouteId, params?: Record<string, string | number | boolean>) {
    if (!routeId) {
      return ok(undefined);
    }

    return kernel.router.toRoute(routeId, params);
  }

  async function routeToLogin() {
    if (!loginRouteId) {
      return ok(undefined);
    }

    const current = kernel.router.current();
    return kernel.router.replaceRoute(
      loginRouteId,
      createAuthRedirectParams({
        ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
        ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
        ...(authRedirectSource ? { source: authRedirectSource } : {}),
        reason: "auth-required",
      }),
    );
  }

  async function captureLocalContext() {
    const current = kernel.router.current();
    const sessionResult = await kernel.session.get();
    const capabilityStatus = kernel.capability?.status("device");
    const deviceInfo =
      capabilityStatus?.ok && capabilityStatus.value
        ? await kernel.capability?.execute({
            capability: "device",
            action: "getInfo",
          })
        : undefined;

    store.setState({
      values: {
        ...store.getState().values,
        sourcePage: current.ok && current.value?.path ? current.value.path : "/feedback",
        sourceRouteId: feedbackRouteId,
        sourceLabel: "Feedback page",
        userId: sessionResult.ok ? sessionResult.value?.identity.userId : undefined,
        platform: kernel.env?.platform ?? "h5",
        appVersion: kernel.env?.version ?? "1.0.0",
        deviceSummary: buildDeviceSummary(deviceInfo?.ok ? deviceInfo.value.value : undefined),
      },
      formValues: {
        ...store.getState().formValues,
        sourcePage: current.ok && current.value?.path ? current.value.path : "/feedback",
        sourceRouteId: feedbackRouteId,
        sourceLabel: "Feedback page",
        userId: sessionResult.ok ? sessionResult.value?.identity.userId : undefined,
        platform: kernel.env?.platform ?? "h5",
        appVersion: kernel.env?.version ?? "1.0.0",
        deviceSummary: buildDeviceSummary(deviceInfo?.ok ? deviceInfo.value.value : undefined),
      },
    });
  }

  function applyCategory(category: FeedbackCategory | undefined) {
    if (!category) {
      return;
    }

    const currentState = store.getState();
    store.setState({
      values: {
        ...currentState.values,
        categoryKey: category.key,
        type: category.type,
      },
      recommendedFaqEntries: resolveFaqEntries(category, currentState),
      supportEntry: category.supportEntry ? structuredClone(category.supportEntry) : currentState.supportEntry,
      serviceLoopSummary:
        currentState.latestStatus?.progressLabel ??
        category.description ??
        currentState.serviceLoopSummary,
      serviceHint:
        category.supportEntry?.label ??
        category.customerServiceEntryLabel ??
        currentState.serviceHint,
    });
  }

  function validateValues(values: FeedbackValues): FormValidationError[] {
    const errors: FormValidationError[] = [];
    if (!values.categoryKey.trim()) {
      errors.push({ field: "categoryKey", message: "Please choose a feedback category.", rule: "required", fieldType: "single_select", blocking: true });
    }
    if (!values.title.trim()) {
      errors.push({ field: "title", message: "Please enter a short feedback title.", rule: "required", fieldType: "text", blocking: true });
    }
    if (!values.description.trim()) {
      errors.push({ field: "description", message: "Please describe the issue or suggestion.", rule: "required", fieldType: "text", blocking: true });
    }
    if (values.type === "satisfaction" && values.satisfactionScore === undefined) {
      errors.push({ field: "satisfactionScore", message: "Please provide a satisfaction score.", rule: "cross_field", fieldType: "number", blocking: true });
    }
    return errors;
  }

  async function addUploadedAsset(kind: "screenshot" | "attachment") {
    const uploadStatus = kernel.capability?.status("upload");
    if (!kernel.capability || !uploadStatus?.ok || !uploadStatus.value) {
      store.setState({
        errorCode: "CAPABILITY_UNAVAILABLE",
        errorText: "Upload capability is unavailable on this host.",
      });
      return ok(undefined);
    }

    store.setState({
      loading: true,
      errorCode: undefined,
      errorText: undefined,
    });

    const selection = await kernel.capability.execute<UploadSelectionResult>({
      capability: "upload",
      action: "selectAsset",
      payload: {
        scenario: kind === "screenshot" ? "content" : "attachment",
        preferredFileType: kind === "screenshot" ? "image" : "attachment",
        acceptedFileTypes: kind === "screenshot" ? ["image"] : ["attachment", "pdf", "image"],
        maxSelectCount: 1,
        governance: {
          maxSizeBytes: kind === "screenshot" ? 10_000_000 : 15_000_000,
          acceptedFileTypes: kind === "screenshot" ? ["image"] : ["attachment", "pdf", "image"],
          sensitiveReviewRequired: true,
          expiresInDays: 30,
        },
      },
    });
    if (!selection.ok) {
      store.setState({
        loading: false,
        errorCode: selection.error.code,
        errorText: selection.error.message,
      });
      return selection;
    }

    const value = selection.value.value;
    if (!value) {
      store.setState({
        loading: false,
        errorCode: "INVALID_ARGUMENT",
        errorText: "The upload capability did not return a selected asset.",
      });
      return ok(undefined);
    }

    const request: UploadPipelineRequest = {
      scenario: kind === "screenshot" ? "content" : "attachment",
      selection: value,
    };
    const sessionResponse = await kernel.request.post<UploadPipelineResponse>(uploadSessionPath, request);
    let finalResponse: Result<UploadPipelineResponse> | undefined;
    if (!sessionResponse.ok) {
      finalResponse = await kernel.request.post<UploadPipelineResponse>(uploadRequestPath, request);
    } else {
      let current = sessionResponse.value;
      if (current.session && current.transfer) {
        const activeSession = current.session;
        const activeTransfer = current.transfer;
        const nextChunkIndex = activeSession.nextChunkIndex ?? current.uploadTask.uploadedChunkCount ?? 0;
        for (const chunk of activeTransfer.chunks.slice(nextChunkIndex)) {
          const chunkRequest: UploadChunkRequest = {
            taskId: current.uploadTask.taskId,
            sessionId: activeSession.sessionId,
            chunk,
          };
          const chunkResult = await kernel.request.post<UploadPipelineResponse>(uploadChunkPath, chunkRequest);
          if (!chunkResult.ok) {
            finalResponse = chunkResult;
            break;
          }
          current = chunkResult.value;
        }
        if (!finalResponse) {
          const completionRequest: UploadCompleteRequest = {
            taskId: current.uploadTask.taskId,
            sessionId: activeSession.sessionId,
            fileChecksum: activeTransfer.fileChecksum,
            checksumAlgorithm: activeTransfer.checksumAlgorithm,
          };
          finalResponse = await kernel.request.post<UploadPipelineResponse>(uploadCompletePath, completionRequest);
        }
      } else {
        finalResponse = sessionResponse;
      }
    }
    if (!finalResponse || !finalResponse.ok) {
      store.setState({
        loading: false,
        errorCode: finalResponse?.ok === false ? finalResponse.error.code : "UPLOAD_INCOMPLETE",
        errorText: finalResponse?.ok === false ? finalResponse.error.message : "Upload completion did not return a response.",
      });
      return finalResponse ?? ok(undefined);
    }

    const uploadedAsset = finalResponse.value.uploadAsset;
    if (!uploadedAsset) {
      store.setState({
        loading: false,
        errorCode: finalResponse.value.uploadError?.code,
        errorText: finalResponse.value.uploadError?.message ?? "The upload pipeline did not return a finalized asset.",
      });
      return ok(undefined);
    }

    const nextValues =
      kind === "screenshot"
        ? {
            screenshotAssets: [...store.getState().values.screenshotAssets, uploadedAsset],
          }
        : {
            attachmentAssets: [...store.getState().values.attachmentAssets, uploadedAsset],
          };

    store.setState({
      dirty: true,
      loading: false,
      errorCode: undefined,
      errorText: undefined,
      values: {
        ...store.getState().values,
        ...nextValues,
      },
      formValues: {
        ...store.getState().formValues,
        ...nextValues,
      },
    });

    return finalResponse;
  }

  async function handleFailure(result: FailedFeedbackResult) {
    store.setState({
      loading: false,
      submitting: false,
      ready: true,
      errorCode: result.error.code,
      errorText: result.error.message,
      submitState: {
        ...store.getState().submitState,
        phase: "failed",
      },
    });

    if (result.error.code === "UNAUTHORIZED") {
      await routeToLogin();
    }

    return result;
  }

  return {
    store,

    async loadInitial() {
      store.setState({
        loading: true,
        errorCode: undefined,
        errorText: undefined,
        submitState: {
          ...store.getState().submitState,
          phase: "idle",
        },
      });
      await captureLocalContext();
      const result = await kernel.request.get<FeedbackBootstrapResponse>(bootstrapPath);
      if (!result.ok) {
        return handleFailure(result);
      }

      const nextState = applyFeedbackBootstrap(store.getState(), result.value);
      const defaultCategory =
        result.value.feedbackCategories.find((category) => category.key === nextState.values.categoryKey) ??
        result.value.feedbackCategories[0];

      store.setState({
        ...nextState,
        ready: true,
        loading: false,
        errorCode: undefined,
        errorText: undefined,
      });
      applyCategory(defaultCategory);
      return result;
    },

    markReady() {
      return this.loadInitial();
    },

    updateField(values: Partial<FeedbackValues>) {
      store.setState({
        dirty: true,
        values: {
          ...store.getState().values,
          ...values,
        },
        formValues: {
          ...store.getState().formValues,
          ...values,
        },
      });
    },

    updateValues(values: Partial<FeedbackValues>) {
      this.updateField(values);
    },

    setCategory(categoryKey: string) {
      const category = store.getState().categories.find((entry) => entry.key === categoryKey);
      if (!category) {
        return;
      }

      store.setState({
        dirty: true,
        values: {
          ...store.getState().values,
          categoryKey: category.key,
          type: category.type,
        },
        formValues: {
          ...store.getState().formValues,
          categoryKey: category.key,
          type: category.type,
        },
        recommendedFaqEntries: resolveFaqEntries(category, store.getState()),
        supportEntry: category.supportEntry ? structuredClone(category.supportEntry) : store.getState().supportEntry,
        serviceLoopSummary: category.description ?? store.getState().serviceLoopSummary,
        serviceHint: category.supportEntry?.label ?? category.customerServiceEntryLabel,
      });
    },

    setType(type: FeedbackValues["type"]) {
      const category = store.getState().categories.find((entry) => entry.type === type);
      store.setState({
        dirty: true,
        values: {
          ...store.getState().values,
          type,
          ...(category ? { categoryKey: category.key } : {}),
        },
        formValues: {
          ...store.getState().formValues,
          type,
          ...(category ? { categoryKey: category.key } : {}),
        },
        ...(category
          ? {
              recommendedFaqEntries: resolveFaqEntries(category, store.getState()),
              supportEntry: category.supportEntry ? structuredClone(category.supportEntry) : store.getState().supportEntry,
              serviceLoopSummary: category.description ?? store.getState().serviceLoopSummary,
              serviceHint: category.supportEntry?.label ?? category.customerServiceEntryLabel,
            }
          : {}),
      });
    },

    toggleRevisitRequested() {
      store.setState({
        dirty: true,
        values: {
          ...store.getState().values,
          revisitRequested: !store.getState().values.revisitRequested,
        },
        formValues: {
          ...store.getState().formValues,
          revisitRequested: !store.getState().formValues.revisitRequested,
        },
      });
    },

    setSatisfactionScore(score: number) {
      store.setState({
        dirty: true,
        values: {
          ...store.getState().values,
          satisfactionScore: score,
        },
        formValues: {
          ...store.getState().formValues,
          satisfactionScore: score,
        },
      });
    },

    addSampleScreenshot() {
      return addUploadedAsset("screenshot");
    },

    addSampleAttachment() {
      return addUploadedAsset("attachment");
    },

    validateForm() {
      const errors = validateValues(store.getState().values);
      store.setState({
        fieldErrors: errors,
        validationErrors: errors,
        errorCode: undefined,
        errorText: errors.length > 0 ? "Please complete the required feedback fields." : undefined,
        submitState: {
          ...store.getState().submitState,
          phase: errors.length > 0 ? "failed" : "idle",
        },
      });
      return errors;
    },

    async submit() {
      const errors = this.validateForm();
      if (errors.length > 0) {
        return ok(undefined);
      }

      const values = store.getState().values;
      const payload: SubmitFeedbackRequest = {
        type: values.type,
        categoryKey: values.categoryKey,
        title: values.title,
        description: values.description,
        revisitRequested: values.revisitRequested,
        ...(values.satisfactionScore !== undefined ? { satisfactionScore: values.satisfactionScore } : {}),
        context: {
          sourcePage: values.sourcePage,
          ...(values.sourceRouteId ? { sourceRouteId: values.sourceRouteId } : {}),
          ...(values.sourceLabel ? { sourceLabel: values.sourceLabel } : {}),
          ...(values.userId ? { userId: values.userId } : {}),
          platform: values.platform,
          appVersion: values.appVersion,
          ...(values.deviceSummary ? { deviceSummary: values.deviceSummary } : {}),
          screenshotAssets: values.screenshotAssets,
          attachmentAssets: values.attachmentAssets,
        },
      };

      store.setState({
        submitting: true,
        errorCode: undefined,
        errorText: undefined,
        submitState: {
          ...store.getState().submitState,
          phase: "submitting",
          mode: "submit",
        },
      });

      const result = await kernel.request.post<FeedbackTicketDetailResponse>(submitPath, payload);
      if (!result.ok) {
        return handleFailure(result);
      }

      store.setState({
        ready: true,
        submitting: false,
        dirty: false,
        errorCode: undefined,
        errorText: undefined,
        fieldErrors: [],
        validationErrors: [],
        latestTicket: structuredClone(result.value.feedbackTicket),
        latestStatus: structuredClone(result.value.feedbackStatus),
        latestCategory: structuredClone(result.value.feedbackCategory),
        recommendedFaqEntries:
          result.value.feedbackStatus.faqEntries?.map((entry) => structuredClone(entry)) ??
          (result.value.feedbackCategory.faqEntries?.map((entry) => structuredClone(entry)) ??
            (result.value.feedbackCategory.faqEntry ? [structuredClone(result.value.feedbackCategory.faqEntry)] : [])),
        supportEntry:
          result.value.feedbackStatus.supportEntry
            ? structuredClone(result.value.feedbackStatus.supportEntry)
            : result.value.feedbackCategory.supportEntry
              ? structuredClone(result.value.feedbackCategory.supportEntry)
              : undefined,
        revisitAction: result.value.feedbackStatus.revisitAction
          ? structuredClone(result.value.feedbackStatus.revisitAction)
          : undefined,
        serviceLoopSummary: result.value.feedbackStatus.nextStepLabel ?? result.value.feedbackStatus.progressLabel,
        serviceHint:
          result.value.feedbackStatus.supportEntry?.label ??
          result.value.feedbackCategory.supportEntry?.label ??
          result.value.feedbackCategory.customerServiceEntryLabel,
        lastSubmission: {
          submittedAt: Date.now(),
          value: structuredClone(result.value),
        },
        submitState: {
          ...store.getState().submitState,
          phase: "submitted",
          mode: "submit",
          submittedAt: Date.now(),
          result: structuredClone(result.value),
        },
      });

      return ok(result.value);
    },

    async refreshLatestStatus(ticketId?: string) {
      const targetTicketId = ticketId ?? store.getState().latestTicket?.ticketId;
      if (!targetTicketId) {
        return ok(undefined);
      }

      const result = await kernel.request.get<FeedbackTicketDetailResponse>(detailPath, { ticketId: targetTicketId });
      if (!result.ok) {
        return handleFailure(result);
      }

      store.setState({
        latestTicket: structuredClone(result.value.feedbackTicket),
        latestStatus: structuredClone(result.value.feedbackStatus),
        latestCategory: structuredClone(result.value.feedbackCategory),
        recommendedFaqEntries:
          result.value.feedbackStatus.faqEntries?.map((entry) => structuredClone(entry)) ??
          (result.value.feedbackCategory.faqEntries?.map((entry) => structuredClone(entry)) ??
            (result.value.feedbackCategory.faqEntry ? [structuredClone(result.value.feedbackCategory.faqEntry)] : [])),
        supportEntry:
          result.value.feedbackStatus.supportEntry
            ? structuredClone(result.value.feedbackStatus.supportEntry)
            : result.value.feedbackCategory.supportEntry
              ? structuredClone(result.value.feedbackCategory.supportEntry)
              : undefined,
        revisitAction: result.value.feedbackStatus.revisitAction
          ? structuredClone(result.value.feedbackStatus.revisitAction)
          : undefined,
        serviceLoopSummary: result.value.feedbackStatus.nextStepLabel ?? result.value.feedbackStatus.progressLabel,
        serviceHint:
          result.value.feedbackStatus.supportEntry?.label ??
          result.value.feedbackCategory.supportEntry?.label ??
          result.value.feedbackCategory.customerServiceEntryLabel,
      });

      return result;
    },

    openSupportEntry() {
      const supportEntry = store.getState().supportEntry;
      if (!supportEntry) {
        return ok(undefined);
      }

      if (supportEntry.channel === "messages") {
        return routeToOptional(
          supportEntry.routeId ?? messagesRouteId,
          supportEntry.threadId ? { threadId: supportEntry.threadId } : undefined,
        );
      }

      return routeToOptional(supportEntry.routeId ?? settingsRouteId);
    },

    openFaq(entryId?: string) {
      const faqEntry =
        store.getState().recommendedFaqEntries.find((entry) => entry.entryId === entryId) ??
        store.getState().recommendedFaqEntries[0];
      if (!faqEntry) {
        return ok(undefined);
      }

      store.setState({
        serviceLoopSummary: faqEntry.summary,
        serviceHint: faqEntry.title,
      });
      return ok(faqEntry);
    },

    async revisitLatestTicket(userMessage?: string) {
      const ticketId = store.getState().latestTicket?.ticketId;
      if (!ticketId) {
        return ok(undefined);
      }

      store.setState({
        submitting: true,
        errorCode: undefined,
        errorText: undefined,
        submitState: {
          ...store.getState().submitState,
          phase: "submitting",
          mode: "submit",
        },
      });

      const result = await kernel.request.post<FeedbackRevisitResponse>(revisitPath, {
        ticketId,
        ...(userMessage ? { userMessage } : {}),
      });
      if (!result.ok) {
        return handleFailure(result);
      }

      store.setState({
        submitting: false,
        latestTicket: structuredClone(result.value.feedbackTicket),
        latestStatus: structuredClone(result.value.feedbackStatus),
        latestCategory: structuredClone(result.value.feedbackCategory),
        recommendedFaqEntries:
          result.value.feedbackStatus.faqEntries?.map((entry) => structuredClone(entry)) ??
          (result.value.feedbackCategory.faqEntries?.map((entry) => structuredClone(entry)) ??
            (result.value.feedbackCategory.faqEntry ? [structuredClone(result.value.feedbackCategory.faqEntry)] : [])),
        supportEntry:
          result.value.feedbackStatus.supportEntry
            ? structuredClone(result.value.feedbackStatus.supportEntry)
            : result.value.feedbackCategory.supportEntry
              ? structuredClone(result.value.feedbackCategory.supportEntry)
              : undefined,
        revisitAction: result.value.feedbackStatus.revisitAction
          ? structuredClone(result.value.feedbackStatus.revisitAction)
          : undefined,
        serviceLoopSummary: result.value.feedbackStatus.nextStepLabel ?? result.value.feedbackStatus.progressLabel,
        serviceHint:
          result.value.feedbackStatus.supportEntry?.label ??
          result.value.feedbackCategory.supportEntry?.label ??
          result.value.feedbackCategory.customerServiceEntryLabel,
        submitState: {
          ...store.getState().submitState,
          phase: "submitted",
          mode: "submit",
          submittedAt: Date.now(),
          result: structuredClone(result.value),
        },
      });

      return ok(result.value);
    },

    goToLogin() {
      return routeToOptional(loginRouteId);
    },

    goToSettings() {
      return routeToOptional(settingsRouteId);
    },

    cancel() {
      return routeToOptional(cancelRouteId);
    },
  };
}
