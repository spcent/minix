import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";

import { createNovelH5PageEntry } from "../registrations/page-entries";
import { createNovelH5Runtime } from "../manifest/app.manifest";

async function invokeEntryAction(entry: unknown, action: string) {
  const handler = (entry as Record<string, unknown>)[action];
  assert.equal(typeof handler, "function");
  return (handler as () => Promise<unknown>)();
}

function createKernelStub(): AppKernel {
  let currentLocation: { path: string; params?: Record<string, string | number | boolean> } | null = { path: "/" };

  return {
    env: {
      appId: "novel-h5",
      appName: "novel-h5",
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
            pageSize: 2,
            searchQuery: {
              keyword: "",
              mode: "domain",
              domain: "novel",
              page: 1,
              pageSize: 2,
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
          userId: "novel-h5-user",
          accessToken: "mock-novel-h5-access-token",
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
          identity: { userId: "novel-h5-user" },
          loggedIn: true,
          platform: "h5",
          token: { accessToken: "mock-novel-h5-access-token" },
        });
      },
      async login() {
        return ok({
          identity: { userId: "novel-h5-user" },
          loggedIn: true,
          platform: "h5",
          token: { accessToken: "mock-novel-h5-access-token" },
        });
      },
      async logout() {
        return ok(undefined);
      },
      async exchangeToken() {
        return ok({
          identity: { userId: "novel-h5-guest", anonymous: true, loginMethod: "guest" },
          loggedIn: true,
          authStatus: "guest",
          platform: "h5",
          token: { accessToken: "mock-novel-h5-guest-token" },
        });
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
          path: "/",
          ...(params ? { params } : {}),
        };
        return ok(undefined);
      },
      async replaceRoute(_routeId, params) {
        currentLocation = {
          path: "/",
          ...(params ? { params } : {}),
        };
        return ok(undefined);
      },
      resolve() {
        return ok("/");
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

test("novel h5 runtime creates page controllers on a shared kernel", () => {
  const kernel = createKernelStub();
  const runtime = createNovelH5Runtime(kernel);

  assert.equal(runtime.kernel, kernel);
  assert.deepEqual(Object.keys(runtime.registry), ["home", "login", "catalog", "novelDetail", "toc", "reader", "bookshelf", "settings", "membership"]);
  assert.deepEqual(Object.keys(runtime.pages), ["home", "login", "catalog", "novelDetail", "toc", "reader", "bookshelf", "settings", "membership"]);
});

test("novel h5 page entries delegate to runtime controllers", async () => {
  const runtime = createNovelH5Runtime(createKernelStub());
  const homeEntry = createNovelH5PageEntry(runtime, "home");
  const loginEntry = createNovelH5PageEntry(runtime, "login");
  const catalogEntry = createNovelH5PageEntry(runtime, "catalog");
  const detailEntry = createNovelH5PageEntry(runtime, "novelDetail");
  const tocEntry = createNovelH5PageEntry(runtime, "toc");
  const readerEntry = createNovelH5PageEntry(runtime, "reader");
  const bookshelfEntry = createNovelH5PageEntry(runtime, "bookshelf");
  const settingsEntry = createNovelH5PageEntry(runtime, "settings");
  const membershipEntry = createNovelH5PageEntry(runtime, "membership");

  const homeResult = await invokeEntryAction(homeEntry, "onShow");
  const loginResult = await invokeEntryAction(loginEntry, "onTapLogin");
  const catalogResult = await invokeEntryAction(catalogEntry, "onShow");
  const detailResult = await invokeEntryAction(detailEntry, "onShow");
  const tocResult = await invokeEntryAction(tocEntry, "onShow");
  const readerResult = await invokeEntryAction(readerEntry, "onShow");
  const bookshelfResult = await invokeEntryAction(bookshelfEntry, "onShow");
  const settingsResult = await invokeEntryAction(settingsEntry, "onTapLogout");
  const membershipResult = await invokeEntryAction(membershipEntry, "onShow");

  assert.equal((homeResult as { ok?: boolean }).ok, true);
  assert.deepEqual(loginResult, { ok: true, value: undefined });
  assert.equal((catalogResult as { ok?: boolean }).ok, true);
  assert.equal((detailResult as { ok?: boolean }).ok, true);
  assert.equal((tocResult as { ok?: boolean }).ok, true);
  assert.equal((readerResult as { ok?: boolean }).ok, true);
  assert.equal((bookshelfResult as { ok?: boolean }).ok, true);
  assert.equal((membershipResult as { ok?: boolean }).ok, true);
  assert.deepEqual(settingsResult, { ok: true, value: undefined });
  assert.equal(runtime.pages.home.store.getState().items.length, 1);
  assert.equal(runtime.pages.catalog.store.getState().items.length, 1);
  assert.equal(runtime.pages.novelDetail.store.getState().detail?.id, "novel_lantern");
  assert.equal(runtime.pages.toc.store.getState().volumes.length, 1);
  assert.equal(runtime.pages.reader.store.getState().chapter?.id, "lantern_ch_01");
  assert.equal(runtime.pages.bookshelf.store.getState().items.length, 1);
  assert.equal(runtime.pages.membership.store.getState().overview?.headline, "Membership Center");
});
