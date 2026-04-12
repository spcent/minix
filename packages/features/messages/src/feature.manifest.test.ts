import assert from "node:assert/strict";
import test from "node:test";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS, type MessageThreadResponse, type NotificationListResponse } from "@minix/contracts";

import { messagesFeatureManifest } from "./feature.manifest";
import { createDefaultMessagesState } from "./model";

function createKernelStub() {
  const kernel = {
    request: {
      async get<T>(url?: string) {
        if (url === "/messages/thread") {
          const response: MessageThreadResponse = {
            messageThread: {
              threadId: "thread-1",
              type: "private",
              title: "Tutor",
              participantLabels: ["Tutor", "You"],
              pinned: true,
              doNotDisturb: false,
              unreadCount: 1,
              reserved: true,
              touchpoints: [],
            },
            messageItems: [
              {
                messageId: "msg-1",
                threadId: "thread-1",
                direction: "inbound",
                senderRole: "advisor",
                senderLabel: "Tutor",
                body: "Loaded from manifest controller",
                createdAt: "2026-04-08T09:00:00.000Z",
                deliveryStatus: "delivered",
                deliveredAt: "2026-04-08T09:00:01.000Z",
                attemptCount: 1,
                retryable: false,
                touchpoints: [],
              },
            ],
            detailActions: {
              canReply: true,
              canMarkRead: true,
              canRetryFailed: false,
              canCreateThread: true,
              deliveryLabel: "Private message delivery lane",
            },
            unreadBadge: {
              totalUnread: 2,
              notificationUnread: 1,
              threadUnread: 1,
              breakdown: [{ key: "system", label: "System", count: 1 }],
            },
          };

          return ok(response as T);
        }

        const response: NotificationListResponse = {
          notificationList: {
            items: [
              {
                id: "notice-1",
                type: "system",
                groupKey: "security",
                groupLabel: "Security",
                title: "Security update",
                summary: "Loaded from manifest controller",
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
            total: 1,
            hasMore: false,
            grouping: "type",
            groups: [{ key: "security", label: "Security", count: 1 }],
            filters: [],
            onlyUnread: false,
            selectedNotificationId: "notice-1",
          },
          messageThread: {
            threadId: "thread-1",
            type: "private",
            title: "Tutor",
            participantLabels: ["Tutor", "You"],
            pinned: true,
            doNotDisturb: false,
            unreadCount: 1,
            reserved: true,
            touchpoints: [],
          },
          unreadBadge: {
            totalUnread: 2,
            notificationUnread: 1,
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
              reserved: true,
              touchpoints: [],
            },
          ],
        };

        return ok(response as T);
      },
      async post<T>() {
        return ok({} as T);
      },
    },
    router: {
      async toRoute() {
        return ok(undefined);
      },
      async replaceRoute() {
        return ok(undefined);
      },
      current() {
        return ok({ path: "/messages" });
      },
    },
  } as unknown as AppKernel;

  return kernel;
}

test("messages feature manifest wires host entry actions by platform", () => {
  assert.ok("onPullDownRefresh" in messagesFeatureManifest.hosts.wechat.entryActions);
  assert.ok(!("onPullDownRefresh" in messagesFeatureManifest.hosts.h5.entryActions));
});

test("messages feature manifest creates a reusable inbox controller from host page data", async () => {
  const controller = messagesFeatureManifest.createController(
    "h5",
    createKernelStub(),
    {
      messagesRouteId: APP_ROUTE_IDS.messages,
    },
    createDefaultMessagesState(),
  );

  await controller.loadInitial();

  assert.equal(controller.store.getState().items.length, 1);
  assert.equal(controller.store.getState().title, "Inbox");
  assert.equal(controller.store.getState().unreadBadge.totalUnread, 2);
  assert.equal(controller.store.getState().messageItems.length, 1);
});
