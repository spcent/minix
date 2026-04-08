export const SEARCH_MODES = ["global", "content", "user", "domain"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

export const SEARCH_DOMAINS = ["all", "content", "user", "novel", "feed"] as const;
export type SearchDomain = (typeof SEARCH_DOMAINS)[number];

export interface SearchQuery {
  keyword: string;
  mode: SearchMode;
  domain: SearchDomain;
  page: number;
  pageSize: number;
}

export interface SearchFilterOption {
  key: string;
  label: string;
  count?: number;
}

export interface SearchFilterGroup {
  key: string;
  label: string;
  multi?: boolean;
  selectedKeys: string[];
  options: SearchFilterOption[];
}

export interface SearchSortOption {
  key: string;
  label: string;
}

export interface SearchResults<TItem> {
  items: TItem[];
  total: number;
  hasMore: boolean;
  emptyText: string;
  featuredReason?: string;
  suggestionTerms: string[];
  hotKeywords: string[];
  recentKeywords: string[];
  sortOptions: SearchSortOption[];
  activeSortKey: string;
}
