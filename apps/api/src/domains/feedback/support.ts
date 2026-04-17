import type {
  FeedbackBootstrapResponse,
  FeedbackCategory,
  FeedbackFaqEntry,
  FeedbackPriority,
  FeedbackRevisitAction,
  FeedbackStatus,
  FeedbackSupportEntry,
  FeedbackTicket,
  FeedbackTicketAssignee,
  FeedbackTicketDetailResponse,
  FeedbackTicketList,
  FeedbackTicketSla,
  FeedbackTicketSummary,
  FeedbackType,
  MessageBodyItem,
  SubmitFeedbackRequest,
} from "@minix/contracts";
import { APP_ROUTE_IDS } from "@minix/contracts";

import type { SessionRecord, UserState } from "../../types";
import { createMessageThread, sendThreadMessage } from "../messages/threads";

const FEEDBACK_FAQ_ENTRIES: Record<string, FeedbackFaqEntry> = {
  account: {
    entryId: "faq_account_recovery",
    title: "Account Recovery FAQ",
    summary: "Use the shared account recovery lane before opening a duplicate support ticket.",
    linkLabel: "Open FAQ",
    linkUrl: "https://example.test/faq/account-recovery",
  },
  payment: {
    entryId: "faq_payment_status",
    title: "Payment Status FAQ",
    summary: "Check order and payment status before escalating duplicate billing questions.",
    linkLabel: "Open FAQ",
    linkUrl: "https://example.test/faq/payment-status",
  },
  content: {
    entryId: "faq_content_review",
    title: "Content Review FAQ",
    summary: "Review content moderation expectations and publication timing.",
    linkLabel: "Open FAQ",
    linkUrl: "https://example.test/faq/content-review",
  },
};

function createFeedbackSupportEntry(
  label: string,
  summary: string,
  queueKey: string,
  queueLabel: string,
): FeedbackSupportEntry {
  return {
    entryId: `support_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    label,
    summary,
    channel: "messages",
    queueKey,
    queueLabel,
    handlerLabel: queueLabel,
    routeId: APP_ROUTE_IDS.messages,
    threadId: "thread_customer_service",
    updatedAt: "2026-04-07T18:10:00.000Z",
    enabled: true,
  };
}

function createFeedbackFaqEntries(keys: Array<keyof typeof FEEDBACK_FAQ_ENTRIES>): FeedbackFaqEntry[] {
  return keys.map((key) => ({ ...FEEDBACK_FAQ_ENTRIES[key]! }));
}

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  {
    key: "product_issue",
    label: "Product Issue",
    type: "issue_report",
    description: "Use for broken flows, rendering issues, or session recovery problems.",
    defaultPriority: "high",
    labels: ["product", "bug"],
    supportsAttachments: true,
    faqEntry: FEEDBACK_FAQ_ENTRIES.account!,
    faqEntries: createFeedbackFaqEntries(["account"]),
    customerServiceEntryLabel: "Open Support Desk",
    supportEntry: createFeedbackSupportEntry(
      "Open Support Desk",
      "Route this ticket into the shared customer-service inbox thread for follow-up.",
      "product_support",
      "Product Support",
    ),
    defaultQueueKey: "product_support",
    defaultQueueLabel: "Product Support",
  },
  {
    key: "improvement",
    label: "Suggestion",
    type: "suggestion",
    description: "Use for ideas, workflow improvements, and missing capabilities.",
    defaultPriority: "medium",
    labels: ["product", "idea"],
    supportsAttachments: true,
    customerServiceEntryLabel: "Open Suggestion Review Queue",
    supportEntry: createFeedbackSupportEntry(
      "Open Suggestion Review Queue",
      "Use the shared inbox thread to clarify product suggestions and expected improvements.",
      "suggestion_review",
      "Suggestion Review",
    ),
    defaultQueueKey: "suggestion_review",
    defaultQueueLabel: "Suggestion Review",
  },
  {
    key: "billing",
    label: "Payment Issue",
    type: "complaint",
    description: "Use for billing confusion, refunds, or duplicate payment concerns.",
    defaultPriority: "urgent",
    labels: ["payment", "billing"],
    supportsAttachments: true,
    faqEntry: FEEDBACK_FAQ_ENTRIES.payment!,
    faqEntries: createFeedbackFaqEntries(["payment"]),
    customerServiceEntryLabel: "Open Billing Support",
    supportEntry: createFeedbackSupportEntry(
      "Open Billing Support",
      "Continue billing follow-up in the shared customer-service thread with order context.",
      "billing_support",
      "Billing Support",
    ),
    defaultQueueKey: "billing_support",
    defaultQueueLabel: "Billing Support",
  },
  {
    key: "abuse",
    label: "Report Abuse",
    type: "abuse_report",
    description: "Use for harmful content, impersonation, or abuse reporting.",
    defaultPriority: "urgent",
    labels: ["abuse", "moderation"],
    supportsAttachments: true,
    faqEntry: FEEDBACK_FAQ_ENTRIES.content!,
    faqEntries: createFeedbackFaqEntries(["content"]),
    customerServiceEntryLabel: "Open Trust and Safety Desk",
    supportEntry: createFeedbackSupportEntry(
      "Open Trust And Safety Desk",
      "Escalate moderation follow-up into the reserved support thread used by the sample inbox.",
      "trust_safety",
      "Trust And Safety",
    ),
    defaultQueueKey: "trust_safety",
    defaultQueueLabel: "Trust And Safety",
  },
  {
    key: "satisfaction",
    label: "Satisfaction Survey",
    type: "satisfaction",
    description: "Use for structured service satisfaction feedback.",
    defaultPriority: "low",
    labels: ["survey", "quality"],
    supportsAttachments: false,
    customerServiceEntryLabel: "Open Service Quality Desk",
    supportEntry: createFeedbackSupportEntry(
      "Open Service Quality Desk",
      "Continue service-quality follow-up in the shared support inbox thread.",
      "service_quality",
      "Service Quality",
    ),
    defaultQueueKey: "service_quality",
    defaultQueueLabel: "Service Quality",
  },
];

function createDefaultFeedbackFaqCatalog(): FeedbackFaqEntry[] {
  return Object.values(FEEDBACK_FAQ_ENTRIES).map((entry) => ({
    ...entry,
    enabled: true,
    updatedAt: "2026-04-07T18:10:00.000Z",
    categoryKeys:
      entry.entryId === "faq_account_recovery"
        ? ["product_issue"]
        : entry.entryId === "faq_payment_status"
          ? ["billing"]
          : ["abuse"],
  }));
}

function createDefaultFeedbackSupportEntries(): FeedbackSupportEntry[] {
  return FEEDBACK_CATEGORIES.map((category) => ({
    ...(category.supportEntry
      ? structuredClone(category.supportEntry)
      : createFeedbackSupportEntry("Support", "Support", "general", "General Support")),
    ...(category.defaultQueueKey ? { queueKey: category.defaultQueueKey } : {}),
    ...(category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
  }));
}

export function ensureFeedbackRuntimeState(userState: UserState) {
  userState.feedbackTicketIds ??= [];
  if ((userState.feedbackFaqCatalog?.length ?? 0) === 0) {
    userState.feedbackFaqCatalog = createDefaultFeedbackFaqCatalog();
  }
  if ((userState.feedbackSupportEntries?.length ?? 0) === 0) {
    userState.feedbackSupportEntries = createDefaultFeedbackSupportEntries();
  }
}

export function cloneFeedbackCategory(category: FeedbackCategory): FeedbackCategory {
  return {
    ...category,
    labels: [...category.labels],
    ...(category.faqEntry ? { faqEntry: { ...category.faqEntry } } : {}),
    ...(category.faqEntries ? { faqEntries: category.faqEntries.map((entry) => ({ ...entry })) } : {}),
    ...(category.supportEntry ? { supportEntry: { ...category.supportEntry } } : {}),
  };
}

export function cloneFeedbackStatus(status: FeedbackStatus): FeedbackStatus {
  return {
    ...status,
    handlingProgress: [...status.handlingProgress],
    processingHistory: status.processingHistory.map((record) => ({ ...record })),
    ...(status.assignee ? { assignee: { ...status.assignee } } : {}),
    ...(status.sla ? { sla: { ...status.sla } } : {}),
    ...(status.faqEntry ? { faqEntry: { ...status.faqEntry } } : {}),
    ...(status.faqEntries ? { faqEntries: status.faqEntries.map((entry) => ({ ...entry })) } : {}),
    ...(status.supportEntry ? { supportEntry: { ...status.supportEntry } } : {}),
    ...(status.revisitAction ? { revisitAction: { ...status.revisitAction } } : {}),
  };
}

export function resolveFeedbackCategory(categoryKey: string, type: FeedbackType): FeedbackCategory {
  const fallbackCategory = FEEDBACK_CATEGORIES[0];
  return (
    FEEDBACK_CATEGORIES.find((category) => category.key === categoryKey) ??
    FEEDBACK_CATEGORIES.find((category) => category.type === type) ??
    fallbackCategory!
  );
}

export function shiftIsoMinutes(timestamp: string, minutes: number): string {
  return new Date(new Date(timestamp).getTime() + minutes * 60_000).toISOString();
}

function createFeedbackRevisitAction(
  ticketId: string,
  category: FeedbackCategory,
  state: FeedbackStatus["state"],
  revisitRequired: boolean,
): FeedbackRevisitAction {
  return {
    ticketId,
    label:
      state === "waiting_user"
        ? "Reply With Requested Details"
        : state === "resolved" || state === "closed"
          ? "Request Follow-up"
          : "Add More Context",
    summary:
      revisitRequired
        ? "The support lane is waiting for more context before closing the ticket."
        : `Continue follow-up for ${category.label.toLowerCase()} in the shared support lane.`,
    enabled: true,
    ...(category.supportEntry?.routeId ? { routeId: category.supportEntry.routeId } : {}),
    ...(category.supportEntry?.threadId ? { threadId: category.supportEntry.threadId } : {}),
    suggestedReply:
      state === "waiting_user"
        ? "I am following up with the details you requested."
        : `Following up on ${ticketId}: please review the latest update.`,
  };
}

export function createFeedbackStatus(
  ticketId: string,
  state: FeedbackStatus["state"],
  category: FeedbackCategory,
  revisitRequired: boolean,
  createdAt: string,
  options: {
    queueKey?: string;
    queueLabel?: string;
    assignee?: FeedbackTicketAssignee;
    sla?: FeedbackTicketSla;
    supportEntry?: FeedbackSupportEntry;
  } = {},
): FeedbackStatus {
  const history: FeedbackStatus["processingHistory"] = [
    {
      recordedAt: createdAt,
      actorLabel: "System Intake",
      actorRole: "system",
      actionLabel: "Ticket created",
      note: "Feedback entered the shared support loop foundation.",
      state: "submitted" as const,
    },
  ];

  if (state === "triaged" || state === "in_progress" || state === "waiting_user" || state === "resolved" || state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 10),
      actorLabel: "Support Queue",
      actorRole: "support",
      actionLabel: "Ticket triaged",
      note: "The shared support lane assigned the ticket to the right queue.",
      state: "triaged",
    });
  }

  if (state === "in_progress" || state === "waiting_user" || state === "resolved" || state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 25),
      actorLabel: "Support Specialist",
      actorRole: "support",
      actionLabel: "Support review started",
      note: "A support agent started reviewing the provided context and attachments.",
      state: "in_progress",
    });
  }

  if (state === "waiting_user") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 35),
      actorLabel: "Support Specialist",
      actorRole: "support",
      actionLabel: "Additional context requested",
      note: "The support lane asked for more detail before closing the loop.",
      state: "waiting_user",
    });
  }

  if (state === "resolved" || state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 45),
      actorLabel: "Support Specialist",
      actorRole: "support",
      actionLabel: "Resolution posted",
      note: "A sample resolution was attached to the support loop for follow-up confirmation.",
      state: "resolved",
    });
  }

  if (state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 60),
      actorLabel: "System Intake",
      actorRole: "system",
      actionLabel: "Ticket closed",
      note: "The feedback service loop completed without additional follow-up.",
      state: "closed",
    });
  }

  return {
    state,
    label:
      state === "submitted"
        ? "Submitted"
        : state === "triaged"
          ? "Triaged"
          : state === "in_progress"
            ? "In Progress"
            : state === "waiting_user"
              ? "Waiting for User"
              : state === "resolved"
                ? "Resolved"
                : "Closed",
    progressLabel:
      state === "submitted"
        ? "Queued for initial review"
        : state === "triaged"
          ? "Assigned to the right support lane"
          : state === "in_progress"
            ? "Being processed by support"
            : state === "waiting_user"
              ? "Waiting for more user context"
              : state === "resolved"
                ? "Handled and ready for confirmation"
                : "Service loop complete",
    nextStepLabel:
      state === "waiting_user"
        ? "Reply from the support entry to continue this ticket."
        : state === "resolved"
          ? "Confirm whether the proposed resolution is sufficient."
          : state === "closed"
            ? "Open a follow-up if the issue returns."
            : "Use the support entry if you need to add more context.",
    revisitRequired,
    ...(category.faqEntry ? { faqEntry: { ...category.faqEntry } } : {}),
    ...(category.faqEntries ? { faqEntries: category.faqEntries.map((entry) => ({ ...entry })) } : {}),
    ...(category.customerServiceEntryLabel ? { customerServiceEntryLabel: category.customerServiceEntryLabel } : {}),
    ...(options.supportEntry
      ? { supportEntry: { ...options.supportEntry } }
      : category.supportEntry
        ? { supportEntry: { ...category.supportEntry } }
        : {}),
    ...(options.queueKey ? { queueKey: options.queueKey } : category.defaultQueueKey ? { queueKey: category.defaultQueueKey } : {}),
    ...(options.queueLabel ? { queueLabel: options.queueLabel } : category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
    ...(options.assignee ? { assignee: { ...options.assignee } } : {}),
    ...(options.sla ? { sla: { ...options.sla } } : {}),
    revisitAction: createFeedbackRevisitAction(ticketId, category, state, revisitRequired),
    handlingProgress: [
      "Submitted to intake",
      "Routed to support lane",
      "Support review in progress",
      revisitRequired ? "Waiting for your reply" : "Waiting for support confirmation",
      "Resolved or closed",
    ],
    processingHistory: history,
  };
}

export function createFeedbackTicketResponse(
  ticket: FeedbackTicket,
  category: FeedbackCategory,
  status: FeedbackStatus,
): FeedbackTicketDetailResponse {
  return {
    feedbackTicket: structuredClone(ticket),
    feedbackCategory: cloneFeedbackCategory(category),
    feedbackStatus: cloneFeedbackStatus(status),
  };
}

export function cloneFeedbackTicket(ticket: FeedbackTicket): FeedbackTicket {
  return {
    ...ticket,
    labels: [...ticket.labels],
    ...(ticket.assignee ? { assignee: { ...ticket.assignee } } : {}),
    ...(ticket.sla ? { sla: { ...ticket.sla } } : {}),
    context: {
      ...ticket.context,
      ...(ticket.context.sourceContext ? { sourceContext: { ...ticket.context.sourceContext } } : {}),
      ...(ticket.context.actorContext ? { actorContext: { ...ticket.context.actorContext } } : {}),
      screenshotAssets: ticket.context.screenshotAssets.map((asset) => structuredClone(asset)),
      attachmentAssets: ticket.context.attachmentAssets.map((asset) => structuredClone(asset)),
    },
  };
}

function createFeedbackTicketSummary(detail: FeedbackTicketDetailResponse): FeedbackTicketSummary {
  return {
    ticketId: detail.feedbackTicket.ticketId,
    title: detail.feedbackTicket.title,
    categoryKey: detail.feedbackTicket.categoryKey,
    categoryLabel: detail.feedbackCategory.label,
    type: detail.feedbackTicket.type,
    state: detail.feedbackStatus.state,
    priority: detail.feedbackTicket.priority,
    labels: [...detail.feedbackTicket.labels],
    revisitRequired: detail.feedbackStatus.revisitRequired,
    ...(detail.feedbackStatus.queueKey ? { queueKey: detail.feedbackStatus.queueKey } : {}),
    ...(detail.feedbackStatus.queueLabel ? { queueLabel: detail.feedbackStatus.queueLabel } : {}),
    ...(detail.feedbackStatus.assignee ? { assignee: { ...detail.feedbackStatus.assignee } } : {}),
    ...(detail.feedbackStatus.sla ? { sla: { ...detail.feedbackStatus.sla } } : {}),
    ...(detail.feedbackTicket.supportThreadId ? { supportThreadId: detail.feedbackTicket.supportThreadId } : {}),
    lastUpdatedAt: detail.feedbackTicket.updatedAt,
  };
}

export function createFeedbackTicketList(
  userState: UserState,
  input: {
    page?: number;
    pageSize?: number;
    state?: FeedbackStatus["state"] | "all";
    categoryKey?: string;
    keyword?: string;
  } = {},
): FeedbackTicketList {
  ensureFeedbackRuntimeState(userState);
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 10;
  const keyword = input.keyword?.trim().toLowerCase();
  const filteredIds = userState.feedbackTicketIds.filter((ticketId) => {
    const detail = userState.feedbackDetailsById[ticketId];
    if (!detail) {
      return false;
    }
    if (input.state && input.state !== "all" && detail.feedbackStatus.state !== input.state) {
      return false;
    }
    if (input.categoryKey && detail.feedbackTicket.categoryKey !== input.categoryKey) {
      return false;
    }
    if (keyword) {
      const haystack =
        `${detail.feedbackTicket.title} ${detail.feedbackTicket.description} ${detail.feedbackTicket.labels.join(" ")}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }
    return true;
  });
  const total = filteredIds.length;
  const start = Math.max(0, (page - 1) * pageSize);
  const items = filteredIds
    .slice(start, start + pageSize)
    .map((ticketId) => createFeedbackTicketSummary(userState.feedbackDetailsById[ticketId]!));

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: start + items.length < total,
    ...(userState.latestFeedbackTicketId ? { selectedTicketId: userState.latestFeedbackTicketId } : {}),
  };
}

export function cloneFeedbackFaqCatalog(entries: FeedbackFaqEntry[]): FeedbackFaqEntry[] {
  return entries.map((entry) => ({
    ...entry,
    ...(entry.categoryKeys ? { categoryKeys: [...entry.categoryKeys] } : {}),
  }));
}

export function cloneFeedbackSupportEntries(entries: FeedbackSupportEntry[]): FeedbackSupportEntry[] {
  return entries.map((entry) => ({ ...entry }));
}

export function appendSupportMessageToThread(
  userState: UserState,
  input: {
    threadId: string;
    senderLabel: string;
    body: string;
    createdAt: string;
  },
) {
  const record = userState.threadRecordsById[input.threadId];
  if (!record) {
    return null;
  }

  const nextMessage: MessageBodyItem = {
    messageId: `msg_${crypto.randomUUID()}`,
    threadId: input.threadId,
    direction: "inbound",
    senderRole: "support",
    senderLabel: input.senderLabel,
    body: input.body,
    createdAt: input.createdAt,
    deliveryStatus: "delivered",
    deliveredAt: input.createdAt,
    attemptCount: 1,
    retryable: false,
    touchpoints: structuredClone(record.thread.touchpoints),
  };
  record.messages = [...structuredClone(record.messages), nextMessage];
  record.updatedAt = input.createdAt;
  userState.threadMessagesByThreadId[input.threadId] = structuredClone(record.messages);
  return nextMessage;
}

export function ensureFeedbackSupportThread(
  userState: UserState,
  ticketId: string,
  category: FeedbackCategory,
  description: string,
  now: string,
  context?: {
    sourceContext?: SubmitFeedbackRequest["context"]["sourceContext"];
    actorContext?: SubmitFeedbackRequest["context"]["actorContext"];
  },
): FeedbackSupportEntry | undefined {
  const seedSupportEntry = category.supportEntry;
  if (!seedSupportEntry) {
    return undefined;
  }

  const threadResponse = createMessageThread(
    userState,
    {
      type: "customer_service",
      title: `${category.label}: ${ticketId}`,
      sourceTicketId: ticketId,
      ...(context?.sourceContext ? { sourceContext: context.sourceContext } : {}),
      ...(context?.actorContext ? { actorContext: context.actorContext } : {}),
    },
    now,
  );
  sendThreadMessage(userState, {
    threadId: threadResponse.messageThread.threadId,
    body: `[${ticketId}] ${description}`,
  });
  return {
    ...seedSupportEntry,
    ...(category.defaultQueueKey ? { queueKey: category.defaultQueueKey } : {}),
    ...(category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
    threadId: threadResponse.messageThread.threadId,
    updatedAt: now,
    enabled: true,
  };
}

export function createDefaultFeedbackContext(
  session: SessionRecord,
  request: SubmitFeedbackRequest["context"],
): FeedbackTicket["context"] {
  return {
    sourcePage: request.sourcePage,
    ...(request.sourceRouteId ? { sourceRouteId: request.sourceRouteId } : {}),
    ...(request.sourceLabel ? { sourceLabel: request.sourceLabel } : {}),
    userId: request.userId ?? session.userId,
    platform: request.platform,
    appVersion: request.appVersion,
    ...(request.deviceSummary ? { deviceSummary: request.deviceSummary } : {}),
    sourceContext: request.sourceContext ?? {
      pagePath: request.sourcePage,
      ...(request.sourceRouteId ? { routeId: request.sourceRouteId } : {}),
      ...(request.sourceLabel ? { label: request.sourceLabel } : {}),
    },
    actorContext: request.actorContext ?? {
      userId: request.userId ?? session.userId,
      platform: request.platform,
      appVersion: request.appVersion,
      ...(request.deviceSummary ? { deviceSummary: request.deviceSummary } : {}),
    },
    screenshotAssets: request.screenshotAssets.map((asset) => structuredClone(asset)),
    attachmentAssets: request.attachmentAssets.map((asset) => structuredClone(asset)),
  };
}

export function createFeedbackBootstrapResponse(userState: UserState): FeedbackBootstrapResponse {
  ensureFeedbackRuntimeState(userState);
  const latestDetail = userState.latestFeedbackTicketId
    ? userState.feedbackDetailsById[userState.latestFeedbackTicketId]
    : undefined;
  const referenceCategory = latestDetail?.feedbackCategory ?? FEEDBACK_CATEGORIES[0];
  const serviceLoopSummary =
    latestDetail?.feedbackStatus.nextStepLabel ?? latestDetail?.feedbackStatus.progressLabel ?? referenceCategory?.description;

  return {
    feedbackCategories: FEEDBACK_CATEGORIES.map(cloneFeedbackCategory),
    ticketList: createFeedbackTicketList(userState, { page: 1, pageSize: 10 }),
    recommendedFaqEntries:
      referenceCategory?.faqEntries?.map((entry) => ({ ...entry })) ??
      (referenceCategory?.faqEntry ? [{ ...referenceCategory.faqEntry }] : []),
    faqCatalog: cloneFeedbackFaqCatalog(userState.feedbackFaqCatalog),
    supportEntries: cloneFeedbackSupportEntries(userState.feedbackSupportEntries),
    ...(latestDetail?.feedbackStatus.supportEntry
      ? { supportEntry: { ...latestDetail.feedbackStatus.supportEntry } }
      : referenceCategory?.supportEntry
        ? { supportEntry: { ...referenceCategory.supportEntry } }
        : {}),
    ...(serviceLoopSummary !== undefined ? { serviceLoopSummary } : {}),
    ...(latestDetail
      ? {
          latestTicket: structuredClone(latestDetail.feedbackTicket),
          latestStatus: cloneFeedbackStatus(latestDetail.feedbackStatus),
          latestCategory: cloneFeedbackCategory(latestDetail.feedbackCategory),
        }
      : {}),
  };
}
