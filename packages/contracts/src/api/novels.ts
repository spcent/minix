import type { ContentAccess, ContentCard } from "./content";
import type { SearchFilterGroup, SearchQuery, SearchResults } from "./search";

export const NOVEL_STATUSES = ["serializing", "completed", "paused"] as const;
export type NovelStatus = (typeof NOVEL_STATUSES)[number];

export const NOVEL_SORT_VALUES = ["recommended", "updatedAt", "popular", "wordCount"] as const;
export type NovelSortValue = (typeof NOVEL_SORT_VALUES)[number];

export interface NovelTag {
  key: string;
  label: string;
}

export interface NovelCard {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  coverUrl?: string;
  summary: string;
  categoryKey: string;
  categoryLabel: string;
  tags: NovelTag[];
  status: NovelStatus;
  latestChapterId?: string;
  latestChapterTitle?: string;
  latestChapterOrder?: number;
  continueChapterId?: string;
  continueChapterTitle?: string;
  recommendedReason?: string;
  updatedAt: string;
  wordCount: number;
  readingCount?: number;
  bookshelfCount?: number;
  isFree: boolean;
  isTrial: boolean;
  requiresMembership: boolean;
  isPurchased?: boolean;
  contentCard: ContentCard;
  contentAccess: ContentAccess;
}

export interface NovelListQuery {
  keyword?: string;
  categoryKey?: string;
  status?: NovelStatus | "all";
  sort?: NovelSortValue;
  page?: number;
  pageSize?: number;
}

export interface NovelListResponse {
  items: NovelCard[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  searchQuery: SearchQuery;
  searchFilters: SearchFilterGroup[];
  searchResults: SearchResults<NovelCard>;
}
