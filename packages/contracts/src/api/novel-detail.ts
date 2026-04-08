import type { ContentAccess, ContentDetail } from "./content";
import type { NovelStatus, NovelTag } from "./novels";

export interface NovelAuthorSummary {
  id: string;
  name: string;
  bio?: string;
}

export interface NovelLatestChapterSummary {
  id: string;
  title: string;
  order: number;
  updatedAt: string;
}

export interface RelatedNovelSummary {
  id: string;
  title: string;
  authorName: string;
  categoryLabel: string;
  status: NovelStatus;
  highlight: string;
  requiresMembership: boolean;
}

export interface NovelDetail {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  author: NovelAuthorSummary;
  coverUrl?: string;
  summary: string;
  categoryKey: string;
  categoryLabel: string;
  tags: NovelTag[];
  status: NovelStatus;
  wordCount: number;
  chapterCount: number;
  readingCount?: number;
  bookshelfCount?: number;
  ratingScore?: number;
  ratingCount?: number;
  favoriteCount?: number;
  updateCadenceLabel?: string;
  updateHistoryLabel?: string;
  trialRuleLabel?: string;
  accessRuleSummaryLabel?: string;
  authorPresenceLabel?: string;
  relatedLaneLabel?: string;
  latestChapter?: NovelLatestChapterSummary;
  firstChapterId?: string;
  continueChapterId?: string;
  isFree: boolean;
  isTrial: boolean;
  requiresMembership: boolean;
  isPurchased?: boolean;
  inBookshelf?: boolean;
  relatedNovels?: RelatedNovelSummary[];
  contentDetail: ContentDetail;
  contentAccess: ContentAccess;
}
