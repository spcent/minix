import {
  createAuthRedirectParams,
  createStore,
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
  type ContentLifecycleAction,
  type ContentLifecycleMutationResponse,
  type ContentVisibility,
  type FeedItem,
  type FeedListResponse,
  type SearchDomain,
  type SearchMode,
  type SearchResults,
} from "@minix/contracts";

import { createDefaultFeedState, type FeedState } from "../model";

export interface CreateFeedControllerOptions {
  kernel: AppKernel;
  initialState?: Partial<FeedState>;
  feedRouteId?: AppRouteId;
  detailRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  requestPath?: string;
  searchHistoryStorageKey?: string;
  authRedirectSource?: string;
}

type FailedFeedResult = Extract<Result<FeedListResponse>, { ok: false }>;

const DEFAULT_SEARCH_HISTORY_STORAGE_KEY = "feed.recent-keywords";

function cloneState(state: FeedState): FeedState {
  return {
    ...state,
    items: state.items.map((item) => ({ ...item })),
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
    query: { ...state.query },
    recentKeywords: [...state.recentKeywords],
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
): SearchResults<FeedItem> {
  const nextSearchResults = structuredClone(response.searchResults);
  return {
    ...nextSearchResults,
    recentKeywords,
    emptyText: nextSearchResults.emptyText || fallbackEmptyText,
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

function deriveSelectedContentId(state: FeedState): string | undefined {
  return state.items.find((item) => item.id === state.selectedItemId)?.contentCard?.contentId;
}

function createListStatus(
  loadState: FeedState["status"]["loadState"],
  options: {
    firstLoaded?: boolean;
    partialData?: boolean;
  } = {},
): FeedState["status"] {
  return {
    loadState,
    firstLoaded: options.firstLoaded ?? !["idle", "loading", "refreshing"].includes(loadState),
    retryable: true,
    partialData: options.partialData ?? false,
    stickyHeaderEnabled: false,
  };
}

export function createFeedController(options: CreateFeedControllerOptions) {
  const {
    kernel,
    feedRouteId,
    detailRouteId,
    settingsRouteId,
    loginRouteId,
    requestPath = "/feed",
    searchHistoryStorageKey = DEFAULT_SEARCH_HISTORY_STORAGE_KEY,
    authRedirectSource = "feed",
    initialState,
  } = options;
  const store = createStore<FeedState>({
    ...cloneState(createDefaultFeedState()),
    ...initialState,
  });
  let keywordHydration: Promise<Result<void>> | null = null;

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

    store.setState({
      query: {
        ...store.getState().query,
        keyword,
        mode,
        domain,
      },
      activeTag: tag,
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
      ...(current.activeTag && current.activeTag !== "all" ? { tag: current.activeTag } : {}),
    };
  }

  function createRouteParams(overrides: {
    keyword: string | undefined;
    tag: string | undefined;
    mode?: SearchMode;
    domain?: SearchDomain;
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
      }),
    });

    if (result.error.code === "UNAUTHORIZED") {
      await routeToLogin();
    }

    return result;
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
      store.setState({
        loading: true,
        refreshing: false,
        errorText: undefined,
        contentTransitionFeedback: undefined,
        status: createListStatus("loading", {
          firstLoaded: store.getState().status.firstLoaded,
        }),
      });

      const result = await kernel.request.get<FeedListResponse>(requestPath, createRequestQuery());
      if (!result.ok) {
        return handleFeedFailure(result);
      }

      const nextSearchResults = createSearchResults(result.value, store.getState().recentKeywords, store.getState().emptyText);
      const nextItems = nextSearchResults.items.map((item) => ({ ...item }));
      const selectedItemId = deriveSelectedItemId(nextItems, store.getState().selectedItemId);
      const loadState = nextItems.length > 0 ? "ready" : "empty";
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
        selectedItemId,
        selection: createSelection(selectedItemId),
        status: createListStatus(loadState, {
          firstLoaded: true,
        }),
        tags: result.value.tags?.map((tag) => ({ ...tag })) ?? store.getState().tags,
        featuredReason: nextSearchResults.featuredReason ?? result.value.featuredReason ?? deriveFeaturedReason(nextItems, store.getState().featuredReason),
        recentKeywords: nextSearchResults.recentKeywords,
        query: {
          ...store.getState().query,
          keyword: result.value.searchQuery.keyword,
          mode: result.value.searchQuery.mode,
          domain: result.value.searchQuery.domain,
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
        }),
      });

      const result = await kernel.request.get<FeedListResponse>(requestPath, createRequestQuery());
      if (!result.ok) {
        return handleFeedFailure(result);
      }

      const nextItems = result.value.items.map((item) => ({ ...item }));
      const selectedItemId = deriveSelectedItemId(nextItems, store.getState().selectedItemId);
      const nextSearchResults = createSearchResults(result.value, store.getState().recentKeywords, store.getState().emptyText);
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
        selectedItemId,
        selection: createSelection(selectedItemId),
        status: createListStatus(loadState, {
          firstLoaded: true,
        }),
        tags: result.value.tags?.map((tag) => ({ ...tag })) ?? store.getState().tags,
        featuredReason: result.value.featuredReason ?? deriveFeaturedReason(nextItems, store.getState().featuredReason),
        query: {
          ...store.getState().query,
          keyword: result.value.searchQuery.keyword,
          mode: result.value.searchQuery.mode,
          domain: result.value.searchQuery.domain,
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

      const nextSearchResults = createSearchResults(result.value, current.recentKeywords, current.emptyText);
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
        selectedItemId,
        selection: createSelection(selectedItemId),
        status: createListStatus(loadState, {
          firstLoaded: true,
        }),
        tags: result.value.tags?.map((tag) => ({ ...tag })) ?? current.tags,
        featuredReason: nextSearchResults.featuredReason ?? result.value.featuredReason ?? deriveFeaturedReason(nextItems, current.featuredReason),
        recentKeywords: nextSearchResults.recentKeywords,
        query: {
          ...current.query,
          keyword: result.value.searchQuery.keyword,
          mode: result.value.searchQuery.mode,
          domain: result.value.searchQuery.domain,
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
        }),
      );
      return this.loadInitial();
    },

    selectItem(itemId: string) {
      store.setState({
        selectedItemId: itemId,
        selection: createSelection(itemId),
      });
    },

    async openItem(itemId?: string) {
      const nextItemId = itemId ?? store.getState().selectedItemId;
      if (!nextItemId || !detailRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(detailRouteId, { id: nextItemId });
    },

    async applyContentLifecycleAction(
      action: ContentLifecycleAction,
      options: {
        contentId?: string;
        visibility?: ContentVisibility;
        reviewMessage?: string;
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

      const result = await kernel.request.post<ContentLifecycleMutationResponse>("/content/lifecycle", {
        contentId,
        action,
        ...(options.visibility ? { visibility: options.visibility } : {}),
        ...(options.reviewMessage ? { reviewMessage: options.reviewMessage } : {}),
      });
      if (!result.ok) {
        store.setState({
          contentTransitionFeedback: result.error.message,
        });
        return result;
      }

      const currentItem = state.items.find((item) => item.id === contentId);
      if (currentItem) {
        const nextItem: FeedItem = {
          ...currentItem,
          title: result.value.contentCard.title,
          ...(result.value.contentCard.subtitle ? { subtitle: result.value.contentCard.subtitle } : {}),
          ...(result.value.contentDetail.recommendationReason ?? currentItem.recommendedReason
            ? { recommendedReason: result.value.contentDetail.recommendationReason ?? currentItem.recommendedReason }
            : {}),
          contentCard: result.value.contentCard,
          contentAccess: result.value.contentAccess,
        };
        const nextItems = replaceFeedItem(state.items, nextItem);
        store.setState({
          items: nextItems,
          searchResults: state.searchResults
            ? {
                ...state.searchResults,
                items: replaceFeedItem(state.searchResults.items, nextItem),
              }
            : state.searchResults,
          featuredReason: deriveFeaturedReason(nextItems, state.featuredReason),
          contentTransitionFeedback: result.value.transitionMessage,
        });
      } else {
        store.setState({
          contentTransitionFeedback: result.value.transitionMessage,
        });
      }

      return result;
    },

    async goToSettings() {
      return routeToOptional(settingsRouteId);
    },
  };
}
