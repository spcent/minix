import { NOTIFICATION_TYPES } from "@minix/contracts";
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
  MarkNotificationsReadResponse,
  MessageThread,
  MessageThreadResponse,
  MessageTouchpoint,
  MembershipOverview,
  MembershipEntitlement,
  NovelCard,
  NovelDetail,
  NovelListResponse,
  NotificationFilterGroup,
  NotificationGroupSummary,
  NotificationItem,
  NotificationList,
  NotificationListResponse,
  NotificationType,
  Order,
  OrderDetailResponse,
  PaymentChannel,
  PaymentIntent,
  PaymentResult,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  RelatedNovelSummary,
  SearchDomain,
  SearchFilterGroup,
  SearchResults,
  SearchSortOption,
  SettingsResponse,
  UnreadBadge,
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
    notificationReadAtById: {},
    ordersById: {},
    orderIdByIdempotencyKey: {},
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

function createMembershipAmountCents(planId: PurchaseMembershipRequest["planId"]): number {
  if (planId === "monthly") {
    return 1900;
  }

  if (planId === "annual") {
    return 15900;
  }

  return 4900;
}

function createMembershipProductLabel(planId: PurchaseMembershipRequest["planId"]): string {
  if (planId === "monthly") {
    return "Monthly Membership";
  }

  if (planId === "annual") {
    return "Annual Membership";
  }

  return "Quarterly Membership";
}

function createPaymentChannel(channel: PaymentChannel | undefined, platform: SessionRecord["platform"]): PaymentChannel {
  if (channel) {
    return channel;
  }

  return platform === "wechat" ? "wechat_pay" : "h5_pay";
}

function createMembershipEntitlement(
  planId: PurchaseMembershipRequest["planId"],
  orderId: string,
): MembershipEntitlement {
  const overview = createMembershipOverview(planId);
  return {
    entitlementId: `ent_membership_${orderId}`,
    productType: "membership",
    active: true,
    statusLabel: overview.statusLabel,
    sourceOrderId: orderId,
    overview,
  };
}

export function createMembershipOrderDetail(
  session: SessionRecord,
  payload: PurchaseMembershipRequest,
  duplicateProtected = false,
  now = new Date().toISOString(),
): OrderDetailResponse & { entitlement: MembershipEntitlement } {
  const orderId = `ord_${crypto.randomUUID()}`;
  const amountCents = createMembershipAmountCents(payload.planId);
  const title = createMembershipProductLabel(payload.planId);
  const channel = createPaymentChannel(payload.channel, session.platform);
  const order: Order = {
    orderId,
    title,
    status: "paid",
    productType: "membership",
    channel,
    currency: "CNY",
    totalAmountCents: amountCents,
    ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    duplicateProtected,
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    createdAt: now,
    updatedAt: now,
    lineItems: [
      {
        productId: `membership_${payload.planId}`,
        productType: "membership",
        title,
        quantity: 1,
        unitAmountCents: amountCents,
        totalAmountCents: amountCents,
      },
    ],
  };
  const paymentIntent: PaymentIntent = {
    intentId: `pi_${orderId}`,
    orderId,
    channel,
    status: "succeeded",
    clientAction: session.platform === "wechat" ? "wechat_sdk" : "h5_redirect",
    clientPayload: {
      orderId,
      channel,
      mode: "sample",
    },
    expiresAt: now,
  };
  const paymentResult: PaymentResult = {
    orderId,
    status: "success",
    paid: true,
    duplicateProtected,
    callbackVerified: false,
    message: duplicateProtected
      ? "Duplicate payment protection kept the active entitlement and returned the existing paid outcome."
      : "Payment completed in the sample payment domain.",
    polledAt: now,
  };
  const entitlement = createMembershipEntitlement(payload.planId, orderId);

  return {
    order,
    paymentIntent,
    paymentResult,
    entitlement,
  };
}

export function createMembershipPurchaseResponse(
  detail: OrderDetailResponse & { entitlement: MembershipEntitlement },
  payload: PurchaseMembershipRequest,
): PurchaseMembershipResponse {
  return {
    purchased: true,
    overview: detail.entitlement.overview,
    order: detail.order,
    paymentIntent: detail.paymentIntent,
    paymentResult: detail.paymentResult,
    entitlement: detail.entitlement,
    returnTarget: deriveReturnTarget(payload.source),
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
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

interface NotificationSeed {
  id: string;
  type: NotificationType;
  groupKey: string;
  groupLabel: string;
  title: string;
  summary: string;
  bodyPreview?: string;
  createdAt: string;
  updatedAt?: string;
  pinned: boolean;
  doNotDisturb: boolean;
  tagLabels: string[];
  threadId?: string;
}

const DEFAULT_MESSAGE_TOUCHPOINTS: MessageTouchpoint[] = [
  {
    channel: "in_app",
    executable: true,
    enabled: true,
    delivered: true,
    statusLabel: "Visible in the in-app inbox",
  },
  {
    channel: "subscription_message",
    executable: false,
    enabled: true,
    statusLabel: "Reserved subscription-message abstraction",
  },
  {
    channel: "sms",
    executable: false,
    enabled: false,
    statusLabel: "Contract-only SMS fallback",
  },
  {
    channel: "email",
    executable: false,
    enabled: true,
    statusLabel: "Email touchpoint reserved for future delivery",
  },
  {
    channel: "push",
    executable: false,
    enabled: false,
    statusLabel: "Push abstraction reserved for vendor integration",
  },
];

const RESERVED_THREADS: MessageThread[] = [
  {
    threadId: "thread_private_tutor",
    type: "private",
    title: "Tutor Mila",
    subtitle: "Private coaching thread",
    participantLabels: ["Tutor Mila", "You"],
    pinned: true,
    doNotDisturb: false,
    unreadCount: 2,
    lastMessagePreview: "I left pronunciation notes on your latest speaking task.",
    lastMessageAt: "2026-04-08T09:10:00.000Z",
    lastReadAt: "2026-04-08T08:40:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
  },
  {
    threadId: "thread_consultation_case",
    type: "consultation",
    title: "Consultation Desk",
    subtitle: "Reserved consultation workflow thread",
    participantLabels: ["Consultation Desk", "You"],
    pinned: false,
    doNotDisturb: false,
    unreadCount: 1,
    lastMessagePreview: "Your consultation request is queued for an advisor reply.",
    lastMessageAt: "2026-04-08T07:55:00.000Z",
    lastReadAt: "2026-04-08T06:30:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
  },
  {
    threadId: "thread_customer_service",
    type: "customer_service",
    title: "Customer Support",
    subtitle: "Reserved customer-service thread",
    participantLabels: ["Support Bot", "You"],
    pinned: false,
    doNotDisturb: true,
    unreadCount: 0,
    lastMessagePreview: "Your billing question was marked resolved.",
    lastMessageAt: "2026-04-07T18:20:00.000Z",
    lastReadAt: "2026-04-07T18:25:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
  },
  {
    threadId: "thread_group_members",
    type: "group",
    title: "Member Circle (Reserved)",
    subtitle: "Reserved group-chat contract surface",
    participantLabels: ["Community Host", "You", "12 members"],
    pinned: false,
    doNotDisturb: true,
    unreadCount: 3,
    lastMessagePreview: "Weekly challenge picks are ready to review.",
    lastMessageAt: "2026-04-08T08:05:00.000Z",
    lastReadAt: "2026-04-07T21:20:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
  },
];

const NOTIFICATION_SEEDS: NotificationSeed[] = [
  {
    id: "notice_system_security",
    type: "system",
    groupKey: "security",
    groupLabel: "Security",
    title: "New device sign-in detected",
    summary: "A new H5 session was created for your account. Review the session if this was not you.",
    bodyPreview: "Security events surface here before vendor-backed push or SMS delivery is added.",
    createdAt: "2026-04-08T09:25:00.000Z",
    updatedAt: "2026-04-08T09:25:00.000Z",
    pinned: true,
    doNotDisturb: false,
    tagLabels: ["security", "session"],
    threadId: "thread_customer_service",
  },
  {
    id: "notice_business_payment",
    type: "business",
    groupKey: "orders",
    groupLabel: "Orders",
    title: "Membership payment confirmed",
    summary: "Your membership entitlement is active and premium reading has been unlocked.",
    bodyPreview: "This item links the order/payment foundation into the shared inbox model.",
    createdAt: "2026-04-08T08:50:00.000Z",
    updatedAt: "2026-04-08T08:52:00.000Z",
    pinned: true,
    doNotDisturb: false,
    tagLabels: ["payment", "entitlement"],
  },
  {
    id: "notice_campaign_challenge",
    type: "campaign",
    groupKey: "growth",
    groupLabel: "Growth",
    title: "Seven-day speaking challenge is live",
    summary: "Invite a friend or join the reserved member group to start the next challenge.",
    bodyPreview: "Campaign notices keep attribution-friendly metadata in a shared structure.",
    createdAt: "2026-04-08T07:40:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["campaign", "invite"],
    threadId: "thread_group_members",
  },
  {
    id: "notice_review_article",
    type: "review",
    groupKey: "moderation",
    groupLabel: "Moderation",
    title: "Your draft feedback was approved",
    summary: "The editorial review step is complete and the content is now visible.",
    bodyPreview: "Review notices reserve the moderation lane before the general content workflow lands.",
    createdAt: "2026-04-08T07:05:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["review", "content"],
  },
  {
    id: "notice_business_consultation",
    type: "business",
    groupKey: "consultation",
    groupLabel: "Consultation",
    title: "Consultation reply received",
    summary: "An advisor replied to your latest consultation request.",
    bodyPreview: "Conversation threads stay separate from notifications, but this notice can reference one.",
    createdAt: "2026-04-07T21:15:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["consultation", "advisor"],
    threadId: "thread_consultation_case",
  },
  {
    id: "notice_system_learning",
    type: "system",
    groupKey: "learning",
    groupLabel: "Learning",
    title: "Daily plan is ready",
    summary: "Overview and today's plan have been refreshed with a new practice queue.",
    createdAt: "2026-04-07T20:45:00.000Z",
    pinned: false,
    doNotDisturb: true,
    tagLabels: ["plan", "overview"],
  },
  {
    id: "notice_review_profile",
    type: "review",
    groupKey: "account",
    groupLabel: "Account",
    title: "Profile update under review",
    summary: "Your new profile description is being reviewed before it appears publicly.",
    createdAt: "2026-04-07T18:10:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["profile", "review"],
  },
];

function cloneTouchpoints(touchpoints: MessageTouchpoint[]): MessageTouchpoint[] {
  return touchpoints.map((touchpoint) => ({ ...touchpoint }));
}

function cloneReservedThreads(): MessageThread[] {
  return RESERVED_THREADS.map((thread) => ({
    ...thread,
    participantLabels: [...thread.participantLabels],
    touchpoints: cloneTouchpoints(thread.touchpoints),
  }));
}

function createNotificationItem(seed: NotificationSeed, userState: UserState): NotificationItem {
  const readAt = userState.notificationReadAtById[seed.id];
  const thread = seed.threadId ? RESERVED_THREADS.find((item) => item.threadId === seed.threadId) : undefined;

  return {
    id: seed.id,
    type: seed.type,
    groupKey: seed.groupKey,
    groupLabel: seed.groupLabel,
    title: seed.title,
    summary: seed.summary,
    ...(seed.bodyPreview ? { bodyPreview: seed.bodyPreview } : {}),
    createdAt: seed.createdAt,
    ...(seed.updatedAt ? { updatedAt: seed.updatedAt } : {}),
    pinned: seed.pinned,
    doNotDisturb: seed.doNotDisturb,
    receipt: {
      read: Boolean(readAt),
      ...(readAt ? { readAt } : {}),
      readReceiptRequired: true,
    },
    touchpoints: cloneTouchpoints(DEFAULT_MESSAGE_TOUCHPOINTS),
    tagLabels: [...seed.tagLabels],
    ...(thread
      ? {
          thread: {
            threadId: thread.threadId,
            type: thread.type,
            title: thread.title,
            ...(thread.lastMessagePreview ? { lastMessagePreview: thread.lastMessagePreview } : {}),
            reserved: thread.reserved,
          },
        }
      : {}),
  };
}

function sortNotifications(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function createNotificationGroups(items: NotificationItem[]): NotificationGroupSummary[] {
  return Array.from(
    items.reduce((map, item) => {
      const existing = map.get(item.groupKey);
      map.set(item.groupKey, {
        key: item.groupKey,
        label: item.groupLabel,
        count: (existing?.count ?? 0) + 1,
      });
      return map;
    }, new Map<string, NotificationGroupSummary>()),
  )
    .map(([, value]) => value)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function createNotificationFilters(
  allItems: NotificationItem[],
  activeType: string | undefined,
  activeGroupKey: string | undefined,
  onlyUnread: boolean,
): NotificationFilterGroup[] {
  const typeCounts = NOTIFICATION_SEEDS.reduce<Record<string, number>>((counts, seed) => {
    counts[seed.type] = (counts[seed.type] ?? 0) + 1;
    return counts;
  }, {});
  const groupCounts = NOTIFICATION_SEEDS.reduce<Record<string, number>>((counts, seed) => {
    counts[seed.groupKey] = (counts[seed.groupKey] ?? 0) + 1;
    return counts;
  }, {});
  const groupLabels = new Map(NOTIFICATION_SEEDS.map((seed) => [seed.groupKey, seed.groupLabel]));

  return [
    {
      key: "type",
      label: "Type",
      selectedKeys: activeType && activeType !== "all" ? [activeType] : [],
      options: [
        { key: "all", label: "All", count: allItems.length },
        { key: "system", label: "System", count: typeCounts.system ?? 0 },
        { key: "business", label: "Business", count: typeCounts.business ?? 0 },
        { key: "campaign", label: "Campaign", count: typeCounts.campaign ?? 0 },
        { key: "review", label: "Review", count: typeCounts.review ?? 0 },
      ],
    },
    {
      key: "group",
      label: "Group",
      selectedKeys: activeGroupKey && activeGroupKey !== "all" ? [activeGroupKey] : [],
      options: [
        { key: "all", label: "All groups", count: allItems.length },
        ...Object.entries(groupCounts)
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .map(([key, count]) => ({
            key,
            label: groupLabels.get(key) ?? key,
            count,
          })),
      ],
    },
    {
      key: "state",
      label: "State",
      selectedKeys: onlyUnread ? ["unread"] : [],
      options: [
        { key: "all", label: "All", count: allItems.length },
        { key: "unread", label: "Unread", count: allItems.filter((item) => !item.receipt.read).length },
      ],
    },
  ];
}

function createUnreadBadge(userState: UserState): UnreadBadge {
  const notifications = sortNotifications(NOTIFICATION_SEEDS.map((seed) => createNotificationItem(seed, userState)));
  const notificationUnread = notifications.filter((item) => !item.receipt.read).length;
  const threadUnread = RESERVED_THREADS.reduce((total, thread) => total + thread.unreadCount, 0);
  const breakdown: Array<{ key: string; label: string; count: number }> = NOTIFICATION_TYPES
    .map((type) => ({
      key: type,
      label: `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`,
      count: notifications.filter((item) => item.type === type && !item.receipt.read).length,
    }))
    .filter((entry) => entry.count > 0);

  if (threadUnread > 0) {
    breakdown.push({
      key: "threads",
      label: "Threads",
      count: threadUnread,
    });
  }

  return {
    totalUnread: notificationUnread + threadUnread,
    notificationUnread,
    threadUnread,
    breakdown,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function createNotificationList(
  userState: UserState,
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
  },
): NotificationList {
  const allItems = sortNotifications(NOTIFICATION_SEEDS.map((seed) => createNotificationItem(seed, userState)));
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const activeType = input.type && input.type !== "all" ? input.type : undefined;
  const activeGroupKey = input.groupKey && input.groupKey !== "all" ? input.groupKey : undefined;
  const onlyUnread = Boolean(input.onlyUnread);

  let filteredItems = allItems;
  if (activeType) {
    filteredItems = filteredItems.filter((item) => item.type === activeType);
  }
  if (activeGroupKey) {
    filteredItems = filteredItems.filter((item) => item.groupKey === activeGroupKey);
  }
  if (onlyUnread) {
    filteredItems = filteredItems.filter((item) => !item.receipt.read);
  }

  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);

  return {
    items,
    page,
    pageSize,
    total: filteredItems.length,
    hasMore: start + pageSize < filteredItems.length,
    grouping: "type",
    groups: createNotificationGroups(filteredItems),
    filters: createNotificationFilters(allItems, activeType, activeGroupKey, onlyUnread),
    onlyUnread,
    ...(items[0] ? { selectedNotificationId: items[0].id } : {}),
  };
}

export function listNotifications(
  userState: UserState,
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
    threadId?: string | undefined;
  },
): NotificationListResponse {
  const notificationList = createNotificationList(userState, input);
  const reservedThreads = cloneReservedThreads();
  const selectedThread =
    (input.threadId ? reservedThreads.find((thread) => thread.threadId === input.threadId) : undefined) ??
    reservedThreads.find((thread) => thread.unreadCount > 0) ??
    reservedThreads[0];

  return {
    notificationList,
    messageThread: selectedThread ? { ...selectedThread, participantLabels: [...selectedThread.participantLabels], touchpoints: cloneTouchpoints(selectedThread.touchpoints) } : undefined,
    unreadBadge: createUnreadBadge(userState),
    reservedThreads,
  };
}

export function markNotificationsRead(
  userState: UserState,
  input: {
    notificationIds: string[];
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
  },
): MarkNotificationsReadResponse {
  const updatedIds = input.notificationIds.filter((notificationId) =>
    NOTIFICATION_SEEDS.some((seed) => seed.id === notificationId),
  );
  const timestamp = new Date().toISOString();

  for (const notificationId of updatedIds) {
    userState.notificationReadAtById[notificationId] = timestamp;
  }

  return {
    updatedIds,
    notificationList: createNotificationList(userState, input),
    unreadBadge: createUnreadBadge(userState),
  };
}

export function getUnreadBadge(userState: UserState): UnreadBadge {
  return createUnreadBadge(userState);
}

export function getMessageThread(userState: UserState, threadId: string): MessageThreadResponse | null {
  const messageThread = cloneReservedThreads().find((thread) => thread.threadId === threadId);
  if (!messageThread) {
    return null;
  }

  return {
    messageThread,
    unreadBadge: createUnreadBadge(userState),
  };
}
