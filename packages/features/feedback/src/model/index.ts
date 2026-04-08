import type {
  FeedbackBootstrapResponse,
  FeedbackCategory,
  FeedbackTicket,
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

export type FeedbackState = FormPageState<FeedbackValues, FeedbackTicketDetailResponse> & {
  categories: FeedbackCategory[];
  latestTicket: FeedbackTicket | undefined;
  latestStatus: FeedbackStatus | undefined;
  latestCategory: FeedbackCategory | undefined;
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
    appVersion: values.appVersion ?? "0.1.0",
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
    serviceHint:
      bootstrap.latestCategory?.customerServiceEntryLabel ??
      bootstrap.feedbackCategories.find((category) => category.key === state.values.categoryKey)?.customerServiceEntryLabel,
  };
}
