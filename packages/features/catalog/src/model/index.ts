import type { NovelCard, NovelSortValue, NovelStatus, SearchFilterGroup, SearchQuery, SearchResults } from "@minix/contracts";
import { createListPageState, type LatestMilestoneHistoryEntry, type ListPageState } from "@minix/core";

export interface CatalogCategory {
  key: string;
  label: string;
}

export interface CatalogStatusOption {
  key: NovelStatus | "all";
  label: string;
}

export interface CatalogState {
  ready: boolean;
  title: string;
  list: ListPageState<NovelCard>;
  items: NovelCard[];
  searchQuery: SearchQuery | undefined;
  searchFilters: SearchFilterGroup[];
  searchResults: SearchResults<NovelCard> | undefined;
  query: {
    page: number;
    pageSize: number;
    keyword: string;
  };
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  emptyText: string;
  errorText: string | undefined;
  selectedNovelId: string | undefined;
  activeCategoryKey: string;
  activeStatus: NovelStatus | "all";
  sort: NovelSortValue;
  categories: CatalogCategory[];
  statusOptions: CatalogStatusOption[];
  recentSearches: string[];
  hotKeywords: string[];
  selectedReason: string | undefined;
  continueReason: string | undefined;
  updateReason: string | undefined;
  membershipReason: string | undefined;
  frontlistReason: string | undefined;
  storefrontReason: string | undefined;
  serialReason: string | undefined;
  rankingReason: string | undefined;
  latestMilestoneTitle: string | undefined;
  latestMilestoneCopy: string | undefined;
  latestMilestoneMeta: string | undefined;
  latestMilestoneNovelId: string | undefined;
  latestMilestoneChapterId: string | undefined;
  latestMilestoneSource: "reader" | "toc" | "bookshelf" | undefined;
  latestMilestoneSourceLabel: string | undefined;
  latestMilestoneRecencyLabel: string | undefined;
  latestMilestoneReturnLabel: string | undefined;
  latestMilestoneReturnHint: string | undefined;
  milestoneHistory: LatestMilestoneHistoryEntry[];
}

export interface CreateCatalogStateOptions {
  title?: string;
  pageSize?: number;
  emptyText?: string;
  activeCategoryKey?: string;
  activeStatus?: NovelStatus | "all";
  sort?: NovelSortValue;
  categories?: CatalogCategory[];
  statusOptions?: CatalogStatusOption[];
  recentSearches?: string[];
  hotKeywords?: string[];
}

export interface CreateCatalogListStateOptions {
  title: string;
  pageSize: number;
  emptyText: string;
  items?: NovelCard[];
  selectedNovelId?: string;
  searchQuery?: SearchQuery;
  searchFilters?: SearchFilterGroup[];
  searchResults?: SearchResults<NovelCard>;
  hasMore?: boolean;
  total?: number;
  keyword?: string;
  page?: number;
  sort?: NovelSortValue;
}

export function createCatalogListState(options: CreateCatalogListStateOptions): ListPageState<NovelCard> {
  return createListPageState({
    title: options.title,
    pageSize: options.pageSize,
    emptyText: options.emptyText,
    ...(options.items ? { items: options.items } : {}),
    ...(options.selectedNovelId ? { selectedItemId: options.selectedNovelId } : {}),
    ...(options.searchQuery ? { searchQuery: options.searchQuery } : {}),
    ...(options.searchFilters ? { searchFilters: options.searchFilters } : {}),
    ...(options.searchResults ? { searchResults: options.searchResults } : {}),
    hasMore: options.hasMore ?? false,
    ...(options.total !== undefined ? { total: options.total } : {}),
    query: {
      page: options.page ?? 1,
      pageSize: options.pageSize,
      ...(options.keyword ? { keyword: options.keyword } : {}),
      ...(options.sort ? { sort: [{ field: options.sort, order: "desc" }] } : {}),
    },
  });
}

export function createInitialCatalogState(options: CreateCatalogStateOptions = {}): CatalogState {
  const pageSize = options.pageSize ?? 6;
  const title = options.title ?? "Discover Novels";
  const emptyText = options.emptyText ?? "No novels found yet.";

  return {
    ready: false,
    title,
    list: createCatalogListState({
      title,
      pageSize,
      emptyText,
      sort: options.sort ?? "recommended",
    }),
    items: [],
    searchQuery: undefined,
    searchFilters: [],
    searchResults: undefined,
    query: {
      page: 1,
      pageSize,
      keyword: "",
    },
    loading: false,
    refreshing: false,
    hasMore: false,
    emptyText,
    errorText: undefined,
    selectedNovelId: undefined,
    activeCategoryKey: options.activeCategoryKey ?? "all",
    activeStatus: options.activeStatus ?? "all",
    sort: options.sort ?? "recommended",
    categories: options.categories ?? [
      { key: "all", label: "All" },
      { key: "fantasy", label: "Fantasy" },
      { key: "mystery", label: "Mystery" },
      { key: "wuxia", label: "Wuxia" },
    ],
    statusOptions: options.statusOptions ?? [
      { key: "all", label: "Any Status" },
      { key: "serializing", label: "Serializing" },
      { key: "completed", label: "Completed" },
      { key: "paused", label: "Paused" },
    ],
    recentSearches: options.recentSearches ?? [],
    hotKeywords: options.hotKeywords ?? ["lantern", "brocade", "sword", "orchid"],
    selectedReason: undefined,
    continueReason: undefined,
    updateReason: undefined,
    membershipReason: undefined,
    frontlistReason: undefined,
    storefrontReason: undefined,
    serialReason: undefined,
    rankingReason: undefined,
    latestMilestoneTitle: undefined,
    latestMilestoneCopy: undefined,
    latestMilestoneMeta: undefined,
    latestMilestoneNovelId: undefined,
    latestMilestoneChapterId: undefined,
    latestMilestoneSource: undefined,
    latestMilestoneSourceLabel: undefined,
    latestMilestoneRecencyLabel: undefined,
    latestMilestoneReturnLabel: undefined,
    latestMilestoneReturnHint: undefined,
    milestoneHistory: [],
  };
}
