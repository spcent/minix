import test from "node:test";
import assert from "node:assert/strict";

import { APP_ROUTE_IDS } from "@minix/contracts";
import { ok, type AppKernel } from "@minix/core";
import type { LoadReadingProgressResponse, NovelDetail } from "@minix/contracts";

import { createNovelDetailController } from "./index";

interface KernelStubOptions {
  detail?: NovelDetail;
  progress?: LoadReadingProgressResponse;
  currentNovelId?: string;
  latestMilestone?: {
    novelId?: string;
    chapterId?: string;
    title: string;
    copy: string;
    meta?: string;
    source: "reader" | "toc" | "bookshelf";
    type: "volume-complete" | "archive-milestone" | "chapter-recap";
    savedAt: string;
  };
}

function withContentFields(detail: Omit<NovelDetail, "contentDetail" | "contentAccess">): NovelDetail {
  return {
    ...detail,
    contentDetail: {
      contentId: detail.id,
      model: "novel_story",
      title: detail.title,
      ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
      summary: detail.summary,
      authorLabel: detail.author.name,
      display: {
        category: { key: detail.categoryKey, label: detail.categoryLabel },
        tags: detail.tags.map((tag) => ({ key: tag.key, label: tag.label })),
        topics: detail.tags.slice(0, 2).map((tag) => ({ key: tag.key, label: tag.label })),
        recommendationSlot: detail.requiresMembership ? "premium" : "frontlist",
        recommendationSlotLabel: detail.requiresMembership ? "Premium Spotlight" : "Frontlist Serial",
        pinned: detail.status === "serializing",
        featured: detail.requiresMembership || detail.status === "serializing",
      },
      lifecycle: {
        state: "published",
        availableActions: ["update", "archive", "delete"],
        updatedAt: "2026-03-24T09:00:00.000Z",
      },
    },
    contentAccess: {
      visibility: detail.requiresMembership ? "member_only" : "public",
      accessible: !detail.requiresMembership || Boolean(detail.isPurchased) || detail.isFree,
      previewAvailable: Boolean(detail.isFree || detail.isTrial),
      requiresLogin: false,
      requiresMembership: detail.requiresMembership,
      requiresPurchase: false,
      purchased: Boolean(detail.isPurchased),
      summaryLabel:
        detail.accessRuleSummaryLabel ??
        (detail.requiresMembership
          ? "This title stays in the premium lane until membership unlocks the complete reading route after the visible preview boundary."
          : "Open-access reading continues without a paywall in the current sample surface."),
    },
  };
}

function createKernelStub(options: KernelStubOptions = {}) {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const currentNovelId = options.currentNovelId ?? "novel_lantern";
  const detail: NovelDetail =
    options.detail ?? withContentFields({
      id: "novel_lantern",
      slug: "ashes-of-the-lantern",
      title: "Ashes Of The Lantern",
      subtitle: "Rain, ash, and hidden rooms.",
      author: {
        id: "author_lin",
        name: "Lin Yue",
      },
      summary: "A canal-city mystery built for serialized reading.",
      categoryKey: "mystery",
      categoryLabel: "Mystery",
      tags: [],
      status: "serializing",
      wordCount: 182000,
      chapterCount: 6,
      firstChapterId: "lantern_ch_01",
      continueChapterId: "lantern_ch_02",
      isFree: true,
      isTrial: true,
      requiresMembership: false,
      isPurchased: true,
      inBookshelf: false,
    });
  const progress: LoadReadingProgressResponse = options.progress ?? {
    progress: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_05",
      progressPercent: 0.68,
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
      version: "0.1.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {
      async get<T>() { return ok((options.latestMilestone as T | null | undefined) ?? null); },
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
        if (url === "/novels/detail") {
          return ok(detail as T);
        }

        if (url === "/reading-progress") {
          return ok(progress as T);
        }

        return ok({} as T);
      },
      async post<T>(_url: string, body?: unknown) {
        const novelId = (body as { novelId?: string } | undefined)?.novelId;
        return ok({
          novelId,
          inBookshelf: true,
          bookshelfCount: 6241,
          items: [],
        } as T);
      },
      async put<T>() { return ok({} as T); },
      async patch<T>() { return ok({} as T); },
      async delete<T>(_url: string, body?: unknown) {
        const novelId = (body as { novelId?: string } | undefined)?.novelId;
        return ok({
          novelId,
          inBookshelf: false,
          bookshelfCount: 6240,
          items: [],
        } as T);
      },
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
      resolve() { return ok("/novel/detail"); },
      async back() { return ok(undefined); },
      current() {
        return ok({
          path: "/novel/detail",
          params: {
            novelId: currentNovelId,
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

test("novel-detail controller marks state ready", () => {
  const { kernel } = createKernelStub();
  const controller = createNovelDetailController({
    kernel,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    tocRouteId: APP_ROUTE_IDS.toc,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  assert.equal(controller.store.getState().ready, false);
  controller.markReady();
  assert.equal(controller.store.getState().ready, true);
});

test("novel-detail controller prefers saved progress for continue reading", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createNovelDetailController({
    kernel,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    tocRouteId: APP_ROUTE_IDS.toc,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  const result = await controller.load();

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().detail?.continueChapterId, "lantern_ch_05");
  assert.equal(controller.store.getState().detailData?.id, "novel_lantern");
  assert.equal(controller.store.getState().detailStatus.loadState, "ready");
  assert.equal(controller.store.getState().detailStatus.entryContext, "deep_link");
  assert.equal(controller.store.getState().detailActions[0]?.key, "continue-reading");
  assert.match(controller.store.getState().reputationSummary ?? "", /editorial framing|reputation/i);
  assert.match(controller.store.getState().cadenceSummary ?? "", /latest visible movement|release rhythm/i);
  assert.match(controller.store.getState().trialSummary ?? "", /open to read|Open-access reading|continuation available/i);

  await controller.continueReading();

  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.reader,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_05",
    },
  });
});

test("novel-detail controller routes locked titles to membership", async () => {
  const { kernel, routeCalls } = createKernelStub({
    detail: withContentFields({
      id: "novel_brocade",
      slug: "brocade-pavilion",
      title: "Brocade Pavilion",
      subtitle: "Court intrigue and inheritance.",
      author: {
        id: "author_qiao",
        name: "Qiao An",
      },
      summary: "A premium serial behind membership.",
      categoryKey: "fantasy",
      categoryLabel: "Fantasy",
      tags: [],
      status: "completed",
      wordCount: 264000,
      chapterCount: 4,
      firstChapterId: "brocade_ch_01",
      continueChapterId: "brocade_ch_02",
      isFree: false,
      isTrial: false,
      requiresMembership: true,
      isPurchased: false,
      inBookshelf: false,
    }),
    progress: {
      progress: {
        novelId: "novel_brocade",
        chapterId: "brocade_ch_02",
        progressPercent: 0.3,
        updatedAt: "2026-03-24T09:00:00.000Z",
      },
    },
    currentNovelId: "novel_brocade",
  });
  const controller = createNovelDetailController({
    kernel,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    tocRouteId: APP_ROUTE_IDS.toc,
    readerRouteId: APP_ROUTE_IDS.reader,
    membershipRouteId: APP_ROUTE_IDS.membership,
  });

  await controller.load();
  await controller.continueReading();

  assert.equal(controller.store.getState().membershipLocked, true);
  assert.equal(controller.store.getState().detailActions[0]?.key, "open-membership");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.membership,
    params: {
      novelId: "novel_brocade",
      source: "detail",
    },
  });
});

test("novel-detail controller hydrates the latest milestone from shared storage", async () => {
  const { kernel } = createKernelStub({
    latestMilestone: {
      novelId: "novel_lantern",
      title: "Volume 2 complete",
      copy: "The title dossier should surface the latest completed milestone.",
      meta: "Saved from TOC",
      source: "toc",
      type: "volume-complete",
      savedAt: "2026-04-05T10:00:00.000Z",
    },
  });
  const controller = createNovelDetailController({
    kernel,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    tocRouteId: APP_ROUTE_IDS.toc,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.load();

  assert.equal(controller.store.getState().latestMilestoneTitle, "Volume 2 complete");
  assert.equal(
    controller.store.getState().latestMilestoneCopy,
    "The title dossier should surface the latest completed milestone.",
  );
  assert.equal(controller.store.getState().latestMilestoneMeta, "Saved from TOC");
  assert.equal(controller.store.getState().latestMilestoneSourceLabel, "Saved from TOC");
  assert.equal(controller.store.getState().latestMilestoneReturnLabel, "Return to directory");
});

test("novel-detail controller keeps detail actions in sync with bookshelf mutations", async () => {
  const { kernel } = createKernelStub();
  const controller = createNovelDetailController({
    kernel,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    tocRouteId: APP_ROUTE_IDS.toc,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.load();
  await controller.addToBookshelf();

  assert.equal(controller.store.getState().detail?.inBookshelf, true);
  assert.equal(controller.store.getState().detailData?.inBookshelf, true);
  assert.equal(controller.store.getState().detailActions[1]?.key, "remove-bookshelf");

  await controller.removeFromBookshelf();

  assert.equal(controller.store.getState().detail?.inBookshelf, false);
  assert.equal(controller.store.getState().detailData?.inBookshelf, false);
  assert.equal(controller.store.getState().detailActions[1]?.key, "add-bookshelf");
});

test("novel-detail controller can reopen the latest milestone route", async () => {
  const { kernel, routeCalls } = createKernelStub({
    latestMilestone: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_05",
      title: "Volume 2 complete",
      copy: "Reopen the latest milestone from detail.",
      meta: "Saved from TOC",
      source: "toc",
      type: "volume-complete",
      savedAt: "2026-04-05T10:00:00.000Z",
    },
  });
  const controller = createNovelDetailController({
    kernel,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    tocRouteId: APP_ROUTE_IDS.toc,
    readerRouteId: APP_ROUTE_IDS.reader,
    bookshelfRouteId: APP_ROUTE_IDS.bookshelf,
  });

  await controller.load();
  const result = await controller.openLatestMilestone();

  assert.equal(result.ok, true);
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.toc,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_05",
    },
  });
});

test("novel-detail controller can add and remove a title from the bookshelf", async () => {
  const { kernel } = createKernelStub();
  const controller = createNovelDetailController({
    kernel,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    tocRouteId: APP_ROUTE_IDS.toc,
    readerRouteId: APP_ROUTE_IDS.reader,
  });

  await controller.load();
  const addResult = await controller.addToBookshelf();
  const addedState = controller.store.getState();
  const removeResult = await controller.removeFromBookshelf();
  const removedState = controller.store.getState();

  assert.equal(addResult.ok, true);
  assert.equal(addedState.detail?.inBookshelf, true);
  assert.equal(addedState.detail?.bookshelfCount, 6241);
  assert.match(addedState.bookshelfSummary ?? "", /already on shelf|shelf workspace/i);
  assert.equal(addedState.bookshelfNotice, "Added to shelf. You can now resume it from the bookshelf workspace.");
  assert.equal(removeResult.ok, true);
  assert.equal(removedState.detail?.inBookshelf, false);
  assert.equal(removedState.detail?.bookshelfCount, 6240);
  assert.match(removedState.bookshelfSummary ?? "", /shelf adds|return candidate/i);
  assert.equal(removedState.bookshelfNotice, "Removed from shelf. The title can still be opened from the library or detail route.");
});
