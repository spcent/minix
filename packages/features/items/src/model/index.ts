import type { ListPageModel } from "@minix/core";
import type { ItemsListItem } from "@minix/contracts";

export type ItemsFilterValue = "all" | "remaining" | "completed";

export interface ItemsPageItem extends ItemsListItem {
  completed: boolean;
}

export interface ItemsProgressSnapshot {
  completedItemIds: string[];
  activeFilter: ItemsFilterValue;
  lastProgressAt?: string;
}

export interface ItemsPageModel extends ListPageModel<ItemsPageItem> {
  activeFilter: ItemsFilterValue;
  completedItemIds: string[];
  selectedItemId: string | undefined;
  progressHydrated: boolean;
  lastProgressAt: string | undefined;
  featuredReason: string | undefined;
  recentlyCompletedItemId: string | undefined;
}

export interface CreateItemsPageModelOptions {
  title: string;
  pageSize: number;
  emptyText: string;
  items?: ItemsListItem[];
  activeFilter?: ItemsFilterValue;
  featuredReason?: string;
}

export interface CreateDefaultItemsPageModelOptions {
  title?: string;
  pageSize?: number;
  emptyText?: string;
  items?: ItemsListItem[];
  activeFilter?: ItemsFilterValue;
  featuredReason?: string;
}

function normalizeItems(items: ItemsListItem[] | undefined): ItemsPageItem[] {
  return (items ?? []).map((item) => ({
    ...item,
    completed: false,
  }));
}

export function createItemsPageModel(options: CreateItemsPageModelOptions): ItemsPageModel {
  return {
    title: options.title,
    items: normalizeItems(options.items),
    query: {
      page: 1,
      pageSize: options.pageSize,
    },
    loading: false,
    refreshing: false,
    hasMore: false,
    emptyText: options.emptyText,
    activeFilter: options.activeFilter ?? "all",
    completedItemIds: [],
    selectedItemId: undefined,
    progressHydrated: false,
    lastProgressAt: undefined,
    featuredReason: options.featuredReason,
    recentlyCompletedItemId: undefined,
  };
}

export function createDefaultItemsPageModel(options: CreateDefaultItemsPageModelOptions = {}): ItemsPageModel {
  return createItemsPageModel({
    title: options.title ?? "Items",
    pageSize: options.pageSize ?? 20,
    emptyText: options.emptyText ?? "No items yet",
    ...(options.items ? { items: options.items } : {}),
    ...(options.activeFilter ? { activeFilter: options.activeFilter } : {}),
    ...(options.featuredReason ? { featuredReason: options.featuredReason } : {}),
  });
}
