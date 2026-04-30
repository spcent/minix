import {
  createControllerRouterHelpers,
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
  type BookshelfResponse,
  type RemoveFromBookshelfRequest,
} from "@minix/contracts";

import {
  createInitialBookshelfState,
  type BookshelfFilterKey,
  type BookshelfSortKey,
  type BookshelfState,
} from "../model";
import {
  cloneInitialBookshelfState,
  createVisibleState,
  mapShelfOrderToSortKey,
  resolveTargetItem,
} from "./projection";

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
    ...cloneInitialBookshelfState(createInitialBookshelfState()),
    ...initialState,
  });
  const { routeToLogin } = createControllerRouterHelpers({
    kernel,
    loginRouteId,
  });

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
        ...nextView,
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
        ...nextView,
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
        ...nextView,
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
        ...nextView,
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
        ...nextView,
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
        mutatingNovelId: undefined,
        pinnedNovelId: current.pinnedNovelId === novelId ? undefined : current.pinnedNovelId,
        ...nextView,
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
