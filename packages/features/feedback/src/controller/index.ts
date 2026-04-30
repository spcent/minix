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
  FormValidationError,
  UploadAsset,
} from "@minix/contracts";
import {
  cloneFormPageState,
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  createControllerRouterHelpers,
  createStore,
  ok,
  runFormDraftFlow,
  runFormSubmitFlow,
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
import {
  createFeedbackDraftState,
  createFeedbackWorkflow,
  feedbackDraftStorageKey,
} from "./form-schema";
import {
  createDetailStatePatch,
  createFeedbackTicketsRequestQuery,
  createTicketListStatePatch,
} from "./ticket-list";
import { applyFeedbackFailure, createSubmitFeedbackPayload } from "./submit-flow";
import { addFeedbackUploadedAsset, type FeedbackUploadKind } from "./upload-workflow";

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
  return cloneFormPageState(state) as FeedbackState;
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

  async function addUploadedAsset(kind: FeedbackUploadKind) {
    return addFeedbackUploadedAsset({
      kernel,
      store,
      kind,
      paths: {
        uploadRequestPath,
        uploadSessionPath,
        uploadChunkPath,
        uploadCompletePath,
      },
      applyFeedbackValues,
    });
  }

  async function handleFailure(result: FailedFeedbackResult) {
    return applyFeedbackFailure({ store, result, routeToLogin });
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

      return runFormDraftFlow({
        scope: "feedback-form",
        submitState: store.getState().submitState,
        snapshot,
        persist: (draftSnapshot) => kernel.storage.set(feedbackDraftStorageKey, draftSnapshot),
        onStarted: (submitState) => {
          store.setState({ submitState });
        },
        onDuplicate: (submitState) => {
          store.setState({
            submitState,
            serviceLoopSummary: "This feedback draft is already saved.",
          });
        },
        onFailure: (result) => {
          store.setState({
            errorText: result.error.message,
            submitState: {
              ...store.getState().submitState,
              phase: "failed",
            },
          });
        },
        onSuccess: ({ snapshot: draftSnapshot, submitState }) => {
          const nextDraft = createFeedbackDraftState({
            savedAt: draftSnapshot.savedAt,
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
            submitState,
            serviceLoopSummary: "Feedback draft saved for recovery.",
          });
        },
      });
    },

    async submit() {
      const errors = this.validateForm();
      if (errors.length > 0) {
        return ok(undefined);
      }

      const values = store.getState().values;
      return runFormSubmitFlow({
        scope: "feedback-form",
        submitState: store.getState().submitState,
        values,
        submit: (submitValues) => kernel.request.post<FeedbackTicketDetailResponse>(submitPath, createSubmitFeedbackPayload(submitValues)),
        onStarted: (submitState) => {
          store.setState({
            submitting: true,
            errorCode: undefined,
            errorText: undefined,
            submitState,
          });
        },
        onDuplicate: (submitState) => {
          store.setState({
            submitState,
            serviceLoopSummary: "This feedback form was already submitted.",
          });
        },
        onFailure: async ({ result }) => {
          await handleFailure(result);
        },
        onSuccess: async ({ result, submittedAt, submitState }) => {
          await clearDraftState();
          const nextDerived = createFeedbackWorkflow(
            store.getState().values,
            {
              categories: store.getState().categories,
              latestStatus: result.feedbackStatus,
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
            ...createDetailStatePatch(store.getState(), result),
            schema: nextDerived.schema,
            workflow: nextDerived.workflow,
            lastSubmission: {
              submittedAt,
              value: cloneStateSnapshot(result),
            },
            submitState: {
              ...submitState,
              result: cloneStateSnapshot(result),
            },
          });
        },
      });
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
      const result = await kernel.request.get<ListFeedbackTicketsResponse>(listPath, createFeedbackTicketsRequestQuery(query));
      if (!result.ok) {
        return handleFailure(result);
      }

      store.setState(createTicketListStatePatch(result.value));
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
