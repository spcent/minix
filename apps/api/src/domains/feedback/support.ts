import type {
  FeedbackBootstrapResponse,
  FeedbackCategory,
  FeedbackFaqEntry,
  FeedbackHandlingReport,
  FeedbackPriority,
  FeedbackQueueDashboard,
  FeedbackRevisitAction,
  FeedbackSlaRule,
  FeedbackStatus,
  FeedbackSupportEntry,
  FeedbackSupportHandoff,
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
import { createApiPaginationWindow } from "../pagination";
import {
  createMessageThread,
  createSharedSupportLoopSummary,
  createSharedSupportThreadSummary,
  createSupportOperatorActionSummary,
  sendThreadMessage,
} from "../messages/threads";
import { cloneDomainSnapshot, cloneDomainSnapshotArray, cloneOptionalDomainSnapshot } from "../snapshot";

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
    threadSummary: createSharedSupportThreadSummary({
      threadId: "thread_customer_service",
      queueLabel,
      assigneeLabel: queueLabel,
    }),
    supportLoopSummary: createSharedSupportLoopSummary({
      state: "resolved",
      queueLabel,
    }),
    updatedAt: "2026-04-07T18:10:00.000Z",
    enabled: true,
  };
}

function createFeedbackFaqEntries(keys: Array<keyof typeof FEEDBACK_FAQ_ENTRIES>): FeedbackFaqEntry[] {
  return keys.map((key) => cloneDomainSnapshot(FEEDBACK_FAQ_ENTRIES[key]!));
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
      ? cloneDomainSnapshot(category.supportEntry)
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
    ...(category.faqEntry ? { faqEntry: cloneDomainSnapshot(category.faqEntry) } : {}),
    ...(category.faqEntries ? { faqEntries: cloneDomainSnapshotArray(category.faqEntries) } : {}),
    ...(category.supportEntry ? { supportEntry: cloneDomainSnapshot(category.supportEntry) } : {}),
  };
}

export function cloneFeedbackStatus(status: FeedbackStatus): FeedbackStatus {
  return {
    ...status,
    handlingProgress: [...status.handlingProgress],
    processingHistory: cloneDomainSnapshotArray(status.processingHistory),
    ...(status.assignee ? { assignee: cloneDomainSnapshot(status.assignee) } : {}),
    ...(status.sla ? { sla: cloneDomainSnapshot(status.sla) } : {}),
    ...(status.slaRule ? { slaRule: cloneDomainSnapshot(status.slaRule) } : {}),
    ...(status.faqEntry ? { faqEntry: cloneDomainSnapshot(status.faqEntry) } : {}),
    ...(status.faqEntries ? { faqEntries: cloneDomainSnapshotArray(status.faqEntries) } : {}),
    ...(status.supportEntry ? { supportEntry: cloneDomainSnapshot(status.supportEntry) } : {}),
    ...(status.queueDashboard ? { queueDashboard: cloneDomainSnapshot(status.queueDashboard) } : {}),
    ...(status.supportHandoff ? { supportHandoff: cloneDomainSnapshot(status.supportHandoff) } : {}),
    ...(status.handlingReport ? { handlingReport: cloneDomainSnapshot(status.handlingReport) } : {}),
    ...(status.revisitAction ? { revisitAction: cloneDomainSnapshot(status.revisitAction) } : {}),
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

function createFeedbackSlaRule(category: FeedbackCategory, sla?: FeedbackTicketSla): FeedbackSlaRule {
  const responseMinutes = category.defaultPriority === "urgent" ? 30 : category.defaultPriority === "high" ? 60 : 240;
  const resolutionMinutes = category.defaultPriority === "urgent" ? 240 : category.defaultPriority === "high" ? 480 : 1440;
  const policyKey = sla?.policyKey ?? `${category.key}_default_sla`;
  return {
    policyKey,
    label: sla?.label ?? `${category.label} SLA`,
    responseMinutes,
    resolutionMinutes,
    ruleSummary: `${category.label} uses ${responseMinutes} minute first response and ${resolutionMinutes} minute resolution targets.`,
  };
}

function createFeedbackQueueDashboard(input: {
  queueKey: string;
  queueLabel: string;
  summaries: FeedbackTicketSummary[];
}): FeedbackQueueDashboard {
  const openItems = input.summaries.filter((item) => item.state !== "closed" && item.state !== "resolved");
  const waitingUserCount = input.summaries.filter((item) => item.state === "waiting_user").length;
  const breachedSlaCount = input.summaries.filter((item) => item.sla?.breached).length;
  const urgentCount = input.summaries.filter((item) => item.priority === "urgent").length;
  return {
    queueKey: input.queueKey,
    queueLabel: input.queueLabel,
    openCount: openItems.length,
    waitingUserCount,
    breachedSlaCount,
    urgentCount,
    dashboardSummary: `${input.queueLabel} has ${openItems.length} open ticket${openItems.length === 1 ? "" : "s"}, ${waitingUserCount} waiting on users, and ${breachedSlaCount} SLA breach${breachedSlaCount === 1 ? "" : "es"}.`,
  };
}

function createFeedbackSupportHandoff(input: {
  supportEntry?: FeedbackSupportEntry;
  queueKey?: string;
  queueLabel: string;
}): FeedbackSupportHandoff {
  const channel = input.supportEntry?.channel ?? "messages";
  const transport = channel === "messages" ? "messages_touchpoint" : "settings_entry";
  return {
    channel,
    transport,
    ...(input.queueKey ? { queueKey: input.queueKey } : input.supportEntry?.queueKey ? { queueKey: input.supportEntry.queueKey } : {}),
    queueLabel: input.queueLabel,
    ...(input.supportEntry?.threadId ? { threadId: input.supportEntry.threadId } : {}),
    handoffSummary:
      transport === "messages_touchpoint"
        ? `${input.queueLabel} handoff stays on the shared messages touchpoint model.`
        : `${input.queueLabel} handoff stays on the settings support entry.`,
  };
}

export function createFeedbackHandlingReport(input: {
  ticketId: string;
  state: FeedbackStatus["state"];
  queueKey?: string;
  sla?: FeedbackTicketSla;
  history: FeedbackStatus["processingHistory"];
}): FeedbackHandlingReport {
  const latestAction = input.history.at(-1)?.actionLabel;
  return {
    ticketId: input.ticketId,
    state: input.state,
    ...(input.queueKey ? { queueKey: input.queueKey } : {}),
    slaBreached: input.sla?.breached ?? false,
    processingHistoryCount: input.history.length,
    ...(latestAction ? { latestActionLabel: latestAction } : {}),
    reportSummary: `${input.ticketId} is ${input.state}; ${input.history.length} processing event${input.history.length === 1 ? "" : "s"} recorded.`,
  };
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
  const queueLabel = options.queueLabel ?? category.defaultQueueLabel ?? "General Support";
  const supportEntry = options.supportEntry ?? category.supportEntry;
  const assigneeLabel = options.assignee?.label ?? supportEntry?.handlerLabel;
  const threadSummary = createSharedSupportThreadSummary({
    ...(supportEntry?.threadId ? { threadId: supportEntry.threadId } : {}),
    queueLabel,
    ...(assigneeLabel ? { assigneeLabel } : {}),
  });
  const supportLoopSummary = createSharedSupportLoopSummary({
    state:
      state === "submitted"
        ? "unassigned"
        : state === "triaged" || state === "in_progress"
          ? "assigned"
          : state === "waiting_user"
            ? "waiting_user"
            : state === "resolved"
              ? "resolved"
              : "closed",
    queueLabel,
  });
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

  const queueKey = options.queueKey ?? category.defaultQueueKey;
  const slaRule = createFeedbackSlaRule(category, options.sla);
  const queueDashboard = createFeedbackQueueDashboard({
    queueKey: queueKey ?? "general",
    queueLabel,
    summaries: [
      {
        ticketId,
        title: `${category.label} ticket`,
        categoryKey: category.key,
        categoryLabel: category.label,
        type: category.type,
        state,
        priority: category.defaultPriority,
        labels: [...category.labels],
        revisitRequired,
        ...(queueKey ? { queueKey } : {}),
        queueLabel,
        ...(options.assignee ? { assignee: { ...options.assignee } } : {}),
        ...(options.sla ? { sla: { ...options.sla } } : {}),
        lastUpdatedAt: createdAt,
      },
    ],
  });
  const supportHandoff = createFeedbackSupportHandoff({
    ...(supportEntry ? { supportEntry } : {}),
    ...(queueKey ? { queueKey } : {}),
    queueLabel,
  });
  const handlingReport = createFeedbackHandlingReport({
    ticketId,
    state,
    ...(queueKey ? { queueKey } : {}),
    ...(options.sla ? { sla: options.sla } : {}),
    history,
  });

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
    supportLoopSummary,
    operatorActionSummary: createSupportOperatorActionSummary({ queueLabel }),
    sharedThreadSummary: threadSummary,
    ...(category.faqEntry ? { faqEntry: cloneDomainSnapshot(category.faqEntry) } : {}),
    ...(category.faqEntries ? { faqEntries: cloneDomainSnapshotArray(category.faqEntries) } : {}),
    ...(category.customerServiceEntryLabel ? { customerServiceEntryLabel: category.customerServiceEntryLabel } : {}),
    ...(options.supportEntry
      ? { supportEntry: { ...options.supportEntry, threadSummary, supportLoopSummary } }
      : category.supportEntry
        ? { supportEntry: { ...category.supportEntry, threadSummary, supportLoopSummary } }
        : {}),
    ...(queueKey ? { queueKey } : {}),
    ...(options.queueLabel ? { queueLabel: options.queueLabel } : category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
    ...(options.assignee ? { assignee: { ...options.assignee } } : {}),
    ...(options.sla ? { sla: { ...options.sla } } : {}),
    slaRule,
    queueDashboard,
    supportHandoff,
    handlingReport,
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
    feedbackTicket: cloneDomainSnapshot(ticket),
    feedbackCategory: cloneFeedbackCategory(category),
    feedbackStatus: cloneFeedbackStatus(status),
  };
}

export function cloneFeedbackTicket(ticket: FeedbackTicket): FeedbackTicket {
  const sourceContext = cloneOptionalDomainSnapshot(ticket.context.sourceContext);
  const actorContext = cloneOptionalDomainSnapshot(ticket.context.actorContext);

  return {
    ...ticket,
    labels: [...ticket.labels],
    ...(ticket.assignee ? { assignee: cloneDomainSnapshot(ticket.assignee) } : {}),
    ...(ticket.sla ? { sla: cloneDomainSnapshot(ticket.sla) } : {}),
    context: {
      ...ticket.context,
      ...(sourceContext ? { sourceContext } : {}),
      ...(actorContext ? { actorContext } : {}),
      screenshotAssets: cloneDomainSnapshotArray(ticket.context.screenshotAssets),
      attachmentAssets: cloneDomainSnapshotArray(ticket.context.attachmentAssets),
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
  const pageWindow = createApiPaginationWindow(filteredIds, {
    page: input.page,
    pageSize: input.pageSize,
    defaultPageSize: 10,
  });
  const items = pageWindow.items
    .map((ticketId) => createFeedbackTicketSummary(userState.feedbackDetailsById[ticketId]!));

  return {
    items,
    page: pageWindow.page,
    pageSize: pageWindow.pageSize,
    total: pageWindow.total,
    hasMore: pageWindow.hasMore,
    ...(userState.latestFeedbackTicketId ? { selectedTicketId: userState.latestFeedbackTicketId } : {}),
  };
}

export function createFeedbackQueueDashboards(userState: UserState): FeedbackQueueDashboard[] {
  const summaries = userState.feedbackTicketIds
    .map((ticketId) => {
      const detail = userState.feedbackDetailsById[ticketId];
      return detail ? createFeedbackTicketSummary(detail) : undefined;
    })
    .filter((summary): summary is FeedbackTicketSummary => Boolean(summary));
  const byQueue = new Map<string, { queueLabel: string; summaries: FeedbackTicketSummary[] }>();
  for (const summary of summaries) {
    const queueKey = summary.queueKey ?? "general";
    const queueLabel = summary.queueLabel ?? "General Support";
    const existing = byQueue.get(queueKey);
    if (existing) {
      existing.summaries.push(summary);
    } else {
      byQueue.set(queueKey, { queueLabel, summaries: [summary] });
    }
  }
  if (byQueue.size === 0) {
    for (const category of FEEDBACK_CATEGORIES) {
      const queueKey = category.defaultQueueKey ?? "general";
      const queueLabel = category.defaultQueueLabel ?? "General Support";
      if (!byQueue.has(queueKey)) {
        byQueue.set(queueKey, { queueLabel, summaries: [] });
      }
    }
  }
  return Array.from(byQueue.entries()).map(([queueKey, value]) =>
    createFeedbackQueueDashboard({
      queueKey,
      queueLabel: value.queueLabel,
      summaries: value.summaries,
    }),
  );
}

export function createFeedbackSlaRules(): FeedbackSlaRule[] {
  return FEEDBACK_CATEGORIES.map((category) => createFeedbackSlaRule(category));
}

export function cloneFeedbackFaqCatalog(entries: FeedbackFaqEntry[]): FeedbackFaqEntry[] {
  return cloneDomainSnapshotArray(entries);
}

export function cloneFeedbackSupportEntries(entries: FeedbackSupportEntry[]): FeedbackSupportEntry[] {
  return cloneDomainSnapshotArray(entries);
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
    touchpoints: cloneDomainSnapshotArray(record.thread.touchpoints),
  };
  record.messages = [...cloneDomainSnapshotArray(record.messages), nextMessage];
  record.updatedAt = input.createdAt;
  userState.threadMessagesByThreadId[input.threadId] = cloneDomainSnapshotArray(record.messages);
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

  const sourceContext = cloneOptionalDomainSnapshot(context?.sourceContext);
  const actorContext = cloneOptionalDomainSnapshot(context?.actorContext);
  const threadResponse = createMessageThread(
    userState,
    {
      type: "customer_service",
      title: `${category.label}: ${ticketId}`,
      sourceTicketId: ticketId,
      ...(sourceContext ? { sourceContext } : {}),
      ...(actorContext ? { actorContext } : {}),
    },
    now,
  );
  sendThreadMessage(userState, {
    threadId: threadResponse.messageThread.threadId,
    body: `[${ticketId}] ${description}`,
  });
  const threadRecord = userState.threadRecordsById[threadResponse.messageThread.threadId];
  if (threadRecord) {
    const queueLabel = category.defaultQueueLabel ?? seedSupportEntry.queueLabel ?? "General Support";
    const assigneeLabel = seedSupportEntry.handlerLabel ?? "Support Bot";
    threadRecord.thread.assignment = {
      assigneeUserId: "support_agent_1",
      assigneeLabel,
      teamLabel: queueLabel,
      assignedAt: now,
      statusLabel: `Assigned to ${queueLabel}`,
    };
    threadRecord.thread.supportProgress = {
      state: "assigned",
      ticketId,
      queueLabel,
      assigneeLabel,
      nextStepLabel: "Support will continue in the same thread.",
      supportLoopSummary: createSharedSupportLoopSummary({
        state: "assigned",
        queueLabel,
      }),
      operatorActionSummary: createSupportOperatorActionSummary({
        queueLabel,
      }),
    };
  }
  return {
    ...seedSupportEntry,
    ...(category.defaultQueueKey ? { queueKey: category.defaultQueueKey } : {}),
    ...(category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
    threadId: threadResponse.messageThread.threadId,
    threadSummary: createSharedSupportThreadSummary({
      threadId: threadResponse.messageThread.threadId,
      ...(category.defaultQueueLabel ?? seedSupportEntry.queueLabel
        ? { queueLabel: category.defaultQueueLabel ?? seedSupportEntry.queueLabel }
        : {}),
      ...(seedSupportEntry.handlerLabel ? { assigneeLabel: seedSupportEntry.handlerLabel } : {}),
    }),
    supportLoopSummary: createSharedSupportLoopSummary({
      state: "assigned",
      ...(category.defaultQueueLabel ?? seedSupportEntry.queueLabel
        ? { queueLabel: category.defaultQueueLabel ?? seedSupportEntry.queueLabel }
        : {}),
    }),
    updatedAt: now,
    enabled: true,
  };
}

export function createDefaultFeedbackContext(
  session: SessionRecord,
  request: SubmitFeedbackRequest["context"],
): FeedbackTicket["context"] {
  const sourceContext =
    cloneOptionalDomainSnapshot(request.sourceContext) ??
    {
      pagePath: request.sourcePage,
      ...(request.sourceRouteId ? { routeId: request.sourceRouteId } : {}),
      ...(request.sourceLabel ? { label: request.sourceLabel } : {}),
    };
  const actorContext =
    cloneOptionalDomainSnapshot(request.actorContext) ??
    {
      userId: request.userId ?? session.userId,
      platform: request.platform,
      appVersion: request.appVersion,
      ...(request.deviceSummary ? { deviceSummary: request.deviceSummary } : {}),
    };

  return {
    sourcePage: request.sourcePage,
    ...(request.sourceRouteId ? { sourceRouteId: request.sourceRouteId } : {}),
    ...(request.sourceLabel ? { sourceLabel: request.sourceLabel } : {}),
    userId: request.userId ?? session.userId,
    platform: request.platform,
    appVersion: request.appVersion,
    ...(request.deviceSummary ? { deviceSummary: request.deviceSummary } : {}),
    sourceContext,
    actorContext,
    screenshotAssets: cloneDomainSnapshotArray(request.screenshotAssets),
    attachmentAssets: cloneDomainSnapshotArray(request.attachmentAssets),
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
      cloneDomainSnapshotArray(referenceCategory?.faqEntries ?? (referenceCategory?.faqEntry ? [referenceCategory.faqEntry] : [])),
    faqCatalog: cloneFeedbackFaqCatalog(userState.feedbackFaqCatalog),
    supportEntries: cloneFeedbackSupportEntries(userState.feedbackSupportEntries),
    queueDashboards: createFeedbackQueueDashboards(userState),
    slaRules: createFeedbackSlaRules(),
    ...(latestDetail?.feedbackStatus.supportEntry
      ? { supportEntry: cloneDomainSnapshot(latestDetail.feedbackStatus.supportEntry) }
      : referenceCategory?.supportEntry
        ? { supportEntry: cloneDomainSnapshot(referenceCategory.supportEntry) }
        : {}),
    ...(serviceLoopSummary !== undefined ? { serviceLoopSummary } : {}),
    ...(latestDetail
      ? {
          latestTicket: cloneDomainSnapshot(latestDetail.feedbackTicket),
          latestStatus: cloneFeedbackStatus(latestDetail.feedbackStatus),
          latestCategory: cloneFeedbackCategory(latestDetail.feedbackCategory),
        }
      : {}),
  };
}
