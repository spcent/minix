import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";

import { createHostH5PageEntry } from "../registrations/page-entries";
import { createHostH5Runtime } from "../manifest/app.manifest";

function createKernelStub(): AppKernel {
  return {
    env: {
      appId: "host-h5",
      appName: "host-h5",
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
    session: {
      async get() {
        return ok(null);
      },
      async set() {
        return ok(undefined);
      },
      async clear() {
        return ok(undefined);
      },
      async isLoggedIn() {
        return ok(false);
      },
    },
    request: {
      async get<T>(path: string) {
        if (path === "/me") {
          return ok({
            userProfile: {
              nickname: "Host H5 User",
              tags: ["member-ready"],
            },
            accountSummary: {
              userId: "host-h5-user",
              phoneBound: false,
              wechatBound: false,
              realNameStatus: "unverified",
              assets: {
                points: 0,
                level: 1,
                membership: {
                  active: false,
                  tier: "guest",
                  entitlementScope: "none",
                  statusLabel: "Guest mode",
                  renewalLabel: "Upgrade anytime",
                  headline: "Guest",
                  subheadline: "Guest",
                  benefits: [],
                },
                entitlementLabels: ["basic-access"],
                balanceCents: 0,
              },
              relations: {
                followingCount: 0,
                followerCount: 0,
                friendCount: 0,
                blockedCount: 0,
              },
            },
            userStatus: {
              availability: "enabled",
              enabled: true,
              frozen: false,
              cancellationInProgress: false,
              blacklisted: false,
              guest: false,
            },
            identityWorkflows: {
              canUpgradeGuest: false,
              canBindPhone: false,
              mergePending: false,
            },
          } as T);
        }

        if (path === "/settings") {
          return ok({
            preferences: {
              language: "zh-CN",
              theme: "system",
              fontScale: "md",
              notificationsEnabled: true,
              device: {
                cacheLabel: "Clear local cache only",
                networkStrategy: "balanced",
                autoplay: true,
                weakNetworkMode: false,
              },
              account: {
                profileEntryLabel: "Edit profile",
                phoneEntryLabel: "Bind phone",
                unbindEntryLabel: "Bind WeChat",
                cancellationEntryLabel: "Cancellation entry",
              },
              content: {
                sortOrder: "recommended",
                filterMode: "all",
                readingMode: "scroll",
                historyEnabled: true,
              },
              developerOptions: {
                logsEnabled: true,
                experimentsEnabled: true,
              },
            },
            featureToggles: {
              pushEnabled: true,
              smsEnabled: false,
              emailEnabled: false,
              accountCenterEnabled: true,
              readingSyncEnabled: true,
              experimentsEnabled: true,
            },
            privacyOptions: {
              profileVisibilityLabel: "Private to signed-in session",
              personalizedRecommendations: true,
              searchHistoryEnabled: true,
              analyticsEnabled: true,
              screenshotFeedbackEnabled: true,
            },
          } as T);
        }

        if (path === "/feed") {
          return ok({
            items: [
              {
                id: "lesson_4",
                title: "Speak Out Loud",
                subtitle: "Repeat 5 travel lines and practice natural rhythm out loud",
                eyebrow: "Speaking",
                tag: "speaking",
                recommendedReason: "Now turn the lesson into spoken output while the sentence patterns are still fresh.",
              },
            ],
            hasMore: false,
            page: 1,
            pageSize: 6,
            tags: [
              { key: "all", label: "All" },
              { key: "speaking", label: "Speaking" },
            ],
            searchQuery: {
              keyword: "",
              mode: "global",
              domain: "feed",
              page: 1,
              pageSize: 6,
            },
            searchFilters: [
              {
                key: "tag",
                label: "Content type",
                selectedKeys: [],
                options: [
                  { key: "all", label: "All", count: 1 },
                  { key: "speaking", label: "Speaking", count: 1 },
                ],
              },
            ],
            searchResults: {
              items: [
                {
                  id: "lesson_4",
                  title: "Speak Out Loud",
                  subtitle: "Repeat 5 travel lines and practice natural rhythm out loud",
                  eyebrow: "Speaking",
                  tag: "speaking",
                  recommendedReason: "Now turn the lesson into spoken output while the sentence patterns are still fresh.",
                },
              ],
              total: 1,
              hasMore: false,
              emptyText: "No discovery results are available yet.",
              featuredReason: "Now turn the lesson into spoken output while the sentence patterns are still fresh.",
              suggestionTerms: ["travel"],
              hotKeywords: ["travel"],
              recentKeywords: [],
              sortOptions: [{ key: "recommended", label: "Recommended" }],
              activeSortKey: "recommended",
            },
          } as T);
        }

        if (path === "/feedback/bootstrap") {
          return ok({
            feedbackCategories: [
              {
                key: "product_issue",
                label: "Product issue",
                type: "issue_report",
                description: "Unexpected behavior or broken experience.",
                defaultPriority: "high",
                labels: ["product", "issue"],
                supportsAttachments: true,
                customerServiceEntryLabel: "Escalate to support",
              },
              {
                key: "suggestion",
                label: "Suggestion",
                type: "suggestion",
                description: "Product improvement ideas.",
                defaultPriority: "medium",
                labels: ["suggestion"],
                supportsAttachments: true,
              },
            ],
          } as T);
        }

        if (path === "/notifications") {
          return ok({
            notificationList: {
              items: [
                {
                  id: "notice_host_h5_1",
                  type: "system",
                  groupKey: "security",
                  groupLabel: "Security",
                  title: "Inbox ready",
                  summary: "Host H5 inbox state is available.",
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
              selectedNotificationId: "notice_host_h5_1",
            },
            messageThread: {
              threadId: "thread_host_h5",
              type: "private",
              title: "Tutor",
              participantLabels: ["Tutor", "You"],
              pinned: false,
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
                threadId: "thread_host_h5",
                type: "private",
                title: "Tutor",
                participantLabels: ["Tutor", "You"],
                pinned: false,
                doNotDisturb: false,
                unreadCount: 1,
                reserved: true,
                touchpoints: [],
              },
            ],
          } as T);
        }

        if (path === "/messages/thread") {
          return ok({
            messageThread: {
              threadId: "thread_host_h5",
              type: "private",
              title: "Tutor",
              participantLabels: ["Tutor", "You"],
              pinned: false,
              doNotDisturb: false,
              unreadCount: 1,
              reserved: true,
              touchpoints: [],
            },
            messageItems: [
              {
                messageId: "msg_host_h5_1",
                threadId: "thread_host_h5",
                direction: "inbound",
                senderRole: "advisor",
                senderLabel: "Tutor",
                body: "Host runtime thread detail is available.",
                createdAt: "2026-04-08T09:00:00.000Z",
                deliveryStatus: "delivered",
                touchpoints: [],
              },
            ],
            detailActions: {
              canReply: true,
              canMarkRead: true,
              deliveryLabel: "Private message delivery lane",
            },
            unreadBadge: {
              totalUnread: 2,
              notificationUnread: 1,
              threadUnread: 1,
              breakdown: [{ key: "system", label: "System", count: 1 }],
            },
          } as T);
        }

        return ok({
          items: [],
          hasMore: false,
          page: 1,
          pageSize: 2,
        } as T);
      },
      async post<T>() {
        return ok({
          userId: "host-h5-user",
          accessToken: "mock-h5-access-token",
        } as T);
      },
      async put() {
        throw new Error("not implemented");
      },
      async patch() {
        throw new Error("not implemented");
      },
      async delete() {
        throw new Error("not implemented");
      },
    },
    auth: {
      async ensureLogin() {
        return ok({
          identity: { userId: "host-h5-user" },
          loggedIn: true,
          platform: "h5",
          token: { accessToken: "mock-h5-access-token" },
        });
      },
      async login() {
        return ok({
          identity: { userId: "host-h5-user" },
          loggedIn: true,
          platform: "h5",
          token: { accessToken: "mock-h5-access-token" },
        });
      },
      async logout() {
        return ok(undefined);
      },
      async exchangeToken() {
        throw new Error("not implemented");
      },
    },
    router: {
      async to() {
        return ok(undefined);
      },
      async replace() {
        return ok(undefined);
      },
      async toRoute() {
        return ok(undefined);
      },
      async replaceRoute() {
        return ok(undefined);
      },
      resolve() {
        return ok("/login");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok({ path: "/login" });
      },
    },
    ui: {
      async toast() {
        return ok(undefined);
      },
      async loading() {
        return ok(undefined);
      },
      async modal() {
        return ok(true);
      },
    },
  };
}

test("host h5 runtime creates page controllers on a shared kernel", () => {
  const kernel = createKernelStub();
  const runtime = createHostH5Runtime(kernel);
  const expectedPages = [
    "login",
    "identityUpgrade",
    "identityBindPhone",
    "identityMerge",
    "overview",
    "items",
    "feed",
    "feedback",
    "messages",
    "mediaTools",
    "settings",
    "account",
  ];

  assert.equal(runtime.kernel, kernel);
  assert.deepEqual(Object.keys(runtime.registry), expectedPages);
  assert.deepEqual(Object.keys(runtime.pages), expectedPages);
});

test("host h5 page entries delegate to runtime controllers", async () => {
  const runtime = createHostH5Runtime(createKernelStub());
  const loginEntry = createHostH5PageEntry(runtime, "login");
  const overviewEntry = createHostH5PageEntry(runtime, "overview");
  const itemsEntry = createHostH5PageEntry(runtime, "items");
  const feedEntry = createHostH5PageEntry(runtime, "feed");
  const feedbackEntry = createHostH5PageEntry(runtime, "feedback");
  const mediaToolsEntry = createHostH5PageEntry(runtime, "mediaTools");
  const messagesEntry = createHostH5PageEntry(runtime, "messages");
  const settingsEntry = createHostH5PageEntry(runtime, "settings");
  const accountEntry = createHostH5PageEntry(runtime, "account");

  const loginResult = await loginEntry.onTapLogin();
  const overviewResult = await overviewEntry.onShow();
  const itemsResult = await itemsEntry.onShow();
  const feedResult = await feedEntry.onShow();
  const feedbackResult = await feedbackEntry.onShow();
  const mediaToolsResult = await mediaToolsEntry.onShow();
  const messagesResult = await messagesEntry.onShow();
  const settingsResult = await settingsEntry.onTapLogout();
  const accountResult = await accountEntry.onShow();

  assert.deepEqual(loginResult, { ok: true, value: undefined });
  assert.equal((overviewResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((itemsResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((feedResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((feedbackResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((mediaToolsResult as { ok?: boolean } | undefined)?.ok, true);
  assert.equal((messagesResult as { ok?: boolean } | undefined)?.ok, true);
  assert.deepEqual(settingsResult, { ok: true, value: undefined });
  assert.equal((accountResult as { ok?: boolean } | undefined)?.ok, true);
});
