import type { FeedItem, FeedTag, SearchFilterGroup, SearchQuery, SearchResults } from "@minix/contracts";

export interface FeedQuery {
  page: number;
  pageSize: number;
  keyword: string;
}

export interface FeedState {
  title: string;
  subtitle: string;
  ready: boolean;
  loading: boolean;
  refreshing: boolean;
  errorText: string | undefined;
  featuredReason: string | undefined;
  items: FeedItem[];
  tags: FeedTag[];
  searchQuery: SearchQuery | undefined;
  searchFilters: SearchFilterGroup[];
  searchResults: SearchResults<FeedItem> | undefined;
  activeTag: string | undefined;
  selectedItemId: string | undefined;
  query: FeedQuery;
  hasMore: boolean;
  recentKeywords: string[];
  emptyText: string;
}

export interface CreateFeedStateOptions {
  title: string;
  subtitle: string;
  pageSize: number;
  emptyText: string;
  tags?: FeedTag[];
}

export interface CreateDefaultFeedStateOptions {
  title?: string;
  subtitle?: string;
  pageSize?: number;
  emptyText?: string;
}

function cloneTags(tags: FeedTag[]): FeedTag[] {
  return tags.map((tag) => ({ ...tag }));
}

export function createFeedState(options: CreateFeedStateOptions): FeedState {
  return {
    title: options.title,
    subtitle: options.subtitle,
    ready: false,
    loading: false,
    refreshing: false,
    errorText: undefined,
    featuredReason: undefined,
    items: [],
    tags: cloneTags(options.tags ?? []),
    searchQuery: undefined,
    searchFilters: [],
    searchResults: undefined,
    activeTag: undefined,
    selectedItemId: undefined,
    query: {
      page: 1,
      pageSize: options.pageSize,
      keyword: "",
    },
    hasMore: false,
    recentKeywords: [],
    emptyText: options.emptyText,
  };
}

export function createDefaultFeedState(options: CreateDefaultFeedStateOptions = {}): FeedState {
  return createFeedState({
    title: options.title ?? "Feed",
    subtitle: options.subtitle ?? "A reusable discovery surface for ranked content, recommendations, and quick re-entry.",
    pageSize: options.pageSize ?? 12,
    emptyText: options.emptyText ?? "No feed items are available yet.",
    tags: [
      {
        key: "all",
        label: "All",
      },
    ],
  });
}
