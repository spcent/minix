import {
  beginFormSubmit,
  createAuthRedirectParams,
  createFormSubmissionKey,
  createListStatus,
  createFormWorkflowState,
  createStore,
  finalizeFormSubmit,
  normalizeSearchKeyword,
  ok,
  pushRecentSearchKeyword,
  resolveSearchDomainParam,
  resolveSearchModeParam,
  type AppKernel,
  type Result,
} from "@minix/core";
import {
  type AppRouteId,
  type ContentActorRole,
  type ContentLifecycleAction,
  type ContentLifecycleMutationResponse,
  type ContentModel,
  type ContentReviewQueueResponse,
  type ContentReviewQueueItem,
  type ContentVisibility,
  type FeedItem,
  type FeedListResponse,
  type FormApprovalNode,
  type FormFieldDefinition,
  type FormSchema,
  type SaveContentDraftRequest,
  type SaveContentDraftResponse,
  type SearchDomain,
  type SearchMode,
  type SearchResults,
} from "@minix/contracts";

import {
  createDefaultContentDraftFormValues,
  createDefaultFeedState,
  type ContentDraftFormValues,
  type FeedState,
} from "../model";

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

const DEFAULT_SEARCH_HISTORY_STORAGE_KEY = "feed.recent-keywords";
const CONTENT_DRAFT_STORAGE_KEY = "@minix/feed/content-draft/v1";

function createContentDraftSchema(values: ContentDraftFormValues): FormSchema {
  const fields: FormFieldDefinition[] = [
    {
      key: "model",
      label: "Content model",
      type: "single_select",
      required: true,
      dynamic: true,
      stepKey: "basics",
      options: [
        { key: "article", label: "Article" },
        { key: "course", label: "Course" },
        { key: "event", label: "Event" },
        { key: "post", label: "Post" },
      ],
    },
    {
      key: "title",
      label: "Title",
      type: "text",
      required: true,
      stepKey: "basics",
    },
    {
      key: "subtitle",
      label: "Subtitle",
      type: "text",
      stepKey: "basics",
    },
    {
      key: "summary",
      label: "Summary",
      type: "text",
      required: true,
      stepKey: "basics",
    },
    {
      key: "bodyPreview",
      label: "Body preview",
      type: "rich_text",
      required: true,
      stepKey: "editorial",
      richTextToolbar: "placeholder",
    },
    {
      key: "tagKeys",
      label: "Tags",
      type: "multi_select",
      dynamic: true,
      stepKey: "editorial",
      options: [
        { key: "news", label: "News" },
        { key: "featured", label: "Featured" },
        { key: "member", label: "Member" },
        { key: "event", label: "Event" },
      ],
    },
    {
      key: "visibility",
      label: "Visibility",
      type: "single_select",
      required: true,
      dynamic: true,
      stepKey: "distribution",
      options: [
        { key: "public", label: "Public" },
        { key: "login_required", label: "Login required" },
        { key: "member_only", label: "Member only" },
        { key: "purchased_only", label: "Purchased only" },
      ],
    },
    {
      key: "publishAt",
      label: "Publish date",
      type: "date",
      dynamic: true,
      stepKey: "distribution",
      conditions: [{ field: "model", operator: "eq", value: "event" }],
    },
    {
      key: "coverAssetId",
      label: "Cover asset",
      type: "upload_reference",
      dynamic: true,
      stepKey: "assets",
      uploadRole: "content-cover",
    },
    {
      key: "attachmentAssetIds",
      label: "Attachment assets",
      type: "upload_reference",
      dynamic: true,
      stepKey: "assets",
      uploadRole: "content-attachment",
      conditions: [{ field: "model", operator: "neq", value: "post" }],
    },
  ];

  return {
    fields,
    steps: [
      { key: "basics", label: "Basics" },
      { key: "editorial", label: "Editorial" },
      { key: "distribution", label: "Distribution" },
      { key: "assets", label: "Assets" },
      { key: "review", label: "Review" },
    ],
  };
}

function createContentDraftApprovalNodes(
  response?: SaveContentDraftResponse,
  selectedReviewItem?: ContentReviewQueueItem,
): FormApprovalNode[] {
  const reviewStatus = response?.contentDetail.reviewRecord?.status;
  if (!reviewStatus && !selectedReviewItem) {
    return [];
  }

  return [
    {
      nodeKey: "authoring",
      label: "Authoring",
      state: "approved",
      assigneeLabel: response?.contentDetail.authorLabel ?? "Author",
      comment: response?.transitionMessage ?? "Draft content is ready for editorial review.",
    },
    {
      nodeKey: "review",
      label: "Editorial review",
      state:
        reviewStatus === "approved"
          ? "approved"
          : reviewStatus === "rejected"
            ? "rejected"
            : reviewStatus === "queued" || selectedReviewItem?.lifecycleState === "under_review"
              ? "pending"
              : "not_started",
      assigneeLabel: selectedReviewItem?.reviewerLabel ?? response?.contentDetail.reviewRecord?.reviewerLabel ?? "Reviewer",
      comment:
        response?.contentDetail.reviewRecord?.message ??
        selectedReviewItem?.queueLabel ??
        "Editorial review will start after the draft is submitted.",
    },
  ];
}

function buildContentDraftFormState(
  values: ContentDraftFormValues,
  options: {
    currentStepKey?: string;
    draftSavedAt?: number;
    restored?: boolean;
    lastResponse?: SaveContentDraftResponse;
    selectedReviewItem?: ContentReviewQueueItem;
  } = {},
) {
  const schema = createContentDraftSchema(values);
  const approvalNodes = createContentDraftApprovalNodes(options.lastResponse, options.selectedReviewItem);
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
      ...(options.currentStepKey ? { currentStepKey: options.currentStepKey } : {}),
      ...(approvalNodes.length > 0 ? { approvalNodes } : {}),
      ...(options.draftSavedAt !== undefined
        ? {
            draft: {
              draftId: "content-draft",
              recoveryKey: CONTENT_DRAFT_STORAGE_KEY,
              lastSavedAt: options.draftSavedAt,
              ...(options.restored ? { restoredAt: Date.now() } : {}),
            },
          }
        : {}),
    }),
  };
}

function createContentDraftRequest(values: ContentDraftFormValues): SaveContentDraftRequest {
  return {
    ...(values.contentId ? { contentId: values.contentId } : {}),
    model: values.model,
    title: values.title,
    ...(values.subtitle ? { subtitle: values.subtitle } : {}),
    summary: values.summary,
    bodyPreview: values.bodyPreview,
    visibility: values.visibility,
    categoryKey: values.categoryKey,
    categoryLabel: values.categoryLabel,
    tags: values.tagKeys.map((key) => ({
      key,
      label: key.slice(0, 1).toUpperCase() + key.slice(1),
    })),
    ...(values.coverAssetId ? { coverAssetId: values.coverAssetId } : {}),
    ...(values.attachmentAssetIds.length > 0 ? { attachmentAssetIds: values.attachmentAssetIds } : {}),
    actorRole: values.actorRole,
  };
}

function cloneState(state: FeedState): FeedState {
  return {
    ...state,
    items: state.items.map((item) => ({ ...item })),
    contentDraftForm: {
      ...state.contentDraftForm,
      formValues: structuredClone(state.contentDraftForm.formValues),
      initialFormValues: structuredClone(state.contentDraftForm.initialFormValues),
      validationErrors: state.contentDraftForm.validationErrors.map((error) => ({ ...error })),
      submitState: { ...state.contentDraftForm.submitState },
      schema: {
        fields: state.contentDraftForm.schema.fields.map((field) => structuredClone(field)),
        steps: state.contentDraftForm.schema.steps.map((step) => structuredClone(step)),
      },
      workflow: {
        ...state.contentDraftForm.workflow,
        stepKeys: [...state.contentDraftForm.workflow.stepKeys],
        visibleFieldKeys: [...state.contentDraftForm.workflow.visibleFieldKeys],
        dynamicFieldKeys: [...state.contentDraftForm.workflow.dynamicFieldKeys],
        conditionalFieldKeys: [...state.contentDraftForm.workflow.conditionalFieldKeys],
        ...(state.contentDraftForm.workflow.approvalNodes
          ? {
              approvalNodes: state.contentDraftForm.workflow.approvalNodes.map((node) => structuredClone(node)),
            }
          : {}),
        ...(state.contentDraftForm.workflow.draft
          ? { draft: structuredClone(state.contentDraftForm.workflow.draft) }
          : {}),
      },
      values: structuredClone(state.contentDraftForm.values),
      initialValues: structuredClone(state.contentDraftForm.initialValues),
      fieldErrors: state.contentDraftForm.fieldErrors.map((error) => ({ ...error })),
      ...(state.contentDraftForm.lastSubmission
        ? { lastSubmission: structuredClone(state.contentDraftForm.lastSubmission) }
        : {}),
    },
    reviewQueue: state.reviewQueue.map((item) => structuredClone(item)),
    surface: state.surface,
    tags: state.tags.map((tag) => ({ ...tag })),
    pagination: { ...state.pagination },
    filters: state.filters.map((group) => structuredClone(group)),
    selection: {
      ...state.selection,
      selectedItemIds: [...state.selection.selectedItemIds],
    },
    status: { ...state.status },
    searchQuery: state.searchQuery ? structuredClone(state.searchQuery) : undefined,
    searchFilters: state.searchFilters.map((group) => structuredClone(group)),
    searchResults: state.searchResults ? structuredClone(state.searchResults) : undefined,
    searchQualitySummary: state.searchQualitySummary ? { ...state.searchQualitySummary } : undefined,
    query: { ...state.query },
    recentKeywords: [...state.recentKeywords],
    selectedReviewContentId: state.selectedReviewContentId,
  };
}

function deriveSelectedItemId(items: FeedItem[], currentSelectedItemId?: string): string | undefined {
  if (currentSelectedItemId && items.some((item) => item.id === currentSelectedItemId)) {
    return currentSelectedItemId;
  }

  return items[0]?.id;
}

function deriveFeaturedReason(items: FeedItem[], fallback?: string): string | undefined {
  return items.find((item) => item.recommendedReason)?.recommendedReason ?? fallback;
}

function createRecentKeywords(current: string[], keyword: string): string[] {
  return pushRecentSearchKeyword(current, keyword);
}

function createSearchResults(
  response: FeedListResponse,
  recentKeywords: string[],
  fallbackEmptyText: string,
  options: {
    restoredFromRoute?: boolean;
    routeWritebackEnabled?: boolean;
    activeTag?: string | undefined;
  } = {},
): SearchResults<FeedItem> {
  const nextSearchResults = structuredClone(response.searchResults);
  const routeKeys = [
    ...(response.searchQuery.keyword ? ["keyword"] : []),
    ...(response.searchQuery.mode !== "global" ? ["mode"] : []),
    ...(response.searchQuery.domain !== "feed" ? ["domain"] : []),
    ...(response.searchQuery.sortKey && response.searchQuery.sortKey !== "recommended" ? ["sort"] : []),
    ...(options.activeTag && options.activeTag !== "all" ? ["tag"] : []),
    ...response.searchFilters
      .filter((group) => group.key !== "domain" && group.key !== "tag" && group.selectedKeys.some((key) => key !== "all"))
      .map((group) => group.key),
  ];
  const reloadRecovery =
    options.restoredFromRoute ? "route" : recentKeywords.length > 0 ? "storage" : "none";
  return {
    ...nextSearchResults,
    recentKeywords,
    emptyText: nextSearchResults.emptyText || fallbackEmptyText,
    persistence: {
      routeKeys,
      routeWriteback: options.routeWritebackEnabled ?? false,
      reloadRecovery,
      recentKeywordCount: recentKeywords.length,
      label:
        reloadRecovery === "route"
          ? "Active discover filters and query params were restored from the current route."
          : reloadRecovery === "storage"
            ? "Recent discover keywords were restored from shared storage for quick reuse."
            : "Discover filters stay route-addressable and recent keywords start empty until the first search.",
    },
    qualitySummary: {
      ...(nextSearchResults.qualitySummary ?? {
        rankingSummary: nextSearchResults.ranking?.label ?? "Results ranked by recommendation relevance.",
        synonymSummary: "Suggestion terms and hot keywords act as the bounded synonym dictionary.",
        correctionSummary: nextSearchResults.correctionKeyword
          ? `Correction dictionary suggested "${nextSearchResults.correctionKeyword}".`
          : "No correction term was required for the current query.",
        recentSearchSummary: "Recent search persistence is bounded before storage writeback.",
        routeWritebackSummary: "Route-addressable filters remain encoded in search query and filter metadata.",
        zeroResultSummary: nextSearchResults.zeroResultGuidance?.label ?? "Search quality signals are active.",
      }),
      recentSearchSummary: `${recentKeywords.length} recent keyword(s) are available after bounded pruning.`,
      routeWritebackSummary:
        routeKeys.length > 0
          ? `Route writeback tracks ${routeKeys.join(", ")}.`
          : "No route writeback keys are active for the default search state.",
    },
  };
}

function createSelection(selectedItemId: string | undefined): FeedState["selection"] {
  return {
    ...(selectedItemId !== undefined ? { selectedItemId } : {}),
    selectedItemIds: selectedItemId ? [selectedItemId] : [],
    batchSelectable: false,
  };
}

  function replaceFeedItem(items: FeedItem[], nextItem: FeedItem): FeedItem[] {
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

function upsertFeedItem(items: FeedItem[], nextItem: FeedItem): FeedItem[] {
  return items.some((item) => item.id === nextItem.id) ? replaceFeedItem(items, nextItem) : [nextItem, ...items];
}

function replaceFeedItemInSearchResults(
  searchResults: FeedState["searchResults"],
  nextItem: FeedItem,
): FeedState["searchResults"] {
  if (!searchResults) {
    return searchResults;
  }

  return {
    ...searchResults,
    items: upsertFeedItem(searchResults.items, nextItem),
    ...(searchResults.resultGroups
      ? {
          resultGroups: searchResults.resultGroups.map((group) => ({
            ...group,
            items: group.items.some((item) => item.id === nextItem.id)
              ? replaceFeedItem(group.items, nextItem)
              : group.items,
          })),
        }
      : {}),
  };
}

function deriveSelectedContentId(state: FeedState): string | undefined {
  return state.items.find((item) => item.id === state.selectedItemId)?.contentCard?.contentId;
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
    ...cloneState(createDefaultFeedState()),
    ...initialState,
  });
  let keywordHydration: Promise<Result<void>> | null = null;

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
        formValues: structuredClone(values),
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

  async function routeToOptional(routeId?: AppRouteId, params?: Record<string, string | number | boolean>) {
    if (!routeId) {
      return ok(undefined);
    }

    return kernel.router.toRoute(routeId, params);
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

  async function hydrateRecentKeywords(force = false): Promise<Result<void>> {
    if (!force && keywordHydration) {
      return keywordHydration;
    }

    const run = async (): Promise<Result<void>> => {
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
    };

    keywordHydration = run().finally(() => {
      keywordHydration = null;
    });
    return keywordHydration;
  }

  function hydrateStateFromRoute() {
    const current = kernel.router.current();
    if (!current.ok || !current.value?.params) {
      return;
    }

    const keyword = typeof current.value.params.keyword === "string" ? current.value.params.keyword : store.getState().query.keyword;
    const tag = typeof current.value.params.tag === "string" ? current.value.params.tag : store.getState().activeTag;
    const mode = resolveSearchModeParam(current.value.params.mode, store.getState().query.mode);
    const domain = resolveSearchDomainParam(current.value.params.domain, store.getState().query.domain);
    const sortKey =
      typeof current.value.params.sort === "string" && current.value.params.sort.length > 0
        ? current.value.params.sort
        : store.getState().query.sortKey;
    const selectedItemId =
      typeof current.value.params.selectedItemId === "string"
        ? current.value.params.selectedItemId
        : store.getState().selectedItemId;

    store.setState({
      query: {
        ...store.getState().query,
        keyword,
        mode,
        domain,
        sortKey,
      },
      activeTag: tag,
      selectedItemId,
      selection: createSelection(selectedItemId),
      status: createListStatus(store.getState().status.loadState, {
        firstLoaded: store.getState().status.firstLoaded,
        restoredFromRoute: Boolean(keyword || (tag && tag !== "all") || mode !== store.getState().query.mode || domain !== store.getState().query.domain || sortKey !== store.getState().query.sortKey || selectedItemId),
        restoredQueryKeys: [
          ...(keyword ? ["keyword"] : []),
          ...(tag && tag !== "all" ? ["tag"] : []),
          ...(mode !== "global" ? ["mode"] : []),
          ...(domain !== "feed" ? ["domain"] : []),
          ...(sortKey !== "recommended" ? ["sort"] : []),
        ],
        ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
      }),
    });
  }

  function createRequestQuery() {
    const current = store.getState();
    return {
      page: current.query.page,
      pageSize: current.query.pageSize,
      ...(current.query.keyword ? { keyword: current.query.keyword } : {}),
      ...(current.query.mode !== "global" ? { mode: current.query.mode } : {}),
      ...(current.query.domain !== "feed" ? { domain: current.query.domain } : {}),
      ...(current.query.sortKey !== "recommended" ? { sort: current.query.sortKey } : {}),
      ...(current.activeTag && current.activeTag !== "all" ? { tag: current.activeTag } : {}),
    };
  }

  function createRouteParams(overrides: {
    keyword: string | undefined;
    tag: string | undefined;
    mode: SearchMode | undefined;
    domain: SearchDomain | undefined;
    sortKey: string | undefined;
    selectedItemId: string | undefined;
  }): Record<string, string | number | boolean> | undefined {
    const params: Record<string, string | number | boolean> = {};

    if (overrides.keyword) {
      params.keyword = overrides.keyword;
    }

    if (overrides.tag && overrides.tag !== "all") {
      params.tag = overrides.tag;
    }

    if (overrides.mode && overrides.mode !== "global") {
      params.mode = overrides.mode;
    }

    if (overrides.domain && overrides.domain !== "feed") {
      params.domain = overrides.domain;
    }

    if (overrides.sortKey && overrides.sortKey !== "recommended") {
      params.sort = overrides.sortKey;
    }

    if (overrides.selectedItemId) {
      params.selectedItemId = overrides.selectedItemId;
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }

  async function persistRecentKeywords(keyword: string) {
    const nextRecentKeywords = createRecentKeywords(store.getState().recentKeywords, keyword);
    store.setState({
      recentKeywords: nextRecentKeywords,
    });

    return kernel.storage.set(searchHistoryStorageKey, nextRecentKeywords);
  }

  async function handleFeedFailure(result: FailedFeedResult) {
    const hasItems = store.getState().items.length > 0;
    store.setState({
      loading: false,
      refreshing: false,
      errorText: result.error.message,
      ready: true,
      status: createListStatus(hasItems ? "partial" : "error", {
        firstLoaded: true,
        partialData: hasItems,
        staleData: hasItems,
      }),
    });

    if (result.error.code === "UNAUTHORIZED") {
      await routeToLogin();
    }

    return result;
  }

  function applyContentMutationResponse(
    response: ContentLifecycleMutationResponse | SaveContentDraftResponse,
    contentId: string,
  ) {
    const state = store.getState();
    const currentItem = state.items.find((item) => item.id === contentId);
    const nextRecommendedReason = response.contentDetail.recommendationReason ?? currentItem?.recommendedReason;
    const nextItem: FeedItem = {
      id: contentId,
      title: response.contentCard.title,
      ...(response.contentCard.subtitle ? { subtitle: response.contentCard.subtitle } : {}),
      eyebrow: response.contentCard.display.category.label ?? currentItem?.eyebrow ?? "Content",
      ...(response.contentCard.coverUrl ? { imageUrl: response.contentCard.coverUrl } : {}),
      ...(nextRecommendedReason !== undefined ? { recommendedReason: nextRecommendedReason } : {}),
      ...(response.contentCard.lifecycle.updatedAt
        ? { updatedAt: response.contentCard.lifecycle.updatedAt }
        : response.contentCard.lifecycle.publishedAt
          ? { updatedAt: response.contentCard.lifecycle.publishedAt }
          : currentItem?.updatedAt
            ? { updatedAt: currentItem.updatedAt }
            : {}),
      tag: response.contentCard.display.category.key ?? currentItem?.tag ?? "content",
      ...(currentItem?.ranking ? { ranking: currentItem.ranking } : {}),
      ...(currentItem?.routeTarget ? { routeTarget: currentItem.routeTarget } : {}),
      contentCard: response.contentCard,
      contentAccess: response.contentAccess,
    };
    const nextItems = upsertFeedItem(state.items, nextItem);
    store.setState({
      items: nextItems,
      searchResults: replaceFeedItemInSearchResults(state.searchResults, nextItem),
      featuredReason: deriveFeaturedReason(nextItems, state.featuredReason),
      selectedItemId: nextItem.id,
      selection: createSelection(nextItem.id),
      contentTransitionFeedback: response.transitionMessage,
      contentGovernanceSummary:
        response.governanceSummary ??
        response.contentDetail.governanceSummary ??
        response.contentCard.governanceSummary ??
        state.contentGovernanceSummary,
    });
  }

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
      hydrateStateFromRoute();
      const contentDraftSnapshot = await loadContentDraftSnapshot();
      store.setState({
        loading: true,
        refreshing: false,
        errorText: undefined,
        contentTransitionFeedback: undefined,
        status: createListStatus("loading", {
          firstLoaded: store.getState().status.firstLoaded,
          restoredFromRoute: store.getState().status.restoredFromRoute,
          ...(store.getState().status.restoredQueryKeys ? { restoredQueryKeys: store.getState().status.restoredQueryKeys } : {}),
          ...(store.getState().status.restoredSelectionId ? { restoredSelectionId: store.getState().status.restoredSelectionId } : {}),
        }),
      });

      const result = await kernel.request.get<FeedListResponse>(requestPath, createRequestQuery());
      if (!result.ok) {
        return handleFeedFailure(result);
      }

      const nextSearchResults = createSearchResults(result.value, store.getState().recentKeywords, store.getState().emptyText, {
        restoredFromRoute: store.getState().status.restoredFromRoute,
        routeWritebackEnabled: Boolean(feedRouteId),
        ...(store.getState().activeTag ? { activeTag: store.getState().activeTag } : {}),
      });
      const nextItems = nextSearchResults.items.map((item) => ({ ...item }));
      const selectedItemId = deriveSelectedItemId(nextItems, store.getState().selectedItemId);
      const loadState = nextItems.length > 0 ? "ready" : "empty";
      const contentDraftValues = contentDraftSnapshot.ok && contentDraftSnapshot.value?.values
        ? createDefaultContentDraftFormValues(contentDraftSnapshot.value.values)
        : store.getState().contentDraftForm.values;
      const nextContentDraft = buildContentDraftFormState(contentDraftValues, {
        ...(contentDraftSnapshot.ok && contentDraftSnapshot.value?.currentStepKey
          ? { currentStepKey: contentDraftSnapshot.value.currentStepKey }
          : {}),
        ...(contentDraftSnapshot.ok && contentDraftSnapshot.value?.savedAt !== undefined
          ? {
              draftSavedAt: contentDraftSnapshot.value.savedAt,
              restored: true,
            }
          : {}),
      });
      store.setState({
        loading: false,
        refreshing: false,
        ready: true,
        items: nextItems,
        hasMore: nextSearchResults.hasMore,
        pagination: {
          page: result.value.searchQuery.page,
          pageSize: result.value.searchQuery.pageSize,
          hasMore: nextSearchResults.hasMore,
          total: nextSearchResults.total,
        },
        filters: result.value.searchFilters.map((group) => structuredClone(group)),
        searchQuery: structuredClone(result.value.searchQuery),
        searchFilters: result.value.searchFilters.map((group) => structuredClone(group)),
        searchResults: nextSearchResults,
        searchQualitySummary: nextSearchResults.qualitySummary,
        selectedItemId,
        selection: createSelection(selectedItemId),
        status: createListStatus(loadState, {
          firstLoaded: true,
          restoredFromRoute: store.getState().status.restoredFromRoute,
          ...(store.getState().status.restoredQueryKeys ? { restoredQueryKeys: store.getState().status.restoredQueryKeys } : {}),
          ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
        }),
        tags: result.value.tags?.map((tag) => ({ ...tag })) ?? store.getState().tags,
        featuredReason: nextSearchResults.featuredReason ?? result.value.featuredReason ?? deriveFeaturedReason(nextItems, store.getState().featuredReason),
        recentKeywords: nextSearchResults.recentKeywords,
        contentDraftForm: {
          ...store.getState().contentDraftForm,
          dirty: Boolean(contentDraftSnapshot.ok && contentDraftSnapshot.value),
          values: contentDraftValues,
          formValues: structuredClone(contentDraftValues),
          ...(contentDraftSnapshot.ok && contentDraftSnapshot.value?.savedAt !== undefined
            ? {
                initialValues: structuredClone(createDefaultContentDraftFormValues()),
                initialFormValues: structuredClone(createDefaultContentDraftFormValues()),
              }
            : {}),
          schema: nextContentDraft.schema,
          workflow: nextContentDraft.workflow,
          submitState: {
            ...store.getState().contentDraftForm.submitState,
            ...(contentDraftSnapshot.ok && contentDraftSnapshot.value?.savedAt !== undefined
              ? { draftSavedAt: contentDraftSnapshot.value.savedAt }
              : {}),
          },
        },
        query: {
          ...store.getState().query,
          keyword: result.value.searchQuery.keyword,
          mode: result.value.searchQuery.mode,
          domain: result.value.searchQuery.domain,
          sortKey: result.value.searchQuery.sortKey ?? store.getState().query.sortKey,
          page: result.value.searchQuery.page,
          pageSize: result.value.searchQuery.pageSize,
        },
      });
      return result;
    },

    async refresh() {
      store.setState({
        refreshing: true,
        errorText: undefined,
        contentTransitionFeedback: undefined,
        query: {
          ...store.getState().query,
          page: 1,
        },
        status: createListStatus("refreshing", {
          firstLoaded: store.getState().status.firstLoaded,
          partialData: store.getState().items.length > 0,
          staleData: store.getState().items.length > 0,
        }),
      });

      const result = await kernel.request.get<FeedListResponse>(requestPath, createRequestQuery());
      if (!result.ok) {
        return handleFeedFailure(result);
      }

      const nextItems = result.value.items.map((item) => ({ ...item }));
      const selectedItemId = deriveSelectedItemId(nextItems, store.getState().selectedItemId);
      const nextSearchResults = createSearchResults(result.value, store.getState().recentKeywords, store.getState().emptyText, {
        restoredFromRoute: store.getState().status.restoredFromRoute,
        routeWritebackEnabled: Boolean(feedRouteId),
        ...(store.getState().activeTag ? { activeTag: store.getState().activeTag } : {}),
      });
      const loadState = nextItems.length > 0 ? "ready" : "empty";
      store.setState({
        loading: false,
        refreshing: false,
        ready: true,
        items: nextItems,
        hasMore: result.value.hasMore,
        pagination: {
          page: result.value.searchQuery.page,
          pageSize: result.value.searchQuery.pageSize,
          hasMore: result.value.hasMore,
          total: nextSearchResults.total,
        },
        filters: result.value.searchFilters.map((group) => structuredClone(group)),
        searchQuery: structuredClone(result.value.searchQuery),
        searchFilters: result.value.searchFilters.map((group) => structuredClone(group)),
        searchResults: nextSearchResults,
        searchQualitySummary: nextSearchResults.qualitySummary,
        selectedItemId,
        selection: createSelection(selectedItemId),
        status: createListStatus(loadState, {
          firstLoaded: true,
          restoredFromRoute: store.getState().status.restoredFromRoute,
          ...(store.getState().status.restoredQueryKeys ? { restoredQueryKeys: store.getState().status.restoredQueryKeys } : {}),
          ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
        }),
        tags: result.value.tags?.map((tag) => ({ ...tag })) ?? store.getState().tags,
        featuredReason: result.value.featuredReason ?? deriveFeaturedReason(nextItems, store.getState().featuredReason),
        query: {
          ...store.getState().query,
          keyword: result.value.searchQuery.keyword,
          mode: result.value.searchQuery.mode,
          domain: result.value.searchQuery.domain,
          sortKey: result.value.searchQuery.sortKey ?? store.getState().query.sortKey,
          page: result.value.searchQuery.page,
          pageSize: result.value.searchQuery.pageSize,
        },
      });
      return result;
    },

    async loadMore() {
      const current = store.getState();
      if (!current.hasMore || current.loading || current.refreshing) {
        return ok(undefined);
      }

      store.setState({
        loading: true,
        status: createListStatus("appending", {
          firstLoaded: current.status.firstLoaded,
          partialData: current.items.length > 0,
          staleData: current.items.length > 0,
        }),
        query: {
          ...current.query,
          page: current.query.page + 1,
        },
      });

      const result = await kernel.request.get<FeedListResponse>(requestPath, createRequestQuery());
      if (!result.ok) {
        return handleFeedFailure(result);
      }

      const nextSearchResults = createSearchResults(result.value, current.recentKeywords, current.emptyText, {
        restoredFromRoute: current.status.restoredFromRoute,
        routeWritebackEnabled: Boolean(feedRouteId),
        ...(current.activeTag ? { activeTag: current.activeTag } : {}),
      });
      const nextItems = [...current.items, ...nextSearchResults.items.map((item) => ({ ...item }))];
      const selectedItemId = deriveSelectedItemId(nextItems, current.selectedItemId);
      const loadState = nextItems.length > 0 ? "ready" : "empty";
      store.setState({
        loading: false,
        ready: true,
        items: nextItems,
        hasMore: nextSearchResults.hasMore,
        pagination: {
          page: result.value.searchQuery.page,
          pageSize: result.value.searchQuery.pageSize,
          hasMore: nextSearchResults.hasMore,
          total: nextSearchResults.total,
        },
        filters: result.value.searchFilters.map((group) => structuredClone(group)),
        searchQuery: structuredClone(result.value.searchQuery),
        searchFilters: result.value.searchFilters.map((group) => structuredClone(group)),
        searchResults: {
          ...nextSearchResults,
          items: nextItems,
        },
        searchQualitySummary: nextSearchResults.qualitySummary,
        selectedItemId,
        selection: createSelection(selectedItemId),
        status: createListStatus(loadState, {
          firstLoaded: true,
          restoredFromRoute: current.status.restoredFromRoute,
          ...(current.status.restoredQueryKeys ? { restoredQueryKeys: current.status.restoredQueryKeys } : {}),
          ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
        }),
        tags: result.value.tags?.map((tag) => ({ ...tag })) ?? current.tags,
        featuredReason: nextSearchResults.featuredReason ?? result.value.featuredReason ?? deriveFeaturedReason(nextItems, current.featuredReason),
        recentKeywords: nextSearchResults.recentKeywords,
        query: {
          ...current.query,
          keyword: result.value.searchQuery.keyword,
          mode: result.value.searchQuery.mode,
          domain: result.value.searchQuery.domain,
          sortKey: result.value.searchQuery.sortKey ?? current.query.sortKey,
          page: result.value.searchQuery.page,
          pageSize: result.value.searchQuery.pageSize,
        },
      });
      return result;
    },

    async submitSearch() {
      const keyword = store.getState().query.keyword;
      await persistRecentKeywords(keyword);
      await routeToOptional(
        feedRouteId,
        createRouteParams({
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
        createRouteParams({
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
        createRouteParams({
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
        createRouteParams({
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
        createRouteParams({
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
        selection: createSelection(itemId),
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
        values: structuredClone(store.getState().contentDraftForm.values),
        ...(store.getState().contentDraftForm.workflow.currentStepKey
          ? { currentStepKey: store.getState().contentDraftForm.workflow.currentStepKey }
          : {}),
      };
      const submissionKey = createFormSubmissionKey("feed-content-draft", "draft", snapshot.values);
      const nextSubmit = beginFormSubmit(store.getState().contentDraftForm.submitState, {
        mode: "draft",
        submissionKey,
      });
      if (nextSubmit.blocked) {
        store.setState({
          contentTransitionFeedback: "This content draft is already saved.",
          contentDraftForm: {
            ...store.getState().contentDraftForm,
            submitState: nextSubmit.submitState,
          },
        });
        return ok(undefined);
      }

      store.setState({
        contentDraftForm: {
          ...store.getState().contentDraftForm,
          submitState: nextSubmit.submitState,
        },
      });
      const result = await kernel.storage.set(CONTENT_DRAFT_STORAGE_KEY, snapshot);
      if (!result.ok) {
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
        return result;
      }

      applyContentDraftFormValues(store.getState().contentDraftForm.values, {
        dirty: true,
        ...(snapshot.currentStepKey ? { currentStepKey: snapshot.currentStepKey } : {}),
        draftSavedAt: snapshot.savedAt,
      });
      store.setState({
        contentTransitionFeedback: "Content draft snapshot saved.",
        contentDraftForm: {
          ...store.getState().contentDraftForm,
          submitState: finalizeFormSubmit(store.getState().contentDraftForm.submitState, {
            mode: "draft",
            submissionKey,
            submittedAt: snapshot.savedAt,
            draftSavedAt: snapshot.savedAt,
          }),
        },
      });
      return ok(undefined);
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

      applyContentMutationResponse(result.value, contentId);

      return result;
    },

    async saveContentDraft(input?: SaveContentDraftRequest) {
      const request = input ?? createContentDraftRequest(store.getState().contentDraftForm.values);
      const submissionKey = createFormSubmissionKey("feed-content-draft", "submit", request as unknown as Record<string, unknown>);
      const nextSubmit = beginFormSubmit(store.getState().contentDraftForm.submitState, {
        mode: "submit",
        submissionKey,
      });
      if (nextSubmit.blocked) {
        store.setState({
          contentTransitionFeedback: "This content draft was already submitted.",
          contentDraftForm: {
            ...store.getState().contentDraftForm,
            submitState: nextSubmit.submitState,
          },
        });
        return ok(undefined);
      }

      store.setState({
        contentDraftForm: {
          ...store.getState().contentDraftForm,
          submitState: nextSubmit.submitState,
        },
      });
      const result = await kernel.request.post<SaveContentDraftResponse>(contentDraftPath, request as unknown as Record<string, unknown>);
      if (!result.ok) {
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
        return result;
      }

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
        lastResponse: result.value,
        preserveResult: true,
      });
      applyContentMutationResponse(result.value, result.value.contentCard.contentId);
      store.setState({
        contentDraftForm: {
          ...store.getState().contentDraftForm,
          lastSubmission: {
            submittedAt: Date.now(),
            value: structuredClone(result.value),
          },
          submitState: finalizeFormSubmit(store.getState().contentDraftForm.submitState, {
            mode: "submit",
            submissionKey,
            submittedAt: Date.now(),
            result: structuredClone(result.value),
          }),
        },
      });
      return result;
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
