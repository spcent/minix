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
}

export interface CreateDefaultDetailPageStateOptions<TData = unknown> {
  title?: string;
  subtitle?: string;
  data?: TData;
  entryContext?: DetailStatus["entryContext"];
  actions?: DetailAction[];
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
    detailStatus: {
      loadState: options.data !== undefined ? "ready" : "idle",
      entryContext: options.entryContext ?? "unknown",
      refreshable: true,
      invalidated: false,
      deleted: false,
      permissionDenied: false,
      offline: false,
      unpublished: false,
    },
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
  });
}
