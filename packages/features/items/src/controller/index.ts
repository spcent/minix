import {
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  createControllerRouterHelpers,
  createListSelectionState,
  createListRequestFlow,
  createListRequestSuccessStatus,
  createSingleFlightHydrator,
  ok,
  createStore,
  type AppKernel,
  type Result,
} from "@minix/core";
import {
  type ItemsListItem,
  type AppRouteId,
  type ItemsListResponse,
} from "@minix/contracts";

import type { ItemsFilterValue, ItemsPageItem, ItemsPageModel, ItemsProgressSnapshot } from "../model";

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
    items: cloneStateSnapshotArray(initialModel.items),
    query: cloneStateSnapshot(initialModel.query),
    pagination: cloneStateSnapshot(initialModel.pagination),
    selection: {
      ...initialModel.selection,
      selectedItemIds: [...initialModel.selection.selectedItemIds],
    },
    status: cloneStateSnapshot(initialModel.status),
    filters: cloneStateSnapshotArray(initialModel.filters),
    searchFilters: cloneStateSnapshotArray(initialModel.searchFilters),
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
  return createListSelectionState(selectedItemId);
}

function createLoadedItemsPatch<TItem extends ItemsListItem>(
  current: ItemsPageModel,
  response: ItemsListResponse<TItem>,
  options: {
    append?: boolean;
    fallbackPage: number;
  },
): Partial<ItemsPageModel> {
  const sourceItems = options.append ? [...current.items, ...response.items] : response.items;
  const nextItems = applyCompletionState(sourceItems, current.completedItemIds);
  const selectedItemId = deriveSelectedItemId(nextItems, current.selectedItemId);
  const page = response.page ?? options.fallbackPage;
  const pageSize = response.pageSize ?? current.query.pageSize ?? 20;

  return {
    loading: false,
    refreshing: false,
    ready: true,
    items: nextItems,
    selectedItemId,
    selection: createSelectionState(selectedItemId),
    hasMore: response.hasMore,
    pagination: {
      page,
      pageSize,
      hasMore: response.hasMore,
    },
    query: {
      ...current.query,
      page,
      pageSize,
    },
    errorText: undefined,
    featuredReason: deriveFeaturedReason(nextItems, current.featuredReason),
    recentlyCompletedItemId: undefined,
    status: createListRequestSuccessStatus(nextItems.length, selectedItemId),
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
  const { routeToLogin, routeToOptional } = createControllerRouterHelpers({
    kernel,
    loginRouteId,
    ...(authRedirectSource ? { authRedirectSource } : {}),
  });

  async function persistProgress() {
    const current = store.getState();
    return kernel.storage.set(progressStorageKey, createProgressSnapshot(current));
  }

  const hydrateProgress = createSingleFlightHydrator<void>(
    async (force): Promise<Result<void>> => {
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
    },
  );

  const runListRequest = createListRequestFlow<ItemsPageModel, ItemsListResponse<TItem>>({
    store,
    request({ state, page }) {
      return kernel.request.get<ItemsListResponse<TItem>>(
        requestPath,
        nextPageQuery(page, state.query.pageSize ?? 20),
      );
    },
    applyResponse({ kind, state, response, page }) {
      return createLoadedItemsPatch(state, response, {
        append: kind === "append",
        fallbackPage: page,
      });
    },
    onUnauthorized: routeToLogin,
    resolvePage({ kind, state }) {
      return kind === "append" ? (state.query.page ?? 1) + 1 : 1;
    },
  });

  return {
    store,

    async hydrateProgress() {
      return hydrateProgress();
    },

    async loadInitial() {
      await hydrateProgress();
      return runListRequest("initial");
    },

    async refresh() {
      await hydrateProgress();
      return runListRequest("refresh");
    },

    async loadMore() {
      await hydrateProgress();
      const current = store.getState();
      if (current.loading || current.refreshing || !current.hasMore) {
        return;
      }

      return runListRequest("append");
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
