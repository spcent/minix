import { APP_ROUTE_IDS } from "@minix/contracts";
import type {
  FeedItem,
  NovelCard,
  SearchDomain,
  SearchFilterGroup,
  SearchResults,
  SearchSortOption,
  SettingsProfileVisibility,
} from "@minix/contracts";

import type { UserState } from "../../types";

export function resolveProfileVisibility(userState?: UserState): SettingsProfileVisibility {
  return userState?.settingsState?.privacyOptions?.profileVisibility ?? "signed_in_only";
}

function canExposeRelationSearch(userState: UserState | undefined, relation: UserState["relationTarget"] | undefined): boolean {
  const visibility = resolveProfileVisibility(userState);
  if (!relation) {
    return false;
  }
  if (visibility === "public" || visibility === "signed_in_only") {
    return true;
  }
  return Boolean(relation.followedBy || relation.friend || relation.friendState === "mutual");
}

export function canExposeRemarkName(userState: UserState | undefined, relation: UserState["relationTarget"] | undefined): boolean {
  const visibility = resolveProfileVisibility(userState);
  if (!relation?.remarkName) {
    return false;
  }
  if (visibility === "public") {
    return true;
  }
  if (visibility === "followers_only") {
    return Boolean(relation.followedBy || relation.friend || relation.friendState === "mutual");
  }
  return false;
}

export function isPersonalizedRecommendationsEnabled(userState?: UserState): boolean {
  return userState?.settingsState?.privacyOptions?.personalizedRecommendations ?? true;
}

export function createSuggestionTerms(keyword: string | undefined, fallbackTerms: string[]): string[] {
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

const TYPO_CORRECTIONS: Record<string, string> = {
  travle: "travel",
  travl: "travel",
  speeking: "speaking",
  litening: "listening",
  listenning: "listening",
  usre: "user",
  noval: "novel",
};

export function createCorrectionKeyword(keyword: string | undefined, fallbackTerms: string[]): string | undefined {
  const normalized = keyword?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (TYPO_CORRECTIONS[normalized]) {
    return TYPO_CORRECTIONS[normalized];
  }

  return fallbackTerms.find((term) => term.toLowerCase().startsWith(normalized.slice(0, 3)));
}

export function createRecoverySuggestions(keyword: string | undefined, hotKeywords: string[], correctionKeyword?: string) {
  const normalized = keyword?.trim().toLowerCase();
  const candidates = correctionKeyword
    ? [correctionKeyword, ...hotKeywords.filter((term) => term.toLowerCase() !== correctionKeyword.toLowerCase())]
    : hotKeywords;

  return candidates
    .filter((term) => term.toLowerCase() !== normalized)
    .slice(0, 3)
    .map((term, index) => ({
      keyword: term,
      label: index === 0 && correctionKeyword ? `Try ${term}` : `Search ${term}`,
      reason:
        index === 0 && correctionKeyword
          ? "Correction term derived from the current search keyword."
          : "Hot or reusable query from the shared search center.",
    }));
}

export function createSearchRankingSummary(activeSortKey: string) {
  return {
    strategy: activeSortKey,
    appliedSortKey: activeSortKey,
    label:
      activeSortKey === "updatedAt"
        ? "Results ranked by freshness."
        : activeSortKey === "popular"
          ? "Results ranked by popularity."
          : "Results ranked by recommendation relevance.",
  };
}

function createFreshnessScore(updatedAt: string | undefined): number {
  if (!updatedAt) {
    return 0;
  }

  const timestamp = Date.parse(updatedAt);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 10_000_000_000) : 0;
}

function createFeedItemSearchScore(item: FeedItem, activeSortKey: string, keyword: string | undefined): number {
  const normalizedKeyword = keyword?.trim().toLowerCase() ?? "";
  let score = createFreshnessScore(item.updatedAt);

  if (normalizedKeyword.length > 0) {
    const title = item.title.toLowerCase();
    const subtitle = item.subtitle?.toLowerCase();
    const eyebrow = item.eyebrow?.toLowerCase();
    const reason = item.recommendedReason?.toLowerCase();
    const tag = item.tag?.toLowerCase();

    if (title === normalizedKeyword) {
      score += 120;
    } else if (title.startsWith(normalizedKeyword)) {
      score += 90;
    } else if (title.includes(normalizedKeyword)) {
      score += 70;
    }

    if (subtitle?.includes(normalizedKeyword)) {
      score += 35;
    }
    if (eyebrow?.includes(normalizedKeyword)) {
      score += 20;
    }
    if (reason?.includes(normalizedKeyword)) {
      score += 25;
    }
    if (tag === normalizedKeyword) {
      score += 15;
    }
  }

  if (activeSortKey === "popular") {
    score += (item.recommendedReason?.length ?? 0) * 2;
  } else if (activeSortKey === "recommended") {
    score += item.recommendedReason?.length ?? 0;
  }

  return score;
}

export function createFeedItemRouteTarget(item: FeedItem): FeedItem["routeTarget"] {
  if (item.tag === "user") {
    return {
      routeId: APP_ROUTE_IDS.account,
      params: {
        targetUserId: item.id,
      },
      label: "Open account profile",
    };
  }

  return {
    routeId: APP_ROUTE_IDS.overview,
    params: {
      id: item.id,
    },
    label: "Open detail",
  };
}

export function createFeedItemRanking(item: FeedItem, index: number, activeSortKey: string, keyword: string | undefined) {
  const normalizedKeyword = keyword?.trim().toLowerCase();
  const matchedFields = [
    normalizedKeyword && item.title.toLowerCase().includes(normalizedKeyword) ? "title" : undefined,
    normalizedKeyword && item.subtitle?.toLowerCase().includes(normalizedKeyword) ? "subtitle" : undefined,
    normalizedKeyword && item.recommendedReason?.toLowerCase().includes(normalizedKeyword) ? "reason" : undefined,
  ].filter((value): value is string => Boolean(value));

  return {
    score: Math.max(1, createFeedItemSearchScore(item, activeSortKey, keyword) - index),
    label: index === 0 ? "Top match" : `Rank ${index + 1}`,
    strategy: activeSortKey,
    matchedFields: matchedFields.length > 0 ? matchedFields : ["recommendation"],
  };
}

export function decorateSearchItems(items: FeedItem[], activeSortKey: string, keyword: string | undefined): FeedItem[] {
  return items.map((item, index): FeedItem => {
    const routeTarget: NonNullable<FeedItem["routeTarget"]> = item.routeTarget ?? createFeedItemRouteTarget(item)!;
    return {
      ...item,
      ranking: createFeedItemRanking(item, index, activeSortKey, keyword),
      routeTarget,
    };
  });
}

export function resolveFeedSortKey(sortKey: string | undefined): string {
  return sortKey === "updatedAt" || sortKey === "popular" ? sortKey : "recommended";
}

export function sortFeedItems(items: FeedItem[], activeSortKey: string, keyword?: string): FeedItem[] {
  if (activeSortKey === "updatedAt") {
    return [...items].sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));
  }

  if (activeSortKey === "popular") {
    return [...items].sort(
      (left, right) =>
        createFeedItemSearchScore(right, activeSortKey, keyword) -
          createFeedItemSearchScore(left, activeSortKey, keyword) ||
        (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "") ||
        left.title.localeCompare(right.title),
    );
  }

  return [...items].sort(
    (left, right) =>
      createFeedItemSearchScore(right, activeSortKey, keyword) -
        createFeedItemSearchScore(left, activeSortKey, keyword) ||
      (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "") ||
      left.title.localeCompare(right.title),
  );
}

export function interleaveSearchGroups<T extends { items: FeedItem[] }>(groups: T[]): FeedItem[] {
  const queues = groups.map((group) => [...group.items]);
  const flattened: FeedItem[] = [];

  while (queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next) {
        flattened.push(next);
      }
    }
  }

  return flattened;
}

export function createFeedSearchFilters(items: FeedItem[], activeTag?: string): SearchFilterGroup[] {
  const tagCounts = new Map<string, number>();
  const allTags = items
    .filter((item): item is FeedItem & { tag: string } => typeof item.tag === "string" && item.tag.length > 0)
    .map((item) => ({ key: item.tag, label: item.tag }));

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

export function createNovelSearchFilters(
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

export function createNovelSortOptions(): SearchSortOption[] {
  return [
    { key: "recommended", label: "Recommended" },
    { key: "updatedAt", label: "Latest" },
    { key: "popular", label: "Popular" },
    { key: "wordCount", label: "Length" },
  ];
}

export function createFeedSortOptions(): SearchSortOption[] {
  return [
    { key: "recommended", label: "Recommended" },
    { key: "updatedAt", label: "Latest" },
    { key: "popular", label: "Popular" },
  ];
}

export function createFeedSearchResults(
  items: FeedItem[],
  total: number,
  hasMore: boolean,
  emptyText: string,
  hotKeywords: string[],
  activeSortKey: string,
  keyword: string,
  options: {
    correctionKeyword?: string;
    correctionReason?: string;
  } = {},
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
    ...(options.correctionKeyword ? { correctionKeyword: options.correctionKeyword } : {}),
    ...(options.correctionReason ? { correctionReason: options.correctionReason } : {}),
    recoverySuggestions: createRecoverySuggestions(keyword, hotKeywords, options.correctionKeyword),
    ranking: createSearchRankingSummary(activeSortKey),
  };
}

export function filterSearchItems<TItem>(
  items: TItem[],
  keyword: string,
  project: (item: TItem) => Array<string | undefined>,
): TItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return items;
  }

  return items.filter((item) =>
    project(item).some((value) => value?.toLowerCase().includes(normalizedKeyword)),
  );
}

export function createUserSearchItems(userState?: UserState): FeedItem[] {
  const relation = userState?.relationTarget;
  const visibility = resolveProfileVisibility(userState);
  const items: FeedItem[] = [
    {
      id: "user_current",
      title: userState?.profileOverrides?.nickname ?? "MiniX User",
      subtitle:
        visibility === "public"
          ? "Public profile"
          : visibility === "followers_only"
            ? "Followers-only profile"
            : "Current signed-in account",
      eyebrow: "User",
      recommendedReason:
        visibility === "public"
          ? "This profile is visible across shared discovery surfaces."
          : visibility === "followers_only"
            ? "This profile is limited to follower-aware discovery surfaces."
            : "Use the shared search center to jump between account, creator, and domain surfaces.",
      tag: "user",
    },
  ];

  if (relation && canExposeRelationSearch(userState, relation)) {
    items.push({
      id: relation.targetUserId,
      title: relation.displayName,
      subtitle: relation.friend ? "Mutual connection" : relation.following ? "Following" : "Suggested user",
      eyebrow: "User",
      recommendedReason: canExposeRemarkName(userState, relation)
        ? `Remark: ${relation.remarkName}`
        : relation.blocked
          ? "Blocked relation target"
          : "Shared relation surface sample result",
      tag: "user",
    });
  }

  return items;
}

export function createSearchDomainTabs(input: Array<{ domain: SearchDomain; label: string; total: number }>, activeDomain: SearchDomain) {
  return input.map((item) => ({
    ...item,
    active: item.domain === activeDomain,
  }));
}

export function createSearchResultGroups(
  input: Array<{ domain: SearchDomain; label: string; items: FeedItem[] }>,
) {
  return input.map((group) => ({
    domain: group.domain,
    label: group.label,
    total: group.items.length,
    items: group.items,
    ...(group.items[0]?.recommendedReason ? { featuredReason: group.items[0].recommendedReason } : {}),
  }));
}

export function createNovelSearchResults(
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
