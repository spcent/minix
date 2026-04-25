import type {
  FeedbackBootstrapResponse,
  FeedbackCategory,
  FeedbackFaqEntry,
  FeedbackHandlingReport,
  FeedbackQueueDashboard,
  FeedbackRevisitAction,
  FeedbackSlaRule,
  FeedbackSupportEntry,
  FeedbackTicket,
  FeedbackTicketList,
  FeedbackTicketDetailResponse,
  FeedbackStatus,
  FeedbackType,
  UploadAsset,
} from "@minix/contracts";
import {
  cloneOptionalStateSnapshot,
  cloneStateSnapshotArray,
  createDefaultFormPageState,
  type FormPageState,
} from "@minix/core";

export interface FeedbackValues extends Record<string, unknown> {
  type: FeedbackType;
  categoryKey: string;
  title: string;
  description: string;
  revisitRequested: boolean;
  satisfactionScore: number | undefined;
  sourcePage: string;
  sourceRouteId: string | undefined;
  sourceLabel: string | undefined;
  userId: string | undefined;
  platform: string;
  appVersion: string;
  deviceSummary: string | undefined;
  screenshotAssets: UploadAsset[];
  attachmentAssets: UploadAsset[];
}

export interface FeedbackDraftSnapshot {
  savedAt: number;
  values: FeedbackValues;
  currentStepKey?: string;
}

export type FeedbackState = FormPageState<FeedbackValues, FeedbackTicketDetailResponse> & {
  categories: FeedbackCategory[];
  latestTicket: FeedbackTicket | undefined;
  latestStatus: FeedbackStatus | undefined;
  latestCategory: FeedbackCategory | undefined;
  ticketList: FeedbackTicketList | undefined;
  selectedTicketId: string | undefined;
  recommendedFaqEntries: FeedbackFaqEntry[];
  faqCatalog: FeedbackFaqEntry[];
  supportEntries: FeedbackSupportEntry[];
  supportEntry: FeedbackSupportEntry | undefined;
  revisitAction: FeedbackRevisitAction | undefined;
  queueDashboards: FeedbackQueueDashboard[];
  slaRules: FeedbackSlaRule[];
  handlingReport: FeedbackHandlingReport | undefined;
  serviceLoopSummary: string | undefined;
  serviceHint: string | undefined;
};

export interface CreateDefaultFeedbackStateOptions {
  title?: string;
  subtitle?: string;
  values?: Partial<FeedbackValues>;
}

export function createDefaultFeedbackValues(values: Partial<FeedbackValues> = {}): FeedbackValues {
  return {
    type: values.type ?? "issue_report",
    categoryKey: values.categoryKey ?? "product_issue",
    title: values.title ?? "",
    description: values.description ?? "",
    revisitRequested: values.revisitRequested ?? false,
    satisfactionScore: values.satisfactionScore,
    sourcePage: values.sourcePage ?? "",
    sourceRouteId: values.sourceRouteId,
    sourceLabel: values.sourceLabel,
    userId: values.userId,
    platform: values.platform ?? "h5",
    appVersion: values.appVersion ?? "1.0.0",
    deviceSummary: values.deviceSummary,
    screenshotAssets: cloneStateSnapshotArray(values.screenshotAssets ?? []),
    attachmentAssets: cloneStateSnapshotArray(values.attachmentAssets ?? []),
  };
}

export function createDefaultFeedbackState(
  options: CreateDefaultFeedbackStateOptions = {},
): FeedbackState {
  return {
    ...createDefaultFormPageState<FeedbackValues, FeedbackTicketDetailResponse>({
      title: options.title ?? "Feedback",
      ...(options.subtitle !== undefined ? { subtitle: options.subtitle } : {}),
      values: createDefaultFeedbackValues(options.values),
    }),
    categories: [],
    latestTicket: undefined,
    latestStatus: undefined,
    latestCategory: undefined,
    ticketList: undefined,
    selectedTicketId: undefined,
    recommendedFaqEntries: [],
    faqCatalog: [],
    supportEntries: [],
    supportEntry: undefined,
    revisitAction: undefined,
    queueDashboards: [],
    slaRules: [],
    handlingReport: undefined,
    serviceLoopSummary: undefined,
    serviceHint: undefined,
  };
}

export function applyFeedbackBootstrap(
  state: FeedbackState,
  bootstrap: FeedbackBootstrapResponse,
): FeedbackState {
  return {
    ...state,
    categories: cloneStateSnapshotArray(bootstrap.feedbackCategories),
    latestTicket: cloneOptionalStateSnapshot(bootstrap.latestTicket),
    latestStatus: cloneOptionalStateSnapshot(bootstrap.latestStatus),
    latestCategory: cloneOptionalStateSnapshot(bootstrap.latestCategory),
    ticketList: cloneOptionalStateSnapshot(bootstrap.ticketList),
    selectedTicketId: bootstrap.ticketList?.selectedTicketId ?? bootstrap.latestTicket?.ticketId,
    recommendedFaqEntries: cloneStateSnapshotArray(bootstrap.recommendedFaqEntries ?? []),
    faqCatalog: cloneStateSnapshotArray(bootstrap.faqCatalog ?? []),
    supportEntries: cloneStateSnapshotArray(bootstrap.supportEntries ?? []),
    supportEntry: cloneOptionalStateSnapshot(bootstrap.supportEntry),
    revisitAction: cloneOptionalStateSnapshot(bootstrap.latestStatus?.revisitAction),
    queueDashboards: cloneStateSnapshotArray(bootstrap.queueDashboards ?? []),
    slaRules: cloneStateSnapshotArray(bootstrap.slaRules ?? []),
    handlingReport: cloneOptionalStateSnapshot(bootstrap.latestStatus?.handlingReport),
    serviceLoopSummary: bootstrap.serviceLoopSummary,
    serviceHint:
      bootstrap.supportEntry?.label ??
      bootstrap.latestCategory?.supportEntry?.label ??
      bootstrap.latestCategory?.customerServiceEntryLabel ??
      bootstrap.feedbackCategories.find((category) => category.key === state.values.categoryKey)?.supportEntry?.label ??
      bootstrap.feedbackCategories.find((category) => category.key === state.values.categoryKey)?.customerServiceEntryLabel,
  };
}
