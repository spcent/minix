import { NOTIFICATION_TYPES } from "@minix/contracts";
import type {
  CreateMessageThreadRequest,
  CreateMessageThreadResponse,
  GetMessageThreadRequest,
  MarkThreadReadRequest,
  MessageBodyItem,
  MessageConsultationProgress,
  MessageDeliveryStatus,
  MessageThread,
  MessageThreadActions,
  MessageThreadList,
  MessageThreadListResponse,
  MessageThreadListSort,
  MessageThreadMember,
  MessageThreadMemberRole,
  MessageThreadResponse,
  MessageTouchpoint,
  MessageTouchpointReceipt,
  MessageTouchpointReceiptStatus,
  RetryMessageRequest,
  RetryMessageResponse,
  SendMessageRequest,
  SendMessageResponse,
  SyncMessageThreadRequest,
  UnreadBadge,
} from "@minix/contracts";

import type { StoredMessageThreadRecord, UserState } from "../../types";
import { cloneTouchpoints, DEFAULT_MESSAGE_TOUCHPOINTS, cloneMessageTouchpointsForItem } from "./touchpoints";

const MESSAGE_POLL_INTERVAL_MS = 5_000;

const THREAD_SEEDS: Record<string, MessageThread> = {
  thread_private_tutor: {
    threadId: "thread_private_tutor",
    type: "private",
    title: "Tutor Mila",
    subtitle: "Private coaching thread",
    participantLabels: ["Tutor Mila", "You"],
    pinned: true,
    doNotDisturb: false,
    unreadCount: 2,
    lastMessagePreview: "I left pronunciation notes on your latest speaking task.",
    lastMessageAt: "2026-04-08T09:10:00.000Z",
    lastReadAt: "2026-04-08T08:40:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: "open",
    members: [
      {
        userId: "creator_sample",
        label: "Tutor Mila",
        role: "advisor",
        active: true,
        canReply: true,
        joinedAt: "2026-04-01T08:00:00.000Z",
      },
      {
        userId: "self",
        label: "You",
        role: "customer",
        active: true,
        canReply: true,
        joinedAt: "2026-04-01T08:00:00.000Z",
      },
    ],
  },
  thread_consultation_case: {
    threadId: "thread_consultation_case",
    type: "consultation",
    title: "Consultation Desk",
    subtitle: "Reserved consultation workflow thread",
    participantLabels: ["Consultation Desk", "You"],
    pinned: false,
    doNotDisturb: false,
    unreadCount: 1,
    lastMessagePreview: "Your consultation request is queued for an advisor reply.",
    lastMessageAt: "2026-04-08T07:55:00.000Z",
    lastReadAt: "2026-04-08T06:30:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: "open",
    assignment: {
      assigneeUserId: "advisor_oncall_1",
      assigneeLabel: "Advisor Nia",
      teamLabel: "Consultation Desk",
      assignedAt: "2026-04-08T07:50:00.000Z",
      statusLabel: "Advisor assigned",
    },
    consultationProgress: {
      caseId: "consult_case_1",
      state: "assigned",
      advisorLabel: "Advisor Nia",
      nextStepLabel: "Reply in-thread to keep the consultation active.",
    },
    members: [
      {
        userId: "advisor_oncall_1",
        label: "Advisor Nia",
        role: "advisor",
        active: true,
        canReply: true,
        joinedAt: "2026-04-08T07:50:00.000Z",
      },
      {
        userId: "self",
        label: "You",
        role: "customer",
        active: true,
        canReply: true,
        joinedAt: "2026-04-08T07:42:00.000Z",
      },
    ],
  },
  thread_customer_service: {
    threadId: "thread_customer_service",
    type: "customer_service",
    title: "Customer Support",
    subtitle: "Reserved customer-service thread",
    participantLabels: ["Support Bot", "You"],
    pinned: false,
    doNotDisturb: true,
    unreadCount: 0,
    lastMessagePreview: "Your billing question was marked resolved.",
    lastMessageAt: "2026-04-07T18:20:00.000Z",
    lastReadAt: "2026-04-07T18:25:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: "open",
    assignment: {
      assigneeUserId: "support_agent_1",
      assigneeLabel: "Support Bot",
      teamLabel: "Billing Support",
      assignedAt: "2026-04-07T18:10:00.000Z",
      statusLabel: "Assigned to billing support",
    },
    supportProgress: {
      ticketId: "fb_seed_support",
      state: "resolved",
      queueLabel: "Billing Support",
      assigneeLabel: "Support Bot",
      nextStepLabel: "Reply to reopen this support conversation.",
    },
    members: [
      {
        userId: "support_agent_1",
        label: "Support Bot",
        role: "support_agent",
        active: true,
        canReply: true,
        joinedAt: "2026-04-07T18:10:00.000Z",
      },
      {
        userId: "self",
        label: "You",
        role: "customer",
        active: true,
        canReply: true,
        joinedAt: "2026-04-07T18:10:00.000Z",
      },
    ],
  },
  thread_group_members: {
    threadId: "thread_group_members",
    type: "group",
    title: "Member Circle (Reserved)",
    subtitle: "Reserved group-chat contract surface",
    participantLabels: ["Community Host", "You", "12 members"],
    pinned: false,
    doNotDisturb: true,
    unreadCount: 3,
    lastMessagePreview: "Weekly challenge picks are ready to review.",
    lastMessageAt: "2026-04-08T08:05:00.000Z",
    lastReadAt: "2026-04-07T21:20:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: "readonly",
    groupState: {
      memberCount: 12,
      userMember: false,
      replyPolicy: "readonly",
      readonlyReason: "Join the member circle before replying in the group lane.",
    },
    members: [
      {
        userId: "community_host_1",
        label: "Community Host",
        role: "owner",
        active: true,
        canReply: true,
        joinedAt: "2026-04-01T08:00:00.000Z",
      },
    ],
  },
};

const THREAD_MESSAGE_SEEDS: Record<string, MessageBodyItem[]> = {
  thread_private_tutor: [
    {
      messageId: "msg_private_1",
      threadId: "thread_private_tutor",
      direction: "inbound",
      senderRole: "advisor",
      senderLabel: "Tutor Mila",
      body: "I left pronunciation notes on your latest speaking task.",
      createdAt: "2026-04-08T09:10:00.000Z",
      deliveryStatus: "delivered",
      deliveredAt: "2026-04-08T09:10:05.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
    {
      messageId: "msg_private_2",
      threadId: "thread_private_tutor",
      direction: "inbound",
      senderRole: "advisor",
      senderLabel: "Tutor Mila",
      body: "Reply here if you want me to review your next recording tonight.",
      createdAt: "2026-04-08T09:12:00.000Z",
      deliveryStatus: "delivered",
      deliveredAt: "2026-04-08T09:12:04.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
  thread_consultation_case: [
    {
      messageId: "msg_consult_1",
      threadId: "thread_consultation_case",
      direction: "outbound",
      senderRole: "self",
      senderLabel: "You",
      body: "I need advice on the premium reading workflow for our consultation flow.",
      createdAt: "2026-04-08T07:42:00.000Z",
      deliveryStatus: "read",
      deliveredAt: "2026-04-08T07:43:00.000Z",
      readAt: "2026-04-08T07:44:00.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
    {
      messageId: "msg_consult_2",
      threadId: "thread_consultation_case",
      direction: "inbound",
      senderRole: "advisor",
      senderLabel: "Consultation Desk",
      body: "Your consultation request is queued for an advisor reply.",
      createdAt: "2026-04-08T07:55:00.000Z",
      deliveryStatus: "delivered",
      deliveredAt: "2026-04-08T07:55:03.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
  thread_customer_service: [
    {
      messageId: "msg_support_1",
      threadId: "thread_customer_service",
      direction: "outbound",
      senderRole: "self",
      senderLabel: "You",
      body: "Can you confirm whether my billing question was resolved?",
      createdAt: "2026-04-07T18:10:00.000Z",
      deliveryStatus: "read",
      deliveredAt: "2026-04-07T18:11:00.000Z",
      readAt: "2026-04-07T18:12:00.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
    {
      messageId: "msg_support_2",
      threadId: "thread_customer_service",
      direction: "inbound",
      senderRole: "support",
      senderLabel: "Support Bot",
      body: "Your billing question was marked resolved.",
      createdAt: "2026-04-07T18:20:00.000Z",
      deliveryStatus: "read",
      deliveredAt: "2026-04-07T18:20:02.000Z",
      readAt: "2026-04-07T18:25:00.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
  thread_group_members: [
    {
      messageId: "msg_group_1",
      threadId: "thread_group_members",
      direction: "inbound",
      senderRole: "peer",
      senderLabel: "Community Host",
      body: "Weekly challenge picks are ready to review.",
      createdAt: "2026-04-08T08:05:00.000Z",
      deliveryStatus: "delivered",
      deliveredAt: "2026-04-08T08:05:02.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
};

function cloneThreadMembers(members: MessageThreadMember[]): MessageThreadMember[] {
  return members.map((member) => ({
    userId: member.userId,
    label: member.label,
    role: member.role,
    active: member.active,
    canReply: member.canReply,
    ...(member.joinedAt ? { joinedAt: member.joinedAt } : {}),
  }));
}

function cloneMessageThread(thread: MessageThread, userState?: UserState): MessageThread {
  return {
    ...thread,
    participantLabels: [...thread.participantLabels],
    touchpoints: cloneTouchpoints(thread.touchpoints, userState, {
      resourceId: `thread:${thread.threadId}`,
      resourceLabel: `thread.${thread.type}`,
      ...(thread.lastMessageAt ? { createdAt: thread.lastMessageAt } : {}),
    }),
    ...(thread.replyPolicy ? { replyPolicy: thread.replyPolicy } : {}),
    ...(thread.members ? { members: cloneThreadMembers(thread.members) } : {}),
    ...(thread.assignment ? { assignment: { ...thread.assignment } } : {}),
    ...(thread.consultationProgress ? { consultationProgress: { ...thread.consultationProgress } } : {}),
    ...(thread.supportProgress ? { supportProgress: { ...thread.supportProgress } } : {}),
    ...(thread.groupState ? { groupState: { ...thread.groupState } } : {}),
    ...(thread.syncState ? { syncState: { ...thread.syncState } } : {}),
  };
}

function cloneMessageBodyItem(message: MessageBodyItem, userState?: UserState): MessageBodyItem {
  return {
    ...message,
    ...(message.updatedAt ? { updatedAt: message.updatedAt } : {}),
    ...(message.readAt ? { readAt: message.readAt } : {}),
    ...(message.deliveredAt ? { deliveredAt: message.deliveredAt } : {}),
    ...(message.failureCode ? { failureCode: message.failureCode } : {}),
    ...(message.failureMessage ? { failureMessage: message.failureMessage } : {}),
    touchpoints: cloneMessageTouchpointsForItem(message, userState),
  };
}

function cloneMessageItems(messages: MessageBodyItem[], userState?: UserState): MessageBodyItem[] {
  return messages.map((message) => cloneMessageBodyItem(message, userState));
}

function createThreadSyncState(cursor: string, lastSyncedAt?: string) {
  return {
    mode: "polling" as const,
    modeLabel: "Polling sync",
    cursor,
    recommendedPollIntervalMs: MESSAGE_POLL_INTERVAL_MS,
    recoverable: true,
    statusLabel: `Delivery receipts finalize through polling every ${Math.round(MESSAGE_POLL_INTERVAL_MS / 1000)} seconds.`,
    providerSummary: "External touchpoints stay explicit about sample versus production mode; in-app delivery remains the durable fallback lane.",
    ...(lastSyncedAt ? { lastSyncedAt } : {}),
  };
}

function createThreadCursor(messages: MessageBodyItem[], thread: MessageThread, updatedAt: string) {
  return `${updatedAt}:${messages.length}:${thread.unreadCount}:${thread.lastMessageAt ?? "none"}`;
}

function ensureMessageRuntimeState(userState: UserState) {
  userState.threadRecordsById ??= {};
  for (const [threadId, seed] of Object.entries(THREAD_SEEDS)) {
    const existing = userState.threadRecordsById[threadId];
    if (!existing) {
      userState.threadRecordsById[threadId] = {
        thread: cloneMessageThread(seed, userState),
        messages: [],
        syncCursor: createThreadCursor(
          THREAD_MESSAGE_SEEDS[threadId] ?? [],
          seed,
          seed.lastMessageAt ?? new Date().toISOString(),
        ),
        updatedAt: seed.lastMessageAt ?? new Date().toISOString(),
      };
    }
  }
}

function getStoredThreadRecord(
  userState: UserState,
  threadId: string,
): StoredMessageThreadRecord | undefined {
  ensureMessageRuntimeState(userState);
  return userState.threadRecordsById[threadId];
}

function getAllThreadRecords(userState: UserState): StoredMessageThreadRecord[] {
  ensureMessageRuntimeState(userState);
  return Object.values(userState.threadRecordsById);
}

function getThreadMessages(userState: UserState, threadId: string): MessageBodyItem[] {
  const record = getStoredThreadRecord(userState, threadId);
  if (!record) {
    return [];
  }
  const seeded = THREAD_MESSAGE_SEEDS[threadId]
    ? cloneMessageItems(THREAD_MESSAGE_SEEDS[threadId], userState)
    : [];
  const storedMessages = cloneMessageItems(record.messages, userState);
  const lastReadAt = userState.threadReadAtById[threadId];
  const now = new Date().toISOString();
  let storedChanged = false;

  const nextStoredMessages = storedMessages.map((message) => {
    if (message.direction === "outbound" && message.deliveryStatus === "pending") {
      storedChanged = true;
      const nextTouchpoints = message.touchpoints.map((touchpoint) => {
        if (!touchpoint.receipt || touchpoint.channel === "in_app") {
          return touchpoint;
        }
        if (touchpoint.receipt.status === "sent" || touchpoint.receipt.status === "queued") {
          return {
            ...touchpoint,
            delivered: true,
            statusLabel:
              touchpoint.providerMode === "sample"
                ? `${touchpoint.providerLabel ?? touchpoint.providerKey ?? touchpoint.channel} sample delivery finalized after polling sync.`
                : `${touchpoint.providerLabel ?? touchpoint.providerKey ?? touchpoint.channel} delivered through ${touchpoint.channel.replace("_", " ")}.`,
            receipt: {
              ...touchpoint.receipt,
              status: "delivered" as MessageTouchpointReceiptStatus,
              deliveredAt: now,
              retryable: false,
            },
          };
        }
        return touchpoint;
      });
      return {
        ...message,
        deliveryStatus: "delivered" as MessageDeliveryStatus,
        deliveredAt: now,
        retryable: false,
        updatedAt: now,
        touchpoints: nextTouchpoints,
      };
    }
    return message;
  });

  if (storedChanged) {
    record.messages = cloneMessageItems(nextStoredMessages, userState);
    userState.threadMessagesByThreadId[threadId] = cloneMessageItems(nextStoredMessages, userState);
    record.updatedAt = now;
  }

  return [...seeded, ...nextStoredMessages]
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((message) => {
      if (message.direction === "inbound" && lastReadAt && message.createdAt <= lastReadAt) {
        return {
          ...message,
          deliveryStatus: "read",
          readAt: lastReadAt,
        };
      }
      return message;
    });
}

function countUnreadThreadMessages(userState: UserState, threadId: string): number {
  const lastReadAt = userState.threadReadAtById[threadId];
  const messages = getThreadMessages(userState, threadId);
  return messages.filter((message) => {
    if (message.direction !== "inbound") {
      return false;
    }
    if (!lastReadAt) {
      return true;
    }
    return message.createdAt > lastReadAt;
  }).length;
}

function createMessageThreadActions(
  thread: MessageThread,
  messages: MessageBodyItem[] = [],
): MessageThreadActions {
  const canReply =
    thread.replyPolicy !== "readonly" &&
    !(
      thread.type === "group" &&
      thread.groupState &&
      (!thread.groupState.userMember || thread.groupState.replyPolicy === "readonly")
    );
  return {
    canReply,
    canMarkRead: thread.unreadCount > 0,
    canRetryFailed: messages.some(
      (message) =>
        message.direction === "outbound" &&
        message.deliveryStatus === "failed" &&
        message.retryable,
    ),
    canCreateThread: true,
    deliveryLabel:
      thread.type === "customer_service"
        ? "Customer-service delivery lane"
        : thread.type === "consultation"
          ? "Consultation thread delivery lane"
          : thread.type === "private"
            ? "Private message delivery lane"
            : "Polling group delivery lane",
  };
}

export function deriveThreadState(
  userState: UserState,
  threadId: string,
): MessageThread | undefined {
  const record = getStoredThreadRecord(userState, threadId);
  if (!record) {
    return undefined;
  }
  const messages = getThreadMessages(userState, threadId);
  const lastMessage = messages[messages.length - 1];
  const unreadCount = countUnreadThreadMessages(userState, threadId);
  const nextThread: MessageThread = {
    ...cloneMessageThread(record.thread, userState),
    unreadCount,
    ...(lastMessage ? { lastMessagePreview: lastMessage.body } : {}),
    ...(lastMessage ? { lastMessageAt: lastMessage.createdAt } : {}),
    ...(userState.threadReadAtById[threadId]
      ? { lastReadAt: userState.threadReadAtById[threadId] }
      : {}),
  };
  const cursor = createThreadCursor(messages, nextThread, record.updatedAt);
  nextThread.syncState = createThreadSyncState(cursor, record.updatedAt);
  record.thread = cloneMessageThread(nextThread, userState);
  record.syncCursor = cursor;
  return cloneMessageThread(nextThread, userState);
}

export function listMessageThreads(
  userState: UserState,
  input: {
    page?: number;
    pageSize?: number;
    type?: MessageThread["type"] | "all";
    onlyUnread?: boolean;
    sort?: MessageThreadListSort;
    sourceTicketId?: string;
  } = {},
): MessageThreadList {
  const allThreads = getAllThreadRecords(userState)
    .map((record) => deriveThreadState(userState, record.thread.threadId))
    .filter((thread): thread is MessageThread => Boolean(thread));
  const filtered = allThreads
    .filter((thread) =>
      input.type && input.type !== "all" ? thread.type === input.type : true,
    )
    .filter((thread) => (input.onlyUnread ? thread.unreadCount > 0 : true))
    .filter((thread) =>
      input.sourceTicketId ? thread.supportProgress?.ticketId === input.sourceTicketId : true,
    )
    .sort((left, right) => {
      if ((input.sort ?? "activity") === "unread") {
        return (
          right.unreadCount - left.unreadCount ||
          (right.lastMessageAt ?? "").localeCompare(left.lastMessageAt ?? "")
        );
      }
      return (
        (right.lastMessageAt ?? "").localeCompare(left.lastMessageAt ?? "") ||
        right.unreadCount - left.unreadCount
      );
    });
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const latestUpdatedAt =
    filtered[0]?.syncState?.lastSyncedAt ??
    filtered[0]?.lastMessageAt ??
    new Date().toISOString();
  return {
    items,
    page,
    pageSize,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length,
    ...(items[0] ? { selectedThreadId: items[0].threadId } : {}),
    syncState: createThreadSyncState(
      `${filtered.length}:${filtered[0]?.syncState?.cursor ?? "none"}`,
      latestUpdatedAt,
    ),
  };
}

export function createUnreadBadge(
  userState: UserState,
  notificationUnread: number,
): UnreadBadge {
  const threadUnread = listMessageThreads(userState, { page: 1, pageSize: 100 }).items.reduce(
    (total, thread) => total + thread.unreadCount,
    0,
  );
  const breakdown: Array<{ key: string; label: string; count: number }> = NOTIFICATION_TYPES
    .map((type) => ({
      key: type,
      label: `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`,
      count: 0,
    }))
    .filter((entry) => entry.count > 0);

  if (threadUnread > 0) {
    breakdown.push({
      key: "threads",
      label: "Threads",
      count: threadUnread,
    });
  }

  return {
    totalUnread: notificationUnread + threadUnread,
    notificationUnread,
    threadUnread,
    breakdown,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function listMessageThreadResponse(
  userState: UserState,
  input: {
    page?: number;
    pageSize?: number;
    type?: MessageThread["type"] | "all";
    onlyUnread?: boolean;
    sort?: MessageThreadListSort;
    sourceTicketId?: string;
  } = {},
): MessageThreadListResponse {
  return {
    threadList: listMessageThreads(userState, input),
    unreadBadge: createUnreadBadge(userState, 0),
  };
}

export function getMessageThread(
  userState: UserState,
  input: string | GetMessageThreadRequest,
): MessageThreadResponse | null {
  const request = typeof input === "string" ? { threadId: input } : input;
  const messageThread = deriveThreadState(userState, request.threadId);
  if (!messageThread) {
    return null;
  }
  const messageItems = getThreadMessages(userState, request.threadId);
  const detailActions = createMessageThreadActions(messageThread, messageItems);
  const changed = request.cursor ? request.cursor !== messageThread.syncState?.cursor : true;

  return {
    messageThread,
    messageItems,
    detailActions,
    unreadBadge: createUnreadBadge(userState, 0),
    threadList: listMessageThreads(userState, { page: 1, pageSize: 20 }),
    changed,
  };
}

export function markThreadRead(
  userState: UserState,
  input: MarkThreadReadRequest,
): MessageThreadResponse | null {
  const existing = getMessageThread(userState, input.threadId);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  userState.threadReadAtById[input.threadId] = now;
  const record = getStoredThreadRecord(userState, input.threadId);
  if (record) {
    record.updatedAt = now;
  }
  return getMessageThread(userState, input.threadId);
}

export function createMessageThread(
  userState: UserState,
  input: CreateMessageThreadRequest,
  now = new Date().toISOString(),
): CreateMessageThreadResponse {
  ensureMessageRuntimeState(userState);
  const threadId = `thread_${crypto.randomUUID()}`;
  const title =
    input.title ??
    (input.type === "consultation"
      ? "New Consultation"
      : input.type === "customer_service"
        ? "Support Ticket"
        : input.type === "group"
          ? "New Group"
          : "New Conversation");
  const members: MessageThreadMember[] = [
    { userId: "self", label: "You", role: "customer", active: true, canReply: true, joinedAt: now },
    ...(input.participantUserIds ?? []).map((participantUserId) => ({
      userId: participantUserId,
      label: participantUserId,
      role:
        input.type === "private"
          ? ("member" as MessageThreadMemberRole)
          : ("viewer" as MessageThreadMemberRole),
      active: true,
      canReply: input.type !== "group",
      joinedAt: now,
    })),
  ];
  const syncState = createThreadSyncState(`${now}:0:0`, now);
  const thread: MessageThread = {
    threadId,
    type: input.type,
    title,
    subtitle:
      input.type === "consultation"
        ? "Created consultation thread"
        : input.type === "customer_service"
          ? "Created customer-service thread"
          : input.type === "group"
            ? "Created group thread"
            : "Created private thread",
    participantLabels: members.map((member) => member.label),
    pinned: false,
    doNotDisturb: false,
    unreadCount: 0,
    reserved: false,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: input.replyPolicy ?? (input.type === "group" ? "members_only" : "open"),
    members,
    ...(input.type === "consultation"
      ? {
          consultationProgress: {
            caseId: `consult_${crypto.randomUUID()}`,
            state: "queued" as MessageConsultationProgress["state"],
            nextStepLabel: "An advisor will be assigned after the first message.",
          },
        }
      : {}),
    ...(input.type === "customer_service"
      ? {
          supportProgress: {
            state: "unassigned" as const,
            ...(input.sourceTicketId ? { ticketId: input.sourceTicketId } : {}),
            queueLabel: "General Support",
            nextStepLabel: "Support will assign this conversation after the first message.",
          },
        }
      : {}),
    ...(input.type === "group"
      ? {
          groupState: {
            memberCount: members.length,
            userMember: true,
            userRole: "customer",
            replyPolicy: input.replyPolicy ?? "members_only",
          },
        }
      : {}),
    syncState,
  };
  userState.threadRecordsById[threadId] = {
    thread: cloneMessageThread(thread, userState),
    messages: [],
    syncCursor: syncState.cursor,
    updatedAt: now,
  };
  userState.threadMessagesByThreadId[threadId] = [];
  return {
    messageThread: thread,
    detailActions: createMessageThreadActions(thread, []),
    unreadBadge: createUnreadBadge(userState, 0),
    threadList: listMessageThreads(userState, { page: 1, pageSize: 20 }),
  };
}

export function sendThreadMessage(
  userState: UserState,
  input: SendMessageRequest,
): SendMessageResponse | null {
  const thread = deriveThreadState(userState, input.threadId);
  if (!thread) {
    return null;
  }
  if (!createMessageThreadActions(thread).canReply) {
    return null;
  }

  const sentAt = new Date().toISOString();
  const messageId = `msg_${crypto.randomUUID()}`;
  const dispatchTouchpoints = cloneTouchpoints(
    thread.touchpoints.map((touchpoint) => {
      const { receipt: _receipt, delivered: _delivered, statusLabel: _statusLabel, ...dispatchSeed } =
        touchpoint;
      return dispatchSeed;
    }),
    userState,
    {
      resourceId: `message:${messageId}`,
      resourceLabel: `message.${thread.type}`,
      createdAt: sentAt,
      body: input.body,
    },
  ).map((touchpoint) => {
    if (!touchpoint.receipt || touchpoint.channel === "in_app" || touchpoint.receipt.status !== "delivered") {
      return touchpoint;
    }
    const sentReceipt: MessageTouchpointReceipt = {
      receiptId: touchpoint.receipt.receiptId,
      status: "sent",
      retryCount: touchpoint.receipt.retryCount,
      retryable: touchpoint.receipt.retryable,
      ...(touchpoint.receipt.attemptedAt ? { attemptedAt: touchpoint.receipt.attemptedAt } : {}),
      ...(touchpoint.receipt.nextRetryAt ? { nextRetryAt: touchpoint.receipt.nextRetryAt } : {}),
      ...(touchpoint.receipt.providerReference
        ? { providerReference: touchpoint.receipt.providerReference }
        : {}),
    };
    return {
      ...touchpoint,
      delivered: false,
      statusLabel:
        touchpoint.providerMode === "sample"
          ? `${touchpoint.providerLabel ?? touchpoint.providerKey ?? touchpoint.channel} sample dispatch accepted; polling sync will finalize the receipt.`
          : `${touchpoint.providerLabel ?? touchpoint.providerKey ?? touchpoint.channel} accepted the dispatch and is awaiting receipt.`,
      receipt: sentReceipt,
    };
  });
  const failed = dispatchTouchpoints.some((touchpoint) => touchpoint.receipt?.status === "failed");
  const persistedTouchpoints: MessageTouchpoint[] = dispatchTouchpoints.map((touchpoint) => {
    if (touchpoint.channel === "in_app" || !touchpoint.receipt) {
      return touchpoint;
    }
    const receipt = touchpoint.receipt;
    const persistedReceipt: MessageTouchpointReceipt = {
      receiptId: receipt.receiptId,
      status: receipt.status,
      retryCount: receipt.retryCount,
      retryable: receipt.retryable,
      ...(receipt.attemptedAt ? { attemptedAt: receipt.attemptedAt } : {}),
      ...(receipt.deliveredAt ? { deliveredAt: receipt.deliveredAt } : {}),
      ...(receipt.failedAt ? { failedAt: receipt.failedAt } : {}),
      ...(receipt.failureCode ? { failureCode: receipt.failureCode } : {}),
      ...(receipt.failureMessage ? { failureMessage: receipt.failureMessage } : {}),
      ...(receipt.nextRetryAt ? { nextRetryAt: receipt.nextRetryAt } : {}),
      ...(receipt.providerReference ? { providerReference: `${receipt.providerReference}_${messageId}` } : {}),
    };
    return {
      ...touchpoint,
      receipt: persistedReceipt,
    };
  });

  const messageItem: MessageBodyItem = {
    messageId,
    threadId: input.threadId,
    direction: "outbound",
    senderRole: "self",
    senderLabel: "You",
    body: input.body,
    createdAt: sentAt,
    deliveryStatus: failed ? "failed" : "pending",
    attemptCount: 1,
    retryable: failed,
    ...(failed
        ? {
          failureCode: "DELIVERY_FAILED",
          failureMessage: "Sample delivery intentionally failed; retry and polling sync can advance the receipt.",
        }
      : {}),
    touchpoints: persistedTouchpoints,
  };
  const record = getStoredThreadRecord(userState, input.threadId);
  if (!record) {
    return null;
  }
  const existingMessages = cloneMessageItems(record.messages, userState);
  const nextMessages = [...existingMessages, messageItem];
  record.messages = nextMessages;
  userState.threadMessagesByThreadId[input.threadId] = nextMessages;
  record.updatedAt = sentAt;
  if (thread.type === "consultation") {
    record.thread.consultationProgress = {
      caseId: record.thread.consultationProgress?.caseId ?? `consult_${crypto.randomUUID()}`,
      state: "in_progress",
      advisorLabel: record.thread.assignment?.assigneeLabel ?? "Advisor Nia",
      nextStepLabel: failed ? "Retry the failed consultation message." : "Wait for the advisor reply or add more detail.",
    };
  }
  if (thread.type === "customer_service") {
    record.thread.assignment = record.thread.assignment ?? {
      assigneeUserId: "support_agent_1",
      assigneeLabel: "Support Bot",
      teamLabel: "General Support",
      assignedAt: sentAt,
      statusLabel: "Assigned after first outbound support message",
    };
    record.thread.supportProgress = {
      state: failed ? "waiting_user" : "assigned",
      ...(record.thread.supportProgress?.ticketId ? { ticketId: record.thread.supportProgress.ticketId } : {}),
      queueLabel: record.thread.assignment.teamLabel ?? "General Support",
      assigneeLabel: record.thread.assignment.assigneeLabel ?? "Support Bot",
      nextStepLabel: failed ? "Retry this support reply." : "Support will continue in the same thread.",
    };
  }
  const messageThread = deriveThreadState(userState, input.threadId);
  if (!messageThread) {
    return null;
  }

  return {
    messageThread,
    messageItem,
    detailActions: createMessageThreadActions(messageThread, getThreadMessages(userState, input.threadId)),
    unreadBadge: createUnreadBadge(userState, 0),
    threadList: listMessageThreads(userState, { page: 1, pageSize: 20 }),
  };
}

export function retryThreadMessage(
  userState: UserState,
  input: RetryMessageRequest,
): RetryMessageResponse | null {
  const record = getStoredThreadRecord(userState, input.threadId);
  if (!record) {
    return null;
  }
  const target = record.messages.find((message) => message.messageId === input.messageId);
  if (!target || target.deliveryStatus !== "failed" || !target.retryable) {
    return null;
  }
  const retriedAt = new Date().toISOString();
  target.deliveryStatus = "pending";
  target.retryable = false;
  target.attemptCount += 1;
  target.updatedAt = retriedAt;
  delete target.failureCode;
  delete target.failureMessage;
  target.touchpoints = target.touchpoints.map((touchpoint) => {
    if (!touchpoint.receipt || touchpoint.channel === "in_app" || touchpoint.receipt.status !== "failed") {
      return touchpoint;
    }
    return {
      ...touchpoint,
      delivered: false,
      statusLabel:
        touchpoint.providerMode === "sample"
          ? `${touchpoint.providerLabel ?? touchpoint.providerKey ?? touchpoint.channel} sample retry queued; polling sync will finalize the next receipt.`
          : `${touchpoint.providerLabel ?? touchpoint.providerKey ?? touchpoint.channel} retry queued.`,
      receipt: {
        ...touchpoint.receipt,
        status: "sent" as MessageTouchpointReceiptStatus,
        attemptedAt: retriedAt,
        retryCount: touchpoint.receipt.retryCount + 1,
        retryable: false,
        ...(touchpoint.receipt.providerReference ? { providerReference: touchpoint.receipt.providerReference } : {}),
      },
    };
  });
  record.updatedAt = retriedAt;
  userState.threadMessagesByThreadId[input.threadId] = cloneMessageItems(record.messages, userState);
  const messageThread = deriveThreadState(userState, input.threadId);
  if (!messageThread) {
    return null;
  }
  const messageItem = cloneMessageBodyItem(target, userState);
  return {
    messageThread,
    messageItem,
    detailActions: createMessageThreadActions(messageThread, getThreadMessages(userState, input.threadId)),
    unreadBadge: createUnreadBadge(userState, 0),
    threadList: listMessageThreads(userState, { page: 1, pageSize: 20 }),
  };
}

export function syncMessageThread(
  userState: UserState,
  input: SyncMessageThreadRequest,
): MessageThreadResponse | null {
  return getMessageThread(userState, {
    threadId: input.threadId,
    ...(input.cursor !== undefined ? { cursor: input.cursor } : {}),
  });
}
