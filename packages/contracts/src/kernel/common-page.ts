export interface PageCursor {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface PageSortRule {
  field: string;
  order: "asc" | "desc";
}

export interface PageFilterRule {
  field: string;
  operator?: "eq" | "contains" | "in" | "gte" | "lte";
  value: string | number | boolean | null | Array<string | number | boolean>;
}

export interface ListPageQuery extends PageCursor {
  keyword?: string;
  filters?: PageFilterRule[];
  sort?: PageSortRule[];
}

export interface ListPageResult<TItem> extends PageCursor {
  items: TItem[];
  hasMore?: boolean;
  nextCursor?: string;
  total?: number;
}

export interface DetailPageState<TData = unknown> {
  data?: TData;
  loading: boolean;
  errorCode?: string;
}

export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormSubmissionResult<TResult = unknown> {
  submittedAt?: number;
  value?: TResult;
  errors?: FormFieldError[];
}
