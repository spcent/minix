import {
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  createAuthRedirectParams,
  ok,
  createStore,
  deriveLatestMilestoneHistory,
  LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
  LATEST_READING_MILESTONE_STORAGE_KEY,
  mergeLatestReadingMilestoneHistory,
  READING_CENTER_STORAGE_KEY,
  type AppKernel,
  type LatestReadingMilestoneSnapshot,
  type ReadingCenterPreferences,
} from "@minix/core";
import {
  type AppRouteId,
  type BookshelfMutationResponse,
  type BookshelfItem,
  type BookshelfResponse,
  type RemoveFromBookshelfRequest,
} from "@minix/contracts";

import {
  createInitialBookshelfState,
  type BookshelfFilterKey,
  type BookshelfSortKey,
  type BookshelfState,
} from "../model";

export interface CreateBookshelfControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  catalogRouteId: AppRouteId;
  novelDetailRouteId: AppRouteId;
  readerRouteId: AppRouteId;
  tocRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  requestPath?: string;
  removeRequestPath?: string;
  readingCenterStorageKey?: string;
  latestMilestoneStorageKey?: string;
  latestMilestoneHistoryStorageKey?: string;
  initialState?: Partial<BookshelfState>;
}

function cloneInitialState(initialState: BookshelfState): BookshelfState {
  return {
    ...initialState,
    items: cloneStateSnapshotArray(initialState.items),
    visibleItems: cloneStateSnapshotArray(initialState.visibleItems),
    ...(initialState.pinnedItem ? { pinnedItem: cloneStateSnapshot(initialState.pinnedItem) } : {}),
    activeItems: cloneStateSnapshotArray(initialState.activeItems),
    updateItems: cloneStateSnapshotArray(initialState.updateItems),
    completedItems: cloneStateSnapshotArray(initialState.completedItems),
    milestoneHistory: cloneStateSnapshotArray(initialState.milestoneHistory),
  };
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

function resolveTargetItem(state: BookshelfState, novelId?: string): BookshelfItem | undefined {
  const visibleItems = state.visibleItems.length > 0 || state.items.length === 0
    ? state.visibleItems
    : getVisibleItems(state.items, state.activeSortKey, state.activeFilterKey);
  if (novelId) {
    return visibleItems.find((item) => item.novelId === novelId) ?? state.items.find((item) => item.novelId === novelId);
  }

  return visibleItems.find((item) => item.novelId === state.selectedNovelId) ?? visibleItems[0];
}

function createVisibleState(
  state: BookshelfState,
  overrides: Partial<Pick<BookshelfState, "items" | "activeSortKey" | "activeFilterKey" | "selectedNovelId" | "pinnedNovelId">> = {},
): Pick<
  BookshelfState,
  | "visibleItems"
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
> {
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

function mapShelfOrderToSortKey(
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

export function createBookshelfController(options: CreateBookshelfControllerOptions) {
  const {
    kernel,
    loginRouteId,
    catalogRouteId,
    novelDetailRouteId,
    readerRouteId,
    tocRouteId,
    settingsRouteId,
    requestPath = "/bookshelf",
    removeRequestPath = "/bookshelf",
    readingCenterStorageKey = READING_CENTER_STORAGE_KEY,
    latestMilestoneStorageKey = LATEST_READING_MILESTONE_STORAGE_KEY,
    latestMilestoneHistoryStorageKey = LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
    initialState,
  } = options;
  const store = createStore<BookshelfState>({
    ...cloneInitialState(createInitialBookshelfState()),
    ...initialState,
  });

  async function routeToLogin() {
    if (!loginRouteId) {
      return ok(undefined);
    }

    const current = kernel.router.current();
    return kernel.router.replaceRoute(
      loginRouteId,
      createAuthRedirectParams({
        ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
        ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
        reason: "auth-required",
      }),
    );
  }

  async function persistLatestMilestone(
    novelId: string | undefined,
    title: string | undefined,
    copy: string | undefined,
    meta: string | undefined,
  ) {
    if (!title || !copy) {
      return ok(undefined);
    }

    const snapshot: LatestReadingMilestoneSnapshot = {
      ...(novelId ? { novelId } : {}),
      title,
      copy,
      ...(meta ? { meta } : {}),
      source: "bookshelf",
      type: "archive-milestone",
      savedAt: new Date().toISOString(),
    };
    const historyResult = await kernel.storage.get<LatestReadingMilestoneSnapshot[]>(latestMilestoneHistoryStorageKey);
    const nextHistory = mergeLatestReadingMilestoneHistory(historyResult.ok ? historyResult.value : [], snapshot);
    const latestResult = await kernel.storage.set<LatestReadingMilestoneSnapshot>(latestMilestoneStorageKey, snapshot);
    if (!latestResult.ok) {
      return latestResult;
    }
    const historyWriteResult = await kernel.storage.set<LatestReadingMilestoneSnapshot[]>(latestMilestoneHistoryStorageKey, nextHistory);
    if (!historyWriteResult.ok) {
      return historyWriteResult;
    }

    store.setState({
      milestoneHistory: deriveLatestMilestoneHistory(nextHistory),
    });

    return ok(undefined);
  }

  async function hydrateMilestoneHistory() {
    const historyResult = await kernel.storage.get<LatestReadingMilestoneSnapshot[]>(latestMilestoneHistoryStorageKey);
    if (!historyResult.ok) {
      return historyResult;
    }

    store.setState({
      milestoneHistory: deriveLatestMilestoneHistory(historyResult.value),
    });

    return ok(undefined);
  }

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    selectNovel(novelId: string) {
      const current = store.getState();
      const nextView = createVisibleState(current, {
        selectedNovelId: novelId,
      });
      store.setState({
        selectedNovelId: nextView.selectedNovelId,
        pinnedItem: nextView.pinnedItem,
        selectionReason: nextView.selectionReason,
        resumeCueTitle: nextView.resumeCueTitle,
        resumeCueReason: nextView.resumeCueReason,
        resumeCueMeta: nextView.resumeCueMeta,
        activeLaneReason: nextView.activeLaneReason,
        backlogCueTitle: nextView.backlogCueTitle,
        backlogCueReason: nextView.backlogCueReason,
        backlogQueueLabel: nextView.backlogQueueLabel,
        programMilestoneTitle: nextView.programMilestoneTitle,
        programMilestoneCopy: nextView.programMilestoneCopy,
        programMilestoneMeta: nextView.programMilestoneMeta,
        updateLaneReason: nextView.updateLaneReason,
        archiveReason: nextView.archiveReason,
        statusText: undefined,
      });
    },

    pinNovel(novelId: string) {
      const current = store.getState();
      const exists = current.items.some((item) => item.novelId === novelId);
      if (!exists) {
        return;
      }

      const nextView = createVisibleState(current, {
        pinnedNovelId: novelId,
        selectedNovelId: novelId,
      });
      store.setState({
        pinnedNovelId: novelId,
        selectedNovelId: nextView.selectedNovelId,
        visibleItems: nextView.visibleItems,
        pinnedItem: nextView.pinnedItem,
        activeItems: nextView.activeItems,
        updateItems: nextView.updateItems,
        completedItems: nextView.completedItems,
        activeCount: nextView.activeCount,
        updatedCount: nextView.updatedCount,
        completedCount: nextView.completedCount,
        groupedCount: nextView.groupedCount,
        selectionReason: nextView.selectionReason,
        resumeCueTitle: nextView.resumeCueTitle,
        resumeCueReason: nextView.resumeCueReason,
        resumeCueMeta: nextView.resumeCueMeta,
        activeLaneReason: nextView.activeLaneReason,
        backlogCueTitle: nextView.backlogCueTitle,
        backlogCueReason: nextView.backlogCueReason,
        backlogQueueLabel: nextView.backlogQueueLabel,
        programMilestoneTitle: nextView.programMilestoneTitle,
        programMilestoneCopy: nextView.programMilestoneCopy,
        programMilestoneMeta: nextView.programMilestoneMeta,
        updateLaneReason: nextView.updateLaneReason,
        archiveReason: nextView.archiveReason,
        statusText: `${current.items.find((item) => item.novelId === novelId)?.title ?? "Title"} pinned to the top of this shelf view.`,
        errorText: undefined,
      });
    },

    clearPinnedNovel() {
      const current = store.getState();
      if (!current.pinnedNovelId) {
        return;
      }

      const nextView = createVisibleState(current, {
        pinnedNovelId: undefined,
      });
      store.setState({
        pinnedNovelId: undefined,
        selectedNovelId: nextView.selectedNovelId,
        visibleItems: nextView.visibleItems,
        pinnedItem: nextView.pinnedItem,
        activeItems: nextView.activeItems,
        updateItems: nextView.updateItems,
        completedItems: nextView.completedItems,
        activeCount: nextView.activeCount,
        updatedCount: nextView.updatedCount,
        completedCount: nextView.completedCount,
        groupedCount: nextView.groupedCount,
        selectionReason: nextView.selectionReason,
        resumeCueTitle: nextView.resumeCueTitle,
        resumeCueReason: nextView.resumeCueReason,
        resumeCueMeta: nextView.resumeCueMeta,
        activeLaneReason: nextView.activeLaneReason,
        backlogCueTitle: nextView.backlogCueTitle,
        backlogCueReason: nextView.backlogCueReason,
        backlogQueueLabel: nextView.backlogQueueLabel,
        programMilestoneTitle: nextView.programMilestoneTitle,
        programMilestoneCopy: nextView.programMilestoneCopy,
        programMilestoneMeta: nextView.programMilestoneMeta,
        updateLaneReason: nextView.updateLaneReason,
        archiveReason: nextView.archiveReason,
        statusText: "Pinned shelf title cleared.",
        errorText: undefined,
      });
    },

    setSort(sortKey: BookshelfSortKey) {
      const current = store.getState();
      const nextView = createVisibleState(current, {
        activeSortKey: sortKey,
      });
      store.setState({
        activeSortKey: sortKey,
        visibleItems: nextView.visibleItems,
        pinnedItem: nextView.pinnedItem,
        activeItems: nextView.activeItems,
        updateItems: nextView.updateItems,
        completedItems: nextView.completedItems,
        selectedNovelId: nextView.selectedNovelId,
        activeCount: nextView.activeCount,
        updatedCount: nextView.updatedCount,
        completedCount: nextView.completedCount,
        groupedCount: nextView.groupedCount,
        selectionReason: nextView.selectionReason,
        resumeCueTitle: nextView.resumeCueTitle,
        resumeCueReason: nextView.resumeCueReason,
        resumeCueMeta: nextView.resumeCueMeta,
        activeLaneReason: nextView.activeLaneReason,
        backlogCueTitle: nextView.backlogCueTitle,
        backlogCueReason: nextView.backlogCueReason,
        backlogQueueLabel: nextView.backlogQueueLabel,
        programMilestoneTitle: nextView.programMilestoneTitle,
        programMilestoneCopy: nextView.programMilestoneCopy,
        programMilestoneMeta: nextView.programMilestoneMeta,
        updateLaneReason: nextView.updateLaneReason,
        archiveReason: nextView.archiveReason,
        statusText: undefined,
      });
    },

    setSortRecent() {
      this.setSort("recent");
    },

    setSortUpdated() {
      this.setSort("updated");
    },

    setSortProgress() {
      this.setSort("progress");
    },

    setFilter(filterKey: BookshelfFilterKey) {
      const current = store.getState();
      const nextView = createVisibleState(current, {
        activeFilterKey: filterKey,
      });
      store.setState({
        activeFilterKey: filterKey,
        visibleItems: nextView.visibleItems,
        pinnedItem: nextView.pinnedItem,
        activeItems: nextView.activeItems,
        updateItems: nextView.updateItems,
        completedItems: nextView.completedItems,
        selectedNovelId: nextView.selectedNovelId,
        activeCount: nextView.activeCount,
        updatedCount: nextView.updatedCount,
        completedCount: nextView.completedCount,
        groupedCount: nextView.groupedCount,
        selectionReason: nextView.selectionReason,
        resumeCueTitle: nextView.resumeCueTitle,
        resumeCueReason: nextView.resumeCueReason,
        resumeCueMeta: nextView.resumeCueMeta,
        activeLaneReason: nextView.activeLaneReason,
        backlogCueTitle: nextView.backlogCueTitle,
        backlogCueReason: nextView.backlogCueReason,
        backlogQueueLabel: nextView.backlogQueueLabel,
        programMilestoneTitle: nextView.programMilestoneTitle,
        programMilestoneCopy: nextView.programMilestoneCopy,
        programMilestoneMeta: nextView.programMilestoneMeta,
        updateLaneReason: nextView.updateLaneReason,
        archiveReason: nextView.archiveReason,
        statusText: undefined,
      });
    },

    setFilterAll() {
      this.setFilter("all");
    },

    setFilterUpdates() {
      this.setFilter("updates");
    },

    setFilterCompleted() {
      this.setFilter("completed");
    },

    async load() {
      const readingCenterResult = await kernel.storage.get<ReadingCenterPreferences>(readingCenterStorageKey);
      await hydrateMilestoneHistory();
      const preferredSortKey = readingCenterResult.ok
        ? mapShelfOrderToSortKey(readingCenterResult.value?.shelfOrder)
        : store.getState().activeSortKey;

      store.setState({
        loading: true,
        refreshing: false,
        mutatingNovelId: undefined,
        activeSortKey: preferredSortKey,
        errorText: undefined,
        statusText: undefined,
      });

      const result = await kernel.request.get<BookshelfResponse>(requestPath);
      if (!result.ok) {
        store.setState({
          loading: false,
          mutatingNovelId: undefined,
          errorText: result.error.message,
        });

        if (result.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return result;
      }

      store.setState({
        ready: true,
        loading: false,
        items: result.value.items,
        ...createVisibleState({
          ...store.getState(),
          items: result.value.items,
          activeSortKey: preferredSortKey,
        }),
        mutatingNovelId: undefined,
        errorText: undefined,
        statusText:
          readingCenterResult.ok && readingCenterResult.value?.shelfOrder
            ? `Shelf order synced from reading center: ${readingCenterResult.value.shelfOrder}.`
            : undefined,
      });

      const latestView = createVisibleState({
        ...store.getState(),
        ready: true,
        items: result.value.items,
        activeSortKey: preferredSortKey,
      });
      await persistLatestMilestone(
        result.value.items.find((item) => item.title === latestView.backlogCueTitle)?.novelId,
        latestView.programMilestoneTitle,
        latestView.programMilestoneCopy,
        latestView.programMilestoneMeta,
      );

      return result;
    },

    async removeNovel(novelId: string) {
      const current = store.getState();
      const target = current.items.find((item) => item.novelId === novelId);
      if (!target) {
        return ok(undefined);
      }

      store.setState({
        mutatingNovelId: novelId,
        errorText: undefined,
        statusText: undefined,
      });

      const result = await kernel.request.delete<BookshelfMutationResponse>(removeRequestPath, {
        novelId,
      } satisfies RemoveFromBookshelfRequest);

      if (!result.ok) {
        store.setState({
          mutatingNovelId: undefined,
          errorText: result.error.message,
        });

        if (result.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return result;
      }

      const nextItems = result.value.items;
      const nextView = createVisibleState(current, {
        items: nextItems,
        selectedNovelId: current.selectedNovelId === novelId ? undefined : current.selectedNovelId,
        pinnedNovelId: current.pinnedNovelId === novelId ? undefined : current.pinnedNovelId,
      });
      store.setState({
        items: nextItems,
        visibleItems: nextView.visibleItems,
        pinnedItem: nextView.pinnedItem,
        activeItems: nextView.activeItems,
        updateItems: nextView.updateItems,
        completedItems: nextView.completedItems,
        mutatingNovelId: undefined,
        selectedNovelId: nextView.selectedNovelId,
        pinnedNovelId: current.pinnedNovelId === novelId ? undefined : current.pinnedNovelId,
        activeCount: nextView.activeCount,
        updatedCount: nextView.updatedCount,
        completedCount: nextView.completedCount,
        groupedCount: nextView.groupedCount,
        selectionReason: nextView.selectionReason,
        resumeCueTitle: nextView.resumeCueTitle,
        resumeCueReason: nextView.resumeCueReason,
        resumeCueMeta: nextView.resumeCueMeta,
        activeLaneReason: nextView.activeLaneReason,
        backlogCueTitle: nextView.backlogCueTitle,
        backlogCueReason: nextView.backlogCueReason,
        backlogQueueLabel: nextView.backlogQueueLabel,
        programMilestoneTitle: nextView.programMilestoneTitle,
        programMilestoneCopy: nextView.programMilestoneCopy,
        programMilestoneMeta: nextView.programMilestoneMeta,
        updateLaneReason: nextView.updateLaneReason,
        archiveReason: nextView.archiveReason,
        statusText: `${target.title} removed from shelf.`,
        errorText: undefined,
      });
      await persistLatestMilestone(
        nextItems.find((item) => item.title === nextView.backlogCueTitle)?.novelId,
        nextView.programMilestoneTitle,
        nextView.programMilestoneCopy,
        nextView.programMilestoneMeta,
      );

      return result;
    },

    async goToCatalog() {
      return kernel.router.toRoute(catalogRouteId);
    },

    async goToSettings() {
      if (!settingsRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(settingsRouteId);
    },

    async openSelectedNovel() {
      const current = store.getState();
      const target = resolveTargetItem(current);
      if (!target) {
        return ok(undefined);
      }

      return kernel.router.toRoute(novelDetailRouteId, { novelId: target.novelId });
    },

    async openNovel(novelId: string) {
      const current = store.getState();
      const target = resolveTargetItem(current, novelId);
      if (!target) {
        return ok(undefined);
      }

      return kernel.router.toRoute(novelDetailRouteId, { novelId: target.novelId });
    },

    async continueSelectedNovel() {
      const current = store.getState();
      const target = resolveTargetItem(current);
      if (!target?.continueChapterId) {
        return this.openSelectedNovel();
      }

      return kernel.router.toRoute(readerRouteId, {
        novelId: target.novelId,
        chapterId: target.continueChapterId,
      });
    },

    async continueNovel(novelId: string) {
      const current = store.getState();
      const target = resolveTargetItem(current, novelId);
      if (!target?.continueChapterId) {
        return this.openNovel(novelId);
      }

      return kernel.router.toRoute(readerRouteId, {
        novelId: target.novelId,
        chapterId: target.continueChapterId,
      });
    },

    async openMilestoneHistoryItem(indexValue?: string | number) {
      const current = store.getState();
      const index = typeof indexValue === "number" ? indexValue : Number(indexValue ?? 0);
      const item = current.milestoneHistory[index];
      if (!item) {
        return ok(undefined);
      }

      if (item.source === "reader" && item.novelId && item.chapterId) {
        return kernel.router.toRoute(readerRouteId, {
          novelId: item.novelId,
          chapterId: item.chapterId,
        });
      }

      if (item.source === "toc" && tocRouteId && item.novelId) {
        return kernel.router.toRoute(tocRouteId, {
          novelId: item.novelId,
          ...(item.chapterId ? { chapterId: item.chapterId } : {}),
        });
      }

      if (item.source === "bookshelf") {
        return ok(undefined);
      }

      if (item.novelId) {
        return kernel.router.toRoute(novelDetailRouteId, { novelId: item.novelId });
      }

      return ok(undefined);
    },
  };
}
