import type { NovelCard, NovelSortValue, NovelStatus, SearchFilterGroup, SearchQuery, SearchResults } from "@minix/contracts";
import type { LatestMilestoneHistoryEntry } from "@minix/core";

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

export function createInitialCatalogState(options: CreateCatalogStateOptions = {}): CatalogState {
  return {
    ready: false,
    title: options.title ?? "Discover Novels",
    items: [],
    searchQuery: undefined,
    searchFilters: [],
    searchResults: undefined,
    query: {
      page: 1,
      pageSize: options.pageSize ?? 6,
      keyword: "",
    },
    loading: false,
    refreshing: false,
    hasMore: false,
    emptyText: options.emptyText ?? "No novels found yet.",
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
