import { NOTIFICATION_TYPES } from "@minix/contracts";
import type {
  MarkNotificationsReadResponse,
  NotificationFilterGroup,
  NotificationGroupSummary,
  NotificationItem,
  NotificationList,
  NotificationListResponse,
  NotificationType,
  UnreadBadge,
} from "@minix/contracts";

import type { UserState } from "../../types";
import { createApiPaginationWindow } from "../pagination";
import { formatTitleTokenLabel } from "../text";
import type { NotificationChannelProviderRuntimeEnv } from "../settings/state";
import { cloneTouchpoints, DEFAULT_MESSAGE_TOUCHPOINTS } from "./touchpoints";
import { createMessageDeliveryPosture, deriveThreadState, listMessageThreads } from "./threads";

interface NotificationSeed {
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
  tagLabels: string[];
  threadId?: string;
}

const NOTIFICATION_SEEDS: NotificationSeed[] = [
  {
    id: "notice_system_security",
    type: "system",
    groupKey: "security",
    groupLabel: "Security",
    title: "New device sign-in detected",
    summary: "A new H5 session was created for your account. Review the session if this was not you.",
    bodyPreview: "Security events surface here before vendor-backed push or SMS delivery is added.",
    createdAt: "2026-04-08T09:25:00.000Z",
    updatedAt: "2026-04-08T09:25:00.000Z",
    pinned: true,
    doNotDisturb: false,
    tagLabels: ["security", "session"],
    threadId: "thread_customer_service",
  },
  {
    id: "notice_business_payment",
    type: "business",
    groupKey: "orders",
    groupLabel: "Orders",
    title: "Membership payment confirmed",
    summary: "Your membership entitlement is active and premium reading has been unlocked.",
    bodyPreview: "This item links the order/payment foundation into the shared inbox model.",
    createdAt: "2026-04-08T08:50:00.000Z",
    updatedAt: "2026-04-08T08:52:00.000Z",
    pinned: true,
    doNotDisturb: false,
    tagLabels: ["payment", "entitlement"],
  },
  {
    id: "notice_campaign_challenge",
    type: "campaign",
    groupKey: "growth",
    groupLabel: "Growth",
    title: "Seven-day speaking challenge is live",
    summary: "Invite a friend or join the reserved member group to start the next challenge.",
    bodyPreview: "Campaign notices keep attribution-friendly metadata in a shared structure.",
    createdAt: "2026-04-08T07:40:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["campaign", "invite"],
    threadId: "thread_group_members",
  },
  {
    id: "notice_review_article",
    type: "review",
    groupKey: "moderation",
    groupLabel: "Moderation",
    title: "Your draft feedback was approved",
    summary: "The editorial review step is complete and the content is now visible.",
    bodyPreview: "Review notices reserve the moderation lane before the general content workflow lands.",
    createdAt: "2026-04-08T07:05:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["review", "content"],
  },
  {
    id: "notice_business_consultation",
    type: "business",
    groupKey: "consultation",
    groupLabel: "Consultation",
    title: "Consultation reply received",
    summary: "An advisor replied to your latest consultation request.",
    bodyPreview: "Conversation threads stay separate from notifications, but this notice can reference one.",
    createdAt: "2026-04-07T21:15:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["consultation", "advisor"],
    threadId: "thread_consultation_case",
  },
  {
    id: "notice_system_learning",
    type: "system",
    groupKey: "learning",
    groupLabel: "Learning",
    title: "Daily plan is ready",
    summary: "Overview and today's plan have been refreshed with a new practice queue.",
    createdAt: "2026-04-07T20:45:00.000Z",
    pinned: false,
    doNotDisturb: true,
    tagLabels: ["plan", "overview"],
  },
  {
    id: "notice_review_profile",
    type: "review",
    groupKey: "account",
    groupLabel: "Account",
    title: "Profile update under review",
    summary: "Your new profile description is being reviewed before it appears publicly.",
    createdAt: "2026-04-07T18:10:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["profile", "review"],
  },
];

function createNotificationItem(
  seed: NotificationSeed,
  userState: UserState,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): NotificationItem {
  const readAt = userState.notificationReadAtById[seed.id];
  const thread = seed.threadId ? deriveThreadState(userState, seed.threadId, runtimeEnv) : undefined;

  return {
    id: seed.id,
    type: seed.type,
    groupKey: seed.groupKey,
    groupLabel: seed.groupLabel,
    title: seed.title,
    summary: seed.summary,
    ...(seed.bodyPreview ? { bodyPreview: seed.bodyPreview } : {}),
    createdAt: seed.createdAt,
    ...(seed.updatedAt ? { updatedAt: seed.updatedAt } : {}),
    pinned: seed.pinned,
    doNotDisturb: seed.doNotDisturb,
    receipt: {
      read: Boolean(readAt),
      ...(readAt ? { readAt } : {}),
      readReceiptRequired: true,
    },
    touchpoints: cloneTouchpoints(DEFAULT_MESSAGE_TOUCHPOINTS, userState, {
      resourceId: `notification:${seed.id}`,
      resourceLabel: `notification.${seed.type}`,
      createdAt: seed.createdAt,
      ...(seed.bodyPreview ? { body: seed.bodyPreview } : {}),
    }, runtimeEnv),
    tagLabels: [...seed.tagLabels],
    ...(thread
      ? {
          thread: {
            threadId: thread.threadId,
            type: thread.type,
            title: thread.title,
            ...(thread.lastMessagePreview ? { lastMessagePreview: thread.lastMessagePreview } : {}),
            reserved: thread.reserved,
          },
        }
      : {}),
  };
}

function sortNotifications(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }
    return right.createdAt.localeCompare(left.createdAt);
  });
}

function createNotificationGroups(items: NotificationItem[]): NotificationGroupSummary[] {
  return Array.from(
    items.reduce((map, item) => {
      const existing = map.get(item.groupKey);
      map.set(item.groupKey, {
        key: item.groupKey,
        label: item.groupLabel,
        count: (existing?.count ?? 0) + 1,
      });
      return map;
    }, new Map<string, NotificationGroupSummary>()),
  )
    .map(([, value]) => value)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function createNotificationFilters(
  allItems: NotificationItem[],
  activeType: string | undefined,
  activeGroupKey: string | undefined,
  onlyUnread: boolean,
): NotificationFilterGroup[] {
  const typeCounts = NOTIFICATION_SEEDS.reduce<Record<string, number>>((counts, seed) => {
    counts[seed.type] = (counts[seed.type] ?? 0) + 1;
    return counts;
  }, {});
  const groupCounts = NOTIFICATION_SEEDS.reduce<Record<string, number>>((counts, seed) => {
    counts[seed.groupKey] = (counts[seed.groupKey] ?? 0) + 1;
    return counts;
  }, {});
  const groupLabels = new Map(NOTIFICATION_SEEDS.map((seed) => [seed.groupKey, seed.groupLabel]));

  return [
    {
      key: "type",
      label: "Type",
      selectedKeys: activeType && activeType !== "all" ? [activeType] : [],
      options: [
        { key: "all", label: "All", count: allItems.length },
        { key: "system", label: "System", count: typeCounts.system ?? 0 },
        { key: "business", label: "Business", count: typeCounts.business ?? 0 },
        { key: "campaign", label: "Campaign", count: typeCounts.campaign ?? 0 },
        { key: "review", label: "Review", count: typeCounts.review ?? 0 },
      ],
    },
    {
      key: "group",
      label: "Group",
      selectedKeys: activeGroupKey && activeGroupKey !== "all" ? [activeGroupKey] : [],
      options: [
        { key: "all", label: "All groups", count: allItems.length },
        ...Object.entries(groupCounts)
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .map(([key, count]) => ({
            key,
            label: groupLabels.get(key) ?? key,
            count,
          })),
      ],
    },
    {
      key: "state",
      label: "State",
      selectedKeys: onlyUnread ? ["unread"] : [],
      options: [
        { key: "all", label: "All", count: allItems.length },
        { key: "unread", label: "Unread", count: allItems.filter((item) => !item.receipt.read).length },
      ],
    },
  ];
}

function createNotificationList(
  userState: UserState,
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
  },
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): NotificationList {
  const allItems = sortNotifications(
    NOTIFICATION_SEEDS.map((seed) => createNotificationItem(seed, userState, runtimeEnv)),
  );
  const activeType = input.type && input.type !== "all" ? input.type : undefined;
  const activeGroupKey = input.groupKey && input.groupKey !== "all" ? input.groupKey : undefined;
  const onlyUnread = Boolean(input.onlyUnread);

  let filteredItems = allItems;
  if (activeType) {
    filteredItems = filteredItems.filter((item) => item.type === activeType);
  }
  if (activeGroupKey) {
    filteredItems = filteredItems.filter((item) => item.groupKey === activeGroupKey);
  }
  if (onlyUnread) {
    filteredItems = filteredItems.filter((item) => !item.receipt.read);
  }

  const pageWindow = createApiPaginationWindow(filteredItems, {
    page: input.page,
    pageSize: input.pageSize,
    defaultPageSize: 6,
  });

  return {
    items: pageWindow.items,
    page: pageWindow.page,
    pageSize: pageWindow.pageSize,
    total: pageWindow.total,
    hasMore: pageWindow.hasMore,
    grouping: "type",
    groups: createNotificationGroups(filteredItems),
    filters: createNotificationFilters(allItems, activeType, activeGroupKey, onlyUnread),
    onlyUnread,
    ...(pageWindow.items[0] ? { selectedNotificationId: pageWindow.items[0].id } : {}),
  };
}

export function getUnreadBadge(
  userState: UserState,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): UnreadBadge {
  const notifications = sortNotifications(
    NOTIFICATION_SEEDS.map((seed) => createNotificationItem(seed, userState, runtimeEnv)),
  );
  const notificationUnread = notifications.filter((item) => !item.receipt.read).length;
  const threadUnread = listMessageThreads(userState, { page: 1, pageSize: 100 }, runtimeEnv).items.reduce(
    (total, thread) => total + thread.unreadCount,
    0,
  );
  const breakdown: Array<{ key: string; label: string; count: number }> = NOTIFICATION_TYPES
    .map((type) => ({
      key: type,
      label: formatTitleTokenLabel(type),
      count: notifications.filter((item) => item.type === type && !item.receipt.read).length,
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

export function listNotifications(
  userState: UserState,
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
    threadId?: string | undefined;
  },
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): NotificationListResponse {
  const notificationList = createNotificationList(userState, input, runtimeEnv);
  const threadList = listMessageThreads(userState, { page: 1, pageSize: 20 }, runtimeEnv);
  const reservedThreads = threadList.items;
  const selectedThread =
    (input.threadId ? threadList.items.find((thread) => thread.threadId === input.threadId) : undefined) ??
    reservedThreads.find((thread) => thread.unreadCount > 0) ??
    reservedThreads[0];

  return {
    notificationList,
    messageThread: selectedThread
      ? {
          ...selectedThread,
          participantLabels: [...selectedThread.participantLabels],
          touchpoints: cloneTouchpoints(selectedThread.touchpoints, userState, undefined, runtimeEnv),
        }
      : undefined,
    unreadBadge: getUnreadBadge(userState, runtimeEnv),
    reservedThreads,
    threadList,
    deliveryPosture: createMessageDeliveryPosture(userState, runtimeEnv, {
      threads: threadList.items,
    }),
  };
}

export function markNotificationsRead(
  userState: UserState,
  input: {
    notificationIds: string[];
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
  },
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): MarkNotificationsReadResponse {
  const updatedIds = input.notificationIds.filter((notificationId) =>
    NOTIFICATION_SEEDS.some((seed) => seed.id === notificationId),
  );
  const timestamp = new Date().toISOString();

  for (const notificationId of updatedIds) {
    userState.notificationReadAtById[notificationId] = timestamp;
  }

  return {
    updatedIds,
    notificationList: createNotificationList(userState, input, runtimeEnv),
    unreadBadge: getUnreadBadge(userState, runtimeEnv),
  };
}
