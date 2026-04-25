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

export type ListRenderVariant = "feed" | "table" | "card" | "grid" | "grouped";

export interface ListRenderMetadata {
  variant: ListRenderVariant;
  density?: "compact" | "comfortable" | "spacious";
  groupBy?: string;
  stickyHeaderEnabled?: boolean;
  supportsIncrementalAppend?: boolean;
}

export interface ListSavedFilter {
  key: string;
  label: string;
  filterKeys: string[];
  restored?: boolean;
}

export interface ListBatchActionDescriptor {
  key: string;
  label: string;
  enabled: boolean;
  destructive?: boolean;
  requiresSelection?: boolean;
}

export interface ListStatus {
  loadState: ListPageLoadState;
  firstLoaded: boolean;
  retryable: boolean;
  partialData: boolean;
  stickyHeaderEnabled: boolean;
  empty: boolean;
  skeleton: boolean;
  staleData: boolean;
  restoredFromRoute: boolean;
  restoredQueryKeys?: string[];
  restoredSelectionId?: string;
}

export type DetailLoadState =
  | "idle"
  | "loading"
  | "refreshing"
  | "ready"
  | "stale"
  | "invalidated"
  | "deleted"
  | "forbidden"
  | "offline"
  | "unavailable"
  | "unpublished"
  | "error";

export interface DetailEntryEvidence {
  sourceRouteId?: string;
  sourceItemId?: string;
  sourceListKey?: string;
  shareChannel?: string;
  deepLink?: string;
  traceId?: string;
}

export interface DetailRecoveryDescriptor {
  title: string;
  message: string;
  actionLabel?: string;
  retryable?: boolean;
}

export interface DetailStatus {
  loadState: DetailLoadState;
  entryContext: "list" | "share" | "deep_link" | "unknown";
  refreshable: boolean;
  invalidated: boolean;
  deleted: boolean;
  permissionDenied: boolean;
  offline: boolean;
  stale: boolean;
  unavailable: boolean;
  unpublished: boolean;
  recoveredFromLink: boolean;
  requestedDetailId?: string;
  entryEvidence?: DetailEntryEvidence;
  recovery?: DetailRecoveryDescriptor;
}

export interface DetailAction {
  key: string;
  label: string;
  enabled: boolean;
  emphasis?: "primary" | "secondary" | "danger";
  placement?: "primary" | "secondary" | "overflow" | "inline";
  requiresConfirmation?: boolean;
  disabledReason?: string;
}

export type DetailAttachmentKind = "image" | "audio" | "video" | "pdf" | "link" | "file";

export interface DetailAttachmentDescriptor {
  key: string;
  label: string;
  kind: DetailAttachmentKind;
  url?: string;
  thumbnailUrl?: string;
  assetId?: string;
  mimeType?: string;
  sizeBytes?: number;
  downloadable?: boolean;
}

export interface DetailCommentDescriptor {
  key: string;
  authorLabel: string;
  body: string;
  createdAt?: string;
  status?: "visible" | "pending" | "hidden";
  replyCount?: number;
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

export interface FormFieldOption {
  key: string;
  label: string;
  description?: string;
}

export type FormConditionOperator = "eq" | "neq" | "in" | "truthy" | "falsy";

export interface FormFieldCondition {
  field: string;
  operator: FormConditionOperator;
  value?: string | number | boolean | Array<string | number | boolean>;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: FormFieldType;
  stepKey?: string;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  dynamic?: boolean;
  options?: FormFieldOption[];
  conditions?: FormFieldCondition[];
  uploadRole?: string;
  richTextToolbar?: "basic" | "placeholder";
}

export interface FormStepDefinition {
  key: string;
  label: string;
  description?: string;
}

export interface FormSchema {
  fields: FormFieldDefinition[];
  steps: FormStepDefinition[];
}

export type FormApprovalNodeState = "not_started" | "pending" | "approved" | "rejected";

export interface FormApprovalNode {
  nodeKey: string;
  label: string;
  state: FormApprovalNodeState;
  assigneeId?: string;
  assigneeLabel?: string;
  actedAt?: number;
  comment?: string;
}

export interface FormDraftState {
  draftId?: string;
  recoveryKey?: string;
  restoredAt?: number;
  lastSavedAt?: number;
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
  duplicateBlocked?: boolean;
  draftCapable: boolean;
  draftSavedAt?: number;
  submittedAt?: number;
  submissionKey?: string;
  lastCompletedKey?: string;
  result?: TResult;
}

export interface FormWorkflowState {
  stepKeys: string[];
  currentStepKey?: string;
  approvalState: "none" | "pending" | "approved" | "rejected";
  visibleFieldKeys: string[];
  dynamicFieldKeys: string[];
  conditionalFieldKeys: string[];
  approvalNodes?: FormApprovalNode[];
  draft?: FormDraftState;
}
