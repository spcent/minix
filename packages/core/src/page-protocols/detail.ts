import type {
  DetailAction,
  DetailAttachmentDescriptor,
  DetailCommentDescriptor,
  DetailPageState as ContractDetailPageState,
  DetailStatus,
} from "@minix/contracts";

import { cloneOptionalStateSnapshot, cloneStateSnapshotArray } from "../store/snapshot";

export type DetailPageState<TData = unknown> = Omit<ContractDetailPageState<TData>, "errorCode"> & {
  title: string;
  subtitle: string | undefined;
  ready: boolean;
  errorCode: string | undefined;
  errorText: string | undefined;
  detailData: TData | undefined;
  detailStatus: DetailStatus;
  detailActions: DetailAction[];
  detailAttachments: DetailAttachmentDescriptor[];
  detailComments: DetailCommentDescriptor[];
};

export interface CreateDetailPageStateOptions<TData = unknown> {
  title: string;
  subtitle?: string;
  data?: TData;
  entryContext?: DetailStatus["entryContext"];
  entryEvidence?: DetailStatus["entryEvidence"];
  recovery?: DetailStatus["recovery"];
  actions?: DetailAction[];
  attachments?: DetailAttachmentDescriptor[];
  comments?: DetailCommentDescriptor[];
  requestedDetailId?: string;
  recoveredFromLink?: boolean;
}

export interface CreateDefaultDetailPageStateOptions<TData = unknown> {
  title?: string;
  subtitle?: string;
  data?: TData;
  entryContext?: DetailStatus["entryContext"];
  entryEvidence?: DetailStatus["entryEvidence"];
  recovery?: DetailStatus["recovery"];
  actions?: DetailAction[];
  attachments?: DetailAttachmentDescriptor[];
  comments?: DetailCommentDescriptor[];
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
  entryEvidence?: DetailStatus["entryEvidence"];
  recovery?: DetailStatus["recovery"];
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
    ...(options.entryEvidence ? { entryEvidence: structuredClone(options.entryEvidence) } : {}),
    ...(options.recovery ? { recovery: structuredClone(options.recovery) } : {}),
  };
}

export function createDetailPageState<TData = unknown>(
  options: CreateDetailPageStateOptions<TData>,
): DetailPageState<TData> {
  const detailData = cloneOptionalStateSnapshot(options.data);
  return {
    title: options.title,
    subtitle: options.subtitle,
    ready: false,
    loading: false,
    errorCode: undefined,
    errorText: undefined,
    detailData,
    detailStatus: createDetailStatus(options.data !== undefined ? "ready" : "idle", {
      ...(options.entryContext !== undefined ? { entryContext: options.entryContext } : {}),
      ...(options.entryEvidence ? { entryEvidence: options.entryEvidence } : {}),
      ...(options.recovery ? { recovery: options.recovery } : {}),
      ...(options.recoveredFromLink ? { recoveredFromLink: true } : {}),
      ...(options.requestedDetailId ? { requestedDetailId: options.requestedDetailId } : {}),
    }),
    detailActions: cloneStateSnapshotArray(options.actions ?? []),
    detailAttachments: cloneStateSnapshotArray(options.attachments ?? []),
    detailComments: cloneStateSnapshotArray(options.comments ?? []),
    ...(detailData !== undefined ? { data: detailData } : {}),
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
    ...(options.entryEvidence ? { entryEvidence: options.entryEvidence } : {}),
    ...(options.recovery ? { recovery: options.recovery } : {}),
    ...(options.actions ? { actions: options.actions } : {}),
    ...(options.attachments ? { attachments: options.attachments } : {}),
    ...(options.comments ? { comments: options.comments } : {}),
    ...(options.requestedDetailId ? { requestedDetailId: options.requestedDetailId } : {}),
    ...(options.recoveredFromLink ? { recoveredFromLink: true } : {}),
  });
}
