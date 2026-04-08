import type {
  BookshelfItem,
  BookshelfResponse,
  ChapterContent,
  ChapterListResponse,
  CurrentUserResponse,
  ChapterSummary,
  FeedItem,
  FeedListResponse,
  FeedTag,
  ItemsListResponse,
  MembershipOverview,
  NovelCard,
  NovelDetail,
  NovelListResponse,
  PurchaseMembershipRequest,
  RelatedNovelSummary,
  SearchDomain,
  SearchFilterGroup,
  SearchResults,
  SearchSortOption,
  SettingsResponse,
} from "@minix/contracts";

import {
  CHAPTER_CONTENT,
  CHAPTER_LISTS,
  DEFAULT_BOOKSHELF_NOVEL_IDS,
  DEFAULT_MEMBERSHIP_OVERVIEW,
  DEFAULT_PROGRESS_BY_NOVEL_ID,
  HOST_ITEMS,
  MEMBER_RENEWAL_LABELS,
  NOVELS,
} from "./content";
import { resolveSampleMediaUrl } from "./sample-assets";
import type { SessionRecord, UserState } from "./types";

export { CHAPTER_CONTENT, CHAPTER_LISTS, DEFAULT_MEMBERSHIP_OVERVIEW, NOVELS } from "./content";

export function createDefaultUserState(): UserState {
  return {
    bookshelfNovelIds: new Set(DEFAULT_BOOKSHELF_NOVEL_IDS),
    progressByNovelId: structuredClone(DEFAULT_PROGRESS_BY_NOVEL_ID),
  };
}

export function createMembershipOverview(
  planId?: PurchaseMembershipRequest["planId"],
): MembershipOverview {
  if (!planId) {
    return DEFAULT_MEMBERSHIP_OVERVIEW;
  }

  return {
    active: true,
    tier: "member",
    entitlementScope: "membership",
    statusLabel: "Membership active with premium reading unlocked",
    renewalLabel: MEMBER_RENEWAL_LABELS[planId],
    headline: "Membership Active",
    subheadline:
      "Premium reading is now unlocked. You can return to the blocked title and keep going without losing context.",
    benefits: DEFAULT_MEMBERSHIP_OVERVIEW.benefits,
  };
}

export function createCurrentUserResponse(
  session: SessionRecord,
  userState: UserState,
  requestUrl?: string,
): CurrentUserResponse {
  const membership = createMembershipOverview(userState.membershipPlanId);
  const avatarUrl = session.profile.avatarUrl && requestUrl ? resolveSampleMediaUrl(session.profile.avatarUrl, requestUrl) : session.profile.avatarUrl;

  return {
    userProfile: {
      nickname: session.profile.nickname,
      ...(avatarUrl ? { avatarUrl } : {}),
      gender: "unknown",
      region: session.platform === "wechat" ? "Shanghai, CN" : "Web session",
      bio: "Sample user profile for shared account-domain integration.",
      tags: session.authStatus === "guest" ? ["guest", "trial"] : ["member-ready", "cross-host"],
    },
    accountSummary: {
      userId: session.userId,
      phoneBound: Boolean(session.identity.phoneBound),
      ...(session.identity.phoneBound ? { phoneNumberMasked: "138****0001" } : {}),
      wechatBound: Boolean(session.identity.wechatBound),
      realNameStatus: session.identity.realNameVerified ? "verified" : "unverified",
      assets: {
        points: session.authStatus === "guest" ? 0 : 1280,
        level: session.authStatus === "guest" ? 1 : 4,
        membership,
        entitlementLabels: membership.active ? ["premium-reading", "priority-support"] : ["basic-access"],
        balanceCents: 0,
      },
      relations: {
        followingCount: 12,
        followerCount: 28,
        friendCount: 6,
        blockedCount: 1,
        remarkName: session.authStatus === "guest" ? "Guest session" : "MiniX User",
      },
    },
    userStatus: {
      availability: session.authStatus === "guest" ? "guest" : "enabled",
      enabled: session.authStatus !== "guest",
      frozen: false,
      cancellationInProgress: false,
      blacklisted: false,
      guest: session.authStatus === "guest",
    },
  };
}

export function createSettingsResponse(session: SessionRecord, deployEnv: string | undefined): SettingsResponse {
  return {
    preferences: {
      language: "zh-CN",
      theme: session.platform === "wechat" ? "light" : "system",
      fontScale: "md",
      notificationsEnabled: true,
      device: {
        cacheLabel: "Clear local cache only",
        networkStrategy: "balanced",
        autoplay: true,
        weakNetworkMode: false,
      },
      account: {
        profileEntryLabel: "Edit profile",
        phoneEntryLabel: session.identity.phoneBound ? "Change phone" : "Bind phone",
        unbindEntryLabel: session.identity.wechatBound ? "Unbind WeChat" : "Bind WeChat",
        cancellationEntryLabel: "Cancellation entry",
      },
      content: {
        sortOrder: "recommended",
        filterMode: "all",
        readingMode: "scroll",
        historyEnabled: true,
      },
      developerOptions: {
        logsEnabled: Boolean(deployEnv !== "production"),
        experimentsEnabled: true,
      },
    },
    featureToggles: {
      pushEnabled: true,
      smsEnabled: false,
      emailEnabled: false,
      accountCenterEnabled: true,
      readingSyncEnabled: true,
      experimentsEnabled: true,
    },
    privacyOptions: {
      profileVisibilityLabel: "Private to signed-in session",
      personalizedRecommendations: true,
      searchHistoryEnabled: true,
      analyticsEnabled: true,
      screenshotFeedbackEnabled: true,
    },
  };
}

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

  return {
    ...detail,
    ...(resolvedCoverUrl ? { coverUrl: resolvedCoverUrl } : {}),
    isPurchased: isPurchasedByMembership(detail, membershipActive),
    ...(bookshelfCount !== undefined ? { bookshelfCount } : {}),
    ...(bookshelfNovelIds ? { inBookshelf: bookshelfNovelIds.has(detail.id) } : {}),
    relatedNovels: createRelatedNovelSummaries(detail, membershipActive),
  };
}

export function resolveChapterSummary(chapter: ChapterSummary, membershipActive: boolean): ChapterSummary {
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
  };
}

export function listItems(page = 1, pageSize = 2): ItemsListResponse {
  const start = (page - 1) * pageSize;
  return {
    items: HOST_ITEMS.slice(start, start + pageSize),
    page,
    pageSize,
    hasMore: start + pageSize < HOST_ITEMS.length,
  };
}

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

function createFeedItems(): FeedItem[] {
  return HOST_ITEMS.map((item, index) => {
    const tag = resolveFeedTag(item.id);
    return {
      id: item.id,
      title: item.title,
      ...(item.subtitle ? { subtitle: item.subtitle } : {}),
      ...(item.categoryLabel ? { eyebrow: item.categoryLabel } : {}),
      ...(item.recommendedReason ? { recommendedReason: item.recommendedReason } : {}),
      updatedAt: `2026-04-0${Math.min(index + 1, 8)}T08:00:00.000Z`,
      tag: tag.key,
    };
  });
}

function createSuggestionTerms(keyword: string | undefined, fallbackTerms: string[]): string[] {
  const normalized = keyword?.trim().toLowerCase();
  if (!normalized) {
    return fallbackTerms.slice(0, 3);
  }

  const matched = fallbackTerms.filter((term) => term.toLowerCase().includes(normalized));
  if (matched.length > 0) {
    return matched.slice(0, 3);
  }

  return fallbackTerms.slice(0, 3);
}

function createFeedSearchFilters(items: FeedItem[], activeTag?: string): SearchFilterGroup[] {
  const tagCounts = new Map<string, number>();
  const allTags = items.map((item) => resolveFeedTag(item.id));

  for (const tag of allTags) {
    tagCounts.set(tag.key, (tagCounts.get(tag.key) ?? 0) + 1);
  }

  return [
    {
      key: "tag",
      label: "Content type",
      selectedKeys: activeTag && activeTag !== "all" ? [activeTag] : [],
      options: [
        { key: "all", label: "All", count: items.length },
        ...Array.from(new Map(allTags.map((tag) => [tag.key, tag])).values()).map((tag) => ({
          key: tag.key,
          label: tag.label,
          count: tagCounts.get(tag.key) ?? 0,
        })),
      ],
    },
  ];
}

function createNovelSearchFilters(
  allCards: NovelCard[],
  input: {
    categoryKey?: string | undefined;
    status?: string | undefined;
  },
): SearchFilterGroup[] {
  const categoryCounts = new Map<string, { label: string; count: number }>();
  const statusCounts = new Map<string, number>();

  for (const card of allCards) {
    const existingCategory = categoryCounts.get(card.categoryKey);
    categoryCounts.set(card.categoryKey, {
      label: card.categoryLabel,
      count: (existingCategory?.count ?? 0) + 1,
    });
    statusCounts.set(card.status, (statusCounts.get(card.status) ?? 0) + 1);
  }

  return [
    {
      key: "category",
      label: "Category",
      selectedKeys: input.categoryKey && input.categoryKey !== "all" ? [input.categoryKey] : [],
      options: [
        { key: "all", label: "All", count: allCards.length },
        ...Array.from(categoryCounts.entries()).map(([key, value]) => ({
          key,
          label: value.label,
          count: value.count,
        })),
      ],
    },
    {
      key: "status",
      label: "Status",
      selectedKeys: input.status && input.status !== "all" ? [input.status] : [],
      options: [
        { key: "all", label: "Any status", count: allCards.length },
        { key: "serializing", label: "Serializing", count: statusCounts.get("serializing") ?? 0 },
        { key: "completed", label: "Completed", count: statusCounts.get("completed") ?? 0 },
        { key: "paused", label: "Paused", count: statusCounts.get("paused") ?? 0 },
      ],
    },
  ];
}

function createNovelSortOptions(): SearchSortOption[] {
  return [
    { key: "recommended", label: "Recommended" },
    { key: "updatedAt", label: "Latest" },
    { key: "popular", label: "Popular" },
    { key: "wordCount", label: "Length" },
  ];
}

function createFeedSortOptions(): SearchSortOption[] {
  return [
    { key: "recommended", label: "Recommended" },
    { key: "updatedAt", label: "Latest" },
  ];
}

function createFeedSearchResults(
  items: FeedItem[],
  total: number,
  hasMore: boolean,
  emptyText: string,
  hotKeywords: string[],
  activeSortKey: string,
  keyword: string,
): SearchResults<FeedItem> {
  const featuredReason = items[0]?.recommendedReason;

  return {
    items,
    total,
    hasMore,
    emptyText,
    ...(featuredReason ? { featuredReason } : {}),
    suggestionTerms: createSuggestionTerms(keyword, hotKeywords),
    hotKeywords,
    recentKeywords: [],
    sortOptions: createFeedSortOptions(),
    activeSortKey,
  };
}

function createNovelSearchResults(
  items: NovelCard[],
  total: number,
  hasMore: boolean,
  emptyText: string,
  hotKeywords: string[],
  activeSortKey: string,
  keyword: string,
): SearchResults<NovelCard> {
  const featuredReason = items[0]?.recommendedReason;

  return {
    items,
    total,
    hasMore,
    emptyText,
    ...(featuredReason ? { featuredReason } : {}),
    suggestionTerms: createSuggestionTerms(keyword, hotKeywords),
    hotKeywords,
    recentKeywords: [],
    sortOptions: createNovelSortOptions(),
    activeSortKey,
  };
}

function resolveSearchDomain(inputDomain: string | undefined, fallback: SearchDomain): SearchDomain {
  if (inputDomain === "all" || inputDomain === "content" || inputDomain === "user" || inputDomain === "novel" || inputDomain === "feed") {
    return inputDomain;
  }

  return fallback;
}

function createEmptyFeedResults(
  page: number,
  pageSize: number,
  keyword: string,
  mode: FeedListResponse["searchQuery"]["mode"],
  domain: SearchDomain,
): FeedListResponse {
  const hotKeywords = ["travel", "speaking", "listening", "review"];
  const tags = [{ key: "all", label: "All" }];

  return {
    items: [],
    page,
    pageSize,
    hasMore: false,
    tags,
    searchQuery: {
      keyword,
      mode,
      domain,
      page,
      pageSize,
    },
    searchFilters: [
      {
        key: "tag",
        label: "Content type",
        selectedKeys: [],
        options: tags,
      },
    ],
    searchResults: {
      items: [],
      total: 0,
      hasMore: false,
      emptyText:
        mode === "user" || domain === "user"
          ? "User search is modeled in the shared contract, but the sample API does not ship user results yet."
          : "No feed results matched this search yet.",
      suggestionTerms: createSuggestionTerms(keyword, hotKeywords),
      hotKeywords,
      recentKeywords: [],
      sortOptions: createFeedSortOptions(),
      activeSortKey: "recommended",
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
}): FeedListResponse {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const keyword = input.keyword?.trim() ?? "";
  const normalizedKeyword = keyword.toLowerCase();
  const mode = input.mode === "content" || input.mode === "user" || input.mode === "domain" ? input.mode : "global";
  const domain = resolveSearchDomain(input.domain, "feed");

  if (mode === "user" || domain === "user") {
    return createEmptyFeedResults(page, pageSize, keyword, mode, domain);
  }

  const hotKeywords = ["travel", "speaking", "listening", "review"];
  const allItems = createFeedItems();
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

  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);
  const hasMore = start + pageSize < filteredItems.length;

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
    },
    searchFilters: createFeedSearchFilters(allItems, input.tag),
    searchResults: createFeedSearchResults(
      items,
      filteredItems.length,
      hasMore,
      keyword ? `No feed results matched "${keyword}".` : "No feed items are available yet.",
      hotKeywords,
      "recommended",
      keyword,
    ),
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
