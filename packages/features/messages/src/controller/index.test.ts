import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS, type MarkNotificationsReadResponse, type NotificationListResponse } from "@minix/contracts";

import { createMessagesController } from "./index";
import { createDefaultMessagesState } from "../model";

function createKernelStub() {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  let requestMode: "success" | "unauthorized" = "success";

  const kernel: AppKernel = {
    env: {
      appId: "test",
      appName: "test",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "0.1.0",
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
      async get<T>(_url: string, query?: Record<string, unknown>) {
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

        const response: NotificationListResponse = {
          notificationList: {
            items:
              query?.page === 2
                ? [
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
                  ]
                : [
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
            page: Number(query?.page ?? 1),
            pageSize: Number(query?.pageSize ?? 6),
            total: 2,
            hasMore: Number(query?.page ?? 1) === 1,
            grouping: "type",
            groups: [{ key: "security", label: "Security", count: 1 }],
            filters: [
              {
                key: "type",
                label: "Type",
                selectedKeys: typeof query?.type === "string" ? [query.type] : [],
                options: [
                  { key: "all", label: "All", count: 2 },
                  { key: "system", label: "System", count: 1 },
                ],
              },
            ],
            onlyUnread: query?.onlyUnread === true,
            selectedNotificationId: Number(query?.page ?? 1) === 1 ? "notice-1" : "notice-2",
          },
          messageThread: {
            threadId: "thread-1",
            type: "private",
            title: "Tutor",
            participantLabels: ["Tutor", "You"],
            pinned: true,
            doNotDisturb: false,
            unreadCount: 1,
            lastMessagePreview: "Reply",
            lastMessageAt: "2026-04-08T09:10:00.000Z",
            reserved: true,
            touchpoints: [],
          },
          unreadBadge: {
            totalUnread: 3,
            notificationUnread: 2,
            threadUnread: 1,
            breakdown: [{ key: "system", label: "System", count: 1 }],
          },
          reservedThreads: [
            {
              threadId: "thread-1",
              type: "private",
              title: "Tutor",
              participantLabels: ["Tutor", "You"],
              pinned: true,
              doNotDisturb: false,
              unreadCount: 1,
              lastMessagePreview: "Reply",
              lastMessageAt: "2026-04-08T09:10:00.000Z",
              reserved: true,
              touchpoints: [],
            },
          ],
        };

        return ok(response as T);
      },
      async post<T>(_url: string, body?: Record<string, unknown>) {
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
        return ok(undefined);
      },
      async replaceRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      resolve() {
        return ok("/messages");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok({ path: "/messages" });
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
  assert.equal(controller.store.getState().selectedThreadId, "thread-1");
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
