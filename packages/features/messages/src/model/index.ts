import type {
  DetailStatus,
  MessageBodyItem,
  MessageThreadActions,
  MessageThread,
  NotificationFilterGroup,
  NotificationGroupSummary,
  NotificationItem,
  NotificationType,
  UnreadBadge,
} from "@minix/contracts";
import { createDefaultListPageState, type ListPageState } from "@minix/core";

export type MessagesState = Omit<ListPageState<NotificationItem>, "filters"> & {
  filters: NotificationFilterGroup[];
  groups: NotificationGroupSummary[];
  unreadBadge: UnreadBadge;
  reservedThreads: MessageThread[];
  selectedThreadId: string | undefined;
  detailData: MessageThread | undefined;
  detailStatus: DetailStatus;
  messageThread: MessageThread | undefined;
  messageItems: MessageBodyItem[];
  detailActions: MessageThreadActions | undefined;
  composerText: string;
  activeType: NotificationType | "all";
  activeGroupKey: string;
  onlyUnread: boolean;
  lastActionMessage: string | undefined;
};

export interface CreateDefaultMessagesStateOptions {
  title?: string;
  subtitle?: string;
  pageSize?: number;
  emptyText?: string;
}

export function createEmptyUnreadBadge(): UnreadBadge {
  return {
    totalUnread: 0,
    notificationUnread: 0,
    threadUnread: 0,
    breakdown: [],
  };
}

export function createDefaultMessagesState(
  options: CreateDefaultMessagesStateOptions = {},
): MessagesState {
  return {
    ...createDefaultListPageState<NotificationItem>({
      title: options.title ?? "Inbox",
      ...(options.subtitle !== undefined ? { subtitle: options.subtitle } : {}),
      pageSize: options.pageSize ?? 6,
      emptyText: options.emptyText ?? "No notifications are available yet.",
    }),
    filters: [],
    groups: [],
    unreadBadge: createEmptyUnreadBadge(),
    reservedThreads: [],
    selectedThreadId: undefined,
    detailData: undefined,
    detailStatus: {
      loadState: "idle",
      entryContext: "unknown",
      refreshable: true,
      invalidated: false,
      deleted: false,
      permissionDenied: false,
      offline: false,
      unpublished: false,
    },
    messageThread: undefined,
    messageItems: [],
    detailActions: undefined,
    composerText: "",
    activeType: "all",
    activeGroupKey: "all",
    onlyUnread: false,
    lastActionMessage: undefined,
  };
}
