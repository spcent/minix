import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";
import {
  APP_ROUTE_IDS,
  type CreateMessageThreadResponse,
  type MarkNotificationsReadResponse,
  type MessageBodyItem,
  type MessageDeliveryPosture,
  type MessageThread,
  type MessageThreadListResponse,
  type MessageThreadResponse,
  type NotificationListResponse,
  type RetryMessageResponse,
  type SendMessageResponse,
} from "@minix/contracts";

import { createMessagesController } from "./index";
import { createDefaultMessagesState } from "../model";

function createThread(unreadCount: number, lastMessagePreview = "Reply"): MessageThread {
  return {
    threadId: "thread-1",
    type: "private",
    title: "Tutor",
    participantLabels: ["Tutor", "You"],
    pinned: true,
    doNotDisturb: false,
    unreadCount,
    lastMessagePreview,
    lastMessageAt: "2026-04-08T09:10:00.000Z",
    reserved: true,
    touchpoints: [],
    replyPolicy: "open",
    members: [
      { userId: "advisor-1", label: "Tutor", role: "advisor", active: true, canReply: true, joinedAt: "2026-04-08T08:00:00.000Z" },
      { userId: "self", label: "You", role: "customer", active: true, canReply: true, joinedAt: "2026-04-08T08:00:00.000Z" },
    ],
    syncState: {
      mode: "polling",
      cursor: `cursor-${unreadCount}-${lastMessagePreview}`,
      recommendedPollIntervalMs: 3000,
      recoverable: true,
      lastSyncedAt: "2026-04-08T09:10:00.000Z",
    },
    supportProgress: {
      state: "assigned",
      queueLabel: "Product Support",
      assigneeLabel: "Support Bot",
      nextStepLabel: "Reply in the same thread to continue follow-up.",
      supportLoopSummary: "Product Support is now handling this case in the shared support thread.",
      operatorActionSummary:
        "Product Support can reassign the queue or update template posture while external delivery remains in explicit sample mode.",
    },
  };
}

function createInboundMessage(unreadCount: number): MessageBodyItem {
  return {
    messageId: "msg-1",
    threadId: "thread-1",
    direction: "inbound",
    senderRole: "advisor",
    senderLabel: "Tutor",
    body: "Please review the latest task.",
    createdAt: "2026-04-08T09:00:00.000Z",
    deliveryStatus: unreadCount > 0 ? "delivered" : "read",
    ...(unreadCount > 0 ? {} : { readAt: "2026-04-08T09:30:00.000Z" }),
    deliveredAt: "2026-04-08T09:00:02.000Z",
    attemptCount: 1,
    retryable: false,
    touchpoints: [],
  };
}

function createOutboundMessage(
  body: string,
  status: "sent" | "pending" | "delivered" | "failed" = "sent",
  attemptCount = 1,
): MessageBodyItem {
  return {
    messageId: "msg-out-1",
    threadId: "thread-1",
    direction: "outbound",
    senderRole: "self",
    senderLabel: "You",
    body,
    createdAt: "2026-04-08T09:31:00.000Z",
    deliveryStatus: status,
    ...(status === "delivered" ? { deliveredAt: "2026-04-08T09:31:04.000Z" } : {}),
    ...(status === "failed"
      ? { failureCode: "DELIVERY_FAILED", failureMessage: "Sample delivery failure." }
      : {}),
    attemptCount,
    retryable: status === "failed",
    touchpoints: [
      {
        channel: "subscription_message",
        executable: true,
        enabled: true,
        statusLabel: status === "failed" ? "Sample gateway is temporarily unavailable." : "Sample gateway accepted the dispatch.",
        deliverySummary:
          status === "failed"
            ? "Sample gateway failed to deliver through subscription message; retry or operator intervention can restore the external lane."
            : "Sample gateway accepted the subscription message dispatch and polling will finalize the receipt.",
        fallbackSummary: "If this external lane fails or is skipped, the in-app inbox remains the durable fallback.",
        providerKey: "wechat_subscription",
        providerLabel: "Sample gateway",
        providerMode: "sample",
        receipt: {
          receiptId: "receipt-out-1",
          status: status === "failed" ? "failed" : "sent",
          retryCount: attemptCount - 1,
          retryable: status === "failed",
          attemptSummary:
            status === "failed"
              ? `${attemptCount} attempts; delivery failed and can be retried.`
              : `${attemptCount} attempts; accepted by the provider and waiting for polling confirmation.`,
        },
      },
    ],
  };
}

function createDeliveryPosture(overrides: Partial<MessageDeliveryPosture> = {}): MessageDeliveryPosture {
  return {
    providerMode: "sample",
    syncMode: "polling",
    realtimeProvisioned: false,
    pollingIntervalMs: 3000,
    pollingAcceptanceSummary: "Polling-only delivery acceptance runs every 3 seconds; realtime transport is not provisioned.",
    providerSummary: "Message touchpoints remain in explicit sample provider posture, with in-app delivery as durable fallback.",
    receiptHistorySummary: "1 provider receipt(s) tracked across notification and thread touchpoints.",
    retrySummary: "No retryable delivery receipts are pending.",
    failedReceiptCount: 0,
    retryableReceiptCount: 0,
    touchpointChannels: ["in_app", "subscription_message", "sms", "email", "push"],
    supportLoopSummary: "Product Support is now handling this case in the shared support thread.",
    ...overrides,
  };
}

function createThreadResponse(unreadCount: number, sentMessageBody?: string, changed = true): MessageThreadResponse {
  const messageThread = createThread(unreadCount, sentMessageBody ?? "Reply");
  return {
    messageThread,
    messageItems: [createInboundMessage(unreadCount), ...(sentMessageBody ? [createOutboundMessage(sentMessageBody)] : [])],
    detailActions: {
      canReply: true,
      canMarkRead: unreadCount > 0,
      canRetryFailed: false,
      canCreateThread: true,
      deliveryLabel: "Private message delivery lane",
    },
    unreadBadge: {
      totalUnread: 2 + unreadCount,
      notificationUnread: 2,
      threadUnread: unreadCount,
      breakdown: [{ key: "system", label: "System", count: 1 }],
    },
    threadList: {
      items: [messageThread],
      page: 1,
      pageSize: 20,
      total: 1,
      hasMore: false,
      selectedThreadId: messageThread.threadId,
      ...(messageThread.syncState ? { syncState: messageThread.syncState } : {}),
    },
    deliveryPosture: createDeliveryPosture(),
    changed,
  };
}

function createNotificationListResponse(): NotificationListResponse {
  const thread = createThread(1);
  return {
    notificationList: {
      items: [
        {
          id: "notice-1",
          type: "system",
          groupKey: "security",
          groupLabel: "Security",
          title: "Security update",
          summary: "First page notification",
          createdAt: "2026-04-08T09:00:00.000Z",
          pinned: true,
          doNotDisturb: false,
          receipt: {
            read: false,
            readReceiptRequired: true,
          },
          touchpoints: [],
          tagLabels: ["security"],
        },
      ],
      page: 1,
      pageSize: 6,
      total: 2,
      hasMore: true,
      grouping: "type",
      groups: [{ key: "security", label: "Security", count: 1 }],
      filters: [
        {
          key: "type",
          label: "Type",
          selectedKeys: [],
          options: [
            { key: "all", label: "All", count: 2 },
            { key: "system", label: "System", count: 1 },
          ],
        },
      ],
      onlyUnread: false,
      selectedNotificationId: "notice-1",
    },
    messageThread: thread,
    unreadBadge: {
      totalUnread: 3,
      notificationUnread: 2,
      threadUnread: 1,
      breakdown: [{ key: "system", label: "System", count: 1 }],
    },
    reservedThreads: [thread],
    threadList: {
      items: [thread],
      page: 1,
      pageSize: 20,
      total: 1,
      hasMore: false,
      selectedThreadId: thread.threadId,
      ...(thread.syncState ? { syncState: thread.syncState } : {}),
    },
    deliveryPosture: createDeliveryPosture(),
  };
}

function createKernelStub() {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  let requestMode: "success" | "unauthorized" = "success";
  let threadUnreadCount = 1;
  let sentMessageBody: string | undefined;
  let lastDeliveryStatus: "sent" | "pending" | "delivered" | "failed" = "sent";
  let messageAttemptCount = 1;
  let currentRoute: { path: string; params?: Record<string, string | number | boolean> } = { path: "/messages" };

  const kernel: AppKernel = {
    env: {
      appId: "test",
      appName: "test",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "1.0.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {
      async get() {
        return ok(null);
      },
      async set() {
        return ok(undefined);
      },
      async remove() {
        return ok(undefined);
      },
      async clear() {
        return ok(undefined);
      },
    },
    session: {} as AppKernel["session"],
    request: {
      async get<T>(url: string, query?: Record<string, unknown>) {
        if (requestMode === "unauthorized") {
          return {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Message session expired",
              recoverable: true,
            },
          } as const;
        }

        if (url === "/messages/thread") {
          const response = createThreadResponse(threadUnreadCount, sentMessageBody);
          if (sentMessageBody) {
            response.messageItems = [createInboundMessage(threadUnreadCount), createOutboundMessage(sentMessageBody, lastDeliveryStatus, messageAttemptCount)];
            response.detailActions.canRetryFailed = lastDeliveryStatus === "failed";
          }
          response.messageThread.threadId = String(query?.threadId ?? "thread-1");
          return ok(response as T);
        }

        if (url === "/messages/thread/sync") {
          const response = createThreadResponse(threadUnreadCount, sentMessageBody, query?.cursor !== "cursor-stable");
          if (sentMessageBody) {
            response.messageItems = [
              createInboundMessage(threadUnreadCount),
              createOutboundMessage(sentMessageBody, query?.cursor ? "delivered" : lastDeliveryStatus === "failed" ? "failed" : "delivered", messageAttemptCount),
            ];
          }
          return ok(response as T);
        }

        if (url === "/messages/threads") {
          const thread = createThread(threadUnreadCount, sentMessageBody ?? "Reply");
          const response: MessageThreadListResponse = {
            threadList: {
              items: [thread],
              page: Number(query?.page ?? 1),
              pageSize: Number(query?.pageSize ?? 20),
              total: 1,
              hasMore: false,
              selectedThreadId: thread.threadId,
              ...(thread.syncState ? { syncState: thread.syncState } : {}),
            },
            unreadBadge: {
              totalUnread: 2 + threadUnreadCount,
              notificationUnread: 2,
              threadUnread: threadUnreadCount,
              breakdown: [{ key: "system", label: "System", count: 1 }],
            },
            deliveryPosture: createDeliveryPosture(),
          };
          return ok(response as T);
        }

        if (Number(query?.page ?? 1) === 2) {
          const response = createNotificationListResponse();
          response.notificationList.items = [
            {
              id: "notice-2",
              type: "business",
              groupKey: "orders",
              groupLabel: "Orders",
              title: "Order update",
              summary: "Second page notification",
              createdAt: "2026-04-08T08:00:00.000Z",
              pinned: false,
              doNotDisturb: false,
              receipt: {
                read: false,
                readReceiptRequired: true,
              },
              touchpoints: [],
              tagLabels: ["orders"],
            },
          ];
          response.notificationList.page = 2;
          response.notificationList.hasMore = false;
          response.notificationList.selectedNotificationId = "notice-2";
          return ok(response as T);
        }

        return ok(createNotificationListResponse() as T);
      },
      async post<T>(url: string, body?: Record<string, unknown>) {
        if (url === "/messages/thread/read") {
          threadUnreadCount = 0;
          return ok(createThreadResponse(0, sentMessageBody) as T);
        }

        if (url === "/messages/thread/send") {
          sentMessageBody = String(body?.body ?? "");
          lastDeliveryStatus = sentMessageBody.includes("retry") ? "failed" : "pending";
          messageAttemptCount = 1;
          const response: SendMessageResponse = {
            messageThread: createThread(threadUnreadCount, sentMessageBody),
            messageItem: createOutboundMessage(sentMessageBody, lastDeliveryStatus, messageAttemptCount),
            detailActions: {
              canReply: true,
              canMarkRead: threadUnreadCount > 0,
              canRetryFailed: lastDeliveryStatus === "failed",
              canCreateThread: true,
              deliveryLabel: "Private message delivery lane",
            },
            unreadBadge: {
              totalUnread: 2 + threadUnreadCount,
              notificationUnread: 2,
              threadUnread: threadUnreadCount,
              breakdown: [{ key: "system", label: "System", count: 1 }],
            },
            threadList: {
              items: [createThread(threadUnreadCount, sentMessageBody)],
              page: 1,
              pageSize: 20,
              total: 1,
              hasMore: false,
              selectedThreadId: "thread-1",
            },
            deliveryPosture: createDeliveryPosture({
              retrySummary: lastDeliveryStatus === "failed"
                ? "1 receipt(s) are retryable; failed messages stay visible until polling or retry resolves them."
                : "No retryable delivery receipts are pending.",
              failedReceiptCount: lastDeliveryStatus === "failed" ? 1 : 0,
              retryableReceiptCount: lastDeliveryStatus === "failed" ? 1 : 0,
            }),
          };
          return ok(response as T);
        }

        if (url === "/messages/thread/retry") {
          lastDeliveryStatus = "pending";
          messageAttemptCount = 2;
          const response: RetryMessageResponse = {
            messageThread: createThread(threadUnreadCount, sentMessageBody ?? "Reply"),
            messageItem: createOutboundMessage(sentMessageBody ?? "retry", "pending", messageAttemptCount),
            detailActions: {
              canReply: true,
              canMarkRead: threadUnreadCount > 0,
              canRetryFailed: false,
              canCreateThread: true,
              deliveryLabel: "Private message delivery lane",
            },
            unreadBadge: {
              totalUnread: 2 + threadUnreadCount,
              notificationUnread: 2,
              threadUnread: threadUnreadCount,
              breakdown: [{ key: "system", label: "System", count: 1 }],
            },
            threadList: {
              items: [createThread(threadUnreadCount, sentMessageBody ?? "Reply")],
              page: 1,
              pageSize: 20,
              total: 1,
              hasMore: false,
              selectedThreadId: "thread-1",
            },
            deliveryPosture: createDeliveryPosture({
              retrySummary: "No retryable delivery receipts are pending.",
            }),
          };
          return ok(response as T);
        }

        if (url === "/messages/thread/create") {
          const response: CreateMessageThreadResponse = {
            messageThread: {
              ...createThread(0, "New conversation"),
              threadId: "thread-created",
              type: String(body?.type ?? "private") as MessageThread["type"],
              title: String(body?.title ?? "New Conversation"),
              reserved: false,
              unreadCount: 0,
            },
            detailActions: {
              canReply: true,
              canMarkRead: false,
              canRetryFailed: false,
              canCreateThread: true,
              deliveryLabel: "Private message delivery lane",
            },
            unreadBadge: {
              totalUnread: 2,
              notificationUnread: 2,
              threadUnread: 0,
              breakdown: [{ key: "system", label: "System", count: 1 }],
            },
            threadList: {
              items: [
                {
                  ...createThread(0, "New conversation"),
                  threadId: "thread-created",
                  title: String(body?.title ?? "New Conversation"),
                  reserved: false,
                },
                createThread(threadUnreadCount, sentMessageBody ?? "Reply"),
              ],
              page: 1,
              pageSize: 20,
              total: 2,
              hasMore: false,
              selectedThreadId: "thread-created",
            },
            deliveryPosture: createDeliveryPosture(),
          };
          return ok(response as T);
        }

        const response: MarkNotificationsReadResponse = {
          updatedIds: (body?.notificationIds as string[]) ?? [],
          notificationList: {
            items: [
              {
                id: "notice-1",
                type: "system",
                groupKey: "security",
                groupLabel: "Security",
                title: "Security update",
                summary: "Read now",
                createdAt: "2026-04-08T09:00:00.000Z",
                pinned: true,
                doNotDisturb: false,
                receipt: {
                  read: true,
                  readAt: "2026-04-08T09:30:00.000Z",
                  readReceiptRequired: true,
                },
                touchpoints: [],
                tagLabels: ["security"],
              },
            ],
            page: Number(body?.page ?? 1),
            pageSize: Number(body?.pageSize ?? 6),
            total: 1,
            hasMore: false,
            grouping: "type",
            groups: [{ key: "security", label: "Security", count: 1 }],
            filters: [],
            onlyUnread: false,
            selectedNotificationId: "notice-1",
          },
          unreadBadge: {
            totalUnread: 1,
            notificationUnread: 0,
            threadUnread: 1,
            breakdown: [{ key: "threads", label: "Threads", count: 1 }],
          },
        };

        return ok(response as T);
      },
      async put<T>() {
        return ok({} as T);
      },
      async patch<T>() {
        return ok({} as T);
      },
      async delete<T>() {
        return ok({} as T);
      },
    },
    auth: {} as AppKernel["auth"],
    router: {
      async to() {
        return ok(undefined);
      },
      async replace() {
        return ok(undefined);
      },
      async toRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        currentRoute = {
          path: typeof routeId === "string" ? routeId : currentRoute.path,
          ...(params ? { params } : {}),
        };
        return ok(undefined);
      },
      async replaceRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        currentRoute = {
          path: typeof routeId === "string" ? routeId : currentRoute.path,
          ...(params ? { params } : {}),
        };
        return ok(undefined);
      },
      resolve() {
        return ok("/messages");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok(currentRoute);
      },
    },
    ui: {} as AppKernel["ui"],
  };

  return {
    kernel,
    routeCalls,
    setRequestMode(mode: "success" | "unauthorized") {
      requestMode = mode;
    },
    setCurrentRoute(nextRoute: { path: string; params?: Record<string, string | number | boolean> }) {
      currentRoute = nextRoute;
    },
  };
}

test("messages controller loads notifications with unread badge state", async () => {
  const { kernel } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();

  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().items.length, 1);
  assert.equal(controller.store.getState().unreadBadge.totalUnread, 3);
  assert.equal(controller.store.getState().pagination.page, 1);
  assert.equal(controller.store.getState().selection.selectedItemIds[0], "notice-1");
  assert.equal(controller.store.getState().selectedThreadId, "thread-1");
  assert.equal(controller.store.getState().detailStatus.loadState, "ready");
  assert.equal(controller.store.getState().detailData?.threadId, "thread-1");
  assert.equal(controller.store.getState().messageItems.length, 1);
  assert.equal(controller.store.getState().messageThread?.threadId, "thread-1");
  assert.equal(controller.store.getState().deliveryPosture?.syncMode, "polling");
  assert.equal(controller.store.getState().deliveryPosture?.realtimeProvisioned, false);
});

test("messages controller appends the next page and keeps the current list", async () => {
  const { kernel } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();
  await controller.loadMore();

  assert.equal(controller.store.getState().items.length, 2);
  assert.equal(controller.store.getState().items[1]?.id, "notice-2");
  assert.equal(controller.store.getState().pagination.page, 2);
  assert.equal(controller.store.getState().status.loadState, "ready");
});

test("messages controller preserves deep-link recovery metadata and marks missing detail as unavailable", async () => {
  const { kernel, setCurrentRoute } = createKernelStub();
  const originalGet = kernel.request.get.bind(kernel.request);
  setCurrentRoute({
    path: "/messages",
    params: {
      type: "system",
      onlyUnread: true,
      threadId: "thread-1",
    },
  });
  kernel.request.get = async <T>(url: string, query?: Record<string, unknown>) => {
    if (url === "/messages/thread") {
      return {
        ok: false as const,
        error: {
          code: "NOT_FOUND",
          message: "Thread not found",
          recoverable: false,
        },
      };
    }

    return originalGet<T>(url, query);
  };

  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();

  assert.equal(controller.store.getState().status.restoredFromRoute, true);
  assert.deepEqual(controller.store.getState().status.restoredQueryKeys, ["type", "onlyUnread"]);
  assert.equal(controller.store.getState().status.restoredSelectionId, "thread-1");
  assert.equal(controller.store.getState().detailStatus.loadState, "unavailable");
  assert.equal(controller.store.getState().detailStatus.recoveredFromLink, true);
  assert.equal(controller.store.getState().detailStatus.requestedDetailId, "thread-1");
});

test("messages controller syncs type filters into the route and reloads", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    messagesRouteId: APP_ROUTE_IDS.messages,
    initialState: createDefaultMessagesState(),
  });

  await controller.applyType("system");

  assert.deepEqual(routeCalls.at(0), {
    routeId: APP_ROUTE_IDS.messages,
    params: {
      type: "system",
    },
  });
  assert.equal(controller.store.getState().activeType, "system");
});

test("messages controller marks visible notifications read", async () => {
  const { kernel } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();
  await controller.markVisibleRead();

  assert.equal(controller.store.getState().items[0]?.receipt.read, true);
  assert.equal(controller.store.getState().unreadBadge.notificationUnread, 0);
  assert.equal(controller.store.getState().lastActionMessage, "1 notification marked read.");
});

test("messages controller can mark the current thread read and clear thread unread count", async () => {
  const { kernel } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();
  await controller.markThreadRead();

  assert.equal(controller.store.getState().messageThread?.unreadCount, 0);
  assert.equal(controller.store.getState().detailActions?.canMarkRead, false);
  assert.equal(controller.store.getState().detailStatus.loadState, "ready");
  assert.equal(controller.store.getState().unreadBadge.threadUnread, 0);
});

test("messages controller can send an outbound message into the selected thread", async () => {
  const { kernel } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();
  controller.updateComposerText("Can you review my next attempt?");
  await controller.sendMessage();

  assert.equal(controller.store.getState().composerText, "");
  assert.equal(controller.store.getState().messageItems.at(-1)?.body, "Can you review my next attempt?");
  assert.equal(controller.store.getState().messageThread?.lastMessagePreview, "Can you review my next attempt?");
  assert.equal(controller.store.getState().messageItems.at(-1)?.deliveryStatus, "pending");
  assert.equal(
    controller.store.getState().messageItems.at(-1)?.touchpoints[0]?.receipt?.attemptSummary,
    "1 attempts; accepted by the provider and waiting for polling confirmation.",
  );
  assert.equal(
    controller.store.getState().messageThread?.supportProgress?.supportLoopSummary,
    "Product Support is now handling this case in the shared support thread.",
  );
  assert.match(
    controller.store.getState().deliveryPosture?.pollingAcceptanceSummary ?? "",
    /Polling-only delivery acceptance/,
  );
});

test("messages controller retries a failed outbound message", async () => {
  const { kernel } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();
  await controller.sendMessage("please retry this delivery");
  await controller.retryMessage("msg-out-1");

  assert.equal(controller.store.getState().messageItems.at(-1)?.deliveryStatus, "pending");
  assert.equal(controller.store.getState().messageItems.at(-1)?.attemptCount, 2);
  assert.equal(controller.store.getState().detailActions?.canRetryFailed, false);
  assert.equal(controller.store.getState().deliveryPosture?.retryableReceiptCount, 0);
});

test("messages controller can sync a thread and promote delivery state", async () => {
  const { kernel } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();
  await controller.sendMessage("sync this reply");
  const cursor = controller.store.getState().messageThread?.syncState?.cursor;
  await controller.syncThread(undefined, cursor);

  assert.equal(controller.store.getState().messageItems.at(-1)?.deliveryStatus, "delivered");
});

test("messages controller can create a new thread and switch selection", async () => {
  const { kernel } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();
  await controller.createThread({
    type: "private",
    title: "New Conversation",
    participantUserIds: ["coach-2"],
  });

  assert.equal(controller.store.getState().selectedThreadId, "thread-created");
  assert.equal(controller.store.getState().reservedThreads[0]?.threadId, "thread-created");
});

test("messages controller can load a customer-service thread by ticket id", async () => {
  const { kernel } = createKernelStub();
  const controller = createMessagesController({
    kernel,
    initialState: createDefaultMessagesState(),
  });

  await controller.loadInitial();
  await controller.loadSupportThreadByTicket("fb_1");

  assert.equal(controller.store.getState().messageThread?.threadId, "thread-1");
});

test("messages controller routes unauthorized responses back to login", async () => {
  const { kernel, routeCalls, setRequestMode } = createKernelStub();
  setRequestMode("unauthorized");
  const controller = createMessagesController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    initialState: createDefaultMessagesState(),
  });

  const result = await controller.loadInitial();

  assert.equal(result.ok, false);
  assert.equal(controller.store.getState().errorText, "Message session expired");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.login,
    params: {
      redirectPath: "/messages",
      redirectSource: "messages",
      redirectReason: "auth-required",
    },
  });
});
