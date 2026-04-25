import type { UploadAsset } from "./upload";
import type { AppRouteId } from "../routes/app";
import type { ActorContextSnapshot, SourceContextSnapshot } from "./context";

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
  categoryKeys?: string[];
  updatedAt?: string;
  enabled?: boolean;
}

export interface FeedbackSupportEntry {
  entryId: string;
  label: string;
  summary: string;
  channel: "messages" | "settings";
  queueKey?: string;
  queueLabel?: string;
  handlerLabel?: string;
  routeId?: AppRouteId;
  threadId?: string;
  threadSummary?: string;
  supportLoopSummary?: string;
  updatedAt?: string;
  enabled?: boolean;
}

export interface FeedbackTicketAssignee {
  userId: string;
  label: string;
  teamLabel?: string;
  assignedAt?: string;
}

export interface FeedbackTicketSla {
  policyKey: string;
  label: string;
  deadlineAt: string;
  breached: boolean;
  updatedAt?: string;
}

export interface FeedbackSlaRule {
  policyKey: string;
  label: string;
  responseMinutes: number;
  resolutionMinutes: number;
  ruleSummary: string;
}

export interface FeedbackQueueDashboard {
  queueKey: string;
  queueLabel: string;
  openCount: number;
  waitingUserCount: number;
  breachedSlaCount: number;
  urgentCount: number;
  dashboardSummary: string;
}

export interface FeedbackSupportHandoff {
  channel: "messages" | "settings";
  transport: "messages_touchpoint" | "settings_entry";
  queueKey?: string;
  queueLabel?: string;
  threadId?: string;
  handoffSummary: string;
}

export interface FeedbackHandlingReport {
  ticketId: string;
  state: FeedbackTicketState;
  queueKey?: string;
  slaBreached: boolean;
  processingHistoryCount: number;
  latestActionLabel?: string;
  reportSummary: string;
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
  actorRole?: "system" | "user" | "support";
  actorUserId?: string;
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
  supportLoopSummary?: string;
  operatorActionSummary?: string;
  sharedThreadSummary?: string;
  faqEntry?: FeedbackFaqEntry;
  faqEntries?: FeedbackFaqEntry[];
  customerServiceEntryLabel?: string;
  supportEntry?: FeedbackSupportEntry;
  queueKey?: string;
  queueLabel?: string;
  assignee?: FeedbackTicketAssignee;
  sla?: FeedbackTicketSla;
  slaRule?: FeedbackSlaRule;
  queueDashboard?: FeedbackQueueDashboard;
  supportHandoff?: FeedbackSupportHandoff;
  handlingReport?: FeedbackHandlingReport;
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
  defaultQueueKey?: string;
  defaultQueueLabel?: string;
}

export interface FeedbackContextCapture {
  sourcePage: string;
  sourceRouteId?: string;
  sourceLabel?: string;
  userId?: string;
  platform: string;
  appVersion: string;
  deviceSummary?: string;
  sourceContext?: SourceContextSnapshot;
  actorContext?: ActorContextSnapshot;
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
  queueKey?: string;
  queueLabel?: string;
  assignee?: FeedbackTicketAssignee;
  sla?: FeedbackTicketSla;
  supportThreadId?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  context: FeedbackContextCapture;
}

export interface FeedbackTicketSummary {
  ticketId: string;
  title: string;
  categoryKey: string;
  categoryLabel: string;
  type: FeedbackType;
  state: FeedbackTicketState;
  priority: FeedbackPriority;
  labels: string[];
  revisitRequired: boolean;
  queueKey?: string;
  queueLabel?: string;
  assignee?: FeedbackTicketAssignee;
  sla?: FeedbackTicketSla;
  supportThreadId?: string;
  lastUpdatedAt: string;
}

export interface FeedbackTicketList {
  items: FeedbackTicketSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  selectedTicketId?: string;
}

export interface FeedbackTicketDetailResponse {
  feedbackTicket: FeedbackTicket;
  feedbackCategory: FeedbackCategory;
  feedbackStatus: FeedbackStatus;
}

export interface FeedbackBootstrapResponse {
  feedbackCategories: FeedbackCategory[];
  ticketList?: FeedbackTicketList;
  latestTicket?: FeedbackTicket;
  latestStatus?: FeedbackStatus;
  latestCategory?: FeedbackCategory;
  recommendedFaqEntries?: FeedbackFaqEntry[];
  faqCatalog?: FeedbackFaqEntry[];
  supportEntries?: FeedbackSupportEntry[];
  supportEntry?: FeedbackSupportEntry;
  serviceLoopSummary?: string;
  queueDashboards?: FeedbackQueueDashboard[];
  slaRules?: FeedbackSlaRule[];
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

export interface ListFeedbackTicketsRequest {
  page?: number;
  pageSize?: number;
  state?: FeedbackTicketState | "all";
  categoryKey?: string;
  keyword?: string;
}

export interface ListFeedbackTicketsResponse {
  ticketList: FeedbackTicketList;
  faqCatalog: FeedbackFaqEntry[];
  supportEntries: FeedbackSupportEntry[];
  queueDashboards?: FeedbackQueueDashboard[];
  slaRules?: FeedbackSlaRule[];
}

export interface FeedbackRevisitRequest {
  ticketId: string;
  userMessage?: string;
}

export interface FeedbackRevisitResponse extends FeedbackTicketDetailResponse {}

export interface FeedbackTicketActionRequest {
  ticketId: string;
  state?: Extract<FeedbackTicketState, "triaged" | "in_progress" | "waiting_user" | "resolved" | "closed">;
  priority?: FeedbackPriority;
  labels?: string[];
  assignee?: FeedbackTicketAssignee;
  queueKey?: string;
  queueLabel?: string;
  sla?: FeedbackTicketSla;
  note?: string;
  supportReply?: string;
}

export interface FeedbackTicketActionResponse extends FeedbackTicketDetailResponse {
  ticketList: FeedbackTicketList;
}
