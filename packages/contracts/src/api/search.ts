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
  sortKey?: string;
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
  persistenceScope?: "route" | "session" | "memory";
  reloadBehavior?: "restore" | "reset";
  options: SearchFilterOption[];
}

export interface SearchSortOption {
  key: string;
  label: string;
}

export interface SearchRouteTarget {
  routeId: string;
  params?: Record<string, string | number | boolean>;
  label?: string;
}

export interface SearchRecoverySuggestion {
  keyword: string;
  label: string;
  reason: string;
}

export interface SearchRankingInfo {
  score: number;
  label: string;
  strategy: string;
  matchedFields: string[];
}

export interface SearchRankingSummary {
  strategy: string;
  label: string;
  appliedSortKey: string;
}

export interface SearchDomainTab {
  domain: SearchDomain;
  label: string;
  total: number;
  active: boolean;
}

export interface SearchResultGroup<TItem> {
  domain: SearchDomain;
  label: string;
  total: number;
  items: TItem[];
  featuredReason?: string;
}

export interface SearchGroupingSummary {
  strategy: "flat" | "grouped" | "interleaved";
  activeGroupCount: number;
  label: string;
}

export interface SearchPersistenceSummary {
  routeKeys: string[];
  routeWriteback: boolean;
  reloadRecovery: "none" | "route" | "storage";
  recentKeywordCount: number;
  label: string;
}

export interface SearchZeroResultGuidance {
  state: "results" | "empty" | "corrected";
  label: string;
  suggestedAction: string;
  suggestedKeyword?: string;
}

export interface SearchQualitySummary {
  rankingSummary: string;
  synonymSummary: string;
  correctionSummary: string;
  recentSearchSummary: string;
  routeWritebackSummary: string;
  zeroResultSummary: string;
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
  correctionKeyword?: string;
  correctionReason?: string;
  recoverySuggestions?: SearchRecoverySuggestion[];
  ranking?: SearchRankingSummary;
  activeDomain?: SearchDomain;
  domainTabs?: SearchDomainTab[];
  resultGroups?: SearchResultGroup<TItem>[];
  grouping?: SearchGroupingSummary;
  persistence?: SearchPersistenceSummary;
  zeroResultGuidance?: SearchZeroResultGuidance;
  qualitySummary?: SearchQualitySummary;
}
