import {
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  createControllerRouterHelpers,
  createListStatus,
  createSearchListRequestFlow,
  createStore,
  createSingleFlightHydrator,
  normalizeSearchKeyword,
  ok,
  pushRecentSearchKeyword,
  runFormDraftFlow,
  runFormSubmitFlow,
  type AppKernel,
  type Result,
} from "@minix/core";
import {
  type AppRouteId,
  type ContentActorRole,
  type ContentLifecycleAction,
  type ContentLifecycleMutationResponse,
  type ContentReviewQueueResponse,
  type ContentReviewQueueItem,
  type ContentVisibility,
  type FeedItem,
  type FeedListResponse,
  type SaveContentDraftRequest,
  type SaveContentDraftResponse,
  type SearchDomain,
  type SearchMode,
} from "@minix/contracts";

import {
  createDefaultContentDraftFormValues,
  createDefaultFeedState,
  type ContentDraftFormValues,
  type FeedState,
} from "../model";
import { buildContentDraftFormState, CONTENT_DRAFT_STORAGE_KEY } from "./content-draft-form";
import { createContentDraftRequest } from "./draft-request";
import {
  createContentMutationPatch,
  createFeedSearchResults,
  createFeedSelection,
  cloneFeedState,
  deriveFeaturedFeedReason,
  deriveSelectedContentId,
  deriveSelectedFeedItemId,
} from "./projection";
import { createFeedRequestQuery, createFeedRouteParams, hydrateFeedStateFromRoute } from "./route-state";

export interface CreateFeedControllerOptions {
  kernel: AppKernel;
  initialState?: Partial<FeedState>;
  feedRouteId?: AppRouteId;
  detailRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  requestPath?: string;
  contentDraftPath?: string;
  contentLifecyclePath?: string;
  contentReviewQueuePath?: string;
  searchHistoryStorageKey?: string;
  authRedirectSource?: string;
}

type FailedFeedResult = Extract<Result<FeedListResponse>, { ok: false }>;
type ContentDraftSnapshotResult = Result<{
  savedAt: number;
  values: ContentDraftFormValues;
  currentStepKey?: string;
} | null>;

const DEFAULT_SEARCH_HISTORY_STORAGE_KEY = "feed.recent-keywords";

function createRecentKeywords(current: string[], keyword: string): string[] {
  return pushRecentSearchKeyword(current, keyword);
}

export function createFeedController(options: CreateFeedControllerOptions) {
  const {
    kernel,
    feedRouteId,
    detailRouteId,
    settingsRouteId,
    loginRouteId,
    requestPath = "/feed",
    contentDraftPath = "/content/save-draft",
    contentLifecyclePath = "/content/lifecycle",
    contentReviewQueuePath = "/content/review-queue",
    searchHistoryStorageKey = DEFAULT_SEARCH_HISTORY_STORAGE_KEY,
    authRedirectSource = "feed",
    initialState,
  } = options;
  const store = createStore<FeedState>({
    ...cloneFeedState(createDefaultFeedState()),
    ...initialState,
  });
  const { routeToLogin, routeToOptional } = createControllerRouterHelpers({
    kernel,
    loginRouteId,
    authRedirectSource,
  });

  function applyContentDraftFormValues(
    values: ContentDraftFormValues,
    options: {
      dirty?: boolean;
      currentStepKey?: string;
      draftSavedAt?: number;
      restored?: boolean;
      lastResponse?: SaveContentDraftResponse;
      preserveResult?: boolean;
    } = {},
  ) {
    const currentForm = store.getState().contentDraftForm;
    const { result, ...submitStateWithoutResult } = currentForm.submitState;
    const selectedReviewItem = store.getState().reviewQueue.find(
      (item) => item.contentId === (values.contentId ?? store.getState().selectedReviewContentId),
    );
    const nextDerived = buildContentDraftFormState(values, {
      ...((options.currentStepKey ?? currentForm.workflow.currentStepKey)
        ? { currentStepKey: options.currentStepKey ?? currentForm.workflow.currentStepKey }
        : {}),
      ...(options.draftSavedAt !== undefined ? { draftSavedAt: options.draftSavedAt } : {}),
      ...(options.restored ? { restored: true } : {}),
      ...(options.lastResponse ? { lastResponse: options.lastResponse } : {}),
      ...(selectedReviewItem ? { selectedReviewItem } : {}),
    });
    store.setState({
      contentDraftForm: {
        ...currentForm,
        dirty: options.dirty ?? currentForm.dirty,
        values,
        formValues: cloneStateSnapshot(values),
        schema: nextDerived.schema,
        workflow: nextDerived.workflow,
        fieldErrors: [],
        validationErrors: [],
        submitState: {
          ...(options.preserveResult ? currentForm.submitState : submitStateWithoutResult),
          ...(options.draftSavedAt !== undefined ? { draftSavedAt: options.draftSavedAt } : {}),
        },
      },
    });
  }

  async function loadContentDraftSnapshot() {
    if (!kernel.storage) {
      return ok<{
        savedAt: number;
        values: ContentDraftFormValues;
        currentStepKey?: string;
      } | null>(null);
    }

    return kernel.storage.get<{
      savedAt: number;
      values: ContentDraftFormValues;
      currentStepKey?: string;
    }>(CONTENT_DRAFT_STORAGE_KEY);
  }

  async function clearContentDraftSnapshot() {
    if (!kernel.storage) {
      return ok(undefined);
    }

    return kernel.storage.remove(CONTENT_DRAFT_STORAGE_KEY);
  }

  const hydrateRecentKeywords = createSingleFlightHydrator<void>(
    async (): Promise<Result<void>> => {
      const result = await kernel.storage.get<string[]>(searchHistoryStorageKey);
      if (!result.ok) {
        return result;
      }

      const recentKeywords = result.value ?? store.getState().recentKeywords;
      const currentSearchResults = store.getState().searchResults;
      if (currentSearchResults) {
        store.setState({
          recentKeywords,
          searchResults: {
            ...currentSearchResults,
            recentKeywords,
          },
        });
      } else {
        store.setState({
          recentKeywords,
        });
      }
      return ok(undefined);
    },
  );

  async function persistRecentKeywords(keyword: string) {
    const nextRecentKeywords = createRecentKeywords(store.getState().recentKeywords, keyword);
    store.setState({
      recentKeywords: nextRecentKeywords,
    });

    return kernel.storage.set(searchHistoryStorageKey, nextRecentKeywords);
  }

  function createFeedFailurePatch(result: FailedFeedResult) {
    const hasItems = store.getState().items.length > 0;
    return {
      loading: false,
      refreshing: false,
      errorText: result.error.message,
      ready: true,
      status: createListStatus(hasItems ? "partial" : "error", {
        firstLoaded: true,
        partialData: hasItems,
        staleData: hasItems,
      }),
    };
  }

  let pendingContentDraftSnapshot: ContentDraftSnapshotResult | null = null;

  const runListRequest = createSearchListRequestFlow<FeedState, FeedListResponse>({
    store,
    startPatch: {
      appendLoadState: "appending",
      clearKeys: ["contentTransitionFeedback"],
      firstLoaded: ({ state }) => state.status.firstLoaded,
    },
    request: ({ page }) => kernel.request.get<FeedListResponse>(requestPath, createFeedRequestQuery(store.getState(), page)),
    applyResponse: ({ kind, response }) => {
      const current = store.getState();
      const nextSearchResults = createFeedSearchResults(response, current.recentKeywords, current.emptyText, {
        restoredFromRoute: current.status.restoredFromRoute,
        routeWritebackEnabled: Boolean(feedRouteId),
        ...(current.activeTag ? { activeTag: current.activeTag } : {}),
      });
      const nextItems =
        kind === "append"
          ? [...current.items, ...cloneStateSnapshotArray<FeedItem>(nextSearchResults.items)]
          : cloneStateSnapshotArray<FeedItem>(kind === "refresh" ? response.items : nextSearchResults.items);
      const selectedItemId = deriveSelectedFeedItemId(nextItems, current.selectedItemId);
      const loadState = nextItems.length > 0 ? "ready" : "empty";
      const basePatch: Partial<FeedState> = {
        loading: false,
        refreshing: false,
        ready: true,
        items: nextItems,
        hasMore: nextSearchResults.hasMore,
        pagination: {
          page: response.searchQuery.page,
          pageSize: response.searchQuery.pageSize,
          hasMore: nextSearchResults.hasMore,
          total: nextSearchResults.total,
        },
        filters: cloneStateSnapshotArray(response.searchFilters),
        searchQuery: cloneStateSnapshot(response.searchQuery),
        searchFilters: cloneStateSnapshotArray(response.searchFilters),
        searchResults: kind === "append" ? { ...nextSearchResults, items: nextItems } : nextSearchResults,
        searchQualitySummary: nextSearchResults.qualitySummary,
        selectedItemId,
        selection: createFeedSelection(selectedItemId),
        status: createListStatus(loadState, {
          firstLoaded: true,
          restoredFromRoute: current.status.restoredFromRoute,
          ...(current.status.restoredQueryKeys ? { restoredQueryKeys: current.status.restoredQueryKeys } : {}),
          ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
        }),
        tags: response.tags ? cloneStateSnapshotArray(response.tags) : current.tags,
        featuredReason:
          kind === "refresh"
            ? response.featuredReason ?? deriveFeaturedFeedReason(nextItems, current.featuredReason)
            : nextSearchResults.featuredReason ?? response.featuredReason ?? deriveFeaturedFeedReason(nextItems, current.featuredReason),
        query: {
          ...current.query,
          keyword: response.searchQuery.keyword,
          mode: response.searchQuery.mode,
          domain: response.searchQuery.domain,
          sortKey: response.searchQuery.sortKey ?? current.query.sortKey,
          page: response.searchQuery.page,
          pageSize: response.searchQuery.pageSize,
        },
      };

      if (kind !== "refresh") {
        basePatch.recentKeywords = nextSearchResults.recentKeywords;
      }

      if (kind !== "initial") {
        return basePatch;
      }

      const contentDraftSnapshot = pendingContentDraftSnapshot;
      const contentDraftValues = contentDraftSnapshot?.ok && contentDraftSnapshot.value?.values
        ? createDefaultContentDraftFormValues(contentDraftSnapshot.value.values)
        : current.contentDraftForm.values;
      const nextContentDraft = buildContentDraftFormState(contentDraftValues, {
        ...(contentDraftSnapshot?.ok && contentDraftSnapshot.value?.currentStepKey
          ? { currentStepKey: contentDraftSnapshot.value.currentStepKey }
          : {}),
        ...(contentDraftSnapshot?.ok && contentDraftSnapshot.value?.savedAt !== undefined
          ? {
              draftSavedAt: contentDraftSnapshot.value.savedAt,
              restored: true,
            }
          : {}),
      });

      return {
        ...basePatch,
        contentDraftForm: {
          ...current.contentDraftForm,
          dirty: Boolean(contentDraftSnapshot?.ok && contentDraftSnapshot.value),
          values: contentDraftValues,
          formValues: cloneStateSnapshot(contentDraftValues),
          ...(contentDraftSnapshot?.ok && contentDraftSnapshot.value?.savedAt !== undefined
            ? {
                initialValues: cloneStateSnapshot(createDefaultContentDraftFormValues()),
                initialFormValues: cloneStateSnapshot(createDefaultContentDraftFormValues()),
              }
            : {}),
          schema: nextContentDraft.schema,
          workflow: nextContentDraft.workflow,
          submitState: {
            ...current.contentDraftForm.submitState,
            ...(contentDraftSnapshot?.ok && contentDraftSnapshot.value?.savedAt !== undefined
              ? { draftSavedAt: contentDraftSnapshot.value.savedAt }
              : {}),
          },
        },
      };
    },
    createFailurePatch: ({ result }) => createFeedFailurePatch(result),
    onUnauthorized: async (result) => {
      await routeToLogin();
      return result;
    },
  });

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    setKeyword(keyword: string) {
      store.setState({
        query: {
          ...store.getState().query,
          keyword: normalizeSearchKeyword(keyword),
        },
      });
    },

    async loadInitial() {
      await hydrateRecentKeywords();
      hydrateFeedStateFromRoute(kernel, store);
      const contentDraftSnapshot = await loadContentDraftSnapshot();
      pendingContentDraftSnapshot = contentDraftSnapshot;
      try {
        return await runListRequest("initial");
      } finally {
        pendingContentDraftSnapshot = null;
      }
    },

    async refresh() {
      return runListRequest("refresh");
    },

    async loadMore() {
      const current = store.getState();
      if (!current.hasMore || current.loading || current.refreshing) {
        return ok(undefined);
      }

      return runListRequest("append");
    },

    async submitSearch() {
      const keyword = store.getState().query.keyword;
      await persistRecentKeywords(keyword);
      await routeToOptional(
        feedRouteId,
        createFeedRouteParams({
          keyword,
          tag: store.getState().activeTag,
          mode: store.getState().query.mode,
          domain: store.getState().query.domain,
          sortKey: store.getState().query.sortKey,
          selectedItemId: store.getState().selectedItemId,
        }),
      );
      store.setState({
        query: {
          ...store.getState().query,
          page: 1,
        },
      });
      return this.loadInitial();
    },

    async clearSearch() {
      store.setState({
        query: {
          ...store.getState().query,
          page: 1,
          keyword: "",
        },
      });
      await routeToOptional(
        feedRouteId,
        createFeedRouteParams({
          keyword: undefined,
          tag: store.getState().activeTag,
          mode: store.getState().query.mode,
          domain: store.getState().query.domain,
          sortKey: store.getState().query.sortKey,
          selectedItemId: store.getState().selectedItemId,
        }),
      );
      return this.loadInitial();
    },

    async applyTag(tag?: string) {
      const nextTag = tag && tag.length > 0 ? tag : undefined;
      store.setState({
        activeTag: nextTag,
        query: {
          ...store.getState().query,
          page: 1,
        },
      });
      await routeToOptional(
        feedRouteId,
        createFeedRouteParams({
          keyword: store.getState().query.keyword,
          tag: nextTag,
          mode: store.getState().query.mode,
          domain: store.getState().query.domain,
          sortKey: store.getState().query.sortKey,
          selectedItemId: store.getState().selectedItemId,
        }),
      );
      return this.loadInitial();
    },

    async applySearchScope(input: {
      mode?: SearchMode;
      domain?: SearchDomain;
    }) {
      const nextMode = input.mode ?? store.getState().query.mode;
      const nextDomain = input.domain ?? store.getState().query.domain;
      store.setState({
        query: {
          ...store.getState().query,
          mode: nextMode,
          domain: nextDomain,
          page: 1,
        },
      });

      await routeToOptional(
        feedRouteId,
        createFeedRouteParams({
          keyword: store.getState().query.keyword,
          tag: store.getState().activeTag,
          mode: nextMode,
          domain: nextDomain,
          sortKey: store.getState().query.sortKey,
          selectedItemId: store.getState().selectedItemId,
        }),
      );
      return this.loadInitial();
    },

    async applySearchSort(sortKey: string) {
      store.setState({
        query: {
          ...store.getState().query,
          sortKey,
          page: 1,
        },
      });

      await routeToOptional(
        feedRouteId,
        createFeedRouteParams({
          keyword: store.getState().query.keyword,
          tag: store.getState().activeTag,
          mode: store.getState().query.mode,
          domain: store.getState().query.domain,
          sortKey,
          selectedItemId: store.getState().selectedItemId,
        }),
      );
      return this.loadInitial();
    },

    async applySearchFilter(filterKey: string, selectedKeys: string[]) {
      if (filterKey === "tag") {
        return this.applyTag(selectedKeys[0]);
      }

      if (filterKey === "domain") {
        const nextDomain = selectedKeys[0] === "all" ? "all" : (selectedKeys[0] as SearchDomain | undefined);
        return this.applySearchScope({
          domain: nextDomain ?? "feed",
          mode:
            nextDomain === "user"
              ? "user"
              : nextDomain === "content"
                ? "content"
                : "global",
        });
      }

      return ok(undefined);
    },

    async applySuggestionTerm(keyword: string) {
      this.setKeyword(keyword);
      return this.submitSearch();
    },

    async applyCorrectionTerm() {
      const correctionKeyword = store.getState().searchResults?.correctionKeyword;
      if (!correctionKeyword) {
        return ok(undefined);
      }
      this.setKeyword(correctionKeyword);
      return this.submitSearch();
    },

    async applyRecentKeyword(keyword: string) {
      this.setKeyword(keyword);
      return this.submitSearch();
    },

    selectItem(itemId: string) {
      store.setState({
        selectedItemId: itemId,
        selection: createFeedSelection(itemId),
        status: createListStatus(store.getState().status.loadState, {
          firstLoaded: store.getState().status.firstLoaded,
          restoredFromRoute: store.getState().status.restoredFromRoute,
          ...(store.getState().status.restoredQueryKeys ? { restoredQueryKeys: store.getState().status.restoredQueryKeys } : {}),
          restoredSelectionId: itemId,
        }),
      });
    },

    async openItem(itemId?: string) {
      const nextItemId = itemId ?? store.getState().selectedItemId;
      if (!nextItemId) {
        return ok(undefined);
      }

      const selectedItem = store.getState().items.find((item) => item.id === nextItemId);
      if (selectedItem?.routeTarget) {
        return kernel.router.toRoute(selectedItem.routeTarget.routeId as AppRouteId, selectedItem.routeTarget.params);
      }

      if (!detailRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(detailRouteId, { id: nextItemId });
    },

    updateContentDraftValues(values: Partial<ContentDraftFormValues>) {
      applyContentDraftFormValues(
        {
          ...store.getState().contentDraftForm.values,
          ...values,
        },
        {
          dirty: true,
        },
      );
      return ok(undefined);
    },

    setContentDraftStep(stepKey: string) {
      const workflow = store.getState().contentDraftForm.workflow;
      if (!workflow.stepKeys.includes(stepKey)) {
        return ok(undefined);
      }

      store.setState({
        contentDraftForm: {
          ...store.getState().contentDraftForm,
          workflow: {
            ...workflow,
            currentStepKey: stepKey,
          },
        },
      });
      return ok(undefined);
    },

    async saveContentDraftSnapshot() {
      if (!kernel.storage) {
        store.setState({
          contentTransitionFeedback: "Content draft recovery is unavailable on this host.",
          contentDraftForm: {
            ...store.getState().contentDraftForm,
            submitState: {
              ...store.getState().contentDraftForm.submitState,
              phase: "failed",
            },
          },
        });
        return ok(undefined);
      }

      const snapshot = {
        savedAt: Date.now(),
        values: cloneStateSnapshot(store.getState().contentDraftForm.values),
        ...(store.getState().contentDraftForm.workflow.currentStepKey
          ? { currentStepKey: store.getState().contentDraftForm.workflow.currentStepKey }
          : {}),
      };

      return runFormDraftFlow({
        scope: "feed-content-draft",
        submitState: store.getState().contentDraftForm.submitState,
        snapshot,
        persist: (draftSnapshot) => kernel.storage.set(CONTENT_DRAFT_STORAGE_KEY, draftSnapshot),
        onStarted: (submitState) => {
          store.setState({
            contentDraftForm: {
              ...store.getState().contentDraftForm,
              submitState,
            },
          });
        },
        onDuplicate: (submitState) => {
          store.setState({
            contentTransitionFeedback: "This content draft is already saved.",
            contentDraftForm: {
              ...store.getState().contentDraftForm,
              submitState,
            },
          });
        },
        onFailure: (result) => {
          store.setState({
            contentTransitionFeedback: result.error.message,
            contentDraftForm: {
              ...store.getState().contentDraftForm,
              submitState: {
                ...store.getState().contentDraftForm.submitState,
                phase: "failed",
              },
            },
          });
        },
        onSuccess: ({ snapshot: draftSnapshot, submitState }) => {
          applyContentDraftFormValues(store.getState().contentDraftForm.values, {
            dirty: true,
            ...(draftSnapshot.currentStepKey ? { currentStepKey: draftSnapshot.currentStepKey } : {}),
            draftSavedAt: draftSnapshot.savedAt,
          });
          store.setState({
            contentTransitionFeedback: "Content draft snapshot saved.",
            contentDraftForm: {
              ...store.getState().contentDraftForm,
              submitState,
            },
          });
        },
      });
    },

    async applyContentLifecycleAction(
      action: ContentLifecycleAction,
      options: {
        contentId?: string;
        visibility?: ContentVisibility;
        reviewMessage?: string;
        actorRole?: ContentActorRole;
      } = {},
    ) {
      const state = store.getState();
      const contentId = options.contentId ?? deriveSelectedContentId(state);
      if (!contentId) {
        store.setState({
          contentTransitionFeedback: "Select a managed content item before changing lifecycle state.",
        });
        return ok(undefined);
      }

      const result = await kernel.request.post<ContentLifecycleMutationResponse>(contentLifecyclePath, {
        contentId,
        action,
        ...(options.visibility ? { visibility: options.visibility } : {}),
        ...(options.reviewMessage ? { reviewMessage: options.reviewMessage } : {}),
        ...(options.actorRole ? { actorRole: options.actorRole } : {}),
      });
      if (!result.ok) {
        store.setState({
          contentTransitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState(createContentMutationPatch(store.getState(), result.value, contentId));

      return result;
    },

    async saveContentDraft(input?: SaveContentDraftRequest) {
      const request = input ?? createContentDraftRequest(store.getState().contentDraftForm.values);
      return runFormSubmitFlow({
        scope: "feed-content-draft",
        submitState: store.getState().contentDraftForm.submitState,
        values: request as unknown as Record<string, unknown>,
        submit: () => kernel.request.post<SaveContentDraftResponse>(contentDraftPath, request as unknown as Record<string, unknown>),
        onStarted: (submitState) => {
          store.setState({
            contentDraftForm: {
              ...store.getState().contentDraftForm,
              submitState,
            },
          });
        },
        onDuplicate: (submitState) => {
          store.setState({
            contentTransitionFeedback: "This content draft was already submitted.",
            contentDraftForm: {
              ...store.getState().contentDraftForm,
              submitState,
            },
          });
        },
        onFailure: ({ result, submitState }) => {
          store.setState({
            contentTransitionFeedback: result.error.message,
            contentDraftForm: {
              ...store.getState().contentDraftForm,
              submitState,
            },
          });
        },
        onSuccess: async ({ result, submittedAt, submitState }) => {
          const nextValues = createDefaultContentDraftFormValues({
            ...(request.contentId ? { contentId: request.contentId } : {}),
            model: request.model,
            title: request.title,
            subtitle: request.subtitle ?? "",
            summary: request.summary,
            bodyPreview: request.bodyPreview ?? "",
            visibility: request.visibility,
            categoryKey: request.categoryKey,
            categoryLabel: request.categoryLabel,
            tagKeys: request.tags.map((tag) => tag.key),
            coverAssetId: request.coverAssetId ?? "",
            attachmentAssetIds: request.attachmentAssetIds ?? [],
            actorRole: request.actorRole ?? "author",
          });
          await clearContentDraftSnapshot();
          applyContentDraftFormValues(nextValues, {
            dirty: false,
            currentStepKey: "review",
            lastResponse: result,
            preserveResult: true,
          });
          store.setState(createContentMutationPatch(store.getState(), result, result.contentCard.contentId));
          store.setState({
            contentDraftForm: {
              ...store.getState().contentDraftForm,
              lastSubmission: {
                submittedAt,
                value: cloneStateSnapshot(result),
              },
              submitState: {
                ...submitState,
                result: cloneStateSnapshot(result),
              },
            },
          });
        },
      });
    },

    async loadReviewQueue(query: {
      page?: number;
      pageSize?: number;
      state?: ContentReviewQueueItem["lifecycleState"] | "all";
      actorRole?: ContentActorRole;
    } = {}) {
      const result = await kernel.request.get<ContentReviewQueueResponse>(contentReviewQueuePath, {
        ...(query.page !== undefined ? { page: query.page } : {}),
        ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
        ...(query.state !== undefined ? { state: query.state } : {}),
        ...(query.actorRole !== undefined ? { actorRole: query.actorRole } : {}),
      });
      if (!result.ok) {
        store.setState({
          contentTransitionFeedback: result.error.message,
        });
        return result;
      }

      const selectedReviewItem = result.value.reviewQueue.items.find(
        (item) => item.contentId === result.value.reviewQueue.selectedContentId,
      );
      const draftSavedAt = store.getState().contentDraftForm.workflow.draft?.lastSavedAt;
      const nextDerived = buildContentDraftFormState(store.getState().contentDraftForm.values, {
        ...(store.getState().contentDraftForm.workflow.currentStepKey
          ? { currentStepKey: store.getState().contentDraftForm.workflow.currentStepKey }
          : {}),
        ...(draftSavedAt !== undefined ? { draftSavedAt } : {}),
        ...(selectedReviewItem ? { selectedReviewItem } : {}),
      });
      store.setState({
        reviewQueue: result.value.reviewQueue.items,
        selectedReviewContentId: result.value.reviewQueue.selectedContentId,
        contentDraftForm: {
          ...store.getState().contentDraftForm,
          schema: nextDerived.schema,
          workflow: nextDerived.workflow,
        },
        contentGovernanceSummary: result.value.governanceSummary ?? store.getState().contentGovernanceSummary,
      });
      return result;
    },

    async goToSettings() {
      return routeToOptional(settingsRouteId);
    },
  };
}
