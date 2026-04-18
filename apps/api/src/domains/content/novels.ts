import type {
  BookshelfItem,
  BookshelfResponse,
  ChapterContent,
  ChapterListResponse,
  ChapterSummary,
  ContentAccess,
  ContentCard,
  ContentDetail,
  ContentDisplay,
  ContentLifecycle,
  NovelCard,
  NovelDetail,
  NovelListResponse,
  RelatedNovelSummary,
} from "@minix/contracts";

import { CHAPTER_CONTENT, DEFAULT_BOOKSHELF_NOVEL_IDS, NOVELS } from "../../content";
import { resolveSampleMediaUrl } from "../../sample-assets";
import type { UserState } from "../../types";
import { createNovelSearchFilters, createNovelSearchResults } from "./search";

function isPurchasedByMembership(
  record: { requiresMembership: boolean; isPurchased?: boolean },
  membershipActive: boolean,
): boolean {
  return Boolean(record.isPurchased || (record.requiresMembership && membershipActive));
}

function resolveNovelAccess(detail: NovelDetail, membershipActive: boolean): NovelDetail {
  return {
    ...detail,
    isPurchased: isPurchasedByMembership(detail, membershipActive),
  };
}

function createBookshelfCountResolver(bookshelfNovelIds: Set<string>) {
  const initialBookshelfNovelIds = new Set<string>(DEFAULT_BOOKSHELF_NOVEL_IDS);

  return (detail: NovelDetail): number | undefined => {
    if (detail.bookshelfCount === undefined) {
      return detail.bookshelfCount;
    }

    if (bookshelfNovelIds.has(detail.id) && !initialBookshelfNovelIds.has(detail.id)) {
      return detail.bookshelfCount + 1;
    }

    if (!bookshelfNovelIds.has(detail.id) && initialBookshelfNovelIds.has(detail.id)) {
      return Math.max(0, detail.bookshelfCount - 1);
    }

    return detail.bookshelfCount;
  };
}

function createNovelContentLifecycle(detail: NovelDetail): ContentLifecycle {
  const updatedAt = detail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z";
  return {
    state: "published",
    availableActions: ["update", "archive", "delete"],
    publishedAt: updatedAt,
    updatedAt,
  };
}

function createNovelContentDisplay(
  detail: NovelDetail,
  slot: ContentDisplay["recommendationSlot"],
  slotLabel: string,
): ContentDisplay {
  return {
    category: {
      key: detail.categoryKey,
      label: detail.categoryLabel,
    },
    tags: detail.tags.map((tag) => ({ key: tag.key, label: tag.label })),
    topics: detail.tags.slice(0, 2).map((tag) => ({ key: tag.key, label: tag.label })),
    ...(slot ? { recommendationSlot: slot } : {}),
    recommendationSlotLabel: slotLabel,
    recommendationSummary:
      slot === "continue_reading"
        ? "Continue-reading lane keeps the last active chapter visible in shared discovery."
        : slot === "premium"
          ? "Premium lane keeps locked titles visible until membership unlocks the full route."
          : slot === "frontlist"
            ? "Frontlist lane keeps serializing titles surfaced for return visits."
            : "Ranking lane keeps completed titles visible through shared popularity posture.",
    laneGovernanceSummary:
      slot === "premium"
        ? "Premium governance keeps this title in member-aware recommendation lanes."
        : slot === "continue_reading"
          ? "Continue-reading governance keeps this title scoped to recent reader activity."
          : "Shared recommendation governance keeps this title in the discover-centered content stack.",
    pinned: detail.status === "serializing",
    featured: detail.requiresMembership || detail.status === "serializing",
  };
}

export function createNovelContentAccess(detail: NovelDetail): ContentAccess {
  const purchased = Boolean(detail.isPurchased);
  return {
    visibility: detail.requiresMembership ? "member_only" : "public",
    accessible: !detail.requiresMembership || purchased || detail.isFree,
    previewAvailable: Boolean(detail.isFree || detail.isTrial),
    requiresLogin: false,
    requiresMembership: detail.requiresMembership,
    requiresPurchase: false,
    purchased,
    summaryLabel:
      detail.accessRuleSummaryLabel ??
      (detail.requiresMembership
        ? "This title stays in the premium lane until membership unlocks the complete reading route after the visible preview boundary."
        : "Open-access reading continues without a paywall in the current sample surface."),
    ...(detail.requiresMembership ? { gateLabel: "Membership required for full reading" } : {}),
    ...(detail.requiresMembership ? { entitlementLabel: "Membership unlock" } : {}),
  };
}

function createNovelContentDetail(detail: NovelDetail): ContentDetail {
  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(
      detail,
      detail.requiresMembership ? "premium" : detail.status === "serializing" ? "frontlist" : "ranking",
      detail.requiresMembership
        ? "Premium Spotlight"
        : detail.status === "serializing"
          ? "Frontlist Serial"
          : "Completed Archive",
    ),
    lifecycle: createNovelContentLifecycle(detail),
    ...(detail.relatedLaneLabel ? { recommendationReason: detail.relatedLaneLabel } : {}),
  };
}

export function createNovelContentCard(
  detail: NovelDetail,
  continueChapterId: string | undefined,
  continueChapterTitle: string | undefined,
): ContentCard {
  const slot = continueChapterId
    ? "continue_reading"
    : detail.requiresMembership
      ? "premium"
      : detail.status === "serializing"
        ? "frontlist"
        : "ranking";
  const slotLabel = continueChapterId
    ? continueChapterTitle
      ? `Continue · ${continueChapterTitle}`
      : "Continue Reading"
    : detail.requiresMembership
      ? "Premium Spotlight"
      : detail.status === "serializing"
        ? "Frontlist Serial"
        : "Completed Archive";

  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(detail, slot, slotLabel),
    lifecycle: createNovelContentLifecycle(detail),
    moderationSummary: "Novel recommendation posture stays additive to the shared content stack without entering the managed editorial review queue.",
  };
}

function createRelatedNovelSummaries(detail: NovelDetail, membershipActive: boolean): RelatedNovelSummary[] {
  return NOVELS.filter((candidate) => candidate.id !== detail.id)
    .sort((left, right) => {
      const leftScore = Number(left.categoryKey === detail.categoryKey) * 2 + Number(left.status === detail.status);
      const rightScore = Number(right.categoryKey === detail.categoryKey) * 2 + Number(right.status === detail.status);
      return rightScore - leftScore;
    })
    .slice(0, 3)
    .map((candidate) => {
      const resolvedCandidate = resolveNovelAccess(candidate, membershipActive);
      return {
        id: resolvedCandidate.id,
        title: resolvedCandidate.title,
        authorName: resolvedCandidate.author.name,
        categoryLabel: resolvedCandidate.categoryLabel,
        status: resolvedCandidate.status,
        requiresMembership: resolvedCandidate.requiresMembership && !resolvedCandidate.isPurchased,
        highlight:
          resolvedCandidate.categoryKey === detail.categoryKey
            ? `Shared ${resolvedCandidate.categoryLabel.toLowerCase()} lane`
            : resolvedCandidate.status === detail.status
              ? `Similar ${resolvedCandidate.status} rhythm`
              : "Editorially adjacent pick",
      };
    });
}

export function resolveNovelDetail(
  detail: NovelDetail,
  membershipActive: boolean,
  bookshelfNovelIds?: Set<string>,
  requestUrl?: string,
): NovelDetail {
  const resolveBookshelfCount = bookshelfNovelIds ? createBookshelfCountResolver(bookshelfNovelIds) : undefined;
  const bookshelfCount = resolveBookshelfCount?.(detail);
  const resolvedCoverUrl =
    detail.coverUrl && requestUrl ? resolveSampleMediaUrl(detail.coverUrl, requestUrl) : detail.coverUrl;

  const resolvedDetail = {
    ...detail,
    ...(resolvedCoverUrl ? { coverUrl: resolvedCoverUrl } : {}),
    isPurchased: isPurchasedByMembership(detail, membershipActive),
    ...(bookshelfCount !== undefined ? { bookshelfCount } : {}),
    ...(bookshelfNovelIds ? { inBookshelf: bookshelfNovelIds.has(detail.id) } : {}),
    relatedNovels: createRelatedNovelSummaries(detail, membershipActive),
  };

  return {
    ...resolvedDetail,
    contentDetail: createNovelContentDetail(resolvedDetail),
    contentAccess: createNovelContentAccess(resolvedDetail),
  };
}

function resolveChapterSummary(chapter: ChapterSummary, membershipActive: boolean): ChapterSummary {
  return {
    ...chapter,
    isPurchased: isPurchasedByMembership(chapter, membershipActive),
  };
}

export function resolveChapterList(
  response: ChapterListResponse,
  membershipActive: boolean,
): ChapterListResponse {
  return {
    ...response,
    volumes: response.volumes.map((volume) => ({
      ...volume,
      chapters: volume.chapters.map((chapter) => resolveChapterSummary(chapter, membershipActive)),
    })),
  };
}

export function resolveChapterContent(
  chapter: ChapterContent,
  membershipActive: boolean,
): ChapterContent {
  return {
    ...chapter,
    isPurchased: isPurchasedByMembership(chapter, membershipActive),
  };
}

export function toNovelCard(
  detail: NovelDetail,
  membershipActive: boolean,
  userState: UserState,
  requestUrl?: string,
): NovelCard {
  const resolvedDetail = resolveNovelDetail(detail, membershipActive, userState.bookshelfNovelIds, requestUrl);
  const progress = userState.progressByNovelId[resolvedDetail.id];
  const continueChapterId = progress?.chapterId ?? resolvedDetail.continueChapterId ?? resolvedDetail.firstChapterId;
  const continueChapterTitle = continueChapterId ? CHAPTER_CONTENT[continueChapterId]?.title : undefined;

  return {
    id: resolvedDetail.id,
    slug: resolvedDetail.slug,
    title: resolvedDetail.title,
    authorName: resolvedDetail.author.name,
    summary: resolvedDetail.summary,
    categoryKey: resolvedDetail.categoryKey,
    categoryLabel: resolvedDetail.categoryLabel,
    tags: resolvedDetail.tags,
    status: resolvedDetail.status,
    updatedAt: resolvedDetail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z",
    wordCount: resolvedDetail.wordCount,
    isFree: resolvedDetail.isFree,
    isTrial: resolvedDetail.isTrial,
    requiresMembership: resolvedDetail.requiresMembership,
    ...(resolvedDetail.latestChapter?.id ? { latestChapterId: resolvedDetail.latestChapter.id } : {}),
    ...(resolvedDetail.latestChapter?.title ? { latestChapterTitle: resolvedDetail.latestChapter.title } : {}),
    ...(resolvedDetail.latestChapter?.order !== undefined
      ? { latestChapterOrder: resolvedDetail.latestChapter.order }
      : {}),
    ...(continueChapterId ? { continueChapterId } : {}),
    ...(continueChapterTitle ? { continueChapterTitle } : {}),
    ...(resolvedDetail.readingCount !== undefined ? { readingCount: resolvedDetail.readingCount } : {}),
    ...(resolvedDetail.bookshelfCount !== undefined ? { bookshelfCount: resolvedDetail.bookshelfCount } : {}),
    ...(resolvedDetail.coverUrl ? { coverUrl: resolvedDetail.coverUrl } : {}),
    ...(resolvedDetail.isPurchased !== undefined ? { isPurchased: resolvedDetail.isPurchased } : {}),
    contentCard: createNovelContentCard(resolvedDetail, continueChapterId, continueChapterTitle),
    contentAccess: createNovelContentAccess(resolvedDetail),
  };
}

export function listNovels(
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    categoryKey?: string | undefined;
    status?: string | undefined;
    keyword?: string | undefined;
    sort?: string | undefined;
  },
  membershipActive: boolean,
  userState: UserState,
  requestUrl?: string,
): NovelListResponse {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const keyword = input.keyword?.trim() ?? "";
  const normalizedKeyword = keyword.toLowerCase();
  const sort = input.sort ?? "recommended";

  const allCards = NOVELS.map((detail) => toNovelCard(detail, membershipActive, userState, requestUrl));
  let cards = [...allCards];

  if (input.categoryKey && input.categoryKey !== "all") {
    cards = cards.filter((item) => item.categoryKey === input.categoryKey);
  }

  if (input.status && input.status !== "all") {
    cards = cards.filter((item) => item.status === input.status);
  }

  if (normalizedKeyword) {
    cards = cards.filter((item) =>
      [item.title, item.authorName, item.summary].some((value) => value.toLowerCase().includes(normalizedKeyword)),
    );
  }

  if (sort === "updatedAt") {
    cards.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } else if (sort === "popular") {
    cards.sort((left, right) => (right.readingCount ?? 0) - (left.readingCount ?? 0));
  } else if (sort === "wordCount") {
    cards.sort((left, right) => right.wordCount - left.wordCount);
  }

  const start = (page - 1) * pageSize;
  const items = cards.slice(start, start + pageSize);
  const hasMore = start + pageSize < cards.length;
  const hotKeywords = ["lantern", "brocade", "sword", "orchid"];
  return {
    items,
    page,
    pageSize,
    hasMore,
    searchQuery: {
      keyword,
      mode: "domain",
      domain: "novel",
      page,
      pageSize,
    },
    searchFilters: createNovelSearchFilters(allCards, input),
    searchResults: createNovelSearchResults(
      items,
      cards.length,
      hasMore,
      keyword ? `No novels matched "${keyword}".` : "No novels found yet.",
      hotKeywords,
      sort,
      keyword,
    ),
  };
}

function createBookshelfItem(
  detail: NovelDetail,
  userState: UserState,
  membershipActive: boolean,
  requestUrl?: string,
): BookshelfItem {
  const resolvedDetail = resolveNovelDetail(detail, membershipActive, userState.bookshelfNovelIds, requestUrl);
  const progress = userState.progressByNovelId[detail.id];
  const continueChapterId = progress?.chapterId ?? resolvedDetail.continueChapterId ?? resolvedDetail.firstChapterId;
  const continueChapterTitle = continueChapterId ? CHAPTER_CONTENT[continueChapterId]?.title : undefined;
  const latestChapterId = resolvedDetail.latestChapter?.id;

  return {
    novelId: resolvedDetail.id,
    title: resolvedDetail.title,
    authorName: resolvedDetail.author.name,
    ...(resolvedDetail.coverUrl ? { coverUrl: resolvedDetail.coverUrl } : {}),
    ...(resolvedDetail.latestChapter?.title ? { latestChapterTitle: resolvedDetail.latestChapter.title } : {}),
    ...(continueChapterId ? { continueChapterId } : {}),
    ...(continueChapterTitle ? { continueChapterTitle } : {}),
    ...(progress?.progressPercent !== undefined ? { progressPercent: progress.progressPercent } : {}),
    updatedAt: progress?.updatedAt ?? resolvedDetail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z",
    hasUpdate: Boolean(latestChapterId && continueChapterId && latestChapterId !== continueChapterId),
  };
}

export function createBookshelf(
  userState: UserState,
  membershipActive: boolean,
  requestUrl?: string,
): BookshelfResponse {
  return {
    items: NOVELS.filter((detail) => userState.bookshelfNovelIds.has(detail.id))
      .map((detail) => createBookshelfItem(detail, userState, membershipActive, requestUrl))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}

export function deriveReturnTarget(source?: string): "catalog" | "detail" | "reader" {
  if (source === "reader") {
    return "reader";
  }

  if (source === "detail") {
    return "detail";
  }

  return "catalog";
}
