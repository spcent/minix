import type { UploadAsset } from "./upload";
import type { AppRouteId } from "../routes/app";

export const FEEDBACK_TYPES = ["issue_report", "suggestion", "complaint", "abuse_report", "satisfaction"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number];

export const FEEDBACK_TICKET_STATES = ["submitted", "triaged", "in_progress", "waiting_user", "resolved", "closed"] as const;
export type FeedbackTicketState = (typeof FEEDBACK_TICKET_STATES)[number];

export interface FeedbackFaqEntry {
  entryId: string;
  title: string;
  summary: string;
  linkLabel?: string;
  linkUrl?: string;
}

export interface FeedbackSupportEntry {
  entryId: string;
  label: string;
  summary: string;
  channel: "messages" | "settings";
  routeId?: AppRouteId;
  threadId?: string;
}

export interface FeedbackRevisitAction {
  ticketId: string;
  label: string;
  summary: string;
  enabled: boolean;
  routeId?: AppRouteId;
  threadId?: string;
  suggestedReply?: string;
}

export interface FeedbackProcessingRecord {
  recordedAt: string;
  actorLabel: string;
  actionLabel: string;
  note?: string;
  state: FeedbackTicketState;
}

export interface FeedbackStatus {
  state: FeedbackTicketState;
  label: string;
  progressLabel: string;
  revisitRequired: boolean;
  nextStepLabel?: string;
  faqEntry?: FeedbackFaqEntry;
  faqEntries?: FeedbackFaqEntry[];
  customerServiceEntryLabel?: string;
  supportEntry?: FeedbackSupportEntry;
  revisitAction?: FeedbackRevisitAction;
  handlingProgress: string[];
  processingHistory: FeedbackProcessingRecord[];
}

export interface FeedbackCategory {
  key: string;
  label: string;
  type: FeedbackType;
  description?: string;
  defaultPriority: FeedbackPriority;
  labels: string[];
  supportsAttachments: boolean;
  faqEntry?: FeedbackFaqEntry;
  faqEntries?: FeedbackFaqEntry[];
  customerServiceEntryLabel?: string;
  supportEntry?: FeedbackSupportEntry;
}

export interface FeedbackContextCapture {
  sourcePage: string;
  sourceRouteId?: string;
  sourceLabel?: string;
  userId?: string;
  platform: string;
  appVersion: string;
  deviceSummary?: string;
  screenshotAssets: UploadAsset[];
  attachmentAssets: UploadAsset[];
}

export interface FeedbackTicket {
  ticketId: string;
  type: FeedbackType;
  categoryKey: string;
  title: string;
  description: string;
  priority: FeedbackPriority;
  labels: string[];
  revisitRequested: boolean;
  satisfactionScore?: number;
  createdAt: string;
  updatedAt: string;
  context: FeedbackContextCapture;
}

export interface FeedbackTicketDetailResponse {
  feedbackTicket: FeedbackTicket;
  feedbackCategory: FeedbackCategory;
  feedbackStatus: FeedbackStatus;
}

export interface FeedbackBootstrapResponse {
  feedbackCategories: FeedbackCategory[];
  latestTicket?: FeedbackTicket;
  latestStatus?: FeedbackStatus;
  latestCategory?: FeedbackCategory;
  recommendedFaqEntries?: FeedbackFaqEntry[];
  supportEntry?: FeedbackSupportEntry;
  serviceLoopSummary?: string;
}

export interface SubmitFeedbackRequest {
  type: FeedbackType;
  categoryKey: string;
  title: string;
  description: string;
  priority?: FeedbackPriority;
  labels?: string[];
  revisitRequested?: boolean;
  satisfactionScore?: number;
  context: FeedbackContextCapture;
}

export interface SubmitFeedbackResponse extends FeedbackTicketDetailResponse {}

export interface FeedbackRevisitRequest {
  ticketId: string;
  userMessage?: string;
}

export interface FeedbackRevisitResponse extends FeedbackTicketDetailResponse {}
