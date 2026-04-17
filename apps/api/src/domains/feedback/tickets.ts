import type {
  FeedbackPriority,
  FeedbackRevisitRequest,
  FeedbackRevisitResponse,
  FeedbackStatus,
  FeedbackSupportEntry,
  FeedbackTicket,
  FeedbackTicketActionRequest,
  FeedbackTicketActionResponse,
  FeedbackTicketAssignee,
  FeedbackTicketDetailResponse,
  FeedbackTicketSla,
  ListFeedbackTicketsRequest,
  ListFeedbackTicketsResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
} from "@minix/contracts";

import { bindUploadAssetsToOwner } from "../uploads/pipeline";
import type { SessionRecord, UserState } from "../../types";
import {
  appendSupportMessageToThread,
  cloneFeedbackFaqCatalog,
  cloneFeedbackStatus,
  cloneFeedbackSupportEntries,
  cloneFeedbackTicket,
  createDefaultFeedbackContext,
  createFeedbackStatus,
  createFeedbackTicketList,
  createFeedbackTicketResponse,
  ensureFeedbackRuntimeState,
  ensureFeedbackSupportThread,
  resolveFeedbackCategory,
  shiftIsoMinutes,
} from "./support";
import { sendThreadMessage } from "../messages/threads";

export function submitFeedbackTicket(
  session: SessionRecord,
  userState: UserState,
  request: SubmitFeedbackRequest,
  now = new Date().toISOString(),
): SubmitFeedbackResponse {
  ensureFeedbackRuntimeState(userState);
  const category = resolveFeedbackCategory(request.categoryKey, request.type);
  const ticketId = `fb_${crypto.randomUUID()}`;
  const priority: FeedbackPriority = request.priority ?? category.defaultPriority;
  const revisitRequested = Boolean(request.revisitRequested);
  const supportEntry = ensureFeedbackSupportThread(userState, ticketId, category, request.description, now, {
    sourceContext: request.context.sourceContext ?? {
      pagePath: request.context.sourcePage,
      ...(request.context.sourceRouteId ? { routeId: request.context.sourceRouteId } : {}),
      ...(request.context.sourceLabel ? { label: request.context.sourceLabel } : {}),
    },
    actorContext: request.context.actorContext ?? {
      userId: request.context.userId ?? session.userId,
      platform: request.context.platform,
      appVersion: request.context.appVersion,
      ...(request.context.deviceSummary ? { deviceSummary: request.context.deviceSummary } : {}),
    },
  });
  const assignee: FeedbackTicketAssignee | undefined =
    supportEntry?.handlerLabel
      ? {
          userId: "support_agent_1",
          label: "Support Bot",
          ...(supportEntry.queueLabel ?? category.defaultQueueLabel
            ? { teamLabel: supportEntry.queueLabel ?? category.defaultQueueLabel! }
            : {}),
          assignedAt: now,
        }
      : undefined;
  const sla: FeedbackTicketSla = {
    policyKey: `${category.key}_default_sla`,
    label: category.defaultPriority === "urgent" ? "2 hour response" : "24 hour response",
    deadlineAt: shiftIsoMinutes(now, category.defaultPriority === "urgent" ? 120 : 24 * 60),
    breached: false,
    updatedAt: now,
  };
  const ticket: FeedbackTicket = {
    ticketId,
    type: request.type,
    categoryKey: category.key,
    title: request.title,
    description: request.description,
    priority,
    labels: [...new Set([...(request.labels ?? []), ...category.labels])],
    revisitRequested,
    ...(request.satisfactionScore !== undefined ? { satisfactionScore: request.satisfactionScore } : {}),
    ...(category.defaultQueueKey ? { queueKey: category.defaultQueueKey } : {}),
    ...(category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
    ...(assignee ? { assignee } : {}),
    sla,
    ...(supportEntry?.threadId ? { supportThreadId: supportEntry.threadId } : {}),
    createdAt: now,
    updatedAt: now,
    context: createDefaultFeedbackContext(session, request.context),
  };
  const statusState: FeedbackStatus["state"] =
    category.type === "abuse_report" || category.defaultPriority === "urgent" ? "triaged" : "submitted";
  const status = createFeedbackStatus(ticketId, statusState, category, revisitRequested, now, {
    ...(ticket.queueKey ? { queueKey: ticket.queueKey } : {}),
    ...(ticket.queueLabel ? { queueLabel: ticket.queueLabel } : {}),
    ...(ticket.assignee ? { assignee: ticket.assignee } : {}),
    ...(ticket.sla ? { sla: ticket.sla } : {}),
    ...(supportEntry ? { supportEntry } : {}),
  });
  if (status.revisitAction && supportEntry?.threadId) {
    status.revisitAction.threadId = supportEntry.threadId;
  }
  const response = createFeedbackTicketResponse(ticket, category, status);

  bindUploadAssetsToOwner(userState, {
    assetIds: ticket.context.screenshotAssets.map((asset) => asset.assetId),
    ownerType: "feedback",
    ownerId: ticketId,
    role: "screenshot",
    ...(ticket.context.sourceContext ? { sourceContext: ticket.context.sourceContext } : {}),
    ...(ticket.context.actorContext ? { actorContext: ticket.context.actorContext } : {}),
    now,
  });
  bindUploadAssetsToOwner(userState, {
    assetIds: ticket.context.attachmentAssets.map((asset) => asset.assetId),
    ownerType: "feedback",
    ownerId: ticketId,
    role: "attachment",
    ...(ticket.context.sourceContext ? { sourceContext: ticket.context.sourceContext } : {}),
    ...(ticket.context.actorContext ? { actorContext: ticket.context.actorContext } : {}),
    now,
  });
  userState.feedbackDetailsById[ticketId] = response;
  userState.feedbackTicketIds = [ticketId, ...userState.feedbackTicketIds.filter((existing) => existing !== ticketId)];
  userState.latestFeedbackTicketId = ticketId;
  return response;
}

export function getFeedbackTicket(userState: UserState, ticketId: string): FeedbackTicketDetailResponse | null {
  ensureFeedbackRuntimeState(userState);
  const detail = userState.feedbackDetailsById[ticketId];
  return detail ? createFeedbackTicketResponse(detail.feedbackTicket, detail.feedbackCategory, detail.feedbackStatus) : null;
}

export function listFeedbackTickets(
  userState: UserState,
  input: ListFeedbackTicketsRequest = {},
): ListFeedbackTicketsResponse {
  ensureFeedbackRuntimeState(userState);
  return {
    ticketList: createFeedbackTicketList(userState, input),
    faqCatalog: cloneFeedbackFaqCatalog(userState.feedbackFaqCatalog),
    supportEntries: cloneFeedbackSupportEntries(userState.feedbackSupportEntries),
  };
}

export function revisitFeedbackTicket(
  userState: UserState,
  request: FeedbackRevisitRequest,
  now = new Date().toISOString(),
): FeedbackRevisitResponse | null {
  ensureFeedbackRuntimeState(userState);
  const existing = userState.feedbackDetailsById[request.ticketId];
  if (!existing) {
    return null;
  }

  const previousState = existing.feedbackStatus.state;
  const nextState: FeedbackStatus["state"] =
    previousState === "resolved" || previousState === "closed" ? "triaged" : "in_progress";
  const nextTicket: FeedbackTicket = {
    ...cloneFeedbackTicket(existing.feedbackTicket),
    updatedAt: now,
    revisitRequested: true,
  };
  const nextStatus = createFeedbackStatus(nextTicket.ticketId, nextState, existing.feedbackCategory, true, nextTicket.createdAt, {
    ...(nextTicket.queueKey ? { queueKey: nextTicket.queueKey } : {}),
    ...(nextTicket.queueLabel ? { queueLabel: nextTicket.queueLabel } : {}),
    ...(nextTicket.assignee ? { assignee: nextTicket.assignee } : {}),
    ...(nextTicket.sla ? { sla: nextTicket.sla } : {}),
    ...(existing.feedbackStatus.supportEntry ? { supportEntry: existing.feedbackStatus.supportEntry } : {}),
  });
  nextStatus.processingHistory.push({
    recordedAt: now,
    actorLabel: "User Follow-up",
    actorRole: "user",
    actionLabel: request.userMessage ? "Revisit requested with context" : "Revisit requested",
    ...(request.userMessage ? { note: request.userMessage } : { note: "The user reopened the support loop from feedback." }),
    state: nextState,
  });

  if (existing.feedbackStatus.supportEntry?.threadId && request.userMessage) {
    sendThreadMessage(userState, {
      threadId: existing.feedbackStatus.supportEntry.threadId,
      body: `[${nextTicket.ticketId}] ${request.userMessage}`,
    });
  }

  const response = createFeedbackTicketResponse(nextTicket, existing.feedbackCategory, nextStatus);
  userState.feedbackDetailsById[request.ticketId] = response;
  userState.latestFeedbackTicketId = request.ticketId;
  return response;
}

export function applyFeedbackTicketAction(
  userState: UserState,
  request: FeedbackTicketActionRequest,
  now = new Date().toISOString(),
): FeedbackTicketActionResponse | null {
  ensureFeedbackRuntimeState(userState);
  const existing = userState.feedbackDetailsById[request.ticketId];
  if (!existing) {
    return null;
  }

  const nextTicket: FeedbackTicket = {
    ...cloneFeedbackTicket(existing.feedbackTicket),
    updatedAt: now,
    ...(request.priority ? { priority: request.priority } : {}),
    ...(request.labels ? { labels: [...new Set(request.labels)] } : {}),
    ...(request.queueKey ? { queueKey: request.queueKey } : {}),
    ...(request.queueLabel ? { queueLabel: request.queueLabel } : {}),
    ...(request.assignee ? { assignee: { ...request.assignee } } : {}),
    ...(request.sla ? { sla: { ...request.sla, updatedAt: now } } : {}),
    ...(request.state === "closed" ? { closedAt: now } : {}),
  };
  const nextState = request.state ?? existing.feedbackStatus.state;
  const supportEntry: FeedbackSupportEntry | undefined =
    existing.feedbackStatus.supportEntry ?? existing.feedbackCategory.supportEntry;
  const nextStatus = createFeedbackStatus(
    nextTicket.ticketId,
    nextState,
    existing.feedbackCategory,
    nextTicket.revisitRequested,
    nextTicket.createdAt,
    {
      ...(nextTicket.queueKey ? { queueKey: nextTicket.queueKey } : {}),
      ...(nextTicket.queueLabel ? { queueLabel: nextTicket.queueLabel } : {}),
      ...(nextTicket.assignee ? { assignee: nextTicket.assignee } : {}),
      ...(nextTicket.sla ? { sla: nextTicket.sla } : {}),
      ...(supportEntry ? { supportEntry } : {}),
    },
  );
  nextStatus.processingHistory.push(
    {
      recordedAt: now,
      actorLabel: request.assignee?.label ?? "Support Desk",
      actorRole: "support",
      ...(request.assignee?.userId ? { actorUserId: request.assignee.userId } : {}),
      actionLabel: request.state ? `Ticket moved to ${request.state.replaceAll("_", " ")}` : "Ticket updated",
      ...(request.note ? { note: request.note } : {}),
      state: nextState,
    },
    ...(request.assignee
      ? [
          {
            recordedAt: now,
            actorLabel: request.assignee.label,
            actorRole: "support" as const,
            actorUserId: request.assignee.userId,
            actionLabel: "Ticket assigned",
            note: request.assignee.teamLabel ? `Assigned to ${request.assignee.teamLabel}.` : "Assigned to support owner.",
            state: nextState,
          },
        ]
      : []),
  );
  if (request.supportReply && nextTicket.supportThreadId) {
    appendSupportMessageToThread(userState, {
      threadId: nextTicket.supportThreadId,
      senderLabel: request.assignee?.label ?? nextStatus.assignee?.label ?? "Support Bot",
      body: request.supportReply,
      createdAt: now,
    });
  }
  if (nextStatus.revisitAction && nextTicket.supportThreadId) {
    nextStatus.revisitAction.threadId = nextTicket.supportThreadId;
  }

  const response = createFeedbackTicketResponse(nextTicket, existing.feedbackCategory, nextStatus);
  userState.feedbackDetailsById[request.ticketId] = response;
  userState.latestFeedbackTicketId = request.ticketId;

  return {
    ...response,
    ticketList: createFeedbackTicketList(userState, { page: 1, pageSize: 10 }),
  };
}
