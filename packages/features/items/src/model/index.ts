import { createDefaultListPageState, type ListPageState } from "@minix/core";
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

export type ItemsPageModel = ListPageState<ItemsPageItem> & {
  activeFilter: ItemsFilterValue;
  completedItemIds: string[];
  progressHydrated: boolean;
  lastProgressAt: string | undefined;
  featuredReason: string | undefined;
  recentlyCompletedItemId: string | undefined;
};

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
  const base = createDefaultListPageState<ItemsPageItem>({
    title: options.title,
    pageSize: options.pageSize,
    emptyText: options.emptyText,
    items: normalizeItems(options.items),
  });
  return {
    ...base,
    activeFilter: options.activeFilter ?? "all",
    completedItemIds: [],
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

export function createMinuteEnglishOverviewPageModel(): ItemsPageModel {
  return createDefaultItemsPageModel({
    title: "Your Daily English Overview",
    pageSize: 3,
    emptyText: "No overview tasks yet. Please come back later.",
    featuredReason: "Start with overview to understand today's focus before opening the full lesson plan.",
  });
}

export function createMinuteEnglishPracticePlanPageModel(): ItemsPageModel {
  return createDefaultItemsPageModel({
    title: "Today's English Practice",
    pageSize: 6,
    emptyText: "No lesson tasks yet. Please come back later.",
    featuredReason: "Today's plan is balanced to move from vocabulary to listening and then active speaking.",
  });
}
