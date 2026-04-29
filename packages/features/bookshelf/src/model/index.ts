import type { BookshelfItem } from "@minix/contracts";
import { createListPageState, type LatestMilestoneHistoryEntry, type ListPageState } from "@minix/core";

export type BookshelfSortKey = "recent" | "updated" | "progress";

export type BookshelfFilterKey = "all" | "updates" | "completed";

export interface BookshelfState {
  ready: boolean;
  title: string;
  list: ListPageState<BookshelfItem>;
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

export interface CreateBookshelfListStateOptions {
  title: string;
  emptyText: string;
  items?: BookshelfItem[];
  selectedNovelId?: string;
  pageSize?: number;
  sort?: BookshelfSortKey;
}

export function createBookshelfListState(options: CreateBookshelfListStateOptions): ListPageState<BookshelfItem> {
  return createListPageState({
    title: options.title,
    pageSize: options.pageSize ?? Math.max(options.items?.length ?? 0, 1),
    emptyText: options.emptyText,
    ...(options.items ? { items: options.items } : {}),
    ...(options.selectedNovelId ? { selectedItemId: options.selectedNovelId } : {}),
    query: {
      page: 1,
      pageSize: options.pageSize ?? Math.max(options.items?.length ?? 0, 1),
      ...(options.sort ? { sort: [{ field: options.sort, order: "desc" }] } : {}),
    },
  });
}

export function createInitialBookshelfState(options: CreateBookshelfStateOptions = {}): BookshelfState {
  const title = options.title ?? "My Bookshelf";
  const emptyText = options.emptyText ?? "Your bookshelf is still empty.";

  return {
    ready: false,
    title,
    list: createBookshelfListState({
      title,
      emptyText,
      sort: "recent",
    }),
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
    emptyText,
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
