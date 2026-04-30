import {
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  type ReadingCenterPreferences,
} from "@minix/core";
import type { BookshelfItem } from "@minix/contracts";

import {
  createBookshelfListState,
  type BookshelfFilterKey,
  type BookshelfSortKey,
  type BookshelfState,
} from "../model";

export function cloneInitialBookshelfState(initialState: BookshelfState): BookshelfState {
  return {
    ...initialState,
    list: cloneStateSnapshot(initialState.list),
    items: cloneStateSnapshotArray(initialState.items),
    visibleItems: cloneStateSnapshotArray(initialState.visibleItems),
    ...(initialState.pinnedItem ? { pinnedItem: cloneStateSnapshot(initialState.pinnedItem) } : {}),
    activeItems: cloneStateSnapshotArray(initialState.activeItems),
    updateItems: cloneStateSnapshotArray(initialState.updateItems),
    completedItems: cloneStateSnapshotArray(initialState.completedItems),
    milestoneHistory: cloneStateSnapshotArray(initialState.milestoneHistory),
  };
}

export function resolveTargetItem(state: BookshelfState, novelId?: string): BookshelfItem | undefined {
  const visibleItems = state.visibleItems.length > 0 || state.items.length === 0
    ? state.visibleItems
    : getVisibleItems(state.items, state.activeSortKey, state.activeFilterKey);
  if (novelId) {
    return visibleItems.find((item) => item.novelId === novelId) ?? state.items.find((item) => item.novelId === novelId);
  }

  return visibleItems.find((item) => item.novelId === state.selectedNovelId) ?? visibleItems[0];
}

export type BookshelfVisibleState = Pick<
  BookshelfState,
  | "visibleItems"
  | "list"
  | "selectedNovelId"
  | "pinnedItem"
  | "activeItems"
  | "updateItems"
  | "completedItems"
  | "activeCount"
  | "updatedCount"
  | "completedCount"
  | "groupedCount"
  | "selectionReason"
  | "resumeCueTitle"
  | "resumeCueReason"
  | "resumeCueMeta"
  | "activeLaneReason"
  | "backlogCueTitle"
  | "backlogCueReason"
  | "backlogQueueLabel"
  | "programMilestoneTitle"
  | "programMilestoneCopy"
  | "programMilestoneMeta"
  | "updateLaneReason"
  | "archiveReason"
>;

export function createVisibleState(
  state: BookshelfState,
  overrides: Partial<Pick<BookshelfState, "items" | "activeSortKey" | "activeFilterKey" | "selectedNovelId" | "pinnedNovelId">> = {},
): BookshelfVisibleState {
  const nextState = {
    ...state,
    ...overrides,
  };
  const activeItems = nextState.items.filter((item) => !isCompleted(item));
  const updateItems = nextState.items.filter((item) => item.hasUpdate);
  const completedItems = nextState.items.filter((item) => isCompleted(item));
  const visibleItems = getVisibleItems(
    nextState.items,
    nextState.activeSortKey,
    nextState.activeFilterKey,
    nextState.pinnedNovelId,
  );
  const selectedNovelId = deriveSelectedNovelId({
    ...nextState,
    visibleItems,
  });
  const pinnedItem = nextState.pinnedNovelId
    ? nextState.items.find((item) => item.novelId === nextState.pinnedNovelId)
    : undefined;
  const selectedItem = nextState.items.find((item) => item.novelId === selectedNovelId);

  return {
    list: createBookshelfListState({
      title: nextState.title,
      emptyText: nextState.emptyText,
      items: visibleItems,
      ...(selectedNovelId ? { selectedNovelId } : {}),
      sort: nextState.activeSortKey,
    }),
    visibleItems,
    selectedNovelId,
    pinnedItem,
    activeItems,
    updateItems,
    completedItems,
    activeCount: activeItems.length,
    updatedCount: updateItems.length,
    completedCount: completedItems.length,
    groupedCount: activeItems.length + updateItems.length + completedItems.length,
    selectionReason: selectedItem
      ? nextState.pinnedNovelId === selectedItem.novelId
        ? `${selectedItem.title} stays surfaced because it is pinned above the active shelf lane while still preserving the fastest continuation path.`
        : `${selectedItem.title} stays surfaced because it survives the active ${nextState.activeFilterKey} / ${nextState.activeSortKey} shelf view while preserving the fastest continuation path.`
      : undefined,
    resumeCueTitle: createResumeCueTitle(selectedItem ?? pinnedItem),
    resumeCueReason: createResumeCueReason(
      selectedItem ?? pinnedItem,
      nextState.pinnedNovelId,
      nextState.activeFilterKey,
      nextState.activeSortKey,
    ),
    resumeCueMeta: createResumeCueMeta(selectedItem ?? pinnedItem),
    activeLaneReason:
      activeItems.length > 0
        ? "Active titles stay in a warm lane so paused reading sessions can restart without scanning the full shelf."
        : "No unfinished reading sessions are active right now, so the active lane stays quiet.",
    backlogCueTitle: createBacklogCueTitle(completedItems),
    backlogCueReason: createBacklogCueReason(completedItems),
    backlogQueueLabel: createBacklogQueueLabel(activeItems, completedItems),
    programMilestoneTitle: createProgramMilestoneTitle(completedItems),
    programMilestoneCopy: createProgramMilestoneCopy(activeItems, completedItems),
    programMilestoneMeta: createProgramMilestoneMeta(completedItems),
    updateLaneReason:
      updateItems.length > 0
        ? "Updated titles stay in a dedicated lane so release movement is visible without scanning the full shelf."
        : "No release movement is active right now, so the update lane stays quiet.",
    archiveReason:
      completedItems.length > 0
        ? "Completed runs remain in the archive lane so finished reading still participates in the collection story."
        : "Completed titles will appear here once longer reading runs finish.",
  };
}

export function mapShelfOrderToSortKey(
  shelfOrder: ReadingCenterPreferences["shelfOrder"] | undefined,
): BookshelfSortKey {
  if (shelfOrder === "updates") {
    return "updated";
  }

  if (shelfOrder === "pinned") {
    return "recent";
  }

  return "recent";
}

function deriveSelectedNovelId(state: BookshelfState): string | undefined {
  const visibleItems = state.visibleItems.length > 0 || state.items.length === 0
    ? state.visibleItems
    : getVisibleItems(state.items, state.activeSortKey, state.activeFilterKey);

  if (state.pinnedNovelId && visibleItems.some((item) => item.novelId === state.pinnedNovelId)) {
    return state.pinnedNovelId;
  }

  if (state.selectedNovelId && visibleItems.some((item) => item.novelId === state.selectedNovelId)) {
    return state.selectedNovelId;
  }

  return visibleItems[0]?.novelId;
}

function isCompleted(item: BookshelfItem): boolean {
  return (item.progressPercent ?? 0) >= 0.99;
}

function createResumeCueTitle(item: BookshelfItem | undefined): string | undefined {
  if (!item) {
    return undefined;
  }

  return item.title;
}

function createResumeCueReason(
  item: BookshelfItem | undefined,
  pinnedNovelId: string | undefined,
  activeFilterKey: BookshelfFilterKey,
  activeSortKey: BookshelfSortKey,
): string | undefined {
  if (!item) {
    return undefined;
  }

  if (pinnedNovelId === item.novelId) {
    return `Because you pinned ${item.title}, it stays above the rest of the shelf while preserving the fastest route back into reading.`;
  }

  if (item.continueChapterTitle) {
    return `Because you paused at ${item.continueChapterTitle}, ${item.title} stays surfaced as the fastest way back into flow.`;
  }

  if (item.hasUpdate) {
    return `Because a fresh update landed after your last session, ${item.title} stays visible in the ${activeFilterKey}/${activeSortKey} shelf view.`;
  }

  if (isCompleted(item)) {
    return `${item.title} is complete, so it remains available for archive re-entry instead of taking the primary resume slot.`;
  }

  return `${item.title} stays surfaced because it survives the active ${activeFilterKey}/${activeSortKey} shelf view and still carries the strongest reading context.`;
}

function createResumeCueMeta(item: BookshelfItem | undefined): string | undefined {
  if (!item) {
    return undefined;
  }

  return `${item.authorName} · ${item.continueChapterTitle ?? item.latestChapterTitle ?? "Ready to reopen"}`;
}

function createBacklogCueTitle(completedItems: BookshelfItem[]): string | undefined {
  return completedItems[0]?.title;
}

function createBacklogCueReason(completedItems: BookshelfItem[]): string | undefined {
  const item = completedItems[0];
  if (!item) {
    return "No finished title is waiting for backlog re-entry yet.";
  }

  return `${item.title} now leads the backlog re-entry lane because the active run is complete and the title can be reopened without competing with current reading momentum.`;
}

function createBacklogQueueLabel(activeItems: BookshelfItem[], completedItems: BookshelfItem[]): string | undefined {
  if (completedItems.length === 0) {
    return "No finished title is waiting in the backlog queue yet.";
  }

  const completedLabel = `${completedItems.length} finished ${completedItems.length === 1 ? "title" : "titles"}`;
  const activeLabel = `${activeItems.length} active ${activeItems.length === 1 ? "run" : "runs"}`;

  if (activeItems.length > 0) {
    return `${completedLabel} stay in backlog re-entry while ${activeLabel} keep the current reading program warm.`;
  }

  return `${completedLabel} are available for quiet backlog re-entry now that no active run is competing for focus.`;
}

function createProgramMilestoneTitle(completedItems: BookshelfItem[]): string | undefined {
  const item = completedItems[0];
  return item ? `${item.title} archived` : undefined;
}

function createProgramMilestoneCopy(activeItems: BookshelfItem[], completedItems: BookshelfItem[]): string | undefined {
  const item = completedItems[0];
  if (!item) {
    return "No archive milestone is active yet because no title has finished its reading run.";
  }

  if (activeItems.length > 0) {
    return `${item.title} now behaves like the latest archive milestone while unfinished titles keep the active reading program warm.`;
  }

  return `${item.title} is now the calm archive milestone for the shelf because no active run is competing for focus.`;
}

function createProgramMilestoneMeta(completedItems: BookshelfItem[]): string | undefined {
  const item = completedItems[0];
  if (!item) {
    return undefined;
  }

  return `${item.authorName} · completed archive`;
}

function getVisibleItems(
  items: BookshelfItem[],
  activeSortKey: BookshelfSortKey,
  activeFilterKey: BookshelfFilterKey,
  pinnedNovelId?: string,
): BookshelfItem[] {
  const filteredItems = items.filter((item) => {
    if (activeFilterKey === "updates") {
      return item.hasUpdate;
    }

    if (activeFilterKey === "completed") {
      return isCompleted(item);
    }

    return true;
  });

  return [...filteredItems].sort((left, right) => {
    if (pinnedNovelId) {
      const leftPinned = left.novelId === pinnedNovelId;
      const rightPinned = right.novelId === pinnedNovelId;
      if (leftPinned !== rightPinned) {
        return leftPinned ? -1 : 1;
      }
    }

    if (activeSortKey === "updated") {
      if (left.hasUpdate !== right.hasUpdate) {
        return left.hasUpdate ? -1 : 1;
      }
    }

    if (activeSortKey === "progress") {
      const progressDelta = (right.progressPercent ?? 0) - (left.progressPercent ?? 0);
      if (progressDelta !== 0) {
        return progressDelta;
      }
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}
