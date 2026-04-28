export interface ApiPaginationWindow<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface CreateApiPaginationWindowOptions {
  page?: number | undefined;
  pageSize?: number | undefined;
  defaultPage?: number | undefined;
  defaultPageSize: number;
  maxPageSize?: number | undefined;
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && value !== undefined && value > 0 ? value : fallback;
}

export function createApiPaginationWindow<TItem>(
  items: readonly TItem[],
  options: CreateApiPaginationWindowOptions,
): ApiPaginationWindow<TItem> {
  const page = normalizePositiveInteger(options.page, options.defaultPage ?? 1);
  const requestedPageSize = normalizePositiveInteger(options.pageSize, options.defaultPageSize);
  const pageSize =
    options.maxPageSize !== undefined ? Math.min(requestedPageSize, options.maxPageSize) : requestedPageSize;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    items: pageItems,
    page,
    pageSize,
    total: items.length,
    hasMore: start + pageSize < items.length,
  };
}
