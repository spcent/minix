import type {
  DetailAction,
  DetailPageState as ContractDetailPageState,
  DetailStatus,
} from "@minix/contracts";

export type DetailPageState<TData = unknown> = Omit<ContractDetailPageState<TData>, "errorCode"> & {
  title: string;
  subtitle: string | undefined;
  ready: boolean;
  errorCode: string | undefined;
  errorText: string | undefined;
  detailData: TData | undefined;
  detailStatus: DetailStatus;
  detailActions: DetailAction[];
};

export interface CreateDetailPageStateOptions<TData = unknown> {
  title: string;
  subtitle?: string;
  data?: TData;
  entryContext?: DetailStatus["entryContext"];
  actions?: DetailAction[];
  requestedDetailId?: string;
  recoveredFromLink?: boolean;
}

export interface CreateDefaultDetailPageStateOptions<TData = unknown> {
  title?: string;
  subtitle?: string;
  data?: TData;
  entryContext?: DetailStatus["entryContext"];
  actions?: DetailAction[];
  requestedDetailId?: string;
  recoveredFromLink?: boolean;
}

export interface CreateDetailStatusOptions {
  entryContext?: DetailStatus["entryContext"];
  refreshable?: boolean;
  invalidated?: boolean;
  deleted?: boolean;
  permissionDenied?: boolean;
  offline?: boolean;
  stale?: boolean;
  unavailable?: boolean;
  unpublished?: boolean;
  recoveredFromLink?: boolean;
  requestedDetailId?: string;
}

export function createDetailStatus(
  loadState: DetailStatus["loadState"],
  options: CreateDetailStatusOptions = {},
): DetailStatus {
  return {
    loadState,
    entryContext: options.entryContext ?? "unknown",
    refreshable: options.refreshable ?? true,
    invalidated: options.invalidated ?? loadState === "invalidated",
    deleted: options.deleted ?? loadState === "deleted",
    permissionDenied: options.permissionDenied ?? loadState === "forbidden",
    offline: options.offline ?? loadState === "offline",
    stale: options.stale ?? (loadState === "stale" || loadState === "invalidated"),
    unavailable: options.unavailable ?? loadState === "unavailable",
    unpublished: options.unpublished ?? loadState === "unpublished",
    recoveredFromLink: options.recoveredFromLink ?? false,
    ...(options.requestedDetailId ? { requestedDetailId: options.requestedDetailId } : {}),
  };
}

export function createDetailPageState<TData = unknown>(
  options: CreateDetailPageStateOptions<TData>,
): DetailPageState<TData> {
  return {
    title: options.title,
    subtitle: options.subtitle,
    ready: false,
    loading: false,
    errorCode: undefined,
    errorText: undefined,
    detailData: options.data,
    detailStatus: createDetailStatus(options.data !== undefined ? "ready" : "idle", {
      ...(options.entryContext !== undefined ? { entryContext: options.entryContext } : {}),
      ...(options.recoveredFromLink ? { recoveredFromLink: true } : {}),
      ...(options.requestedDetailId ? { requestedDetailId: options.requestedDetailId } : {}),
    }),
    detailActions: options.actions ? options.actions.map((action) => ({ ...action })) : [],
    ...(options.data !== undefined ? { data: options.data } : {}),
  };
}

export function createDefaultDetailPageState<TData = unknown>(
  options: CreateDefaultDetailPageStateOptions<TData> = {},
): DetailPageState<TData> {
  return createDetailPageState({
    title: options.title ?? "Detail",
    ...(options.subtitle !== undefined ? { subtitle: options.subtitle } : {}),
    ...(options.data !== undefined ? { data: options.data } : {}),
    ...(options.entryContext !== undefined ? { entryContext: options.entryContext } : {}),
    ...(options.actions ? { actions: options.actions } : {}),
    ...(options.requestedDetailId ? { requestedDetailId: options.requestedDetailId } : {}),
    ...(options.recoveredFromLink ? { recoveredFromLink: true } : {}),
  });
}
