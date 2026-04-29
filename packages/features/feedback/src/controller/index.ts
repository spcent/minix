import type {
  AppRouteId,
  FeedbackTicketActionRequest,
  FeedbackTicketActionResponse,
  FeedbackBootstrapResponse,
  FeedbackCategory,
  FeedbackFaqEntry,
  ListFeedbackTicketsRequest,
  ListFeedbackTicketsResponse,
  FeedbackRevisitResponse,
  FeedbackTicketDetailResponse,
  FormApprovalNode,
  FormFieldDefinition,
  FormSchema,
  FormValidationError,
  SubmitFeedbackRequest,
  UploadAsset,
  UploadChunkRequest,
  UploadCompleteRequest,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadSelectionResult,
} from "@minix/contracts";
import {
  beginFormSubmit,
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  createControllerRouterHelpers,
  createFormDraftState,
  createFormSchema,
  createFormSubmissionKey,
  createFormWorkflowState,
  createStore,
  finalizeFormSubmit,
  ok,
  type AppKernel,
  type Result,
} from "@minix/core";

import {
  applyFeedbackBootstrap,
  createDefaultFeedbackState,
  type FeedbackDraftSnapshot,
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
  listPath?: string;
  actionPath?: string;
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
  | Extract<Result<FeedbackRevisitResponse>, { ok: false }>
  | Extract<Result<ListFeedbackTicketsResponse>, { ok: false }>
  | Extract<Result<FeedbackTicketActionResponse>, { ok: false }>;

function cloneState(state: FeedbackState): FeedbackState {
  return {
    ...state,
    formValues: cloneStateSnapshot(state.formValues),
    initialFormValues: cloneStateSnapshot(state.initialFormValues),
    validationErrors: cloneStateSnapshotArray(state.validationErrors),
    submitState: cloneStateSnapshot(state.submitState),
    schema: {
      fields: cloneStateSnapshotArray(state.schema.fields),
      steps: cloneStateSnapshotArray(state.schema.steps),
    },
    workflow: {
      ...state.workflow,
      stepKeys: [...state.workflow.stepKeys],
      visibleFieldKeys: [...state.workflow.visibleFieldKeys],
      dynamicFieldKeys: [...state.workflow.dynamicFieldKeys],
      conditionalFieldKeys: [...state.workflow.conditionalFieldKeys],
      ...(state.workflow.approvalNodes
        ? { approvalNodes: cloneStateSnapshotArray(state.workflow.approvalNodes) }
        : {}),
      ...(state.workflow.draft ? { draft: cloneStateSnapshot(state.workflow.draft) } : {}),
    },
    values: cloneStateSnapshot(state.values),
    initialValues: cloneStateSnapshot(state.initialValues),
    fieldErrors: cloneStateSnapshotArray(state.fieldErrors),
    lastSubmission: state.lastSubmission ? cloneStateSnapshot(state.lastSubmission) : undefined,
    categories: cloneStateSnapshotArray(state.categories),
    latestTicket: state.latestTicket ? cloneStateSnapshot(state.latestTicket) : undefined,
    latestStatus: state.latestStatus ? cloneStateSnapshot(state.latestStatus) : undefined,
    latestCategory: state.latestCategory ? cloneStateSnapshot(state.latestCategory) : undefined,
    ticketList: state.ticketList ? cloneStateSnapshot(state.ticketList) : undefined,
    selectedTicketId: state.selectedTicketId,
    recommendedFaqEntries: cloneStateSnapshotArray(state.recommendedFaqEntries),
    faqCatalog: cloneStateSnapshotArray(state.faqCatalog),
    supportEntries: cloneStateSnapshotArray(state.supportEntries),
    supportEntry: state.supportEntry ? cloneStateSnapshot(state.supportEntry) : undefined,
    revisitAction: state.revisitAction ? cloneStateSnapshot(state.revisitAction) : undefined,
    queueDashboards: cloneStateSnapshotArray(state.queueDashboards),
    slaRules: cloneStateSnapshotArray(state.slaRules),
    handlingReport: state.handlingReport ? cloneStateSnapshot(state.handlingReport) : undefined,
    serviceLoopSummary: state.serviceLoopSummary,
  };
}

const feedbackDraftStorageKey = "@minix/feedback/form-draft/v1";

function createFeedbackDraftState(input: {
  savedAt: number;
  restored?: boolean;
}): FeedbackState["workflow"]["draft"] {
  return createFormDraftState({
    draftId: "feedback-form",
    recoveryKey: feedbackDraftStorageKey,
    savedAt: input.savedAt,
    ...(input.restored ? { restored: true } : {}),
  });
}

function createFeedbackSchema(values: FeedbackValues, categories: FeedbackCategory[]): FormSchema {
  const typeOptions = Array.from(new Set(categories.map((category) => category.type))).map((type) => ({
    key: type,
    label: type.replaceAll("_", " "),
  }));
  const categoryOptions = categories.map((category) => ({
    key: category.key,
    label: category.label,
    ...(category.description ? { description: category.description } : {}),
  }));
  const fields: FormFieldDefinition[] = [
    {
      key: "type",
      label: "Feedback type",
      type: "single_select",
      required: true,
      dynamic: true,
      stepKey: "classify",
      options: typeOptions,
    },
    {
      key: "categoryKey",
      label: "Category",
      type: "single_select",
      required: true,
      dynamic: true,
      stepKey: "classify",
      options: categoryOptions,
    },
    {
      key: "title",
      label: "Title",
      type: "text",
      required: true,
      stepKey: "details",
      placeholder: "Short summary",
    },
    {
      key: "description",
      label: "Description",
      type: "rich_text",
      required: true,
      stepKey: "details",
      richTextToolbar: "placeholder",
    },
    {
      key: "satisfactionScore",
      label: "Satisfaction score",
      type: "number",
      dynamic: true,
      stepKey: "details",
      conditions: [{ field: "type", operator: "eq", value: "satisfaction" }],
    },
    {
      key: "revisitRequested",
      label: "Need follow-up",
      type: "single_select",
      dynamic: true,
      stepKey: "followup",
    },
    {
      key: "screenshotAssets",
      label: "Screenshots",
      type: "upload_reference",
      dynamic: true,
      stepKey: "attachments",
      uploadRole: "feedback-screenshot",
    },
    {
      key: "attachmentAssets",
      label: "Attachments",
      type: "upload_reference",
      dynamic: true,
      stepKey: "attachments",
      uploadRole: "feedback-attachment",
      conditions: [{ field: "categoryKey", operator: "neq", value: "satisfaction" }],
    },
  ];

  return createFormSchema({
    fields,
    steps: [
      { key: "classify", label: "Classify" },
      { key: "details", label: "Details" },
      { key: "attachments", label: "Attachments" },
      { key: "followup", label: "Follow-up" },
    ],
  });
}

function createFeedbackApprovalNodes(
  values: FeedbackValues,
  latestStatus: FeedbackState["latestStatus"],
): FormApprovalNode[] {
  if (!values.revisitRequested && !latestStatus) {
    return [];
  }

  const triageState =
    latestStatus?.state === "submitted" || latestStatus?.state === "triaged" || latestStatus?.state === "in_progress"
      ? "pending"
      : latestStatus
        ? "approved"
        : "pending";
  const resolutionState =
    latestStatus?.revisitRequired || latestStatus?.state === "waiting_user"
      ? "pending"
      : latestStatus?.state === "resolved" || latestStatus?.state === "closed"
        ? "approved"
        : "not_started";

  return [
    {
      nodeKey: "support-triage",
      label: "Support triage",
      state: triageState,
      assigneeLabel: "Support Desk",
      comment: latestStatus?.progressLabel ?? "Support reviews the submission and routes it into the handling queue.",
    },
    {
      nodeKey: "resolution-followup",
      label: "Resolution follow-up",
      state: resolutionState,
      assigneeLabel: "Case Owner",
      comment: latestStatus?.nextStepLabel ?? "Additional user replies are collected before the ticket closes.",
    },
  ];
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
    return cloneStateSnapshotArray(state.latestStatus.faqEntries);
  }

  if (state.recommendedFaqEntries.length > 0) {
    return cloneStateSnapshotArray(state.recommendedFaqEntries);
  }

  if (category?.faqEntries && category.faqEntries.length > 0) {
    return cloneStateSnapshotArray(category.faqEntries);
  }

  if (category?.faqEntry) {
    return [cloneStateSnapshot(category.faqEntry)];
  }

  return [];
}

function createTicketListUpdate(
  currentList: FeedbackState["ticketList"],
  detail: FeedbackTicketDetailResponse,
): FeedbackState["ticketList"] | undefined {
  if (!currentList) {
    return currentList;
  }

  const summary = {
    ticketId: detail.feedbackTicket.ticketId,
    title: detail.feedbackTicket.title,
    categoryKey: detail.feedbackTicket.categoryKey,
    categoryLabel: detail.feedbackCategory.label,
    type: detail.feedbackTicket.type,
    state: detail.feedbackStatus.state,
    priority: detail.feedbackTicket.priority,
    labels: [...detail.feedbackTicket.labels],
    revisitRequired: detail.feedbackStatus.revisitRequired,
    ...(detail.feedbackStatus.queueKey ? { queueKey: detail.feedbackStatus.queueKey } : {}),
    ...(detail.feedbackStatus.queueLabel ? { queueLabel: detail.feedbackStatus.queueLabel } : {}),
    ...(detail.feedbackStatus.assignee ? { assignee: cloneStateSnapshot(detail.feedbackStatus.assignee) } : {}),
    ...(detail.feedbackStatus.sla ? { sla: cloneStateSnapshot(detail.feedbackStatus.sla) } : {}),
    ...(detail.feedbackTicket.supportThreadId ? { supportThreadId: detail.feedbackTicket.supportThreadId } : {}),
    lastUpdatedAt: detail.feedbackTicket.updatedAt,
  };

  const existingIndex = currentList.items.findIndex((item) => item.ticketId === summary.ticketId);
  const items =
    existingIndex >= 0
      ? currentList.items.map((item, index) => (index === existingIndex ? summary : cloneStateSnapshot(item)))
      : [summary, ...cloneStateSnapshotArray(currentList.items)];

  return {
    ...cloneStateSnapshot(currentList),
    items,
    total: existingIndex >= 0 ? currentList.total : currentList.total + 1,
    selectedTicketId: summary.ticketId,
  };
}

function createDetailStatePatch(
  currentState: FeedbackState,
  detail: FeedbackTicketDetailResponse,
): Partial<FeedbackState> {
  return {
    latestTicket: cloneStateSnapshot(detail.feedbackTicket),
    latestStatus: cloneStateSnapshot(detail.feedbackStatus),
    latestCategory: cloneStateSnapshot(detail.feedbackCategory),
    selectedTicketId: detail.feedbackTicket.ticketId,
    ticketList: createTicketListUpdate(currentState.ticketList, detail),
    recommendedFaqEntries:
      detail.feedbackStatus.faqEntries
        ? cloneStateSnapshotArray(detail.feedbackStatus.faqEntries)
        : detail.feedbackCategory.faqEntries
          ? cloneStateSnapshotArray(detail.feedbackCategory.faqEntries)
          : detail.feedbackCategory.faqEntry
            ? [cloneStateSnapshot(detail.feedbackCategory.faqEntry)]
            : [],
    supportEntry:
      detail.feedbackStatus.supportEntry
        ? cloneStateSnapshot(detail.feedbackStatus.supportEntry)
        : detail.feedbackCategory.supportEntry
          ? cloneStateSnapshot(detail.feedbackCategory.supportEntry)
          : undefined,
    revisitAction: detail.feedbackStatus.revisitAction ? cloneStateSnapshot(detail.feedbackStatus.revisitAction) : undefined,
    handlingReport: detail.feedbackStatus.handlingReport ? cloneStateSnapshot(detail.feedbackStatus.handlingReport) : undefined,
    serviceLoopSummary:
      detail.feedbackStatus.supportLoopSummary ?? detail.feedbackStatus.nextStepLabel ?? detail.feedbackStatus.progressLabel,
    serviceHint:
      detail.feedbackStatus.supportEntry?.label ??
      detail.feedbackCategory.supportEntry?.label ??
      detail.feedbackCategory.customerServiceEntryLabel,
  };
}

function createFeedbackWorkflow(
  values: FeedbackValues,
  state: Pick<FeedbackState, "categories" | "latestStatus">,
  currentStepKey?: string,
  draft?: FeedbackState["workflow"]["draft"],
) {
  const schema = createFeedbackSchema(values, state.categories);
  const approvalNodes = createFeedbackApprovalNodes(values, state.latestStatus);
  const approvalState = approvalNodes.some((node) => node.state === "pending")
    ? "pending"
    : approvalNodes.some((node) => node.state === "approved")
      ? "approved"
      : "none";

  return {
    schema,
    workflow: createFormWorkflowState({
      values,
      schema,
      approvalState,
      ...(currentStepKey ? { currentStepKey } : {}),
      ...(approvalNodes.length > 0 ? { approvalNodes } : {}),
      ...(draft ? { draft } : {}),
    }),
  };
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
    listPath = "/feedback/tickets",
    actionPath = "/feedback/ticket/action",
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
  const { routeToLogin, routeToOptional } = createControllerRouterHelpers({
    kernel,
    loginRouteId,
    authRedirectSource,
  });

  function applyFeedbackValues(
    values: FeedbackValues,
    options: {
      dirty?: boolean;
      currentStepKey?: string;
      draft?: FeedbackState["workflow"]["draft"];
      phase?: FeedbackState["submitState"]["phase"];
    } = {},
  ) {
    const current = store.getState();
    const { schema, workflow } = createFeedbackWorkflow(
      values,
      {
        categories: current.categories,
        latestStatus: current.latestStatus,
      },
      options.currentStepKey ?? current.workflow.currentStepKey,
      options.draft,
    );
    store.setState({
      dirty: options.dirty ?? current.dirty,
      values,
      formValues: cloneStateSnapshot(values),
      schema,
      workflow,
      fieldErrors: [],
      validationErrors: [],
      submitState: {
        ...current.submitState,
        phase: options.phase ?? current.submitState.phase,
      },
    });
  }

  async function loadDraftState() {
    if (!kernel.storage) {
      return ok<FeedbackDraftSnapshot | undefined>(undefined);
    }

    return kernel.storage.get<FeedbackDraftSnapshot>(feedbackDraftStorageKey);
  }

  async function clearDraftState() {
    if (!kernel.storage) {
      return ok(undefined);
    }

    return kernel.storage.remove(feedbackDraftStorageKey);
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
      supportEntry: category.supportEntry ? cloneStateSnapshot(category.supportEntry) : currentState.supportEntry,
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

    applyFeedbackValues(
      {
        ...store.getState().values,
        ...nextValues,
      },
      {
        dirty: true,
        ...(store.getState().workflow.currentStepKey
          ? { currentStepKey: store.getState().workflow.currentStepKey }
          : {}),
        ...(store.getState().workflow.draft ? { draft: store.getState().workflow.draft } : {}),
      },
    );
    store.setState({
      loading: false,
      errorCode: undefined,
      errorText: undefined,
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
      const draftResult = await loadDraftState();
      const draftSnapshot = draftResult.ok ? draftResult.value : undefined;
      const restoredValues =
        draftSnapshot?.values !== undefined
          ? {
              ...nextState.values,
              ...cloneStateSnapshot(draftSnapshot.values),
            }
          : nextState.values;
      const { schema, workflow } = createFeedbackWorkflow(
        restoredValues,
        {
          categories: nextState.categories,
          latestStatus: nextState.latestStatus,
        },
        draftSnapshot?.currentStepKey,
        draftSnapshot?.savedAt !== undefined
          ? createFeedbackDraftState({
              savedAt: draftSnapshot.savedAt,
              restored: true,
            })
          : undefined,
      );
      const defaultCategory =
        result.value.feedbackCategories.find((category) => category.key === restoredValues.categoryKey) ??
        result.value.feedbackCategories[0];

      store.setState({
        ...nextState,
        ready: true,
        loading: false,
        errorCode: undefined,
        errorText: undefined,
        dirty: Boolean(draftSnapshot),
        values: restoredValues,
        formValues: cloneStateSnapshot(restoredValues),
        initialValues: cloneStateSnapshot(nextState.values),
        initialFormValues: cloneStateSnapshot(nextState.values),
        schema,
        workflow,
        submitState: {
          ...nextState.submitState,
          ...(draftSnapshot?.savedAt !== undefined ? { draftSavedAt: draftSnapshot.savedAt } : {}),
        },
      });
      applyCategory(defaultCategory);
      return result;
    },

    markReady() {
      return this.loadInitial();
    },

    updateField(values: Partial<FeedbackValues>) {
      applyFeedbackValues(
        {
          ...store.getState().values,
          ...values,
        },
        {
          dirty: true,
          ...(store.getState().workflow.draft ? { draft: store.getState().workflow.draft } : {}),
        },
      );
    },

    updateValues(values: Partial<FeedbackValues>) {
      this.updateField(values);
    },

    setCategory(categoryKey: string) {
      const category = store.getState().categories.find((entry) => entry.key === categoryKey);
      if (!category) {
        return;
      }

      const nextValues = {
        ...store.getState().values,
        categoryKey: category.key,
        type: category.type,
      };
      const nextDerived = createFeedbackWorkflow(
        nextValues,
        {
          categories: store.getState().categories,
          latestStatus: store.getState().latestStatus,
        },
        store.getState().workflow.currentStepKey,
        store.getState().workflow.draft,
      );
      store.setState({
        dirty: true,
        values: nextValues,
        formValues: cloneStateSnapshot(nextValues),
        schema: nextDerived.schema,
        workflow: nextDerived.workflow,
        recommendedFaqEntries: resolveFaqEntries(category, store.getState()),
        supportEntry: category.supportEntry ? cloneStateSnapshot(category.supportEntry) : store.getState().supportEntry,
        serviceLoopSummary: category.description ?? store.getState().serviceLoopSummary,
        serviceHint: category.supportEntry?.label ?? category.customerServiceEntryLabel,
      });
    },

    setType(type: FeedbackValues["type"]) {
      const category = store.getState().categories.find((entry) => entry.type === type);
      const nextValues = {
        ...store.getState().values,
        type,
        ...(category ? { categoryKey: category.key } : {}),
      };
      const nextDerived = createFeedbackWorkflow(
        nextValues,
        {
          categories: store.getState().categories,
          latestStatus: store.getState().latestStatus,
        },
        store.getState().workflow.currentStepKey,
        store.getState().workflow.draft,
      );
      store.setState({
        dirty: true,
        values: nextValues,
        formValues: cloneStateSnapshot(nextValues),
        schema: nextDerived.schema,
        workflow: nextDerived.workflow,
        ...(category
          ? {
              recommendedFaqEntries: resolveFaqEntries(category, store.getState()),
              supportEntry: category.supportEntry ? cloneStateSnapshot(category.supportEntry) : store.getState().supportEntry,
              serviceLoopSummary: category.description ?? store.getState().serviceLoopSummary,
              serviceHint: category.supportEntry?.label ?? category.customerServiceEntryLabel,
            }
          : {}),
      });
    },

    toggleRevisitRequested() {
      applyFeedbackValues(
        {
          ...store.getState().values,
          revisitRequested: !store.getState().values.revisitRequested,
        },
        {
          dirty: true,
          ...(store.getState().workflow.draft ? { draft: store.getState().workflow.draft } : {}),
        },
      );
    },

    setSatisfactionScore(score: number) {
      applyFeedbackValues(
        {
          ...store.getState().values,
          satisfactionScore: score,
        },
        {
          dirty: true,
          ...(store.getState().workflow.draft ? { draft: store.getState().workflow.draft } : {}),
        },
      );
    },

    setStep(stepKey: string) {
      if (!store.getState().workflow.stepKeys.includes(stepKey)) {
        return ok(undefined);
      }

      store.setState({
        workflow: {
          ...store.getState().workflow,
          currentStepKey: stepKey,
        },
      });
      return ok(undefined);
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

    async saveDraft() {
      if (!kernel.storage) {
        store.setState({
          errorText: "Feedback drafts are unavailable on this host.",
          submitState: {
            ...store.getState().submitState,
            phase: "failed",
          },
        });
        return ok(undefined);
      }

      const snapshot: FeedbackDraftSnapshot = {
        savedAt: Date.now(),
        values: cloneStateSnapshot(store.getState().values),
        ...(store.getState().workflow.currentStepKey ? { currentStepKey: store.getState().workflow.currentStepKey } : {}),
      };
      const submissionKey = createFormSubmissionKey("feedback-form", "draft", snapshot.values);
      const nextSubmit = beginFormSubmit(store.getState().submitState, {
        mode: "draft",
        submissionKey,
      });
      if (nextSubmit.blocked) {
        store.setState({
          submitState: nextSubmit.submitState,
          serviceLoopSummary: "This feedback draft is already saved.",
        });
        return ok(undefined);
      }

      store.setState({
        submitState: nextSubmit.submitState,
      });
      const result = await kernel.storage.set(feedbackDraftStorageKey, snapshot);
      if (!result.ok) {
        store.setState({
          errorText: result.error.message,
          submitState: {
            ...store.getState().submitState,
            phase: "failed",
          },
        });
        return result;
      }

      const nextDraft = createFeedbackDraftState({
        savedAt: snapshot.savedAt,
      });
      store.setState({
        dirty: true,
        workflow: createFeedbackWorkflow(
          store.getState().values,
          {
            categories: store.getState().categories,
            latestStatus: store.getState().latestStatus,
          },
          store.getState().workflow.currentStepKey,
          nextDraft,
        ).workflow,
        submitState: finalizeFormSubmit(store.getState().submitState, {
          mode: "draft",
          submissionKey,
          submittedAt: snapshot.savedAt,
          draftSavedAt: snapshot.savedAt,
        }),
        serviceLoopSummary: "Feedback draft saved for recovery.",
      });
      return ok(undefined);
    },

    async submit() {
      const errors = this.validateForm();
      if (errors.length > 0) {
        return ok(undefined);
      }

      const values = store.getState().values;
      const submissionKey = createFormSubmissionKey("feedback-form", "submit", values);
      const nextSubmit = beginFormSubmit(store.getState().submitState, {
        mode: "submit",
        submissionKey,
      });
      if (nextSubmit.blocked) {
        store.setState({
          submitState: nextSubmit.submitState,
          serviceLoopSummary: "This feedback form was already submitted.",
        });
        return ok(undefined);
      }

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
          sourceContext: {
            pagePath: values.sourcePage,
            ...(values.sourceRouteId ? { routeId: values.sourceRouteId } : {}),
            ...(values.sourceLabel ? { label: values.sourceLabel } : {}),
          },
          actorContext: {
            ...(values.userId ? { userId: values.userId } : {}),
            platform: values.platform,
            appVersion: values.appVersion,
            ...(values.deviceSummary ? { deviceSummary: values.deviceSummary } : {}),
          },
          screenshotAssets: values.screenshotAssets,
          attachmentAssets: values.attachmentAssets,
        },
      };

      store.setState({
        submitting: true,
        errorCode: undefined,
        errorText: undefined,
        submitState: nextSubmit.submitState,
      });

      const result = await kernel.request.post<FeedbackTicketDetailResponse>(submitPath, payload);
      if (!result.ok) {
        return handleFailure(result);
      }

      await clearDraftState();
      const submittedAt = Date.now();
      const nextDerived = createFeedbackWorkflow(
        store.getState().values,
        {
          categories: store.getState().categories,
          latestStatus: result.value.feedbackStatus,
        },
        store.getState().workflow.currentStepKey,
      );
      store.setState({
        ready: true,
        submitting: false,
        dirty: false,
        errorCode: undefined,
        errorText: undefined,
        fieldErrors: [],
        validationErrors: [],
        ...createDetailStatePatch(store.getState(), result.value),
        schema: nextDerived.schema,
        workflow: nextDerived.workflow,
        lastSubmission: {
          submittedAt,
          value: cloneStateSnapshot(result.value),
        },
        submitState: finalizeFormSubmit(store.getState().submitState, {
          mode: "submit",
          submissionKey,
          submittedAt,
          result: cloneStateSnapshot(result.value),
        }),
      });

      return ok(result.value);
    },

    async refreshLatestStatus(ticketId?: string) {
      const targetTicketId = ticketId ?? store.getState().selectedTicketId ?? store.getState().latestTicket?.ticketId;
      if (!targetTicketId) {
        return ok(undefined);
      }

      const result = await kernel.request.get<FeedbackTicketDetailResponse>(detailPath, { ticketId: targetTicketId });
      if (!result.ok) {
        return handleFailure(result);
      }

      const nextDerived = createFeedbackWorkflow(
        store.getState().values,
        {
          categories: store.getState().categories,
          latestStatus: result.value.feedbackStatus,
        },
        store.getState().workflow.currentStepKey,
        store.getState().workflow.draft,
      );
      store.setState({
        ...createDetailStatePatch(store.getState(), result.value),
        schema: nextDerived.schema,
        workflow: nextDerived.workflow,
      });

      return result;
    },

    async loadTickets(query: ListFeedbackTicketsRequest = {}) {
      const result = await kernel.request.get<ListFeedbackTicketsResponse>(listPath, {
        ...(query.page !== undefined ? { page: query.page } : {}),
        ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
        ...(query.state !== undefined ? { state: query.state } : {}),
        ...(query.categoryKey !== undefined ? { categoryKey: query.categoryKey } : {}),
        ...(query.keyword !== undefined ? { keyword: query.keyword } : {}),
      });
      if (!result.ok) {
        return handleFailure(result);
      }

      store.setState({
        ticketList: cloneStateSnapshot(result.value.ticketList),
        selectedTicketId: result.value.ticketList.selectedTicketId ?? result.value.ticketList.items[0]?.ticketId,
        faqCatalog: cloneStateSnapshotArray(result.value.faqCatalog),
        supportEntries: cloneStateSnapshotArray(result.value.supportEntries),
        queueDashboards: cloneStateSnapshotArray(result.value.queueDashboards ?? []),
        slaRules: cloneStateSnapshotArray(result.value.slaRules ?? []),
      });
      return result;
    },

    async openTicket(ticketId: string) {
      const result = await this.refreshLatestStatus(ticketId);
      if (!result.ok) {
        return result;
      }

      store.setState({
        selectedTicketId: ticketId,
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

      const nextDerived = createFeedbackWorkflow(
        store.getState().values,
        {
          categories: store.getState().categories,
          latestStatus: result.value.feedbackStatus,
        },
        store.getState().workflow.currentStepKey,
        store.getState().workflow.draft,
      );
      store.setState({
        submitting: false,
        ...createDetailStatePatch(store.getState(), result.value),
        schema: nextDerived.schema,
        workflow: nextDerived.workflow,
        submitState: {
          ...store.getState().submitState,
          phase: "submitted",
          mode: "submit",
          submittedAt: Date.now(),
          result: cloneStateSnapshot(result.value),
        },
      });

      return ok(result.value);
    },

    async performTicketAction(input: FeedbackTicketActionRequest) {
      store.setState({
        submitting: true,
        errorCode: undefined,
        errorText: undefined,
      });

      const result = await kernel.request.post<FeedbackTicketActionResponse>(actionPath, input);
      if (!result.ok) {
        return handleFailure(result);
      }

      const nextDerived = createFeedbackWorkflow(
        store.getState().values,
        {
          categories: store.getState().categories,
          latestStatus: result.value.feedbackStatus,
        },
        store.getState().workflow.currentStepKey,
        store.getState().workflow.draft,
      );
      store.setState({
        submitting: false,
        ...createDetailStatePatch(store.getState(), result.value),
        ticketList: cloneStateSnapshot(result.value.ticketList),
        schema: nextDerived.schema,
        workflow: nextDerived.workflow,
        submitState: {
          ...store.getState().submitState,
          phase: "submitted",
          mode: "submit",
          submittedAt: Date.now(),
          result: cloneStateSnapshot(result.value),
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
