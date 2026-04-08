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

export type ListPageLoadState = "idle" | "loading" | "refreshing" | "appending" | "ready" | "empty" | "partial" | "error" | "skeleton";

export interface ListPagination {
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
}

export interface ListSelectionState {
  selectedItemId?: string;
  selectedItemIds: string[];
  batchSelectable: boolean;
}

export interface ListStatus {
  loadState: ListPageLoadState;
  firstLoaded: boolean;
  retryable: boolean;
  partialData: boolean;
  stickyHeaderEnabled: boolean;
}

export type DetailLoadState =
  | "idle"
  | "loading"
  | "refreshing"
  | "ready"
  | "invalidated"
  | "deleted"
  | "forbidden"
  | "offline"
  | "unpublished"
  | "error";

export interface DetailStatus {
  loadState: DetailLoadState;
  entryContext: "list" | "share" | "deep_link" | "unknown";
  refreshable: boolean;
  invalidated: boolean;
  deleted: boolean;
  permissionDenied: boolean;
  offline: boolean;
  unpublished: boolean;
}

export interface DetailAction {
  key: string;
  label: string;
  enabled: boolean;
  emphasis?: "primary" | "secondary" | "danger";
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

export type FormFieldType =
  | "text"
  | "number"
  | "date"
  | "single_select"
  | "multi_select"
  | "upload_reference"
  | "rich_text";

export type FormValidationRule =
  | "required"
  | "length"
  | "format"
  | "cross_field"
  | "async";

export interface FormValidationError extends FormFieldError {
  rule: FormValidationRule;
  fieldType?: FormFieldType;
  blocking?: boolean;
}

export interface FormSubmissionResult<TResult = unknown> {
  submittedAt?: number;
  value?: TResult;
  errors?: FormFieldError[];
}

export type FormSubmitMode = "draft" | "submit";

export type FormSubmitPhase = "idle" | "draft_saving" | "submitting" | "submitted" | "failed";

export interface FormSubmitState<TResult = unknown> {
  phase: FormSubmitPhase;
  mode?: FormSubmitMode;
  duplicateProtected: boolean;
  draftCapable: boolean;
  draftSavedAt?: number;
  submittedAt?: number;
  result?: TResult;
}

export interface FormWorkflowState {
  stepKeys: string[];
  currentStepKey?: string;
  approvalState: "none" | "pending" | "approved" | "rejected";
  visibleFieldKeys: string[];
  dynamicFieldKeys: string[];
  conditionalFieldKeys: string[];
}
