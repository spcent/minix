import type { ListPageQuery, SearchFilterGroup, SearchQuery, SearchResults } from "@minix/contracts";

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
  searchQuery?: SearchQuery;
  searchFilters?: SearchFilterGroup[];
  searchResults?: SearchResults<TItem>;
}

export interface CreateDefaultListPageStateOptions<TItem> {
  title?: string;
  subtitle?: string;
  pageSize?: number;
  emptyText?: string;
  items?: TItem[];
}

function cloneItems<TItem>(items: TItem[]): TItem[] {
  return items.map((item) => ({ ...(item as object) }) as TItem);
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
  });
}
