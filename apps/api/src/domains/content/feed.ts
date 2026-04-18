import type {
  FeedItem,
  FeedListResponse,
  FeedTag,
  SearchDomain,
} from "@minix/contracts";

import { HOST_ITEMS, NOVELS } from "../../content";
import type { UserState } from "../../types";
import {
  createManagedContentAccess,
  createManagedContentCard,
} from "./managed-content";
import {
  createNovelContentAccess,
  createNovelContentCard,
} from "./novels";
import {
  createCorrectionKeyword,
  createFeedSearchFilters,
  createFeedSearchResults,
  createRecoverySuggestions,
  createSearchDomainTabs,
  createSearchGroupingSummary,
  createSearchRankingSummary,
  createSearchResultGroups,
  createSearchZeroResultGuidance,
  createSuggestionTerms,
  createUserSearchItems,
  decorateSearchItems,
  filterSearchItems,
  interleaveSearchGroups,
  isPersonalizedRecommendationsEnabled,
  resolveFeedSortKey,
  sortFeedItems,
} from "./search";

function resolveFeedTag(itemId: string): FeedTag {
  if (itemId === "lesson_1") {
    return { key: "warmup", label: "Warm-up" };
  }

  if (itemId === "lesson_2") {
    return { key: "input", label: "Input" };
  }

  if (itemId === "lesson_3") {
    return { key: "practice", label: "Practice" };
  }

  if (itemId === "lesson_4") {
    return { key: "speaking", label: "Speaking" };
  }

  return { key: "review", label: "Review" };
}

function createFeedItems(userState?: UserState): FeedItem[] {
  const personalizedRecommendations = isPersonalizedRecommendationsEnabled(userState);
  return HOST_ITEMS.map((item, index) => {
    const tag = resolveFeedTag(item.id);
    const managedContent = createManagedContentCard(item.id, userState);
    const managedAccess = createManagedContentAccess(item.id, userState);
    return {
      id: item.id,
      title: item.title,
      ...(item.subtitle ? { subtitle: item.subtitle } : {}),
      ...(item.categoryLabel ? { eyebrow: item.categoryLabel } : {}),
      ...(item.recommendedReason
        ? { recommendedReason: personalizedRecommendations ? item.recommendedReason : "Recommended for all signed-in readers." }
        : {}),
      updatedAt: `2026-04-0${Math.min(index + 1, 8)}T08:00:00.000Z`,
      tag: tag.key,
      ...(managedContent ? { contentCard: managedContent } : {}),
      ...(managedAccess ? { contentAccess: managedAccess } : {}),
    };
  });
}

function createNovelFeedItems(userState?: UserState): FeedItem[] {
  return NOVELS.slice(0, 4).map((detail) => ({
    id: detail.id,
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    eyebrow: "Novel",
    recommendedReason: detail.relatedLaneLabel ?? detail.summary,
    ...(detail.latestChapter?.updatedAt ? { updatedAt: detail.latestChapter.updatedAt } : {}),
    tag: "novel",
    contentCard: createNovelContentCard(detail, detail.continueChapterId, detail.latestChapter?.title),
    contentAccess: createNovelContentAccess(detail),
  }));
}

function createContentSearchItems(userState?: UserState): FeedItem[] {
  return HOST_ITEMS.map((item, index) => {
    const contentCard = createManagedContentCard(item.id, userState);
    const contentAccess = createManagedContentAccess(item.id, userState);
    return {
      id: item.id,
      title: item.title,
      ...(item.subtitle ? { subtitle: item.subtitle } : {}),
      eyebrow: "Content",
      ...(contentCard?.lifecycle.reviewMessage ?? item.recommendedReason
        ? { recommendedReason: contentCard?.lifecycle.reviewMessage ?? item.recommendedReason }
        : {}),
      updatedAt: `2026-04-1${Math.min(index, 8)}T08:00:00.000Z`,
      tag: "content",
      ...(contentCard ? { contentCard } : {}),
      ...(contentAccess ? { contentAccess } : {}),
    };
  });
}

function resolveSearchDomain(inputDomain: string | undefined, fallback: SearchDomain): SearchDomain {
  if (inputDomain === "all" || inputDomain === "content" || inputDomain === "user" || inputDomain === "novel" || inputDomain === "feed") {
    return inputDomain;
  }

  return fallback;
}

function createDiscoverDomainFilter(input: {
  activeDomain: SearchDomain;
  feedCount: number;
  contentCount: number;
  novelCount: number;
  userCount: number;
}): FeedListResponse["searchFilters"][number] {
  const total = input.feedCount + input.contentCount + input.novelCount + input.userCount;
  return {
    key: "domain",
    label: "Search domain",
    selectedKeys: input.activeDomain === "all" || input.activeDomain === "feed" ? [] : [input.activeDomain],
    persistenceScope: "route",
    reloadBehavior: "restore",
    options: [
      { key: "all", label: "All", count: total },
      { key: "feed", label: "Feed", count: input.feedCount },
      { key: "content", label: "Content", count: input.contentCount },
      { key: "novel", label: "Novel", count: input.novelCount },
      { key: "user", label: "User", count: input.userCount },
    ],
  };
}

function createUnifiedFeedResults(
  input: {
    keyword: string;
    page: number;
    pageSize: number;
    mode: FeedListResponse["searchQuery"]["mode"];
    domain: SearchDomain;
    sort?: string | undefined;
    tag?: string | undefined;
  },
  userState?: UserState,
): FeedListResponse {
  const hotKeywords = ["travel", "speaking", "listening", "review", "user", "novel"];
  const activeSortKey = resolveFeedSortKey(input.sort);
  const feedItems = decorateSearchItems(sortFeedItems(filterSearchItems(createFeedItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.eyebrow,
    item.recommendedReason,
  ]), activeSortKey, input.keyword), activeSortKey, input.keyword);
  const contentItems = decorateSearchItems(sortFeedItems(filterSearchItems(createContentSearchItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.eyebrow,
    item.recommendedReason,
    item.contentCard?.lifecycle.state,
  ]), activeSortKey, input.keyword), activeSortKey, input.keyword);
  const novelItems = decorateSearchItems(sortFeedItems(filterSearchItems(createNovelFeedItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.recommendedReason,
  ]), activeSortKey, input.keyword), activeSortKey, input.keyword);
  const userItems = decorateSearchItems(sortFeedItems(filterSearchItems(createUserSearchItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.recommendedReason,
  ]), activeSortKey, input.keyword), activeSortKey, input.keyword);

  const searchMode = input.mode;
  const requestedDomain = input.domain;
  const scopedGroups =
    searchMode === "user" || requestedDomain === "user"
      ? [{ domain: "user" as const, label: "Users", items: userItems }]
      : searchMode === "content"
        ? [
            { domain: "content" as const, label: "Content", items: contentItems },
            { domain: "novel" as const, label: "Novels", items: novelItems },
          ]
        : requestedDomain === "all"
          ? [
              { domain: "feed" as const, label: "Feed", items: feedItems },
              { domain: "content" as const, label: "Content", items: contentItems },
              { domain: "novel" as const, label: "Novels", items: novelItems },
              { domain: "user" as const, label: "Users", items: userItems },
            ]
          : requestedDomain === "content"
            ? [{ domain: "content" as const, label: "Content", items: contentItems }]
            : requestedDomain === "novel"
              ? [{ domain: "novel" as const, label: "Novels", items: novelItems }]
              : [{ domain: "feed" as const, label: "Feed", items: feedItems }];

  const flattened = requestedDomain === "all" ? interleaveSearchGroups(scopedGroups) : scopedGroups.flatMap((group) => group.items);
  const start = (input.page - 1) * input.pageSize;
  const pagedItems = flattened.slice(start, start + input.pageSize);
  const hasMore = start + input.pageSize < flattened.length;
  const activeDomain =
    requestedDomain === "all"
      ? searchMode === "user"
        ? "user"
        : searchMode === "content"
          ? "content"
          : "all"
      : requestedDomain;

  const tags = [
    { key: "all", label: "All" },
    { key: "feed", label: "Feed" },
    { key: "content", label: "Content" },
    { key: "novel", label: "Novel" },
    { key: "user", label: "User" },
  ];

  const resultGroups = createSearchResultGroups(scopedGroups);
  const correctionKeyword = flattened.length === 0 ? createCorrectionKeyword(input.keyword, hotKeywords) : undefined;
  const grouping = createSearchGroupingSummary(scopedGroups, requestedDomain);
  const zeroResultGuidance = createSearchZeroResultGuidance(input.keyword, flattened.length, correctionKeyword, hotKeywords);
  return {
    items: pagedItems,
    page: input.page,
    pageSize: input.pageSize,
    hasMore,
    tags,
    ...(pagedItems[0]?.recommendedReason ? { featuredReason: pagedItems[0].recommendedReason } : {}),
    searchQuery: {
      keyword: input.keyword,
      mode: searchMode,
      domain: requestedDomain,
      page: input.page,
      pageSize: input.pageSize,
      ...(activeSortKey !== "recommended" ? { sortKey: activeSortKey } : {}),
    },
    searchFilters: [
      createDiscoverDomainFilter({
        activeDomain,
        feedCount: feedItems.length,
        contentCount: contentItems.length,
        novelCount: novelItems.length,
        userCount: userItems.length,
      }),
    ],
    searchResults: {
      items: pagedItems,
      total: flattened.length,
      hasMore,
      emptyText:
        searchMode === "user" || requestedDomain === "user"
          ? "No user results matched this search."
          : searchMode === "content" || requestedDomain === "content"
            ? "No content results matched this search."
            : "No cross-domain results matched this search.",
      ...(pagedItems[0]?.recommendedReason ? { featuredReason: pagedItems[0].recommendedReason } : {}),
      suggestionTerms: createSuggestionTerms(input.keyword, hotKeywords),
      hotKeywords,
      recentKeywords: [],
      sortOptions: [
        { key: "recommended", label: "Recommended" },
        { key: "updatedAt", label: "Latest" },
        { key: "popular", label: "Popular" },
      ],
      activeSortKey,
      ...(correctionKeyword ? { correctionKeyword } : {}),
      ...(correctionKeyword ? { correctionReason: `No exact matches for "${input.keyword}".` } : {}),
      recoverySuggestions: createRecoverySuggestions(input.keyword, hotKeywords, correctionKeyword),
      ranking: createSearchRankingSummary(activeSortKey),
      domainTabs: createSearchDomainTabs(
        [
          { domain: "all", label: "All", total: feedItems.length + contentItems.length + novelItems.length + userItems.length },
          { domain: "feed", label: "Feed", total: feedItems.length },
          { domain: "content", label: "Content", total: contentItems.length },
          { domain: "novel", label: "Novel", total: novelItems.length },
          { domain: "user", label: "User", total: userItems.length },
        ],
        activeDomain,
      ),
      activeDomain,
      resultGroups,
      grouping,
      zeroResultGuidance,
    },
  };
}

export function listFeed(input: {
  page?: number | undefined;
  pageSize?: number | undefined;
  keyword?: string | undefined;
  tag?: string | undefined;
  mode?: string | undefined;
  domain?: string | undefined;
  sort?: string | undefined;
}, userState?: UserState): FeedListResponse {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const keyword = input.keyword?.trim() ?? "";
  const normalizedKeyword = keyword.toLowerCase();
  const mode = input.mode === "content" || input.mode === "user" || input.mode === "domain" ? input.mode : "global";
  const domain = resolveSearchDomain(input.domain, "feed");
  const activeSortKey = resolveFeedSortKey(input.sort);

  if (mode !== "global" || domain !== "feed") {
    return createUnifiedFeedResults(
      {
        page,
        pageSize,
        keyword,
        mode,
        domain,
        ...(input.sort ? { sort: input.sort } : {}),
        ...(input.tag ? { tag: input.tag } : {}),
      },
      userState,
    );
  }

  const hotKeywords = ["travel", "speaking", "listening", "review"];
  const allItems = createFeedItems(userState);
  const contentItems = createContentSearchItems(userState);
  const novelItems = createNovelFeedItems(userState);
  const userItems = createUserSearchItems(userState);
  const allTags = [{ key: "all", label: "All" }, ...Array.from(new Map(allItems.map((item) => {
    const tag = resolveFeedTag(item.id);
    return [tag.key, tag];
  })).values())];

  let filteredItems = allItems;
  if (input.tag && input.tag !== "all") {
    filteredItems = filteredItems.filter((item) => item.tag === input.tag);
  }

  if (normalizedKeyword) {
    filteredItems = filteredItems.filter((item) =>
      [item.title, item.subtitle, item.eyebrow, item.recommendedReason].some((value) =>
        value?.toLowerCase().includes(normalizedKeyword),
      ),
    );
  }

  filteredItems = decorateSearchItems(sortFeedItems(filteredItems, activeSortKey, keyword), activeSortKey, keyword);

  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);
  const hasMore = start + pageSize < filteredItems.length;
  const correctionKeyword = filteredItems.length === 0 ? createCorrectionKeyword(keyword, hotKeywords) : undefined;

  return {
    items,
    page,
    pageSize,
    hasMore,
    tags: allTags,
    ...(items[0]?.recommendedReason ? { featuredReason: items[0].recommendedReason } : {}),
    searchQuery: {
      keyword,
      mode,
      domain,
      page,
      pageSize,
      ...(activeSortKey !== "recommended" ? { sortKey: activeSortKey } : {}),
    },
    searchFilters: [
      createDiscoverDomainFilter({
        activeDomain: "feed",
        feedCount: allItems.length,
        contentCount: contentItems.length,
        novelCount: novelItems.length,
        userCount: userItems.length,
      }),
      ...createFeedSearchFilters(allItems, input.tag),
    ],
    searchResults: createFeedSearchResults(
      items,
      filteredItems.length,
      hasMore,
      keyword ? `No feed results matched "${keyword}".` : "No feed items are available yet.",
      hotKeywords,
      activeSortKey,
      keyword,
      {
        ...(correctionKeyword ? { correctionKeyword } : {}),
        ...(correctionKeyword ? { correctionReason: `No exact feed matches for "${keyword}".` } : {}),
        activeDomain: "feed",
        domainTabs: createSearchDomainTabs(
          [
            { domain: "all", label: "All", total: allItems.length + contentItems.length + novelItems.length + userItems.length },
            { domain: "feed", label: "Feed", total: allItems.length },
            { domain: "content", label: "Content", total: contentItems.length },
            { domain: "novel", label: "Novel", total: novelItems.length },
            { domain: "user", label: "User", total: userItems.length },
          ],
          "feed",
        ),
        resultGroups: createSearchResultGroups([{ domain: "feed", label: "Feed", items: filteredItems }]),
        grouping: createSearchGroupingSummary([{ domain: "feed", items: filteredItems }], "feed"),
        zeroResultGuidance: createSearchZeroResultGuidance(keyword, filteredItems.length, correctionKeyword, hotKeywords),
      },
    ),
  };
}
