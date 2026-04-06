import type { BookshelfItem } from "@minix/contracts";
import type { LatestMilestoneHistoryEntry } from "@minix/core";

export type BookshelfSortKey = "recent" | "updated" | "progress";

export type BookshelfFilterKey = "all" | "updates" | "completed";

export interface BookshelfState {
  ready: boolean;
  title: string;
  items: BookshelfItem[];
  visibleItems: BookshelfItem[];
  pinnedItem: BookshelfItem | undefined;
  activeItems: BookshelfItem[];
  updateItems: BookshelfItem[];
  completedItems: BookshelfItem[];
  loading: boolean;
  refreshing: boolean;
  mutatingNovelId: string | undefined;
  errorText: string | undefined;
  statusText: string | undefined;
  emptyText: string;
  selectedNovelId: string | undefined;
  pinnedNovelId: string | undefined;
  activeSortKey: BookshelfSortKey;
  activeFilterKey: BookshelfFilterKey;
  activeCount: number;
  updatedCount: number;
  completedCount: number;
  groupedCount: number;
  selectionReason: string | undefined;
  resumeCueTitle: string | undefined;
  resumeCueReason: string | undefined;
  resumeCueMeta: string | undefined;
  activeLaneReason: string | undefined;
  backlogCueTitle: string | undefined;
  backlogCueReason: string | undefined;
  backlogQueueLabel: string | undefined;
  programMilestoneTitle: string | undefined;
  programMilestoneCopy: string | undefined;
  programMilestoneMeta: string | undefined;
  milestoneHistory: LatestMilestoneHistoryEntry[];
  updateLaneReason: string | undefined;
  archiveReason: string | undefined;
}

export interface CreateBookshelfStateOptions {
  title?: string;
  emptyText?: string;
}

export function createInitialBookshelfState(options: CreateBookshelfStateOptions = {}): BookshelfState {
  return {
    ready: false,
    title: options.title ?? "My Bookshelf",
    items: [],
    visibleItems: [],
    pinnedItem: undefined,
    activeItems: [],
    updateItems: [],
    completedItems: [],
    loading: false,
    refreshing: false,
    mutatingNovelId: undefined,
    errorText: undefined,
    statusText: undefined,
    emptyText: options.emptyText ?? "Your bookshelf is still empty.",
    selectedNovelId: undefined,
    pinnedNovelId: undefined,
    activeSortKey: "recent",
    activeFilterKey: "all",
    activeCount: 0,
    updatedCount: 0,
    completedCount: 0,
    groupedCount: 0,
    selectionReason: undefined,
    resumeCueTitle: undefined,
    resumeCueReason: undefined,
    resumeCueMeta: undefined,
    activeLaneReason: undefined,
    backlogCueTitle: undefined,
    backlogCueReason: undefined,
    backlogQueueLabel: undefined,
    programMilestoneTitle: undefined,
    programMilestoneCopy: undefined,
    programMilestoneMeta: undefined,
    milestoneHistory: [],
    updateLaneReason: undefined,
    archiveReason: undefined,
  };
}
