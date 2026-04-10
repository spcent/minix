import test from "node:test";
import assert from "node:assert/strict";

import { APP_ROUTE_IDS } from "@minix/contracts";
import { ok, type AppKernel } from "@minix/core";
import type { ChapterListResponse, LoadReadingProgressResponse } from "@minix/contracts";

import { createTocController } from "./index";

interface KernelStubOptions {
  chapters?: ChapterListResponse;
  progress?: LoadReadingProgressResponse;
  currentNovelId?: string;
  currentChapterId?: string;
}

function createKernelStub(options: KernelStubOptions = {}) {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const currentNovelId = options.currentNovelId ?? "novel_lantern";
  const currentChapterId = options.currentChapterId;
  const chapters: ChapterListResponse =
    options.chapters ?? {
      novelId: "novel_lantern",
      totalChapters: 3,
      continueChapterId: "lantern_ch_02",
      volumes: [
        {
          id: "lantern_vol_01",
          novelId: "novel_lantern",
          title: "Volume I",
          order: 1,
          chapters: [
            {
              id: "lantern_ch_01",
              novelId: "novel_lantern",
              volumeId: "lantern_vol_01",
              title: "Chapter 1",
              order: 1,
              wordCount: 4100,
              updatedAt: "2026-03-21T08:00:00.000Z",
              isFree: true,
              isTrial: true,
              requiresMembership: false,
              isPurchased: true,
            },
            {
              id: "lantern_ch_02",
              novelId: "novel_lantern",
              volumeId: "lantern_vol_01",
              title: "Chapter 2",
              order: 2,
              wordCount: 4200,
              updatedAt: "2026-03-22T08:00:00.000Z",
              isFree: true,
              isTrial: true,
              requiresMembership: false,
              isPurchased: true,
            },
            {
              id: "lantern_ch_03",
              novelId: "novel_lantern",
              volumeId: "lantern_vol_01",
              title: "Chapter 3",
              order: 3,
              wordCount: 4300,
              updatedAt: "2026-03-23T08:00:00.000Z",
              isFree: true,
              isTrial: true,
              requiresMembership: false,
              isPurchased: true,
            },
          ],
        },
      ],
    };
  const progress: LoadReadingProgressResponse = options.progress ?? {
    progress: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
      progressPercent: 0.74,
      updatedAt: "2026-03-24T09:00:00.000Z",
    },
  };

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
      async get() { return ok(null); },
      async set() { return ok(undefined); },
      async remove() { return ok(undefined); },
      async clear() { return ok(undefined); },
    },
    session: {
      async get() { return ok(null); },
      async set() { return ok(undefined); },
      async clear() { return ok(undefined); },
      async isLoggedIn() { return ok(false); },
    },
    request: {
      async get<T>(url: string) {
        if (url === "/chapters") {
          return ok(chapters as T);
        }

        if (url === "/reading-progress") {
          return ok(progress as T);
        }

        return ok({} as T);
      },
      async post<T>() { return ok({} as T); },
      async put<T>() { return ok({} as T); },
      async patch<T>() { return ok({} as T); },
      async delete<T>() { return ok({} as T); },
    },
    auth: {
      async ensureLogin() {
        return ok({ loggedIn: true, platform: "h5", identity: { userId: "u" }, token: { accessToken: "t" } });
      },
      async login() {
        return ok({ loggedIn: true, platform: "h5", identity: { userId: "u" }, token: { accessToken: "t" } });
      },
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
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      resolve() { return ok("/novel/toc"); },
      async back() { return ok(undefined); },
      current() {
        return ok({
          path: "/novel/toc",
          params: {
            novelId: currentNovelId,
            ...(currentChapterId ? { chapterId: currentChapterId } : {}),
          },
        });
      },
    },
    ui: {
      async toast() { return ok(undefined); },
      async loading() { return ok(undefined); },
      async modal() { return ok(true); },
    },
  };

  return { kernel, routeCalls };
}

test("toc controller marks state ready", () => {
  const { kernel } = createKernelStub();
  const controller = createTocController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  assert.equal(controller.store.getState().ready, false);
  controller.markReady();
  assert.equal(controller.store.getState().ready, true);
});

test("toc controller prefers saved progress when choosing continue chapter", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createTocController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  const result = await controller.load();

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().continueChapterId, "lantern_ch_03");
  assert.equal(controller.store.getState().currentChapterId, "lantern_ch_03");
  assert.equal(controller.store.getState().currentVolumeId, "lantern_vol_01");
  assert.equal(controller.store.getState().highlightedChapterId, "lantern_ch_03");
  assert.equal(controller.store.getState().expandedVolumeId, "lantern_vol_01");
  assert.equal(controller.store.getState().selectedChapterId, "lantern_ch_03");
  assert.deepEqual(controller.store.getState().readChapterIds, ["lantern_ch_01", "lantern_ch_02", "lantern_ch_03"]);
  assert.equal(controller.store.getState().currentVolumeProgressLabel, "Volume I · 3/3 chapters tracked");
  assert.match(controller.store.getState().currentVolumeSummary ?? "", /active program lane/i);
  assert.match(controller.store.getState().nextVolumeHandoffLabel ?? "", /no later volume handoff|final active volume/i);
  assert.equal(controller.store.getState().programMilestoneTitle, "Volume I complete");
  assert.match(controller.store.getState().programMilestoneCopy ?? "", /stable volume milestone|stable reading milestone/i);
  assert.equal(controller.store.getState().programMilestoneMeta, "3/3 chapters tracked");

  await controller.openSelectedChapter();

  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.reader,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
    },
  });
});

test("toc controller keeps the routed reader chapter highlighted even when saved progress differs", async () => {
  const { kernel } = createKernelStub({
    currentChapterId: "lantern_ch_02",
  });
  const controller = createTocController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  const result = await controller.load();

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().continueChapterId, "lantern_ch_03");
  assert.equal(controller.store.getState().currentChapterId, "lantern_ch_02");
  assert.equal(controller.store.getState().currentVolumeId, "lantern_vol_01");
  assert.equal(controller.store.getState().highlightedChapterId, "lantern_ch_02");
  assert.equal(controller.store.getState().expandedVolumeId, "lantern_vol_01");
  assert.equal(controller.store.getState().selectedChapterId, "lantern_ch_02");
  assert.deepEqual(controller.store.getState().readChapterIds, ["lantern_ch_01", "lantern_ch_02"]);
  assert.equal(controller.store.getState().currentVolumeProgressLabel, "Volume I · 2/3 chapters tracked");
  assert.match(controller.store.getState().nextVolumeHandoffLabel ?? "", /final active volume/i);
  assert.equal(controller.store.getState().programMilestoneTitle, undefined);
});

test("toc controller can collapse a secondary volume and jump back to the current chapter", async () => {
  const { kernel } = createKernelStub({
    chapters: {
      novelId: "novel_lantern",
      totalChapters: 4,
      continueChapterId: "lantern_ch_03",
      volumes: [
        {
          id: "lantern_vol_01",
          novelId: "novel_lantern",
          title: "Volume I",
          order: 1,
          chapters: [
            { id: "lantern_ch_01", novelId: "novel_lantern", volumeId: "lantern_vol_01", title: "Chapter 1", order: 1, wordCount: 4100, updatedAt: "2026-03-21T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
            { id: "lantern_ch_02", novelId: "novel_lantern", volumeId: "lantern_vol_01", title: "Chapter 2", order: 2, wordCount: 4200, updatedAt: "2026-03-22T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
          ],
        },
        {
          id: "lantern_vol_02",
          novelId: "novel_lantern",
          title: "Volume II",
          order: 2,
          chapters: [
            { id: "lantern_ch_03", novelId: "novel_lantern", volumeId: "lantern_vol_02", title: "Chapter 3", order: 3, wordCount: 4300, updatedAt: "2026-03-23T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
            { id: "lantern_ch_04", novelId: "novel_lantern", volumeId: "lantern_vol_02", title: "Chapter 4", order: 4, wordCount: 4400, updatedAt: "2026-03-24T08:00:00.000Z", isFree: true, isTrial: true, requiresMembership: false, isPurchased: true },
          ],
        },
      ],
    },
    currentChapterId: "lantern_ch_03",
  });
  const controller = createTocController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.load();
  assert.equal(controller.store.getState().expandedVolumeId, "lantern_vol_02");

  controller.toggleVolume("lantern_vol_02");
  assert.equal(controller.store.getState().expandedVolumeId, undefined);

  controller.selectChapter("lantern_ch_01");
  assert.equal(controller.store.getState().expandedVolumeId, "lantern_vol_01");

  controller.jumpToCurrentChapter();
  assert.equal(controller.store.getState().selectedChapterId, "lantern_ch_03");
  assert.equal(controller.store.getState().highlightedChapterId, "lantern_ch_03");
  assert.equal(controller.store.getState().expandedVolumeId, "lantern_vol_02");
});

test("toc controller can route a locked chapter into membership with toc context", async () => {
  const { kernel, routeCalls } = createKernelStub({
    currentChapterId: "lantern_ch_02",
  });
  const controller = createTocController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
    membershipRouteId: APP_ROUTE_IDS.membership,
  });

  await controller.load();
  const result = await controller.goToMembership("lantern_ch_03");

  assert.equal(result.ok, true);
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.membership,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
      source: "toc",
    },
  });
});
