import type { SearchFilterGroup, SearchQuery, SearchResults } from "./search";

export interface FeedItem {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  imageUrl?: string;
  recommendedReason?: string;
  updatedAt?: string;
  tag?: string;
}

export interface FeedTag {
  key: string;
  label: string;
}

export interface FeedListResponse {
  items: FeedItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  tags?: FeedTag[];
  featuredReason?: string;
  searchQuery: SearchQuery;
  searchFilters: SearchFilterGroup[];
  searchResults: SearchResults<FeedItem>;
}
