import {
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  createControllerRouterHelpers,
  ok,
  createStore,
  deriveLatestMilestoneHistory,
  deriveLatestMilestoneContinuity,
  createSingleFlightHydrator,
  LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
  LATEST_READING_MILESTONE_STORAGE_KEY,
  normalizeSearchKeyword,
  pushRecentSearchKeyword,
  type AppKernel,
  type LatestMilestoneHistoryEntry,
  type LatestReadingMilestoneSnapshot,
  type Result,
} from "@minix/core";
import { type AppRouteId, type NovelCard, type NovelListResponse, type NovelSortValue, type NovelStatus, type SearchResults } from "@minix/contracts";

import { createCatalogListState, createInitialCatalogState, type CatalogState } from "../model";

export interface CreateCatalogControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  catalogRouteId?: AppRouteId;
  detailRouteId: AppRouteId;
  readerRouteId?: AppRouteId;
  tocRouteId?: AppRouteId;
  bookshelfRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  requestPath?: string;
  searchHistoryStorageKey?: string;
  latestMilestoneStorageKey?: string;
  latestMilestoneHistoryStorageKey?: string;
  initialState?: Partial<CatalogState>;
}

type FailedCatalogResult = Extract<Result<NovelListResponse>, { ok: false }>;
const DEFAULT_SEARCH_HISTORY_STORAGE_KEY = "catalog.search-history";

function cloneInitialState(initialState: CatalogState): CatalogState {
  return {
    ...initialState,
    list: cloneStateSnapshot(initialState.list),
    items: cloneStateSnapshotArray(initialState.items),
    ...(initialState.searchQuery ? { searchQuery: cloneStateSnapshot(initialState.searchQuery) } : {}),
    searchFilters: cloneStateSnapshotArray(initialState.searchFilters),
    ...(initialState.searchResults ? { searchResults: cloneStateSnapshot(initialState.searchResults) } : {}),
    query: cloneStateSnapshot(initialState.query),
    categories: [...initialState.categories],
    statusOptions: [...initialState.statusOptions],
    recentSearches: [...initialState.recentSearches],
    hotKeywords: [...initialState.hotKeywords],
    milestoneHistory: cloneStateSnapshotArray(initialState.milestoneHistory),
  };
}

function deriveSelectedNovelId(state: CatalogState): string | undefined {
  if (state.selectedNovelId && state.items.some((item) => item.id === state.selectedNovelId)) {
    return state.selectedNovelId;
  }

  return state.items[0]?.id;
}

function createRecommendedReason(item: NovelListResponse["items"][number], index: number): string {
  const slotLabel = item.contentCard?.display?.recommendationSlotLabel;

  if (item.continueChapterId) {
    return item.continueChapterTitle
      ? `Because you paused at ${item.continueChapterTitle}, this title is the fastest route back into flow.`
      : "Because this title already has saved progress, it should stay close to the top of the reading return path.";
  }

  if (item.requiresMembership) {
    return item.contentAccess?.summaryLabel || "Because this title sits inside the premium lane, keep it visible as a quiet merchandising recommendation.";
  }

  if (item.status === "serializing") {
    return item.latestChapterTitle
      ? `Because the serial lane is still moving, ${item.latestChapterTitle} keeps this story relevant right now.`
      : "Because this story is still serializing, it belongs in the active discovery lane.";
  }

  if (slotLabel) {
    return `Because this title currently anchors the ${slotLabel.toLowerCase()} lane, it should stay legible inside the discovery mix.`;
  }

  if (index === 0) {
    return "Because this title currently leads the frontlist, it anchors the editorial recommendation lane.";
  }

  return "Because this title complements the current frontlist mix, it stays in the recommendation stack.";
}

function annotateItems(items: NovelListResponse["items"]): NovelListResponse["items"] {
  return items.map((item, index) => ({
    ...item,
    recommendedReason: item.recommendedReason ?? createRecommendedReason(item, index),
  }));
}

function createSearchResults(
  response: NovelListResponse,
  recentSearches: string[],
  fallbackEmptyText: string,
): SearchResults<NovelCard> {
  const nextSearchResults = cloneStateSnapshot(response.searchResults);
  return {
    ...nextSearchResults,
    recentKeywords: recentSearches,
    emptyText: nextSearchResults.emptyText || fallbackEmptyText,
  };
}

function findSelectedFilterKey(response: NovelListResponse, groupKey: string): string | undefined {
  return response.searchFilters.find((group) => group.key === groupKey)?.selectedKeys[0];
}

function deriveCatalogReasons(items: NovelListResponse["items"], selectedNovelId: string | undefined): Pick<
  CatalogState,
  "selectedReason" | "continueReason" | "updateReason" | "membershipReason" | "frontlistReason" | "storefrontReason" | "serialReason" | "rankingReason"
> {
  const selected = items.find((item) => item.id === selectedNovelId) ?? items[0];
  const continueNovel = items.find((item) => item.continueChapterId);
  const updatedNovel =
    [...items.filter((item) => item.continueChapterId)].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ??
    [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  const membershipNovel = items.find((item) => item.requiresMembership);
  const frontlistNovel = items.find((item) => !item.continueChapterId) ?? items[0];
  const serialNovel = items.find((item) => item.status === "serializing");
  const rankedNovel = [...items].sort((left, right) => (right.readingCount ?? 0) - (left.readingCount ?? 0))[0];

  return {
    selectedReason: selected?.recommendedReason,
    continueReason: continueNovel?.recommendedReason,
    updateReason: updatedNovel
      ? updatedNovel.continueChapterId
        ? updatedNovel.continueChapterTitle
          ? `Because ${updatedNovel.continueChapterTitle} sits on a title you already touched, the recent-updates lane belongs near the top of the storefront.`
          : `Because ${updatedNovel.title} moved after your last session, the recent-updates lane keeps it visible.`
        : updatedNovel.latestChapterTitle
          ? `Because ${updatedNovel.latestChapterTitle} just landed, the recent-updates lane stays anchored to live serial movement.`
          : updatedNovel.recommendedReason
      : undefined,
    membershipReason: membershipNovel?.recommendedReason,
    frontlistReason: frontlistNovel
      ? frontlistNovel.requiresMembership
        ? `Because ${frontlistNovel.title} gives the frontlist a premium edge, discovery can stay commercial without turning into a loud paywall.`
        : frontlistNovel.contentCard?.display?.recommendationSlotLabel
          ? `${frontlistNovel.title} anchors the ${frontlistNovel.contentCard.display.recommendationSlotLabel.toLowerCase()} lane without losing editorial clarity.`
          : frontlistNovel.status === "serializing"
          ? `Because ${frontlistNovel.title} is still moving, the frontlist stays anchored to a living serial instead of a static archive.`
          : `Because ${frontlistNovel.title} balances category breadth and reading momentum, it anchors the editorial discovery lane.`
      : undefined,
    storefrontReason: continueNovel
      ? `${continueNovel.title} gives the storefront a live return path, so discovery can stay personal without turning into a utility dashboard.`
      : frontlistNovel
        ? `${frontlistNovel.title} anchors the storefront as an editorial lead while the rest of the frontlist stays commercially legible.`
        : undefined,
    serialReason: serialNovel
      ? serialNovel.latestChapterTitle
        ? `${serialNovel.latestChapterTitle} keeps the serial lane feeling active instead of archival.`
        : `${serialNovel.title} keeps the serial lane moving with live publication cadence.`
      : undefined,
    rankingReason: rankedNovel
      ? `${rankedNovel.title} currently leads the readership table, so the ranking lane can work like a quick confidence signal instead of filler.`
      : undefined,
  };
}

export function createCatalogController(options: CreateCatalogControllerOptions) {
  const {
    kernel,
    loginRouteId,
    catalogRouteId,
    detailRouteId,
    readerRouteId,
    tocRouteId,
    bookshelfRouteId,
    settingsRouteId,
    requestPath = "/novels",
    searchHistoryStorageKey = DEFAULT_SEARCH_HISTORY_STORAGE_KEY,
    latestMilestoneStorageKey = LATEST_READING_MILESTONE_STORAGE_KEY,
    latestMilestoneHistoryStorageKey = LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
    initialState,
  } = options;
  const store = createStore<CatalogState>({
    ...cloneInitialState(createInitialCatalogState()),
    ...initialState,
  });
  const { routeToLogin, routeToOptional } = createControllerRouterHelpers({
    kernel,
    loginRouteId,
  });

  function createRecentSearches(current: string[], keyword: string): string[] {
    return pushRecentSearchKeyword(current, keyword);
  }

  async function persistRecentSearches(recentSearches: string[]) {
    return kernel.storage.set(searchHistoryStorageKey, recentSearches);
  }

  const hydrateSearchHistory = createSingleFlightHydrator<void>(
    async (): Promise<Result<void>> => {
      const result = await kernel.storage.get<string[]>(searchHistoryStorageKey);
      if (!result.ok) {
        return result;
      }

      const recentSearches = result.value ?? store.getState().recentSearches;
      const currentSearchResults = store.getState().searchResults;
      if (currentSearchResults) {
        store.setState({
          recentSearches,
          searchResults: {
            ...currentSearchResults,
            recentKeywords: recentSearches,
          },
        });
      } else {
        store.setState({
          recentSearches,
        });
      }
      return ok(undefined);
    },
  );

  async function hydrateLatestMilestone() {
    const result = await kernel.storage.get<LatestReadingMilestoneSnapshot>(latestMilestoneStorageKey);
    if (!result.ok) {
      return result;
    }

    const continuity = deriveLatestMilestoneContinuity(result.value);
    const historyResult = await kernel.storage.get<LatestReadingMilestoneSnapshot[]>(latestMilestoneHistoryStorageKey);
    const milestoneHistory: LatestMilestoneHistoryEntry[] = historyResult.ok
      ? deriveLatestMilestoneHistory(historyResult.value)
      : [];

    store.setState({
      latestMilestoneTitle: result.value?.title,
      latestMilestoneCopy: result.value?.copy,
      latestMilestoneMeta: result.value?.meta,
      latestMilestoneNovelId: result.value?.novelId,
      latestMilestoneChapterId: result.value?.chapterId,
      latestMilestoneSource: result.value?.source,
      latestMilestoneSourceLabel: continuity?.sourceLabel,
      latestMilestoneRecencyLabel: continuity?.recencyLabel,
      latestMilestoneReturnLabel: continuity?.returnLabel,
      latestMilestoneReturnHint: continuity?.returnHint,
      milestoneHistory,
    });
    return ok(undefined);
  }

  function hydrateStateFromRoute() {
    const current = kernel.router.current();
    if (!current.ok || !current.value?.params) {
      return;
    }

    const keyword = typeof current.value.params.keyword === "string" ? current.value.params.keyword : store.getState().query.keyword;
    const categoryKey =
      typeof current.value.params.categoryKey === "string" ? current.value.params.categoryKey : store.getState().activeCategoryKey;
    const status =
      typeof current.value.params.status === "string" ? current.value.params.status : store.getState().activeStatus;
    const sort =
      typeof current.value.params.sort === "string" ? current.value.params.sort : store.getState().sort;

    store.setState({
      query: {
        ...store.getState().query,
        keyword,
      },
      activeCategoryKey: categoryKey,
      activeStatus: status as CatalogState["activeStatus"],
      sort: sort as NovelSortValue,
    });
  }

  async function syncRoute() {
    if (!catalogRouteId) {
      return ok(undefined);
    }

    const current = store.getState();
    return kernel.router.replaceRoute(catalogRouteId, {
      ...(current.query.keyword ? { keyword: current.query.keyword } : {}),
      ...(current.activeCategoryKey !== "all" ? { categoryKey: current.activeCategoryKey } : {}),
      ...(current.activeStatus !== "all" ? { status: current.activeStatus } : {}),
      ...(current.sort !== "recommended" ? { sort: current.sort } : {}),
    });
  }

  async function handleLoadFailure(result: FailedCatalogResult) {
    store.setState({
      loading: false,
      refreshing: false,
      errorText: result.error.message,
    });

    if (result.error.code === "UNAUTHORIZED") {
      return routeToLogin();
    }

    return result;
  }

  async function requestPage(page: number, append: boolean) {
    const current = store.getState();
    const result = await kernel.request.get<NovelListResponse>(requestPath, {
      page,
      pageSize: current.query.pageSize,
      categoryKey: current.activeCategoryKey === "all" ? undefined : current.activeCategoryKey,
      status: current.activeStatus === "all" ? undefined : current.activeStatus,
      sort: current.sort,
      keyword: current.query.keyword || undefined,
    });

    if (!result.ok) {
      return handleLoadFailure(result);
    }

    const nextSearchResults = createSearchResults(result.value, current.recentSearches, current.emptyText);
    const annotatedItems = annotateItems(nextSearchResults.items);
    const nextItems = append ? annotateItems([...current.items, ...annotatedItems]) : annotatedItems;
    const nextQuery = {
      ...current.query,
      keyword: result.value.searchQuery.keyword,
      page: result.value.searchQuery.page,
      pageSize: result.value.searchQuery.pageSize,
    };
    const selectedNovelId = deriveSelectedNovelId({
      ...current,
      items: nextItems,
    });
    store.setState({
      ready: true,
      loading: false,
      refreshing: false,
      items: nextItems,
      hasMore: nextSearchResults.hasMore,
      searchQuery: cloneStateSnapshot(result.value.searchQuery),
      searchFilters: cloneStateSnapshotArray(result.value.searchFilters),
      searchResults: {
        ...nextSearchResults,
        items: nextItems,
      },
      query: nextQuery,
      list: createCatalogListState({
        title: current.title,
        pageSize: nextQuery.pageSize,
        emptyText: current.emptyText,
        items: nextItems,
        ...(selectedNovelId ? { selectedNovelId } : {}),
        searchQuery: result.value.searchQuery,
        searchFilters: result.value.searchFilters,
        searchResults: {
          ...nextSearchResults,
          items: nextItems,
        },
        hasMore: nextSearchResults.hasMore,
        ...(nextSearchResults.total !== undefined ? { total: nextSearchResults.total } : {}),
        keyword: nextQuery.keyword,
        page: nextQuery.page,
        sort: result.value.searchResults.activeSortKey as NovelSortValue,
      }),
      errorText: undefined,
      recentSearches: nextSearchResults.recentKeywords,
      hotKeywords: nextSearchResults.hotKeywords,
      sort: result.value.searchResults.activeSortKey as NovelSortValue,
      activeCategoryKey: findSelectedFilterKey(result.value, "category") ?? "all",
      activeStatus: (findSelectedFilterKey(result.value, "status") as NovelStatus | "all" | undefined) ?? "all",
      selectedNovelId,
      ...deriveCatalogReasons(nextItems, selectedNovelId),
    });

    return result;
  }

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    async loadInitial() {
      hydrateStateFromRoute();
      await hydrateSearchHistory();
      await hydrateLatestMilestone();
      store.setState({
        loading: true,
        refreshing: false,
        errorText: undefined,
      });

      return requestPage(1, false);
    },

    async loadMore() {
      const current = store.getState();
      if (current.loading || !current.hasMore) {
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorText: undefined,
      });

      return requestPage((current.query.page ?? 1) + 1, true);
    },

    selectNovel(novelId: string) {
      const current = store.getState();
      const selected = current.items.find((item) => item.id === novelId);
      store.setState({
        selectedNovelId: novelId,
        selectedReason: selected?.recommendedReason,
        list: createCatalogListState({
          title: current.title,
          pageSize: current.query.pageSize,
          emptyText: current.emptyText,
          items: current.items,
          selectedNovelId: novelId,
          ...(current.searchQuery ? { searchQuery: current.searchQuery } : {}),
          searchFilters: current.searchFilters,
          ...(current.searchResults ? { searchResults: current.searchResults } : {}),
          hasMore: current.hasMore,
          ...(current.searchResults?.total !== undefined ? { total: current.searchResults.total } : {}),
          keyword: current.query.keyword,
          page: current.query.page,
          sort: current.sort,
        }),
      });
    },

    async goToNovelDetail(novelId?: string) {
      const current = store.getState();
      const targetNovelId = novelId ?? current.selectedNovelId ?? current.items[0]?.id;
      if (!targetNovelId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(detailRouteId, {
        novelId: targetNovelId,
      });
    },

    async openSelectedNovel() {
      return this.goToNovelDetail();
    },

    async continueReading(novelId?: string) {
      const current = store.getState();
      const targetNovel =
        current.items.find((item) => item.id === (novelId ?? current.selectedNovelId)) ??
        current.items.find((item) => item.id === current.selectedNovelId) ??
        current.items[0];
      if (!targetNovel) {
        return ok(undefined);
      }

      if (!readerRouteId || !targetNovel.continueChapterId) {
        return this.goToNovelDetail(targetNovel.id);
      }

      return kernel.router.toRoute(readerRouteId, {
        novelId: targetNovel.id,
        chapterId: targetNovel.continueChapterId,
      });
    },

    async openLatestMilestone() {
      const current = store.getState();

      if (current.latestMilestoneSource === "reader" && readerRouteId && current.latestMilestoneNovelId && current.latestMilestoneChapterId) {
        return kernel.router.toRoute(readerRouteId, {
          novelId: current.latestMilestoneNovelId,
          chapterId: current.latestMilestoneChapterId,
        });
      }

      if (current.latestMilestoneSource === "toc" && tocRouteId && current.latestMilestoneNovelId) {
        return kernel.router.toRoute(tocRouteId, {
          novelId: current.latestMilestoneNovelId,
          ...(current.latestMilestoneChapterId ? { chapterId: current.latestMilestoneChapterId } : {}),
        });
      }

      if (current.latestMilestoneSource === "bookshelf" && bookshelfRouteId) {
        return routeToOptional(bookshelfRouteId);
      }

      if (current.latestMilestoneNovelId) {
        return this.goToNovelDetail(current.latestMilestoneNovelId);
      }

      return ok(undefined);
    },

    async openMilestoneHistoryItem(indexValue?: string | number) {
      const current = store.getState();
      const index = typeof indexValue === "number" ? indexValue : Number(indexValue ?? 0);
      const item = current.milestoneHistory[index];
      if (!item) {
        return ok(undefined);
      }

      if (item.source === "reader" && readerRouteId && item.novelId && item.chapterId) {
        return kernel.router.toRoute(readerRouteId, {
          novelId: item.novelId,
          chapterId: item.chapterId,
        });
      }

      if (item.source === "toc" && tocRouteId && item.novelId) {
        return kernel.router.toRoute(tocRouteId, {
          novelId: item.novelId,
          ...(item.chapterId ? { chapterId: item.chapterId } : {}),
        });
      }

      if (item.source === "bookshelf" && bookshelfRouteId) {
        return routeToOptional(bookshelfRouteId);
      }

      if (item.novelId) {
        return this.goToNovelDetail(item.novelId);
      }

      return ok(undefined);
    },

    async goToBookshelf() {
      return routeToOptional(bookshelfRouteId);
    },

    async goToSettings() {
      return routeToOptional(settingsRouteId);
    },

    async applyCategory(categoryKey: string) {
      store.setState({
        activeCategoryKey: categoryKey,
        selectedNovelId: undefined,
      });

      await syncRoute();
      return this.loadInitial();
    },

    async applyStatus(status: NovelStatus | "all") {
      store.setState({
        activeStatus: status,
        selectedNovelId: undefined,
      });

      await syncRoute();
      return this.loadInitial();
    },

    async applySort(sort: NovelSortValue) {
      store.setState({
        sort,
        selectedNovelId: undefined,
      });

      await syncRoute();
      return this.loadInitial();
    },

    setKeyword(keyword: string) {
      store.setState({
        query: {
          ...store.getState().query,
          keyword: normalizeSearchKeyword(keyword),
        },
      });
    },

    async applySearchKeyword(keyword: string) {
      store.setState({
        query: {
          ...store.getState().query,
          keyword: normalizeSearchKeyword(keyword),
        },
        selectedNovelId: undefined,
      });

      return this.submitSearch();
    },

    async submitSearch() {
      const current = store.getState();
      const recentSearches = createRecentSearches(current.recentSearches, current.query.keyword);
      store.setState({
        selectedNovelId: undefined,
        recentSearches,
      });

      await persistRecentSearches(recentSearches);
      await syncRoute();
      return this.loadInitial();
    },

    async clearSearch() {
      store.setState({
        query: {
          ...store.getState().query,
          keyword: "",
        },
        selectedNovelId: undefined,
      });

      await syncRoute();
      return this.loadInitial();
    },
  };
}
