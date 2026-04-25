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
import { createDefaultFormPageState, type FormPageState } from "@minix/core";

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
    screenshotAssets: values.screenshotAssets ? structuredClone(values.screenshotAssets) : [],
    attachmentAssets: values.attachmentAssets ? structuredClone(values.attachmentAssets) : [],
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
    categories: bootstrap.feedbackCategories.map((category) => structuredClone(category)),
    latestTicket: bootstrap.latestTicket ? structuredClone(bootstrap.latestTicket) : undefined,
    latestStatus: bootstrap.latestStatus ? structuredClone(bootstrap.latestStatus) : undefined,
    latestCategory: bootstrap.latestCategory ? structuredClone(bootstrap.latestCategory) : undefined,
    ticketList: bootstrap.ticketList ? structuredClone(bootstrap.ticketList) : undefined,
    selectedTicketId: bootstrap.ticketList?.selectedTicketId ?? bootstrap.latestTicket?.ticketId,
    recommendedFaqEntries: bootstrap.recommendedFaqEntries
      ? bootstrap.recommendedFaqEntries.map((entry) => structuredClone(entry))
      : [],
    faqCatalog: bootstrap.faqCatalog ? bootstrap.faqCatalog.map((entry) => structuredClone(entry)) : [],
    supportEntries: bootstrap.supportEntries ? bootstrap.supportEntries.map((entry) => structuredClone(entry)) : [],
    supportEntry: bootstrap.supportEntry ? structuredClone(bootstrap.supportEntry) : undefined,
    revisitAction: bootstrap.latestStatus?.revisitAction ? structuredClone(bootstrap.latestStatus.revisitAction) : undefined,
    queueDashboards: bootstrap.queueDashboards ? bootstrap.queueDashboards.map((dashboard) => structuredClone(dashboard)) : [],
    slaRules: bootstrap.slaRules ? bootstrap.slaRules.map((rule) => structuredClone(rule)) : [],
    handlingReport: bootstrap.latestStatus?.handlingReport ? structuredClone(bootstrap.latestStatus.handlingReport) : undefined,
    serviceLoopSummary: bootstrap.serviceLoopSummary,
    serviceHint:
      bootstrap.supportEntry?.label ??
      bootstrap.latestCategory?.supportEntry?.label ??
      bootstrap.latestCategory?.customerServiceEntryLabel ??
      bootstrap.feedbackCategories.find((category) => category.key === state.values.categoryKey)?.supportEntry?.label ??
      bootstrap.feedbackCategories.find((category) => category.key === state.values.categoryKey)?.customerServiceEntryLabel,
  };
}
