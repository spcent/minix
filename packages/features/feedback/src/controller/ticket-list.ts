import type {
  FeedbackTicketDetailResponse,
  ListFeedbackTicketsRequest,
  ListFeedbackTicketsResponse,
} from "@minix/contracts";
import { cloneStateSnapshot, cloneStateSnapshotArray } from "@minix/core";

import type { FeedbackState } from "../model";

function createTicketListUpdate(
  currentList: FeedbackState["ticketList"],
  detail: FeedbackTicketDetailResponse,
): FeedbackState["ticketList"] | undefined {
  if (!currentList) {
    return currentList;
  }

  const summary = {
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
    ...(detail.feedbackStatus.assignee ? { assignee: cloneStateSnapshot(detail.feedbackStatus.assignee) } : {}),
    ...(detail.feedbackStatus.sla ? { sla: cloneStateSnapshot(detail.feedbackStatus.sla) } : {}),
    ...(detail.feedbackTicket.supportThreadId ? { supportThreadId: detail.feedbackTicket.supportThreadId } : {}),
    lastUpdatedAt: detail.feedbackTicket.updatedAt,
  };

  const existingIndex = currentList.items.findIndex((item) => item.ticketId === summary.ticketId);
  const items =
    existingIndex >= 0
      ? currentList.items.map((item, index) => (index === existingIndex ? summary : cloneStateSnapshot(item)))
      : [summary, ...cloneStateSnapshotArray(currentList.items)];

  return {
    ...cloneStateSnapshot(currentList),
    items,
    total: existingIndex >= 0 ? currentList.total : currentList.total + 1,
    selectedTicketId: summary.ticketId,
  };
}

export function createDetailStatePatch(
  currentState: FeedbackState,
  detail: FeedbackTicketDetailResponse,
): Partial<FeedbackState> {
  return {
    latestTicket: cloneStateSnapshot(detail.feedbackTicket),
    latestStatus: cloneStateSnapshot(detail.feedbackStatus),
    latestCategory: cloneStateSnapshot(detail.feedbackCategory),
    selectedTicketId: detail.feedbackTicket.ticketId,
    ticketList: createTicketListUpdate(currentState.ticketList, detail),
    recommendedFaqEntries:
      detail.feedbackStatus.faqEntries
        ? cloneStateSnapshotArray(detail.feedbackStatus.faqEntries)
        : detail.feedbackCategory.faqEntries
          ? cloneStateSnapshotArray(detail.feedbackCategory.faqEntries)
          : detail.feedbackCategory.faqEntry
            ? [cloneStateSnapshot(detail.feedbackCategory.faqEntry)]
            : [],
    supportEntry:
      detail.feedbackStatus.supportEntry
        ? cloneStateSnapshot(detail.feedbackStatus.supportEntry)
        : detail.feedbackCategory.supportEntry
          ? cloneStateSnapshot(detail.feedbackCategory.supportEntry)
          : undefined,
    revisitAction: detail.feedbackStatus.revisitAction ? cloneStateSnapshot(detail.feedbackStatus.revisitAction) : undefined,
    handlingReport: detail.feedbackStatus.handlingReport ? cloneStateSnapshot(detail.feedbackStatus.handlingReport) : undefined,
    serviceLoopSummary:
      detail.feedbackStatus.supportLoopSummary ?? detail.feedbackStatus.nextStepLabel ?? detail.feedbackStatus.progressLabel,
    serviceHint:
      detail.feedbackStatus.supportEntry?.label ??
      detail.feedbackCategory.supportEntry?.label ??
      detail.feedbackCategory.customerServiceEntryLabel,
  };
}

export function createFeedbackTicketsRequestQuery(query: ListFeedbackTicketsRequest): Record<string, string | number> {
  return {
    ...(query.page !== undefined ? { page: query.page } : {}),
    ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
    ...(query.state !== undefined ? { state: query.state } : {}),
    ...(query.categoryKey !== undefined ? { categoryKey: query.categoryKey } : {}),
    ...(query.keyword !== undefined ? { keyword: query.keyword } : {}),
  };
}

export function createTicketListStatePatch(response: ListFeedbackTicketsResponse): Partial<FeedbackState> {
  return {
    ticketList: cloneStateSnapshot(response.ticketList),
    selectedTicketId: response.ticketList.selectedTicketId ?? response.ticketList.items[0]?.ticketId,
    faqCatalog: cloneStateSnapshotArray(response.faqCatalog),
    supportEntries: cloneStateSnapshotArray(response.supportEntries),
    queueDashboards: cloneStateSnapshotArray(response.queueDashboards ?? []),
    slaRules: cloneStateSnapshotArray(response.slaRules ?? []),
  };
}
