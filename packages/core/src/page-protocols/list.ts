import type {
  ListPagination,
  ListPageLoadState,
  ListPageQuery,
  ListSelectionState,
  ListStatus,
  SearchFilterGroup,
  SearchQuery,
  SearchResults,
} from "@minix/contracts";

export interface ListPageState<TItem> {
  title: string;
  subtitle: string | undefined;
  ready: boolean;
  loading: boolean;
  refreshing: boolean;
  errorCode: string | undefined;
  errorText: string | undefined;
  emptyText: string;
  items: TItem[];
  selectedItemId: string | undefined;
  pagination: ListPagination;
  filters: SearchFilterGroup[];
  selection: ListSelectionState;
  status: ListStatus;
  hasMore: boolean;
  nextCursor: string | undefined;
  total: number | undefined;
  searchQuery: SearchQuery | undefined;
  searchFilters: SearchFilterGroup[];
  searchResults: SearchResults<TItem> | undefined;
  query: ListPageQuery & {
    page: number;
    pageSize: number;
  };
}

export interface CreateListPageStateOptions<TItem> {
  title: string;
  subtitle?: string;
  pageSize: number;
  emptyText: string;
  items?: TItem[];
  query?: Partial<ListPageQuery>;
  hasMore?: boolean;
  nextCursor?: string;
  total?: number;
  selectedItemId?: string;
  selectedItemIds?: string[];
  batchSelectable?: boolean;
  stickyHeaderEnabled?: boolean;
  searchQuery?: SearchQuery;
  searchFilters?: SearchFilterGroup[];
  searchResults?: SearchResults<TItem>;
  loadState?: ListPageLoadState;
  partialData?: boolean;
  restoredFromRoute?: boolean;
  restoredQueryKeys?: string[];
  restoredSelectionId?: string;
}

export interface CreateDefaultListPageStateOptions<TItem> {
  title?: string;
  subtitle?: string;
  pageSize?: number;
  emptyText?: string;
  items?: TItem[];
  loadState?: ListPageLoadState;
}

function cloneItems<TItem>(items: TItem[]): TItem[] {
  return items.map((item) => ({ ...(item as object) }) as TItem);
}

export interface CreateListStatusOptions {
  firstLoaded?: boolean;
  retryable?: boolean;
  partialData?: boolean;
  stickyHeaderEnabled?: boolean;
  restoredFromRoute?: boolean;
  restoredQueryKeys?: string[];
  restoredSelectionId?: string;
  staleData?: boolean;
}

export function createListStatus(
  loadState: ListPageLoadState,
  options: CreateListStatusOptions = {},
): ListStatus {
  return {
    loadState,
    firstLoaded: options.firstLoaded ?? !["idle", "loading", "refreshing", "skeleton"].includes(loadState),
    retryable: options.retryable ?? true,
    partialData: options.partialData ?? loadState === "partial",
    stickyHeaderEnabled: options.stickyHeaderEnabled ?? false,
    empty: loadState === "empty",
    skeleton: loadState === "skeleton",
    staleData: options.staleData ?? loadState === "partial",
    restoredFromRoute: options.restoredFromRoute ?? false,
    ...(options.restoredQueryKeys && options.restoredQueryKeys.length > 0
      ? { restoredQueryKeys: [...options.restoredQueryKeys] }
      : {}),
    ...(options.restoredSelectionId ? { restoredSelectionId: options.restoredSelectionId } : {}),
  };
}

export function createListPageState<TItem>(options: CreateListPageStateOptions<TItem>): ListPageState<TItem> {
  const query = options.query ?? {};
  const firstItemId =
    options.selectedItemId ??
    ((options.items?.[0] as {
      id?: string;
    } | undefined)?.id ?? undefined);

  return {
    title: options.title,
    subtitle: options.subtitle,
    ready: false,
    loading: false,
    refreshing: false,
    errorCode: undefined,
    errorText: undefined,
    emptyText: options.emptyText,
    items: cloneItems(options.items ?? []),
    selectedItemId: firstItemId,
    pagination: {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? options.pageSize,
      hasMore: options.hasMore ?? false,
      ...(options.nextCursor !== undefined ? { nextCursor: options.nextCursor } : {}),
      ...(options.total !== undefined ? { total: options.total } : {}),
    },
    filters: options.searchFilters?.map((group) => structuredClone(group)) ?? [],
    selection: {
      ...(firstItemId !== undefined ? { selectedItemId: firstItemId } : {}),
      selectedItemIds: [...(options.selectedItemIds ?? (firstItemId ? [firstItemId] : []))],
      batchSelectable: options.batchSelectable ?? false,
    },
    status: {
      ...createListStatus(options.loadState ?? "idle", {
        firstLoaded: false,
        partialData: options.partialData ?? false,
        stickyHeaderEnabled: options.stickyHeaderEnabled ?? false,
        ...(options.restoredFromRoute ? { restoredFromRoute: true } : {}),
        ...(options.restoredQueryKeys ? { restoredQueryKeys: options.restoredQueryKeys } : {}),
        ...(firstItemId ? { restoredSelectionId: firstItemId } : {}),
      }),
    },
    hasMore: options.hasMore ?? false,
    nextCursor: options.nextCursor,
    total: options.total,
    searchQuery: options.searchQuery ? structuredClone(options.searchQuery) : undefined,
    searchFilters: options.searchFilters?.map((group) => structuredClone(group)) ?? [],
    searchResults: options.searchResults ? structuredClone(options.searchResults) : undefined,
    query: {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? options.pageSize,
      ...(query.cursor ? { cursor: query.cursor } : {}),
      ...(query.keyword ? { keyword: query.keyword } : {}),
      ...(query.filters ? { filters: [...query.filters] } : {}),
      ...(query.sort ? { sort: [...query.sort] } : {}),
    },
  };
}

export function createDefaultListPageState<TItem>(
  options: CreateDefaultListPageStateOptions<TItem> = {},
): ListPageState<TItem> {
  return createListPageState({
    title: options.title ?? "List",
    ...(options.subtitle !== undefined ? { subtitle: options.subtitle } : {}),
    pageSize: options.pageSize ?? 20,
    emptyText: options.emptyText ?? "No items are available yet.",
    ...(options.items ? { items: options.items } : {}),
    ...(options.loadState !== undefined ? { loadState: options.loadState } : {}),
  });
}
