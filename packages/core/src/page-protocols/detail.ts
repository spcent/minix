import type { DetailPageState as ContractDetailPageState } from "@minix/contracts";

export type DetailPageState<TData = unknown> = Omit<ContractDetailPageState<TData>, "errorCode"> & {
  title: string;
  subtitle: string | undefined;
  ready: boolean;
  errorCode: string | undefined;
  errorText: string | undefined;
};

export interface CreateDetailPageStateOptions<TData = unknown> {
  title: string;
  subtitle?: string;
  data?: TData;
}

export interface CreateDefaultDetailPageStateOptions<TData = unknown> {
  title?: string;
  subtitle?: string;
  data?: TData;
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
  });
}
