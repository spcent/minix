import { createAuthRedirectParams, createListStatus, ok, createStore, type AppKernel, type Result } from "@minix/core";
import {
  type ItemsListItem,
  type AppRouteId,
  type ItemsListResponse,
} from "@minix/contracts";

import type { ItemsFilterValue, ItemsPageItem, ItemsPageModel, ItemsProgressSnapshot } from "../model";

type FailedItemsResult<TItem extends ItemsListItem> = Extract<Result<ItemsListResponse<TItem>>, { ok: false }>;
const DEFAULT_PROGRESS_STORAGE_KEY = "items.progress";

export interface CreateItemsControllerOptions<TItem extends ItemsListItem> {
  kernel: AppKernel;
  loginRouteId: AppRouteId;
  settingsRouteId: AppRouteId;
  overviewRouteId?: AppRouteId;
  planRouteId?: AppRouteId;
  authRedirectSource?: "overview" | "plan";
  initialModel: ItemsPageModel;
  requestPath?: string;
  progressStorageKey?: string;
}

function cloneInitialModel(initialModel: ItemsPageModel): ItemsPageModel {
  return {
    ...initialModel,
    items: [...initialModel.items],
    query: { ...initialModel.query },
    pagination: { ...initialModel.pagination },
    selection: {
      ...initialModel.selection,
      selectedItemIds: [...initialModel.selection.selectedItemIds],
    },
    status: { ...initialModel.status },
    filters: initialModel.filters.map((group) => structuredClone(group)),
    searchFilters: initialModel.searchFilters.map((group) => structuredClone(group)),
    completedItemIds: [...initialModel.completedItemIds],
    selectedItemId: initialModel.selectedItemId,
  };
}

function nextPageQuery(page: number, pageSize: number) {
  return { page, pageSize };
}

function applyCompletionState<TItem extends ItemsListItem>(
  items: TItem[],
  completedItemIds: string[],
): ItemsPageItem[] {
  const completedIds = new Set(completedItemIds);
  return items.map((item) => ({
    ...item,
    completed: completedIds.has(item.id),
  }));
}

function deriveFeaturedReason(items: ItemsPageItem[], fallback?: string): string | undefined {
  return (
    items.find((item) => !item.completed && item.recommendedReason)?.recommendedReason ??
    items.find((item) => item.recommendedReason)?.recommendedReason ??
    fallback
  );
}

function deriveSelectedItemId(items: ItemsPageItem[], currentSelectedItemId?: string): string | undefined {
  if (currentSelectedItemId && items.some((item) => item.id === currentSelectedItemId)) {
    return currentSelectedItemId;
  }

  return items.find((item) => !item.completed)?.id ?? items[0]?.id;
}

function deriveContinuedSelectionId(items: ItemsPageItem[], currentItemId: string): string | undefined {
  const currentIndex = items.findIndex((item) => item.id === currentItemId);
  if (currentIndex === -1) {
    return deriveSelectedItemId(items);
  }

  const nextOpenAfterCurrent = items.slice(currentIndex + 1).find((item) => !item.completed);
  if (nextOpenAfterCurrent) {
    return nextOpenAfterCurrent.id;
  }

  return items.find((item) => !item.completed)?.id ?? items[currentIndex]?.id;
}

function createProgressSnapshot(model: ItemsPageModel): ItemsProgressSnapshot {
  return {
    completedItemIds: [...model.completedItemIds],
    activeFilter: model.activeFilter,
    ...(model.lastProgressAt ? { lastProgressAt: model.lastProgressAt } : {}),
  };
}

function createSelectionState(selectedItemId: string | undefined) {
  return {
    ...(selectedItemId !== undefined ? { selectedItemId } : {}),
    selectedItemIds: selectedItemId ? [selectedItemId] : [],
    batchSelectable: false,
  };
}

export function createItemsController<TItem extends ItemsListItem>(options: CreateItemsControllerOptions<TItem>) {
  const {
    kernel,
    loginRouteId,
    settingsRouteId,
    overviewRouteId,
    planRouteId,
    authRedirectSource,
    initialModel,
    requestPath = "/items",
    progressStorageKey = DEFAULT_PROGRESS_STORAGE_KEY,
  } = options;
  const store = createStore(cloneInitialModel(initialModel));
  let progressHydration: Promise<Result<void>> | null = null;

  async function routeToLogin() {
    const current = kernel.router.current();
    return kernel.router.replaceRoute(
      loginRouteId,
      createAuthRedirectParams({
        ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
        ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
        ...(authRedirectSource ? { source: authRedirectSource } : {}),
        reason: "auth-required",
      }),
    );
  }

  async function routeToOptional(routeId?: AppRouteId) {
    if (!routeId) {
      return ok(undefined);
    }

    return kernel.router.toRoute(routeId);
  }

  async function persistProgress() {
    const current = store.getState();
    return kernel.storage.set(progressStorageKey, createProgressSnapshot(current));
  }

  async function hydrateProgress(force = false): Promise<Result<void>> {
    if (!force && progressHydration) {
      return progressHydration;
    }

    const run = async (): Promise<Result<void>> => {
      const current = store.getState();
      if (!force && current.progressHydrated) {
        return ok(undefined);
      }

      const result = await kernel.storage.get<ItemsProgressSnapshot>(progressStorageKey);
      if (!result.ok) {
        store.setState({
          progressHydrated: true,
        });
        return result;
      }

      const progress = result.value ?? {
        completedItemIds: [],
        activeFilter: current.activeFilter,
      };

      const nextCompletedItemIds = [...progress.completedItemIds];
      const nextItems = applyCompletionState(current.items, nextCompletedItemIds);
      const selectedItemId = deriveSelectedItemId(nextItems, current.selectedItemId);
      store.setState({
        items: nextItems,
        completedItemIds: nextCompletedItemIds,
        selectedItemId,
        selection: createSelectionState(selectedItemId),
        activeFilter: progress.activeFilter,
        progressHydrated: true,
        lastProgressAt: progress.lastProgressAt,
        featuredReason: deriveFeaturedReason(nextItems, current.featuredReason),
        recentlyCompletedItemId: undefined,
      });
      return ok(undefined);
    };

    progressHydration = run().finally(() => {
      progressHydration = null;
    });
    return progressHydration;
  }

  function handleLoadFailure(result: FailedItemsResult<TItem>) {
    store.setState({
      ready: true,
      loading: false,
      refreshing: false,
      errorText: result.error.message,
      status: createListStatus("error", {
        firstLoaded: store.getState().items.length > 0,
        staleData: store.getState().items.length > 0,
      }),
    });

    if (result.error.code === "UNAUTHORIZED") {
      return routeToLogin();
    }

    return result;
  }

  return {
    store,

    async hydrateProgress() {
      return hydrateProgress();
    },

    async loadInitial() {
      await hydrateProgress();
      const current = store.getState();
      store.setState({
        loading: true,
        refreshing: false,
        errorText: undefined,
        status: createListStatus("loading", {
          firstLoaded: current.items.length > 0,
        }),
      });

      const result = await kernel.request.get<ItemsListResponse<TItem>>(
        requestPath,
        nextPageQuery(current.query.page ?? 1, current.query.pageSize ?? 20),
      );

      if (!result.ok) {
        return handleLoadFailure(result);
      }

      const nextItems = applyCompletionState(result.value.items, current.completedItemIds);
      const selectedItemId = deriveSelectedItemId(nextItems, current.selectedItemId);
      store.setState({
        loading: false,
        refreshing: false,
        ready: true,
        items: nextItems,
        selectedItemId,
        selection: createSelectionState(selectedItemId),
        hasMore: result.value.hasMore,
        pagination: {
          page: result.value.page ?? current.query.page ?? 1,
          pageSize: result.value.pageSize ?? current.query.pageSize ?? 20,
          hasMore: result.value.hasMore,
        },
        query: {
          ...current.query,
          page: result.value.page ?? current.query.page ?? 1,
          pageSize: result.value.pageSize ?? current.query.pageSize ?? 20,
        },
        errorText: undefined,
        featuredReason: deriveFeaturedReason(nextItems, current.featuredReason),
        recentlyCompletedItemId: undefined,
        status: createListStatus(nextItems.length > 0 ? "ready" : "empty", {
          firstLoaded: true,
          ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
        }),
      });
      return result;
    },

    async refresh() {
      await hydrateProgress();
      const current = store.getState();
      store.setState({
        refreshing: true,
        errorText: undefined,
        status: createListStatus("refreshing", {
          firstLoaded: current.items.length > 0,
          staleData: current.items.length > 0,
        }),
      });

      const result = await kernel.request.get<ItemsListResponse<TItem>>(
        requestPath,
        nextPageQuery(1, current.query.pageSize ?? 20),
      );

      if (!result.ok) {
        return handleLoadFailure(result);
      }

      const nextItems = applyCompletionState(result.value.items, current.completedItemIds);
      const selectedItemId = deriveSelectedItemId(nextItems, current.selectedItemId);
      store.setState({
        loading: false,
        refreshing: false,
        ready: true,
        items: nextItems,
        selectedItemId,
        selection: createSelectionState(selectedItemId),
        hasMore: result.value.hasMore,
        pagination: {
          page: result.value.page ?? 1,
          pageSize: result.value.pageSize ?? current.query.pageSize ?? 20,
          hasMore: result.value.hasMore,
        },
        query: {
          ...current.query,
          page: result.value.page ?? 1,
          pageSize: result.value.pageSize ?? current.query.pageSize ?? 20,
        },
        errorText: undefined,
        featuredReason: deriveFeaturedReason(nextItems, current.featuredReason),
        recentlyCompletedItemId: undefined,
        status: createListStatus(nextItems.length > 0 ? "ready" : "empty", {
          firstLoaded: true,
          ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
        }),
      });
      return result;
    },

    async loadMore() {
      await hydrateProgress();
      const current = store.getState();
      if (current.loading || current.refreshing || !current.hasMore) {
        return;
      }

      const nextPage = (current.query.page ?? 1) + 1;
      store.setState({
        loading: true,
        errorText: undefined,
        status: createListStatus("partial", {
          firstLoaded: current.items.length > 0,
          partialData: current.items.length > 0,
          staleData: current.items.length > 0,
        }),
      });

      const result = await kernel.request.get<ItemsListResponse<TItem>>(
        requestPath,
        nextPageQuery(nextPage, current.query.pageSize ?? 20),
      );

      if (!result.ok) {
        return handleLoadFailure(result);
      }

      const nextItems = applyCompletionState([...current.items, ...result.value.items], current.completedItemIds);
      const selectedItemId = deriveSelectedItemId(nextItems, current.selectedItemId);
      store.setState({
        loading: false,
        ready: true,
        items: nextItems,
        selectedItemId,
        selection: createSelectionState(selectedItemId),
        hasMore: result.value.hasMore,
        pagination: {
          page: result.value.page ?? nextPage,
          pageSize: result.value.pageSize ?? current.query.pageSize ?? 20,
          hasMore: result.value.hasMore,
        },
        query: {
          ...current.query,
          page: result.value.page ?? nextPage,
          pageSize: result.value.pageSize ?? current.query.pageSize ?? 20,
        },
        errorText: undefined,
        featuredReason: deriveFeaturedReason(nextItems, current.featuredReason),
        status: createListStatus("ready", {
          firstLoaded: true,
          ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
        }),
      });
      return result;
    },

    async setFilter(nextFilter: ItemsFilterValue) {
      await hydrateProgress();
      const current = store.getState();
      store.setState({
        activeFilter: nextFilter,
      });
      const result = await persistProgress();
      if (!result.ok) {
        store.setState({
          activeFilter: current.activeFilter,
        });
      }
      return result;
    },

    async toggleItemCompletion(itemId: string) {
      await hydrateProgress();
      const current = store.getState();
      const completedIds = new Set(current.completedItemIds);
      const nextCompleted = !completedIds.has(itemId);
      if (nextCompleted) {
        completedIds.add(itemId);
      } else {
        completedIds.delete(itemId);
      }

      const nextCompletedItemIds = [...completedIds];
      const nextItems = applyCompletionState(current.items, nextCompletedItemIds);
      const selectedItemId = deriveSelectedItemId(nextItems, current.selectedItemId);
      store.setState({
        items: nextItems,
        completedItemIds: nextCompletedItemIds,
        selectedItemId,
        selection: createSelectionState(selectedItemId),
        lastProgressAt: new Date().toISOString(),
        featuredReason: deriveFeaturedReason(nextItems, current.featuredReason),
        recentlyCompletedItemId: nextCompleted ? itemId : undefined,
      });
      return persistProgress();
    },

    async markItemsComplete(itemIds: string[]) {
      await hydrateProgress();
      const current = store.getState();
      const completedIds = new Set(current.completedItemIds);
      itemIds.forEach((itemId) => completedIds.add(itemId));
      const nextCompletedItemIds = [...completedIds];
      const nextItems = applyCompletionState(current.items, nextCompletedItemIds);
      const selectedItemId = deriveSelectedItemId(nextItems, current.selectedItemId);
      store.setState({
        items: nextItems,
        completedItemIds: nextCompletedItemIds,
        selectedItemId,
        selection: createSelectionState(selectedItemId),
        lastProgressAt: new Date().toISOString(),
        featuredReason: deriveFeaturedReason(nextItems, current.featuredReason),
        recentlyCompletedItemId: undefined,
      });
      return persistProgress();
    },

    async clearProgress() {
      await hydrateProgress();
      const current = store.getState();
      const nextItems = applyCompletionState(current.items, []);
      const selectedItemId = deriveSelectedItemId(nextItems);
      store.setState({
        items: nextItems,
        completedItemIds: [],
        selectedItemId,
        selection: createSelectionState(selectedItemId),
        activeFilter: "all",
        lastProgressAt: undefined,
        featuredReason: deriveFeaturedReason(nextItems, current.featuredReason),
        recentlyCompletedItemId: undefined,
      });
      return kernel.storage.remove(progressStorageKey);
    },

    async setSelectedItem(itemId: string) {
      const current = store.getState();
      if (!current.items.some((item) => item.id === itemId)) {
        return ok(undefined);
      }

      store.setState({
        selectedItemId: itemId,
        selection: createSelectionState(itemId),
      });
      return ok(undefined);
    },

    async completeItemAndContinue(itemId: string) {
      await hydrateProgress();
      const current = store.getState();
      const completedIds = new Set(current.completedItemIds);
      const wasCompleted = completedIds.has(itemId);

      if (!wasCompleted) {
        completedIds.add(itemId);
      }

      const nextCompletedItemIds = [...completedIds];
      const nextItems = applyCompletionState(current.items, nextCompletedItemIds);
      const nextSelectedItemId = deriveContinuedSelectionId(nextItems, itemId);

      store.setState({
        items: nextItems,
        completedItemIds: nextCompletedItemIds,
        selectedItemId: nextSelectedItemId,
        selection: createSelectionState(nextSelectedItemId),
        ...(wasCompleted ? {} : { lastProgressAt: new Date().toISOString() }),
        featuredReason: deriveFeaturedReason(nextItems, current.featuredReason),
        recentlyCompletedItemId: wasCompleted ? undefined : itemId,
      });

      if (wasCompleted) {
        return ok(undefined);
      }

      return persistProgress();
    },

    clearRecentCompletion() {
      store.setState({
        recentlyCompletedItemId: undefined,
      });
    },

    async goToOverview() {
      return routeToOptional(overviewRouteId);
    },

    async goToPlan() {
      return routeToOptional(planRouteId);
    },

    async goToSettings() {
      return kernel.router.toRoute(settingsRouteId);
    },
  };
}
