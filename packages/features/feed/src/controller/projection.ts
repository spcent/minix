import {
  cloneFormPageState,
  cloneStateSnapshot,
  cloneStateSnapshotArray,
} from "@minix/core";
import type {
  ContentLifecycleMutationResponse,
  FeedItem,
  FeedListResponse,
  SaveContentDraftResponse,
  SearchResults,
} from "@minix/contracts";

import type { FeedState } from "../model";

export function cloneFeedState(state: FeedState): FeedState {
  return {
    ...state,
    items: cloneStateSnapshotArray(state.items),
    contentDraftForm: cloneFormPageState(state.contentDraftForm),
    reviewQueue: cloneStateSnapshotArray(state.reviewQueue),
    surface: state.surface,
    tags: cloneStateSnapshotArray(state.tags),
    pagination: cloneStateSnapshot(state.pagination),
    filters: cloneStateSnapshotArray(state.filters),
    selection: {
      ...state.selection,
      selectedItemIds: [...state.selection.selectedItemIds],
    },
    status: cloneStateSnapshot(state.status),
    searchQuery: state.searchQuery ? cloneStateSnapshot(state.searchQuery) : undefined,
    searchFilters: cloneStateSnapshotArray(state.searchFilters),
    searchResults: state.searchResults ? cloneStateSnapshot(state.searchResults) : undefined,
    searchQualitySummary: state.searchQualitySummary ? cloneStateSnapshot(state.searchQualitySummary) : undefined,
    query: cloneStateSnapshot(state.query),
    recentKeywords: [...state.recentKeywords],
    selectedReviewContentId: state.selectedReviewContentId,
  };
}

export function deriveSelectedFeedItemId(items: FeedItem[], currentSelectedItemId?: string): string | undefined {
  if (currentSelectedItemId && items.some((item) => item.id === currentSelectedItemId)) {
    return currentSelectedItemId;
  }

  return items[0]?.id;
}

export function deriveFeaturedFeedReason(items: FeedItem[], fallback?: string): string | undefined {
  return items.find((item) => item.recommendedReason)?.recommendedReason ?? fallback;
}

export function createFeedSelection(selectedItemId: string | undefined): FeedState["selection"] {
  return {
    ...(selectedItemId !== undefined ? { selectedItemId } : {}),
    selectedItemIds: selectedItemId ? [selectedItemId] : [],
    batchSelectable: false,
  };
}

export function createFeedSearchResults(
  response: FeedListResponse,
  recentKeywords: string[],
  fallbackEmptyText: string,
  options: {
    restoredFromRoute?: boolean;
    routeWritebackEnabled?: boolean;
    activeTag?: string | undefined;
  } = {},
): SearchResults<FeedItem> {
  const nextSearchResults = cloneStateSnapshot(response.searchResults);
  const routeKeys = [
    ...(response.searchQuery.keyword ? ["keyword"] : []),
    ...(response.searchQuery.mode !== "global" ? ["mode"] : []),
    ...(response.searchQuery.domain !== "feed" ? ["domain"] : []),
    ...(response.searchQuery.sortKey && response.searchQuery.sortKey !== "recommended" ? ["sort"] : []),
    ...(options.activeTag && options.activeTag !== "all" ? ["tag"] : []),
    ...response.searchFilters
      .filter((group) => group.key !== "domain" && group.key !== "tag" && group.selectedKeys.some((key) => key !== "all"))
      .map((group) => group.key),
  ];
  const reloadRecovery =
    options.restoredFromRoute ? "route" : recentKeywords.length > 0 ? "storage" : "none";
  return {
    ...nextSearchResults,
    recentKeywords,
    emptyText: nextSearchResults.emptyText || fallbackEmptyText,
    persistence: {
      routeKeys,
      routeWriteback: options.routeWritebackEnabled ?? false,
      reloadRecovery,
      recentKeywordCount: recentKeywords.length,
      label:
        reloadRecovery === "route"
          ? "Active discover filters and query params were restored from the current route."
          : reloadRecovery === "storage"
            ? "Recent discover keywords were restored from shared storage for quick reuse."
            : "Discover filters stay route-addressable and recent keywords start empty until the first search.",
    },
    qualitySummary: {
      ...(nextSearchResults.qualitySummary ?? {
        rankingSummary: nextSearchResults.ranking?.label ?? "Results ranked by recommendation relevance.",
        synonymSummary: "Suggestion terms and hot keywords act as the bounded synonym dictionary.",
        correctionSummary: nextSearchResults.correctionKeyword
          ? `Correction dictionary suggested "${nextSearchResults.correctionKeyword}".`
          : "No correction term was required for the current query.",
        recentSearchSummary: "Recent search persistence is bounded before storage writeback.",
        routeWritebackSummary: "Route-addressable filters remain encoded in search query and filter metadata.",
        zeroResultSummary: nextSearchResults.zeroResultGuidance?.label ?? "Search quality signals are active.",
      }),
      recentSearchSummary: `${recentKeywords.length} recent keyword(s) are available after bounded pruning.`,
      routeWritebackSummary:
        routeKeys.length > 0
          ? `Route writeback tracks ${routeKeys.join(", ")}.`
          : "No route writeback keys are active for the default search state.",
    },
  };
}

function replaceFeedItem(items: FeedItem[], nextItem: FeedItem): FeedItem[] {
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export function upsertFeedItem(items: FeedItem[], nextItem: FeedItem): FeedItem[] {
  return items.some((item) => item.id === nextItem.id) ? replaceFeedItem(items, nextItem) : [nextItem, ...items];
}

function replaceFeedItemInSearchResults(
  searchResults: FeedState["searchResults"],
  nextItem: FeedItem,
): FeedState["searchResults"] {
  if (!searchResults) {
    return searchResults;
  }

  return {
    ...searchResults,
    items: upsertFeedItem(searchResults.items, nextItem),
    ...(searchResults.resultGroups
      ? {
          resultGroups: searchResults.resultGroups.map((group) => ({
            ...group,
            items: group.items.some((item) => item.id === nextItem.id)
              ? replaceFeedItem(group.items, nextItem)
              : group.items,
          })),
        }
      : {}),
  };
}

export function createContentMutationPatch(
  state: FeedState,
  response: ContentLifecycleMutationResponse | SaveContentDraftResponse,
  contentId: string,
): Partial<FeedState> {
  const currentItem = state.items.find((item) => item.id === contentId);
  const nextRecommendedReason = response.contentDetail.recommendationReason ?? currentItem?.recommendedReason;
  const nextItem: FeedItem = {
    id: contentId,
    title: response.contentCard.title,
    ...(response.contentCard.subtitle ? { subtitle: response.contentCard.subtitle } : {}),
    eyebrow: response.contentCard.display.category.label ?? currentItem?.eyebrow ?? "Content",
    ...(response.contentCard.coverUrl ? { imageUrl: response.contentCard.coverUrl } : {}),
    ...(nextRecommendedReason !== undefined ? { recommendedReason: nextRecommendedReason } : {}),
    ...(response.contentCard.lifecycle.updatedAt
      ? { updatedAt: response.contentCard.lifecycle.updatedAt }
      : response.contentCard.lifecycle.publishedAt
        ? { updatedAt: response.contentCard.lifecycle.publishedAt }
        : currentItem?.updatedAt
          ? { updatedAt: currentItem.updatedAt }
          : {}),
    tag: response.contentCard.display.category.key ?? currentItem?.tag ?? "content",
    ...(currentItem?.ranking ? { ranking: currentItem.ranking } : {}),
    ...(currentItem?.routeTarget ? { routeTarget: currentItem.routeTarget } : {}),
    contentCard: response.contentCard,
    contentAccess: response.contentAccess,
  };
  const nextItems = upsertFeedItem(state.items, nextItem);
  return {
    items: nextItems,
    searchResults: replaceFeedItemInSearchResults(state.searchResults, nextItem),
    featuredReason: deriveFeaturedFeedReason(nextItems, state.featuredReason),
    selectedItemId: nextItem.id,
    selection: createFeedSelection(nextItem.id),
    contentTransitionFeedback: response.transitionMessage,
    contentGovernanceSummary:
      response.governanceSummary ??
      response.contentDetail.governanceSummary ??
      response.contentCard.governanceSummary ??
      state.contentGovernanceSummary,
  };
}

export function deriveSelectedContentId(state: FeedState): string | undefined {
  return state.items.find((item) => item.id === state.selectedItemId)?.contentCard?.contentId;
}
