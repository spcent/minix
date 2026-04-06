export interface ListQuery {
  keyword?: string;
  page?: number;
  pageSize?: number;
  filters?: Record<string, unknown>;
}

export interface ListItem {
  id: string;
  title?: string;
  subtitle?: string;
  cover?: string;
  extra?: Record<string, unknown>;
}

export interface ListPageModel<T extends ListItem = ListItem> {
  title: string;
  items: T[];
  query: ListQuery;
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  emptyText?: string | undefined;
  errorText?: string | undefined;
}
