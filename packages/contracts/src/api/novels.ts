import type { SearchFilterGroup, SearchQuery, SearchResults } from "./search";

export type NovelStatus = "serializing" | "completed" | "paused";

export type NovelSortValue = "recommended" | "updatedAt" | "popular" | "wordCount";

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
