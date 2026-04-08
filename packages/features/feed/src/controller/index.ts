import { createAuthRedirectParams, createStore, ok, type AppKernel, type Result } from "@minix/core";
import { type AppRouteId, type FeedItem, type FeedListResponse, type SearchResults } from "@minix/contracts";

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

function normalizeKeyword(keyword: string): string {
  return keyword.trim();
}

function createRecentKeywords(current: string[], keyword: string): string[] {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) {
    return current;
  }

  return [normalized, ...current.filter((entry) => entry !== normalized)].slice(0, 5);
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

    store.setState({
      query: {
        ...store.getState().query,
        keyword,
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
      ...(current.activeTag && current.activeTag !== "all" ? { tag: current.activeTag } : {}),
    };
  }

  function createRouteParams(overrides: {
    keyword: string | undefined;
    tag: string | undefined;
  }): Record<string, string | number | boolean> | undefined {
    const params: Record<string, string | number | boolean> = {};

    if (overrides.keyword) {
      params.keyword = overrides.keyword;
    }

    if (overrides.tag && overrides.tag !== "all") {
      params.tag = overrides.tag;
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
    store.setState({
      loading: false,
      refreshing: false,
      errorText: result.error.message,
      ready: true,
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
          keyword: normalizeKeyword(keyword),
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
      });

      const result = await kernel.request.get<FeedListResponse>(requestPath, createRequestQuery());
      if (!result.ok) {
        return handleFeedFailure(result);
      }

      const nextSearchResults = createSearchResults(result.value, store.getState().recentKeywords, store.getState().emptyText);
      const nextItems = nextSearchResults.items.map((item) => ({ ...item }));
      store.setState({
        loading: false,
        refreshing: false,
        ready: true,
        items: nextItems,
        hasMore: nextSearchResults.hasMore,
        searchQuery: structuredClone(result.value.searchQuery),
        searchFilters: result.value.searchFilters.map((group) => structuredClone(group)),
        searchResults: nextSearchResults,
        selectedItemId: deriveSelectedItemId(nextItems, store.getState().selectedItemId),
        tags: result.value.tags?.map((tag) => ({ ...tag })) ?? store.getState().tags,
        featuredReason: nextSearchResults.featuredReason ?? result.value.featuredReason ?? deriveFeaturedReason(nextItems, store.getState().featuredReason),
        recentKeywords: nextSearchResults.recentKeywords,
        query: {
          ...store.getState().query,
          keyword: result.value.searchQuery.keyword,
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
        query: {
          ...store.getState().query,
          page: 1,
        },
      });

      const result = await kernel.request.get<FeedListResponse>(requestPath, createRequestQuery());
      if (!result.ok) {
        return handleFeedFailure(result);
      }

      const nextItems = result.value.items.map((item) => ({ ...item }));
      store.setState({
        loading: false,
        refreshing: false,
        ready: true,
        items: nextItems,
        hasMore: result.value.hasMore,
        selectedItemId: deriveSelectedItemId(nextItems, store.getState().selectedItemId),
        tags: result.value.tags?.map((tag) => ({ ...tag })) ?? store.getState().tags,
        featuredReason: result.value.featuredReason ?? deriveFeaturedReason(nextItems, store.getState().featuredReason),
        query: {
          ...store.getState().query,
          page: result.value.page ?? 1,
          pageSize: result.value.pageSize ?? store.getState().query.pageSize,
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
      store.setState({
        loading: false,
        ready: true,
        items: nextItems,
        hasMore: nextSearchResults.hasMore,
        searchQuery: structuredClone(result.value.searchQuery),
        searchFilters: result.value.searchFilters.map((group) => structuredClone(group)),
        searchResults: {
          ...nextSearchResults,
          items: nextItems,
        },
        selectedItemId: deriveSelectedItemId(nextItems, current.selectedItemId),
        tags: result.value.tags?.map((tag) => ({ ...tag })) ?? current.tags,
        featuredReason: nextSearchResults.featuredReason ?? result.value.featuredReason ?? deriveFeaturedReason(nextItems, current.featuredReason),
        recentKeywords: nextSearchResults.recentKeywords,
        query: {
          ...current.query,
          keyword: result.value.searchQuery.keyword,
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
        }),
      );
      return this.loadInitial();
    },

    selectItem(itemId: string) {
      store.setState({
        selectedItemId: itemId,
      });
    },

    async openItem(itemId?: string) {
      const nextItemId = itemId ?? store.getState().selectedItemId;
      if (!nextItemId || !detailRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(detailRouteId, { id: nextItemId });
    },

    async goToSettings() {
      return routeToOptional(settingsRouteId);
    },
  };
}
