import type { ActorContextSnapshot, SourceContextSnapshot } from "./context";

export const NOTIFICATION_TYPES = ["system", "business", "campaign", "review"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const MESSAGE_THREAD_TYPES = ["private", "consultation", "customer_service", "group"] as const;
export type MessageThreadType = (typeof MESSAGE_THREAD_TYPES)[number];

export const MESSAGE_TOUCHPOINT_CHANNELS = ["in_app", "subscription_message", "sms", "email", "push"] as const;
export type MessageTouchpointChannel = (typeof MESSAGE_TOUCHPOINT_CHANNELS)[number];
export const MESSAGE_TOUCHPOINT_PROVIDER_MODES = ["sample", "production"] as const;
export type MessageTouchpointProviderMode = (typeof MESSAGE_TOUCHPOINT_PROVIDER_MODES)[number];
export const MESSAGE_TOUCHPOINT_RECEIPT_STATUSES = ["queued", "sent", "delivered", "failed", "skipped", "opted_out"] as const;
export type MessageTouchpointReceiptStatus = (typeof MESSAGE_TOUCHPOINT_RECEIPT_STATUSES)[number];

export const NOTIFICATION_GROUPING_MODES = ["timeline", "type"] as const;
export type NotificationGroupingMode = (typeof NOTIFICATION_GROUPING_MODES)[number];

export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_SENDER_ROLES = ["self", "advisor", "support", "system", "peer"] as const;
export type MessageSenderRole = (typeof MESSAGE_SENDER_ROLES)[number];

export const MESSAGE_DELIVERY_STATUSES = ["pending", "sent", "delivered", "read", "failed"] as const;
export type MessageDeliveryStatus = (typeof MESSAGE_DELIVERY_STATUSES)[number];

export const MESSAGE_THREAD_MEMBER_ROLES = ["owner", "member", "advisor", "support_agent", "customer", "viewer"] as const;
export type MessageThreadMemberRole = (typeof MESSAGE_THREAD_MEMBER_ROLES)[number];

export const MESSAGE_REPLY_POLICIES = ["open", "members_only", "support_only", "readonly"] as const;
export type MessageReplyPolicy = (typeof MESSAGE_REPLY_POLICIES)[number];

export const MESSAGE_CONSULTATION_STATES = ["queued", "assigned", "in_progress", "waiting_user", "resolved", "closed"] as const;
export type MessageConsultationState = (typeof MESSAGE_CONSULTATION_STATES)[number];

export const MESSAGE_SUPPORT_STATES = ["unassigned", "assigned", "waiting_user", "resolved", "closed"] as const;
export type MessageSupportState = (typeof MESSAGE_SUPPORT_STATES)[number];

export const MESSAGE_SYNC_MODES = ["polling"] as const;
export type MessageSyncMode = (typeof MESSAGE_SYNC_MODES)[number];

export const MESSAGE_THREAD_LIST_SORTS = ["activity", "unread"] as const;
export type MessageThreadListSort = (typeof MESSAGE_THREAD_LIST_SORTS)[number];

export interface MessageTouchpointTemplate {
  templateKey: string;
  locale: string;
  title?: string;
  channelConstraint?: MessageTouchpointChannel;
  governanceLabel?: string;
  operatorActionSummary?: string;
}

export interface MessageTouchpointReceipt {
  receiptId: string;
  providerReference?: string;
  status: MessageTouchpointReceiptStatus;
  attemptedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureCode?: string;
  failureMessage?: string;
  retryCount: number;
  retryable: boolean;
  nextRetryAt?: string;
  attemptSummary?: string;
}

export interface MessageTouchpoint {
  channel: MessageTouchpointChannel;
  executable: boolean;
  enabled: boolean;
  delivered?: boolean;
  statusLabel?: string;
  deliverySummary?: string;
  fallbackSummary?: string;
  templateKey?: string;
  providerKey?: string;
  providerLabel?: string;
  providerMode?: MessageTouchpointProviderMode;
  template?: MessageTouchpointTemplate;
  receipt?: MessageTouchpointReceipt;
  fallbackToInApp?: boolean;
  unsubscribable?: boolean;
  unsubscribeKey?: string;
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

export interface MessageThreadMember {
  userId: string;
  label: string;
  role: MessageThreadMemberRole;
  active: boolean;
  canReply: boolean;
  joinedAt?: string;
}

export interface MessageThreadAssignment {
  assigneeUserId?: string;
  assigneeLabel?: string;
  teamLabel?: string;
  assignedAt?: string;
  statusLabel?: string;
}

export interface MessageConsultationProgress {
  caseId: string;
  state: MessageConsultationState;
  advisorLabel?: string;
  nextStepLabel?: string;
}

export interface MessageSupportProgress {
  ticketId?: string;
  state: MessageSupportState;
  queueLabel?: string;
  assigneeLabel?: string;
  nextStepLabel?: string;
  supportLoopSummary?: string;
  operatorActionSummary?: string;
}

export interface MessageGroupState {
  memberCount: number;
  userMember: boolean;
  userRole?: MessageThreadMemberRole;
  replyPolicy: MessageReplyPolicy;
  readonlyReason?: string;
}

export interface MessageSyncState {
  mode: MessageSyncMode;
  modeLabel?: string;
  cursor: string;
  recommendedPollIntervalMs: number;
  recoverable: boolean;
  statusLabel?: string;
  providerSummary?: string;
  lastSyncedAt?: string;
}

export interface MessageDeliveryPosture {
  providerMode: MessageTouchpointProviderMode;
  syncMode: MessageSyncMode;
  realtimeProvisioned: boolean;
  pollingIntervalMs: number;
  pollingAcceptanceSummary: string;
  providerSummary: string;
  receiptHistorySummary: string;
  retrySummary: string;
  failedReceiptCount: number;
  retryableReceiptCount: number;
  touchpointChannels: MessageTouchpointChannel[];
  supportLoopSummary?: string;
  consultationSummary?: string;
}

export interface MessageThread {
  threadId: string;
  type: MessageThreadType;
  title: string;
  subtitle?: string;
  sourceContext?: SourceContextSnapshot;
  actorContext?: ActorContextSnapshot;
  participantLabels: string[];
  pinned: boolean;
  doNotDisturb: boolean;
  unreadCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastReadAt?: string;
  reserved: boolean;
  touchpoints: MessageTouchpoint[];
  replyPolicy?: MessageReplyPolicy;
  members?: MessageThreadMember[];
  assignment?: MessageThreadAssignment;
  consultationProgress?: MessageConsultationProgress;
  supportProgress?: MessageSupportProgress;
  groupState?: MessageGroupState;
  syncState?: MessageSyncState;
}

export interface MessageBodyItem {
  messageId: string;
  threadId: string;
  direction: MessageDirection;
  senderRole: MessageSenderRole;
  senderLabel: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  deliveryStatus: MessageDeliveryStatus;
  readAt?: string;
  deliveredAt?: string;
  attemptCount: number;
  retryable: boolean;
  failureCode?: string;
  failureMessage?: string;
  touchpoints: MessageTouchpoint[];
}

export interface MessageThreadActions {
  canReply: boolean;
  canMarkRead: boolean;
  canRetryFailed: boolean;
  canCreateThread: boolean;
  deliveryLabel: string;
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

export interface MessageThreadList {
  items: MessageThread[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  selectedThreadId?: string;
  syncState?: MessageSyncState;
}

export interface NotificationListResponse {
  notificationList: NotificationList;
  messageThread: MessageThread | undefined;
  unreadBadge: UnreadBadge;
  reservedThreads: MessageThread[];
  threadList?: MessageThreadList;
  deliveryPosture?: MessageDeliveryPosture;
}

export interface MessageThreadResponse {
  messageThread: MessageThread;
  messageItems: MessageBodyItem[];
  detailActions: MessageThreadActions;
  unreadBadge: UnreadBadge;
  threadList?: MessageThreadList;
  deliveryPosture?: MessageDeliveryPosture;
  changed?: boolean;
}

export interface MessageThreadListResponse {
  threadList: MessageThreadList;
  unreadBadge: UnreadBadge;
  deliveryPosture?: MessageDeliveryPosture;
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

export interface ListMessageThreadsRequest {
  page?: number;
  pageSize?: number;
  type?: MessageThreadType | "all";
  onlyUnread?: boolean;
  sort?: MessageThreadListSort;
  sourceTicketId?: string;
}

export interface GetMessageThreadRequest {
  threadId: string;
  cursor?: string;
}

export interface SendMessageRequest {
  threadId: string;
  body: string;
}

export interface SendMessageResponse {
  messageThread: MessageThread;
  messageItem: MessageBodyItem;
  detailActions: MessageThreadActions;
  unreadBadge: UnreadBadge;
  threadList?: MessageThreadList;
  deliveryPosture?: MessageDeliveryPosture;
}

export interface RetryMessageRequest {
  threadId: string;
  messageId: string;
}

export interface RetryMessageResponse extends SendMessageResponse {}

export interface CreateMessageThreadRequest {
  type: MessageThreadType;
  title?: string;
  participantUserIds?: string[];
  sourceTicketId?: string;
  sourceContext?: SourceContextSnapshot;
  actorContext?: ActorContextSnapshot;
  replyPolicy?: MessageReplyPolicy;
}

export interface CreateMessageThreadResponse {
  messageThread: MessageThread;
  detailActions: MessageThreadActions;
  unreadBadge: UnreadBadge;
  threadList: MessageThreadList;
  deliveryPosture?: MessageDeliveryPosture;
}

export interface MarkThreadReadRequest {
  threadId: string;
}

export interface SyncMessageThreadRequest {
  threadId: string;
  cursor?: string;
}
