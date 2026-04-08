import test from "node:test";
import assert from "node:assert/strict";

import { APP_ROUTE_IDS } from "@minix/contracts";
import { ok, type AppKernel } from "@minix/core";
import type { NovelListResponse } from "@minix/contracts";

import { createCatalogController } from "./index";

function createCatalogResponse(
  items: NovelListResponse["items"],
  query?: Record<string, unknown>,
): NovelListResponse {
  return {
    items,
    hasMore: false,
    page: Number(query?.page ?? 1),
    pageSize: Number(query?.pageSize ?? 6),
    searchQuery: {
      keyword: typeof query?.keyword === "string" ? query.keyword : "",
      mode: "domain",
      domain: "novel",
      page: Number(query?.page ?? 1),
      pageSize: Number(query?.pageSize ?? 6),
    },
    searchFilters: [
      {
        key: "category",
        label: "Category",
        selectedKeys: typeof query?.categoryKey === "string" ? [query.categoryKey] : [],
        options: [{ key: "all", label: "All", count: items.length }],
      },
      {
        key: "status",
        label: "Status",
        selectedKeys: typeof query?.status === "string" ? [query.status] : [],
        options: [{ key: "all", label: "Any status", count: items.length }],
      },
    ],
    searchResults: {
      items,
      total: items.length,
      hasMore: false,
      emptyText: "No novels found yet.",
      ...(items[0]?.recommendedReason ? { featuredReason: items[0].recommendedReason } : {}),
      suggestionTerms: ["lantern", "brocade"],
      hotKeywords: ["lantern", "brocade"],
      recentKeywords: [],
      sortOptions: [{ key: "recommended", label: "Recommended" }],
      activeSortKey: typeof query?.sort === "string" ? query.sort : "recommended",
    },
  };
}

function createKernelStub() {
  const requestCalls: Array<Record<string, unknown>> = [];
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const storageValues = new Map<string, unknown>();
  let currentParams: Record<string, string | number | boolean> | undefined;
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
      async get<T>(_url: string, query?: Record<string, unknown>) {
        requestCalls.push(query ?? {});
        return ok(createCatalogResponse([], query) as T);
      },
      async post<T>() { return ok({} as T); },
      async put<T>() { return ok({} as T); },
      async patch<T>() { return ok({} as T); },
      async delete<T>() { return ok({} as T); },
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
      async replaceRoute(routeId, params) {
        currentParams = params;
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      resolve() { return ok("/books"); },
      async back() { return ok(undefined); },
      current() { return ok({ path: "/books", ...(currentParams ? { params: currentParams } : {}) }); },
    },
    ui: {
      async toast() { return ok(undefined); },
      async loading() { return ok(undefined); },
      async modal() { return ok(true); },
    },
  };

  return {
    kernel,
    requestCalls,
    routeCalls,
    storageValues,
    setCurrentParams(next: Record<string, string | number | boolean> | undefined) { currentParams = next; },
  };
}

test("catalog controller marks state ready", () => {
  const { kernel } = createKernelStub();
  const controller = createCatalogController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    detailRouteId: APP_ROUTE_IDS.novelDetail,
  });

  assert.equal(controller.store.getState().ready, false);
  controller.markReady();
  assert.equal(controller.store.getState().ready, true);
});

test("catalog controller submits keyword and status filters to the list request", async () => {
  const { kernel, requestCalls, routeCalls } = createKernelStub();
  const controller = createCatalogController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    detailRouteId: APP_ROUTE_IDS.novelDetail,
  });

  controller.setKeyword("lantern");
  await controller.applyStatus("completed");
  await controller.submitSearch();

  const lastCall = requestCalls.at(-1) as NovelListResponse | Record<string, unknown> | undefined;
  assert.equal(controller.store.getState().query.keyword, "lantern");
  assert.equal(controller.store.getState().activeStatus, "completed");
  assert.equal((lastCall as Record<string, unknown>)?.keyword, "lantern");
  assert.equal((lastCall as Record<string, unknown>)?.status, "completed");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.catalog,
    params: {
      keyword: "lantern",
      status: "completed",
    },
  });
});

test("catalog controller clears keyword search and reloads", async () => {
  const { kernel, requestCalls, routeCalls } = createKernelStub();
  const controller = createCatalogController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    detailRouteId: APP_ROUTE_IDS.novelDetail,
  });

  controller.setKeyword("brocade");
  await controller.clearSearch();

  const lastCall = requestCalls.at(-1) as Record<string, unknown> | undefined;
  assert.equal(controller.store.getState().query.keyword, "");
  assert.equal(lastCall?.keyword, undefined);
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.catalog,
    params: {},
  });
});

test("catalog controller hydrates keyword and filters from current route params", async () => {
  const { kernel, requestCalls, setCurrentParams } = createKernelStub();
  setCurrentParams({
    keyword: "sword",
    categoryKey: "wuxia",
    status: "serializing",
    sort: "updatedAt",
  });

  const controller = createCatalogController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    detailRouteId: APP_ROUTE_IDS.novelDetail,
  });

  await controller.loadInitial();

  const lastCall = requestCalls.at(-1) as Record<string, unknown> | undefined;
  assert.equal(controller.store.getState().query.keyword, "sword");
  assert.equal(controller.store.getState().activeCategoryKey, "wuxia");
  assert.equal(controller.store.getState().activeStatus, "serializing");
  assert.equal(controller.store.getState().sort, "updatedAt");
  assert.equal(lastCall?.keyword, "sword");
  assert.equal(lastCall?.categoryKey, "wuxia");
  assert.equal(lastCall?.status, "serializing");
  assert.equal(lastCall?.sort, "updatedAt");
});

test("catalog controller hydrates the latest reading milestone from shared storage", async () => {
  const { kernel, storageValues } = createKernelStub();
  storageValues.set("novel.latest-milestone", {
    novelId: "novel_lantern",
    chapterId: "lantern_ch_06",
    title: "Volume 2 complete",
    copy: "The storefront should remember the latest completed reading milestone.",
    meta: "Saved from reader",
    source: "reader",
    type: "volume-complete",
    savedAt: "2026-04-05T10:00:00.000Z",
  });
  storageValues.set("novel.latest-milestone-history", [
    {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_06",
      title: "Volume 2 complete",
      copy: "The storefront should remember the latest completed reading milestone.",
      meta: "Saved from reader",
      source: "reader",
      type: "volume-complete",
      savedAt: "2026-04-05T10:00:00.000Z",
    },
    {
      novelId: "novel_brocade",
      title: "Brocade archived",
      copy: "Archive re-entry should still be visible on home.",
      meta: "Saved from bookshelf",
      source: "bookshelf",
      type: "archive-milestone",
      savedAt: "2026-04-04T09:00:00.000Z",
    },
  ]);

  const controller = createCatalogController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    detailRouteId: APP_ROUTE_IDS.novelDetail,
  });

  await controller.loadInitial();

  assert.equal(controller.store.getState().latestMilestoneTitle, "Volume 2 complete");
  assert.equal(
    controller.store.getState().latestMilestoneCopy,
    "The storefront should remember the latest completed reading milestone.",
  );
  assert.equal(controller.store.getState().latestMilestoneMeta, "Saved from reader");
  assert.equal(controller.store.getState().latestMilestoneSourceLabel, "Saved from reader");
  assert.equal(controller.store.getState().latestMilestoneReturnLabel, "Return to chapter");
  assert.equal(controller.store.getState().milestoneHistory.length, 2);
  assert.equal(controller.store.getState().milestoneHistory[0]?.typeLabel, "Volume complete");
  assert.equal(controller.store.getState().milestoneHistory[1]?.typeLabel, "Archive milestone");
  assert.equal(controller.store.getState().milestoneHistory[1]?.sourceLabel, "Saved from bookshelf");
});

test("catalog controller can reopen the latest milestone route", async () => {
  const { kernel, storageValues, routeCalls } = createKernelStub();
  storageValues.set("novel.latest-milestone", {
    novelId: "novel_lantern",
    chapterId: "lantern_ch_06",
    title: "Volume 2 complete",
    copy: "Reopen the latest milestone from home.",
    meta: "Saved from reader",
    source: "reader",
    type: "chapter-recap",
    savedAt: "2026-04-05T10:00:00.000Z",
  });

  const controller = createCatalogController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    detailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
    tocRouteId: APP_ROUTE_IDS.toc,
    bookshelfRouteId: APP_ROUTE_IDS.bookshelf,
  });

  await controller.loadInitial();
  const result = await controller.openLatestMilestone();

  assert.equal(result.ok, true);
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.reader,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_06",
    },
  });
});

test("catalog controller can continue a novel from the saved chapter when available", async () => {
  const { kernel, routeCalls } = createKernelStub();
  kernel.request.get = async <T>(_url: string, query?: Record<string, unknown>) =>
    ok(createCatalogResponse([
      {
        id: "novel_lantern",
        slug: "ashes-of-the-lantern",
        title: "Ashes Of The Lantern",
        authorName: "Lin Yue",
        summary: "A canal-city mystery built for serialized reading.",
        categoryKey: "mystery",
        categoryLabel: "Mystery",
        tags: [],
        status: "serializing",
        updatedAt: "2026-03-22T08:00:00.000Z",
        wordCount: 182000,
        isFree: true,
        isTrial: true,
        requiresMembership: false,
        isPurchased: true,
        continueChapterId: "lantern_ch_05",
        continueChapterTitle: "Chapter 5 · Ink On Wet Stone",
      },
    ], query) as T);

  const controller = createCatalogController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    detailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.loadInitial();
  const result = await controller.continueReading("novel_lantern");

  assert.equal(result.ok, true);
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.reader,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_05",
    },
  });
});

test("catalog controller derives recommendation reasons for surfaced titles", async () => {
  const { kernel } = createKernelStub();
  kernel.request.get = async <T>(_url: string, query?: Record<string, unknown>) =>
    ok(createCatalogResponse([
      {
        id: "novel_lantern",
        slug: "ashes-of-the-lantern",
        title: "Ashes Of The Lantern",
        authorName: "Lin Yue",
        summary: "A canal-city mystery built for serialized reading.",
        categoryKey: "mystery",
        categoryLabel: "Mystery",
        tags: [],
        status: "serializing",
        updatedAt: "2026-03-22T08:00:00.000Z",
        wordCount: 182000,
        isFree: true,
        isTrial: true,
        requiresMembership: false,
        isPurchased: true,
        continueChapterId: "lantern_ch_05",
        continueChapterTitle: "Chapter 5 · Ink On Wet Stone",
      },
      {
        id: "novel_brocade",
        slug: "brocade-pavilion",
        title: "Brocade Pavilion",
        authorName: "Qiao An",
        summary: "Merchant-house intrigue with a premium archive lane.",
        categoryKey: "historical",
        categoryLabel: "Historical",
        tags: [],
        status: "completed",
        updatedAt: "2026-03-20T08:00:00.000Z",
        wordCount: 201000,
        isFree: false,
        isTrial: true,
        requiresMembership: true,
      },
    ], query) as T);

  const controller = createCatalogController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    detailRouteId: APP_ROUTE_IDS.novelDetail,
  });

  await controller.loadInitial();

  assert.match(
    controller.store.getState().items[0]?.recommendedReason ?? "",
    /Because you paused at Chapter 5 · Ink On Wet Stone/,
  );
  assert.match(
    controller.store.getState().items[1]?.recommendedReason ?? "",
    /premium lane/i,
  );
  assert.equal(
    controller.store.getState().selectedReason,
    controller.store.getState().items[0]?.recommendedReason,
  );
  assert.equal(
    controller.store.getState().membershipReason,
    controller.store.getState().items[1]?.recommendedReason,
  );
  assert.match(
    controller.store.getState().updateReason ?? "",
    /recent-updates lane|Chapter 5 · Ink On Wet Stone|moved after your last session/i,
  );
  assert.match(
    controller.store.getState().frontlistReason ?? "",
    /frontlist|living serial|editorial discovery lane/i,
  );
  assert.match(
    controller.store.getState().storefrontReason ?? "",
    /storefront|editorial lead|live return path/i,
  );
  assert.match(
    controller.store.getState().serialReason ?? "",
    /serial lane|live publication cadence|feeling active/i,
  );
  assert.match(
    controller.store.getState().rankingReason ?? "",
    /readership table|ranking lane|confidence signal/i,
  );
});

test("catalog controller stores recent searches and supports quick keyword re-entry", async () => {
  const { kernel, requestCalls, storageValues } = createKernelStub();
  const controller = createCatalogController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    detailRouteId: APP_ROUTE_IDS.novelDetail,
  });

  controller.setKeyword("lantern");
  await controller.submitSearch();
  await controller.applySearchKeyword("brocade");

  assert.deepEqual(controller.store.getState().recentSearches, ["brocade", "lantern"]);
  assert.deepEqual(storageValues.get("catalog.search-history"), ["brocade", "lantern"]);
  const lastCall = requestCalls.at(-1) as Record<string, unknown> | undefined;
  assert.equal(lastCall?.keyword, "brocade");
});
