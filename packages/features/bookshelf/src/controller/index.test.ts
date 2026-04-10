import test from "node:test";
import assert from "node:assert/strict";

import { APP_ROUTE_IDS } from "@minix/contracts";
import { ok, type AppKernel } from "@minix/core";

import { createBookshelfController } from "./index";

function createKernelStub() {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const storageValues = new Map<string, unknown>();
  let items = [
    {
      novelId: "novel_lantern",
      title: "Ashes Of The Lantern",
      authorName: "Lin Yue",
      continueChapterId: "lantern_ch_03",
      continueChapterTitle: "Chapter 3 · Witness On The Water",
      updatedAt: "2026-03-22T08:00:00.000Z",
      hasUpdate: true,
      progressPercent: 0.46,
    },
    {
      novelId: "novel_brocade",
      title: "Brocade Pavilion",
      authorName: "Qiao An",
      continueChapterId: "brocade_ch_02",
      continueChapterTitle: "Chapter 2 · Gold Thread Accounts",
      updatedAt: "2026-03-12T08:00:00.000Z",
      hasUpdate: false,
      progressPercent: 0.24,
    },
    {
      novelId: "novel_cinder",
      title: "Cinder Registry",
      authorName: "He Qing",
      continueChapterId: "cinder_ch_09",
      continueChapterTitle: "Chapter 9 · White Ledger",
      updatedAt: "2026-03-10T08:00:00.000Z",
      hasUpdate: false,
      progressPercent: 1,
    },
  ];

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
      async get<T>(key: string) { return ok((storageValues.get(key) as T | undefined) ?? null); },
      async set<T>(key: string, value: T) {
        storageValues.set(key, value);
        return ok(undefined);
      },
      async remove(key: string) {
        storageValues.delete(key);
        return ok(undefined);
      },
      async clear() {
        storageValues.clear();
        return ok(undefined);
      },
    },
    session: {
      async get() { return ok(null); },
      async set() { return ok(undefined); },
      async clear() { return ok(undefined); },
      async isLoggedIn() { return ok(false); },
    },
    request: {
      async get<T>() { return ok({ items } as T); },
      async post<T>() { return ok({} as T); },
      async put<T>() { return ok({} as T); },
      async patch<T>() { return ok({} as T); },
      async delete<T>(_url: string, body?: unknown) {
        const novelId = (body as { novelId?: string } | undefined)?.novelId;
        items = items.filter((item) => item.novelId !== novelId);
        return ok({
          novelId,
          inBookshelf: false,
          bookshelfCount: 0,
          items,
        } as T);
      },
    },
    auth: {
      async ensureLogin() { return ok({ loggedIn: true, platform: "h5", identity: { userId: "u" }, token: { accessToken: "t" } }); },
      async login() { return ok({ loggedIn: true, platform: "h5", identity: { userId: "u" }, token: { accessToken: "t" } }); },
      async logout() { return ok(undefined); },
      async exchangeToken() {
        return ok({ loggedIn: true, platform: "h5", identity: { userId: "u" }, token: { accessToken: "t" } });
      },
    },
    router: {
      async to() { return ok(undefined); },
      async replace() { return ok(undefined); },
      async toRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      async replaceRoute() { return ok(undefined); },
      resolve() { return ok("/bookshelf"); },
      async back() { return ok(undefined); },
      current() { return ok({ path: "/bookshelf" }); },
    },
    ui: {
      async toast() { return ok(undefined); },
      async loading() { return ok(undefined); },
      async modal() { return ok(true); },
    },
  };

  return { kernel, routeCalls, storageValues };
}

test("bookshelf controller marks state ready", () => {
  const controller = createBookshelfController({
    kernel: createKernelStub().kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  assert.equal(controller.store.getState().ready, false);
  controller.markReady();
  assert.equal(controller.store.getState().ready, true);
});

test("bookshelf controller removes a selected novel and keeps the shelf state in sync", async () => {
  const { kernel } = createKernelStub();
  const controller = createBookshelfController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.load();
  controller.selectNovel("novel_brocade");
  const result = await controller.removeNovel("novel_brocade");

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().items.length, 2);
  assert.equal(controller.store.getState().visibleItems.length, 2);
  assert.equal(controller.store.getState().selectedNovelId, "novel_lantern");
  assert.equal(controller.store.getState().statusText, "Brocade Pavilion removed from shelf.");
});

test("bookshelf controller keeps selection inside the active sort and filter view", async () => {
  const { kernel } = createKernelStub();
  const controller = createBookshelfController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.load();
  controller.selectNovel("novel_brocade");
  controller.setFilter("updates");

  assert.equal(controller.store.getState().selectedNovelId, "novel_lantern");
  assert.equal(controller.store.getState().visibleItems.length, 1);

  controller.setFilter("all");
  controller.setSort("progress");

  assert.equal(controller.store.getState().selectedNovelId, "novel_lantern");
  assert.equal(controller.store.getState().activeSortKey, "progress");
  assert.equal(controller.store.getState().visibleItems[0]?.novelId, "novel_cinder");
});

test("bookshelf controller can continue a specific visible title without relying on selection", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createBookshelfController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.load();
  controller.selectNovel("novel_lantern");
  await controller.continueNovel("novel_brocade");

  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.reader,
    params: {
      novelId: "novel_brocade",
      chapterId: "brocade_ch_02",
    },
  });
});

test("bookshelf controller derives grouped counts and lanes for the shelf workspace", async () => {
  const { kernel } = createKernelStub();
  const controller = createBookshelfController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
    tocRouteId: APP_ROUTE_IDS.toc,
  });

  await controller.load();

  assert.equal(controller.store.getState().activeCount, 2);
  assert.equal(controller.store.getState().updatedCount, 1);
  assert.equal(controller.store.getState().completedCount, 1);
  assert.equal(controller.store.getState().activeItems[0]?.novelId, "novel_lantern");
  assert.equal(controller.store.getState().updateItems[0]?.novelId, "novel_lantern");
  assert.equal(controller.store.getState().completedItems[0]?.novelId, "novel_cinder");
  assert.equal(
    controller.store.getState().updateLaneReason,
    "Updated titles stay in a dedicated lane so release movement is visible without scanning the full shelf.",
  );
  assert.equal(
    controller.store.getState().archiveReason,
    "Completed runs remain in the archive lane so finished reading still participates in the collection story.",
  );
  assert.equal(controller.store.getState().resumeCueTitle, "Ashes Of The Lantern");
  assert.match(controller.store.getState().resumeCueReason ?? "", /Because you paused at Chapter 3 · Witness On The Water/);
  assert.equal(
    controller.store.getState().activeLaneReason,
    "Active titles stay in a warm lane so paused reading sessions can restart without scanning the full shelf.",
  );
  assert.equal(controller.store.getState().backlogCueTitle, "Cinder Registry");
  assert.match(controller.store.getState().backlogCueReason ?? "", /backlog re-entry lane/i);
  assert.match(controller.store.getState().backlogQueueLabel ?? "", /finished title|active run/i);
  assert.equal(controller.store.getState().programMilestoneTitle, "Cinder Registry archived");
  assert.match(controller.store.getState().programMilestoneCopy ?? "", /archive milestone/i);
  assert.equal(controller.store.getState().programMilestoneMeta, "He Qing · completed archive");
  assert.equal(controller.store.getState().milestoneHistory.length, 1);
  assert.equal(controller.store.getState().milestoneHistory[0]?.typeLabel, "Archive milestone");
  assert.equal(controller.store.getState().milestoneHistory[0]?.sourceLabel, "Saved from bookshelf");
});

test("bookshelf controller can reopen a milestone history item", async () => {
  const { kernel, routeCalls, storageValues } = createKernelStub();
  storageValues.set("novel.latest-milestone-history", [
    {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
      title: "Reader milestone",
      copy: "Resume from reader history.",
      meta: "Saved from reader",
      source: "reader",
      type: "chapter-recap",
      savedAt: "2026-04-05T10:00:00.000Z",
    },
    {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
      title: "TOC milestone",
      copy: "Resume from toc history.",
      meta: "Saved from TOC",
      source: "toc",
      type: "volume-complete",
      savedAt: "2026-04-04T10:00:00.000Z",
    },
  ]);
  const controller = createBookshelfController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
    tocRouteId: APP_ROUTE_IDS.toc,
  });

  await controller.load();
  const result = await controller.openMilestoneHistoryItem(2);

  assert.equal(result.ok, true);
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.toc,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
    },
  });
});

test("bookshelf controller can pin a title to the top of the current shelf view", async () => {
  const { kernel } = createKernelStub();
  const controller = createBookshelfController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.load();
  controller.pinNovel("novel_brocade");

  assert.equal(controller.store.getState().pinnedNovelId, "novel_brocade");
  assert.equal(controller.store.getState().pinnedItem?.novelId, "novel_brocade");
  assert.equal(controller.store.getState().selectedNovelId, "novel_brocade");
  assert.equal(controller.store.getState().visibleItems[0]?.novelId, "novel_brocade");
  assert.match(controller.store.getState().selectionReason ?? "", /pinned above the active shelf lane/);
  assert.equal(controller.store.getState().statusText, "Brocade Pavilion pinned to the top of this shelf view.");

  controller.clearPinnedNovel();

  assert.equal(controller.store.getState().pinnedNovelId, undefined);
  assert.equal(controller.store.getState().visibleItems[0]?.novelId, "novel_lantern");
  assert.equal(controller.store.getState().statusText, "Pinned shelf title cleared.");
});

test("bookshelf controller consumes shelf order from reading center preferences on load", async () => {
  const { kernel, storageValues } = createKernelStub();
  storageValues.set("novel.reading-center", {
    resume: "latest-chapter",
    shelfOrder: "updates",
    digest: "weekly",
    sync: "cross-host",
    reminders: "nightly",
  });

  const controller = createBookshelfController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.load();

  assert.equal(controller.store.getState().activeSortKey, "updated");
  assert.equal(
    controller.store.getState().statusText,
    "Shelf order synced from reading center: updates.",
  );
});
