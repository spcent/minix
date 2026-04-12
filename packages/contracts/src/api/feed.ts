import type { ContentAccess, ContentCard } from "./content";
import type { SearchFilterGroup, SearchQuery, SearchRankingInfo, SearchResults, SearchRouteTarget } from "./search";

export interface FeedItem {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  imageUrl?: string;
  recommendedReason?: string;
  updatedAt?: string;
  tag?: string;
  ranking?: SearchRankingInfo;
  routeTarget?: SearchRouteTarget;
  contentCard?: ContentCard;
  contentAccess?: ContentAccess;
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
