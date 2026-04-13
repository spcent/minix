import test from "node:test";
import assert from "node:assert/strict";

import { APP_ROUTE_IDS } from "@minix/contracts";
import { ok, type AppKernel } from "@minix/core";

import { createNovelWechatPageEntry } from "../registrations/page-entries";
import { createNovelWechatRuntime } from "../manifest/app.manifest";

async function invokeEntryAction(entry: unknown, action: string) {
  const handler = (entry as Record<string, unknown>)[action];
  assert.equal(typeof handler, "function");
  return (handler as () => Promise<unknown>)();
}

function createKernelStub(): AppKernel {
  let currentLocation: { path: string; params?: Record<string, string | number | boolean> } | null = {
    path: "/pages/login/index",
  };

  return {
    env: {
      appId: "novel-wechat",
      appName: "novel-wechat",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "wechat",
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
        return ok({
          identity: { userId: "novel-wechat-user" },
          loggedIn: true,
          platform: "wechat",
          token: { accessToken: "mock-novel-wechat-access-token" },
        });
      },
      async set() {
        return ok(undefined);
      },
      async clear() {
        return ok(undefined);
      },
      async isLoggedIn() {
        return ok(true);
      },
    },
    request: {
      async get<T>(path: string) {
        if (path === "/novels") {
          return ok({
            items: [
              {
                id: "novel_lantern",
                slug: "ashes-of-the-lantern",
                title: "Ashes Of The Lantern",
                authorName: "Lin Yue",
                summary: "A city mystery anchored in rain, memory, and vanished rooms.",
                categoryKey: "mystery",
                categoryLabel: "Mystery",
                tags: [],
                status: "serializing",
                latestChapterId: "lantern_ch_02",
                latestChapterTitle: "Chapter 2 · A Door Behind Smoke",
                latestChapterOrder: 2,
                updatedAt: "2026-03-22T08:00:00.000Z",
                wordCount: 182000,
                isFree: true,
                isTrial: true,
                requiresMembership: false,
                isPurchased: true,
              },
            ],
            hasMore: false,
            page: 1,
            pageSize: 20,
            searchQuery: {
              keyword: "",
              mode: "domain",
              domain: "novel",
              page: 1,
              pageSize: 20,
            },
            searchFilters: [
              {
                key: "category",
                label: "Category",
                selectedKeys: [],
                options: [{ key: "all", label: "All", count: 1 }],
              },
              {
                key: "status",
                label: "Status",
                selectedKeys: [],
                options: [{ key: "all", label: "Any status", count: 1 }],
              },
            ],
            searchResults: {
              items: [
                {
                  id: "novel_lantern",
                  slug: "ashes-of-the-lantern",
                  title: "Ashes Of The Lantern",
                  authorName: "Lin Yue",
                  summary: "A city mystery anchored in rain, memory, and vanished rooms.",
                  categoryKey: "mystery",
                  categoryLabel: "Mystery",
                  tags: [],
                  status: "serializing",
                  latestChapterId: "lantern_ch_02",
                  latestChapterTitle: "Chapter 2 · A Door Behind Smoke",
                  latestChapterOrder: 2,
                  updatedAt: "2026-03-22T08:00:00.000Z",
                  wordCount: 182000,
                  isFree: true,
                  isTrial: true,
                  requiresMembership: false,
                  isPurchased: true,
                },
              ],
              total: 1,
              hasMore: false,
              emptyText: "No novels found yet.",
              suggestionTerms: ["lantern", "brocade"],
              hotKeywords: ["lantern", "brocade"],
              recentKeywords: [],
              sortOptions: [{ key: "recommended", label: "Recommended" }],
              activeSortKey: "recommended",
            },
          } as T);
        }

        if (path === "/feed") {
          return ok({
            items: [
              {
                id: "content_editorial_1",
                title: "Editorial Note · Why Quiet Frontlists Convert Better",
                subtitle: "A shared managed-content card rendered through the feed contract.",
                tag: "content",
                recommendedReason: "Shared editorial discovery should remain distinct from the novel-specific catalog and reader flow.",
                updatedAt: "2026-03-22T08:00:00.000Z",
              },
            ],
            hasMore: false,
            page: 1,
            pageSize: 6,
            searchQuery: {
              keyword: "",
              mode: "global",
              domain: "feed",
              page: 1,
              pageSize: 6,
            },
            searchFilters: [],
            searchResults: {
              items: [
                {
                  id: "content_editorial_1",
                  title: "Editorial Note · Why Quiet Frontlists Convert Better",
                  subtitle: "A shared managed-content card rendered through the feed contract.",
                  tag: "content",
                  recommendedReason: "Shared editorial discovery should remain distinct from the novel-specific catalog and reader flow.",
                  updatedAt: "2026-03-22T08:00:00.000Z",
                },
              ],
              total: 1,
              hasMore: false,
              emptyText: "No editorial discover results are available yet.",
              suggestionTerms: ["editorial"],
              hotKeywords: ["editorial"],
              recentKeywords: [],
              sortOptions: [{ key: "recommended", label: "Recommended" }],
              activeSortKey: "recommended",
              featuredReason: "Shared editorial discovery now has an explicit route on the novel host.",
            },
          } as T);
        }

        if (path === "/me") {
          return ok({
            userProfile: {
              nickname: "Lantern Reader",
              avatarUrl: "https://img.test/lantern-reader.png",
              gender: "unknown",
              region: "Suzhou, CN",
              bio: "WeChat reading profile with shared account recovery posture.",
              tags: ["serial", "wechat"],
            },
            accountSummary: {
              userId: "novel-wechat-user",
              phoneBound: false,
              wechatBound: true,
              providerIdentities: [],
              realNameStatus: "unverified",
              assets: {
                points: 88,
                level: 2,
                entitlementLabels: ["discover", "bookshelf"],
                balanceCents: 0,
                availableBalanceCents: 0,
                frozenBalanceCents: 0,
                activeEntitlements: [],
              },
              relations: {
                followingCount: 1,
                followerCount: 3,
                friendCount: 1,
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
              canBindPhone: true,
              mergePending: false,
            },
            securityCenter: {
              deviceIdentities: [],
              riskLevel: "low",
              auditEvents: [],
            },
            accountOperations: [],
            operationRecords: [],
            relationTargets: [],
          } as T);
        }

        if (path.startsWith("/account/assets/history")) {
          return ok({
            accountSummary: {
              userId: "novel-wechat-user",
              phoneBound: false,
              wechatBound: true,
              providerIdentities: [],
              realNameStatus: "unverified",
              assets: {
                points: 88,
                level: 2,
                entitlementLabels: ["discover", "bookshelf"],
                balanceCents: 0,
                availableBalanceCents: 0,
                frozenBalanceCents: 0,
                activeEntitlements: [],
              },
              relations: {
                followingCount: 1,
                followerCount: 3,
                friendCount: 1,
                blockedCount: 0,
              },
            },
            ledgerEntries: [
              {
                ledgerId: "ledger_reader_wechat_1",
                subject: "points",
                kind: "grant",
                title: "Daily reading streak",
                message: "Reader session earned points through steady reading.",
                createdAt: "2026-03-22T08:00:00.000Z",
                sourceType: "system",
                pointsDelta: 8,
              },
            ],
            pagination: {
              page: 1,
              pageSize: 20,
              total: 1,
              hasMore: false,
            },
          } as T);
        }

        if (path === "/feedback/bootstrap") {
          return ok({
            feedbackCategories: [
              {
                key: "product_issue",
                label: "Reader Issue",
                type: "issue_report",
                defaultPriority: "high",
                labels: ["reader", "support"],
                supportsAttachments: true,
                customerServiceEntryLabel: "Open Reading Center",
                supportEntry: {
                  entryId: "support_reading_center",
                  label: "Open Reading Center",
                  summary: "Return to reading preferences for account help.",
                  channel: "settings",
                  routeId: APP_ROUTE_IDS.settings,
                },
              },
              {
                key: "payment_issue",
                label: "Membership Issue",
                type: "complaint",
                defaultPriority: "medium",
                labels: ["membership"],
                supportsAttachments: true,
              },
            ],
            recommendedFaqEntries: [
              {
                entryId: "faq_reader_sync",
                title: "Reader Sync FAQ",
                summary: "Use the account and reading-center surfaces to verify sync posture first.",
              },
            ],
            faqCatalog: [
              {
                entryId: "faq_reader_sync",
                title: "Reader Sync FAQ",
                summary: "Use the account and reading-center surfaces to verify sync posture first.",
                categoryKeys: ["product_issue"],
                enabled: true,
                updatedAt: "2026-03-22T08:00:00.000Z",
              },
            ],
            supportEntries: [
              {
                entryId: "support_reading_center",
                label: "Open Reading Center",
                summary: "Return to reading preferences for account help.",
                channel: "settings",
                routeId: APP_ROUTE_IDS.settings,
                queueKey: "reader_support",
                queueLabel: "Reader Support",
                handlerLabel: "Reading Desk",
                enabled: true,
                updatedAt: "2026-03-22T08:00:00.000Z",
              },
            ],
            supportEntry: {
              entryId: "support_reading_center",
              label: "Open Reading Center",
              summary: "Return to reading preferences for account help.",
              channel: "settings",
              routeId: APP_ROUTE_IDS.settings,
            },
            serviceLoopSummary: "Use Reader Feedback to capture product issues without leaving the novel host.",
            ticketList: {
              items: [],
              page: 1,
              pageSize: 10,
              total: 0,
              hasMore: false,
            },
          } as T);
        }

        if (path === "/novels/detail") {
          return ok({
            id: "novel_lantern",
            slug: "ashes-of-the-lantern",
            title: "Ashes Of The Lantern",
            subtitle: "A slow-burn mystery inside a rain-soaked canal city",
            author: {
              id: "author_lin",
              name: "Lin Yue",
            },
            summary: "When an archivist inherits a forbidden lantern, hidden rooms begin answering back.",
            categoryKey: "mystery",
            categoryLabel: "Mystery",
            tags: [],
            status: "serializing",
            wordCount: 182000,
            chapterCount: 2,
            latestChapter: {
              id: "lantern_ch_02",
              title: "Chapter 2 · A Door Behind Smoke",
              order: 2,
              updatedAt: "2026-03-22T08:00:00.000Z",
            },
            firstChapterId: "lantern_ch_01",
            continueChapterId: "lantern_ch_02",
            isFree: true,
            isTrial: true,
            requiresMembership: false,
            isPurchased: true,
          } as T);
        }

        if (path === "/chapters") {
          return ok({
            novelId: "novel_lantern",
            totalChapters: 2,
            continueChapterId: "lantern_ch_02",
            volumes: [
              {
                id: "lantern_vol_01",
                novelId: "novel_lantern",
                title: "Volume I · Rain Archive",
                order: 1,
                chapters: [
                  {
                    id: "lantern_ch_01",
                    novelId: "novel_lantern",
                    volumeId: "lantern_vol_01",
                    title: "Chapter 1 · The Closed Stack",
                    order: 1,
                    wordCount: 4200,
                    updatedAt: "2026-03-18T08:00:00.000Z",
                    isFree: true,
                    isTrial: true,
                    requiresMembership: false,
                    isPurchased: true,
                  },
                  {
                    id: "lantern_ch_02",
                    novelId: "novel_lantern",
                    volumeId: "lantern_vol_01",
                    title: "Chapter 2 · A Door Behind Smoke",
                    order: 2,
                    wordCount: 4380,
                    updatedAt: "2026-03-19T08:00:00.000Z",
                    isFree: true,
                    isTrial: true,
                    requiresMembership: false,
                    isPurchased: true,
                  },
                ],
              },
            ],
          } as T);
        }

        if (path === "/chapters/content") {
          return ok({
            id: "lantern_ch_01",
            novelId: "novel_lantern",
            title: "Chapter 1 · The Closed Stack",
            order: 1,
            content: "Rain moved through the canal city like a second archive.",
            wordCount: 4200,
            updatedAt: "2026-03-18T08:00:00.000Z",
            nav: { nextChapterId: "lantern_ch_02" },
            isFree: true,
            isTrial: true,
            requiresMembership: false,
            isPurchased: true,
          } as T);
        }

        if (path === "/bookshelf") {
          return ok({
            items: [
              {
                novelId: "novel_lantern",
                title: "Ashes Of The Lantern",
                authorName: "Lin Yue",
                latestChapterTitle: "Chapter 2 · A Door Behind Smoke",
                continueChapterId: "lantern_ch_02",
                continueChapterTitle: "Chapter 2 · A Door Behind Smoke",
                progressPercent: 0.42,
                updatedAt: "2026-03-22T08:00:00.000Z",
                hasUpdate: true,
              },
            ],
          } as T);
        }

        if (path === "/membership") {
          return ok({
            active: false,
            tier: "guest",
            renewalLabel: "Upgrade to unlock full serialized reading",
            headline: "Membership Center",
            subheadline: "Unlock paid chapters and premium serials.",
            benefits: [],
          } as T);
        }

        if (path === "/reading-progress") {
          return ok({
            progress: {
              novelId: "novel_lantern",
              chapterId: "lantern_ch_01",
              progressPercent: 0.42,
              updatedAt: "2026-03-22T08:00:00.000Z",
            },
          } as T);
        }

        return ok({} as T);
      },
      async post<T>(path: string, body: unknown) {
        if (path === "/reading-progress") {
          return ok({
            saved: true,
            progress: {
              ...(body as Record<string, unknown>),
              updatedAt: "2026-03-22T08:10:00.000Z",
            },
          } as T);
        }

        return ok({
          userId: "novel-wechat-user",
          accessToken: "mock-novel-wechat-access-token",
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
          identity: { userId: "novel-wechat-user" },
          loggedIn: true,
          platform: "wechat",
          token: { accessToken: "mock-novel-wechat-access-token" },
        });
      },
      async login() {
        return ok({
          identity: { userId: "novel-wechat-user" },
          loggedIn: true,
          platform: "wechat",
          token: { accessToken: "mock-novel-wechat-access-token" },
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
      async toRoute(_routeId, params) {
        currentLocation = {
          path: "/pages/reader/index",
          ...(params ? { params } : {}),
        };
        return ok(undefined);
      },
      async replaceRoute(_routeId, params) {
        currentLocation = {
          path: "/pages/login/index",
          ...(params ? { params } : {}),
        };
        return ok(undefined);
      },
      resolve() {
        return ok("/pages/login/index");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok(currentLocation);
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

test("novel wechat runtime creates page controllers on a shared kernel", () => {
  const kernel = createKernelStub();
  const runtime = createNovelWechatRuntime(kernel);

  assert.equal(runtime.kernel, kernel);
  assert.deepEqual(Object.keys(runtime.registry), ["login", "catalog", "feed", "account", "feedback", "mediaTools", "novelDetail", "toc", "reader", "bookshelf", "settings", "membership"]);
  assert.deepEqual(Object.keys(runtime.pages), ["login", "catalog", "feed", "account", "feedback", "mediaTools", "novelDetail", "toc", "reader", "bookshelf", "settings", "membership"]);
});

test("novel wechat page entries delegate to page controllers", async () => {
  const runtime = createNovelWechatRuntime(createKernelStub());

  const loginEntry = createNovelWechatPageEntry(runtime, "login");
  const catalogEntry = createNovelWechatPageEntry(runtime, "catalog");
  const feedEntry = createNovelWechatPageEntry(runtime, "feed");
  const accountEntry = createNovelWechatPageEntry(runtime, "account");
  const feedbackEntry = createNovelWechatPageEntry(runtime, "feedback");
  const mediaToolsEntry = createNovelWechatPageEntry(runtime, "mediaTools");
  const detailEntry = createNovelWechatPageEntry(runtime, "novelDetail");
  const tocEntry = createNovelWechatPageEntry(runtime, "toc");
  const readerEntry = createNovelWechatPageEntry(runtime, "reader");
  const bookshelfEntry = createNovelWechatPageEntry(runtime, "bookshelf");
  const settingsEntry = createNovelWechatPageEntry(runtime, "settings");
  const membershipEntry = createNovelWechatPageEntry(runtime, "membership");

  const loginResult = await invokeEntryAction(loginEntry, "onTapLogin");
  const catalogResult = await invokeEntryAction(catalogEntry, "onShow");
  const feedResult = await invokeEntryAction(feedEntry, "onShow");
  const accountResult = await invokeEntryAction(accountEntry, "onShow");
  const feedbackResult = await invokeEntryAction(feedbackEntry, "onShow");
  const mediaToolsResult = await invokeEntryAction(mediaToolsEntry, "onShow");
  const detailResult = await invokeEntryAction(detailEntry, "onShow");
  const tocResult = await invokeEntryAction(tocEntry, "onShow");
  const readerResult = await invokeEntryAction(readerEntry, "onShow");
  const bookshelfResult = await invokeEntryAction(bookshelfEntry, "onShow");
  const logoutResult = await invokeEntryAction(settingsEntry, "onTapLogout");
  const membershipResult = await invokeEntryAction(membershipEntry, "onShow");

  assert.deepEqual(loginResult, { ok: true, value: undefined });
  assert.equal((catalogResult as { ok?: boolean }).ok, true);
  assert.equal((feedResult as { ok?: boolean }).ok, true);
  assert.equal((accountResult as { ok?: boolean }).ok, true);
  assert.equal((feedbackResult as { ok?: boolean }).ok, true);
  assert.equal((mediaToolsResult as { ok?: boolean }).ok, true);
  assert.equal((detailResult as { ok?: boolean }).ok, true);
  assert.equal((tocResult as { ok?: boolean }).ok, true);
  assert.equal((readerResult as { ok?: boolean }).ok, true);
  assert.equal((bookshelfResult as { ok?: boolean }).ok, true);
  assert.equal((membershipResult as { ok?: boolean }).ok, true);
  assert.deepEqual(logoutResult, { ok: true, value: undefined });
  assert.equal(runtime.pages.catalog.store.getState().items.length, 1);
  assert.equal(runtime.pages.feed.store.getState().items.length, 1);
  assert.equal(runtime.pages.account.store.getState().accountSummary?.userId, "novel-wechat-user");
  assert.equal(runtime.pages.account.store.getState().authenticated, true);
  assert.equal(runtime.pages.feedback.store.getState().categories.length, 2);
  assert.equal(runtime.pages.mediaTools.store.getState().title, "Reader Media Tools");
  assert.equal(runtime.pages.novelDetail.store.getState().detail?.id, "novel_lantern");
  assert.equal(runtime.pages.toc.store.getState().volumes.length, 1);
  assert.equal(runtime.pages.reader.store.getState().chapter?.id, "lantern_ch_01");
  assert.equal(runtime.pages.bookshelf.store.getState().items.length, 1);
  assert.equal(runtime.pages.membership.store.getState().overview?.headline, "Membership Center");
});
