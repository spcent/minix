export const NOTIFICATION_TYPES = ["system", "business", "campaign", "review"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const MESSAGE_THREAD_TYPES = ["private", "consultation", "customer_service", "group"] as const;
export type MessageThreadType = (typeof MESSAGE_THREAD_TYPES)[number];

export const MESSAGE_TOUCHPOINT_CHANNELS = ["in_app", "subscription_message", "sms", "email", "push"] as const;
export type MessageTouchpointChannel = (typeof MESSAGE_TOUCHPOINT_CHANNELS)[number];

export const NOTIFICATION_GROUPING_MODES = ["timeline", "type"] as const;
export type NotificationGroupingMode = (typeof NOTIFICATION_GROUPING_MODES)[number];

export interface MessageTouchpoint {
  channel: MessageTouchpointChannel;
  executable: boolean;
  enabled: boolean;
  delivered?: boolean;
  statusLabel?: string;
  templateKey?: string;
}

export interface NotificationReceipt {
  read: boolean;
  readAt?: string;
  readReceiptRequired: boolean;
}

export interface MessageThreadReference {
  threadId: string;
  type: MessageThreadType;
  title: string;
  lastMessagePreview?: string;
  reserved: boolean;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  groupKey: string;
  groupLabel: string;
  title: string;
  summary: string;
  bodyPreview?: string;
  createdAt: string;
  updatedAt?: string;
  pinned: boolean;
  doNotDisturb: boolean;
  receipt: NotificationReceipt;
  touchpoints: MessageTouchpoint[];
  tagLabels: string[];
  thread?: MessageThreadReference;
}

export interface NotificationGroupSummary {
  key: string;
  label: string;
  count: number;
}

export interface NotificationFilterOption {
  key: string;
  label: string;
  count: number;
}

export interface NotificationFilterGroup {
  key: string;
  label: string;
  selectedKeys: string[];
  options: NotificationFilterOption[];
}

export interface NotificationList {
  items: NotificationItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  grouping: NotificationGroupingMode;
  groups: NotificationGroupSummary[];
  filters: NotificationFilterGroup[];
  onlyUnread: boolean;
  selectedNotificationId?: string;
}

export interface MessageThread {
  threadId: string;
  type: MessageThreadType;
  title: string;
  subtitle?: string;
  participantLabels: string[];
  pinned: boolean;
  doNotDisturb: boolean;
  unreadCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastReadAt?: string;
  reserved: boolean;
  touchpoints: MessageTouchpoint[];
}

export interface UnreadBadgeBreakdown {
  key: string;
  label: string;
  count: number;
}

export interface UnreadBadge {
  totalUnread: number;
  notificationUnread: number;
  threadUnread: number;
  breakdown: UnreadBadgeBreakdown[];
  lastUpdatedAt?: string;
}

export interface NotificationListResponse {
  notificationList: NotificationList;
  messageThread: MessageThread | undefined;
  unreadBadge: UnreadBadge;
  reservedThreads: MessageThread[];
}

export interface MessageThreadResponse {
  messageThread: MessageThread;
  unreadBadge: UnreadBadge;
}

export interface MarkNotificationsReadRequest {
  notificationIds: string[];
  page?: number;
  pageSize?: number;
  type?: NotificationType | "all";
  groupKey?: string;
  onlyUnread?: boolean;
}

export interface MarkNotificationsReadResponse {
  updatedIds: string[];
  notificationList: NotificationList;
  unreadBadge: UnreadBadge;
}
