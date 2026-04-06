import test from "node:test";
import assert from "node:assert/strict";

import { APP_ROUTE_IDS } from "@minix/contracts";
import { ok, type AppKernel } from "@minix/core";

import { createSubscriptionController } from "./index";

function createKernelStub(options?: {
  source?: string;
  novelId?: string;
  chapterId?: string;
  latestMilestone?: {
    novelId?: string;
    title: string;
    copy: string;
    meta?: string;
    source: "reader" | "toc" | "bookshelf";
    type: "volume-complete" | "archive-milestone" | "chapter-recap";
    savedAt: string;
  };
}): { kernel: AppKernel; routeCalls: string[] } {
  const routeCalls: string[] = [];
  const source = options?.source ?? "reader";
  const novelId = options?.novelId ?? "novel_lantern";
  const chapterId = options?.chapterId ?? "lantern_ch_04";

  return {
    routeCalls,
    kernel: {
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
        async get<T>() { return ok((options?.latestMilestone as T | null | undefined) ?? null); },
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
        async get<T>() {
          return ok({
            active: false,
            tier: "signed-in",
            entitlementScope: "none",
            statusLabel: "Signed in with standard reading access",
            renewalLabel: "Upgrade to unlock reading",
            headline: "Membership Center",
            subheadline: "Unlock premium reading.",
            benefits: [
              {
                key: "premium",
                label: "Premium Access",
                description: "Open locked chapters.",
              },
            ],
          } as T);
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
        async toRoute(routeId: string, params?: Record<string, string | number | boolean>) {
          routeCalls.push(`${routeId}:${JSON.stringify(params ?? null)}`);
          return ok(undefined);
        },
        async replaceRoute() { return ok(undefined); },
        resolve() { return ok("/membership"); },
        async back() { return ok(undefined); },
        current() {
          return ok({
            path: "/membership",
            params: {
              source,
              novelId,
              chapterId,
            },
          });
        },
      },
      ui: {
        async toast() { return ok(undefined); },
        async loading() { return ok(undefined); },
        async modal() { return ok(true); },
      },
    },
  };
}

test("subscription controller loads overview and route context", async () => {
  const { kernel } = createKernelStub();
  const controller = createSubscriptionController({
    kernel,
    catalogRouteId: "catalog.index",
  });

  const result = await controller.load();

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().title, "Membership Center");
  assert.equal(controller.store.getState().source, "reader");
  assert.equal(controller.store.getState().benefits.length, 1);
  assert.equal(controller.store.getState().recommendedPlanId, "monthly");
  assert.equal(
    controller.store.getState().unlockOutcomeLabel,
    "Unlock happens immediately on the quarterly plan, then the blocked chapter can reopen without losing reading position.",
  );
  assert.equal(
    controller.store.getState().returnContextLabel,
    "Return path will reopen chapter lantern_ch_04 inside the reader flow.",
  );
});

test("subscription controller hydrates the latest milestone from shared storage", async () => {
  const { kernel } = createKernelStub({
    latestMilestone: {
      novelId: "novel_lantern",
      title: "Volume 2 complete",
      copy: "Membership should know the latest completed milestone as well as the blocked return path.",
      meta: "Saved from bookshelf",
      source: "bookshelf",
      type: "archive-milestone",
      savedAt: "2026-04-05T10:00:00.000Z",
    },
  });
  kernel.storage.get = async <T>(key: string) => {
    if (key === "novel.latest-milestone-history") {
      return ok([
        {
          novelId: "novel_lantern",
          title: "Volume 2 complete",
          copy: "Membership should know the latest completed milestone as well as the blocked return path.",
          meta: "Saved from bookshelf",
          source: "bookshelf",
          type: "archive-milestone",
          savedAt: "2026-04-05T10:00:00.000Z",
        },
        {
          novelId: "novel_lantern",
          chapterId: "lantern_ch_04",
          title: "Reader milestone",
          copy: "Reader progression should remain visible here too.",
          meta: "Saved from reader",
          source: "reader",
          type: "chapter-recap",
          savedAt: "2026-04-04T10:00:00.000Z",
        },
      ] as T);
    }

    return ok(({
      novelId: "novel_lantern",
      title: "Volume 2 complete",
      copy: "Membership should know the latest completed milestone as well as the blocked return path.",
      meta: "Saved from bookshelf",
      source: "bookshelf",
      type: "archive-milestone",
      savedAt: "2026-04-05T10:00:00.000Z",
    } as T | null));
  };
  const controller = createSubscriptionController({
    kernel,
    catalogRouteId: "catalog.index",
  });

  await controller.load();

  assert.equal(controller.store.getState().latestMilestoneTitle, "Volume 2 complete");
  assert.equal(
    controller.store.getState().latestMilestoneCopy,
    "Membership should know the latest completed milestone as well as the blocked return path.",
  );
  assert.equal(controller.store.getState().latestMilestoneMeta, "Saved from bookshelf");
  assert.equal(controller.store.getState().latestMilestoneSourceLabel, "Saved from bookshelf");
  assert.equal(controller.store.getState().latestMilestoneReturnLabel, "Open bookshelf");
  assert.equal(controller.store.getState().milestoneHistory.length, 2);
  assert.equal(controller.store.getState().milestoneHistory[0]?.typeLabel, "Archive milestone");
  assert.equal(controller.store.getState().milestoneHistory[1]?.typeLabel, "Chapter recap");
});

test("subscription controller can reopen the latest milestone route", async () => {
  const { kernel, routeCalls } = createKernelStub({
    latestMilestone: {
      novelId: "novel_lantern",
      title: "Volume 2 complete",
      copy: "Membership can reopen the shelf milestone.",
      meta: "Saved from bookshelf",
      source: "bookshelf",
      type: "archive-milestone",
      savedAt: "2026-04-05T10:00:00.000Z",
    },
  });
  kernel.storage.get = async <T>(key: string) => {
    if (key === "novel.latest-milestone-history") {
      return ok([
        {
          novelId: "novel_lantern",
          title: "Volume 2 complete",
          copy: "Membership can reopen the shelf milestone.",
          meta: "Saved from bookshelf",
          source: "bookshelf",
          type: "archive-milestone",
          savedAt: "2026-04-05T10:00:00.000Z",
        },
      ] as T);
    }

    return ok(({
      novelId: "novel_lantern",
      title: "Volume 2 complete",
      copy: "Membership can reopen the shelf milestone.",
      meta: "Saved from bookshelf",
      source: "bookshelf",
      type: "archive-milestone",
      savedAt: "2026-04-05T10:00:00.000Z",
    } as T | null));
  };
  const controller = createSubscriptionController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    readerRouteId: APP_ROUTE_IDS.reader,
    tocRouteId: APP_ROUTE_IDS.toc,
    bookshelfRouteId: APP_ROUTE_IDS.bookshelf,
  });

  await controller.load();
  const result = await controller.openLatestMilestone();

  assert.equal(result.ok, true);
  assert.deepEqual(routeCalls.at(-1), `${APP_ROUTE_IDS.bookshelf}:null`);
});

test("subscription controller can purchase membership and continue back to the blocked reader chapter", async () => {
  const { kernel, routeCalls } = createKernelStub();
  kernel.request.post = async <T>() =>
    ok({
      purchased: true,
      source: "reader",
      novelId: "novel_lantern",
      chapterId: "lantern_ch_04",
      returnTarget: "reader",
      overview: {
        active: true,
        tier: "member",
        entitlementScope: "membership",
        statusLabel: "Membership active with premium reading unlocked",
        renewalLabel: "Renews monthly",
        headline: "Membership Active",
        subheadline: "Premium reading unlocked.",
        benefits: [
          {
            key: "premium",
            label: "Premium Access",
            description: "Open locked chapters.",
          },
        ],
      },
    } as T);

  const controller = createSubscriptionController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    readerRouteId: APP_ROUTE_IDS.reader,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
  });

  await controller.load();
  const purchaseResult = await controller.purchaseMembership("monthly");
  const continueResult = await controller.continueAfterPurchase();

  assert.equal(purchaseResult.ok, true);
  assert.equal(continueResult.ok, true);
  assert.equal(controller.store.getState().overview?.active, true);
  assert.equal(controller.store.getState().lastPurchasedPlanId, "monthly");
  assert.equal(
    controller.store.getState().purchaseSuccessMessage,
    "Membership unlocked. Return to the blocked chapter with your reading position intact.",
  );
  assert.equal(controller.store.getState().recommendedPlanId, "quarterly");
  assert.equal(
    controller.store.getState().unlockOutcomeLabel,
    "Unlock happens immediately on the monthly plan, then the blocked chapter can reopen without losing reading position.",
  );
  assert.deepEqual(routeCalls, [`${APP_ROUTE_IDS.reader}:{"novelId":"novel_lantern","chapterId":"lantern_ch_04"}`]);
});

test("subscription controller can continue back to toc when the unlock flow started from the directory", async () => {
  const { kernel, routeCalls } = createKernelStub({
    source: "toc",
    chapterId: "lantern_ch_05",
  });
  kernel.request.post = async <T>() =>
    ok({
      purchased: true,
      source: "toc",
      novelId: "novel_lantern",
      chapterId: "lantern_ch_05",
      returnTarget: "catalog",
      overview: {
        active: true,
        tier: "member",
        entitlementScope: "membership",
        statusLabel: "Membership active with premium reading unlocked",
        renewalLabel: "Renews quarterly",
        headline: "Membership Active",
        subheadline: "Premium reading unlocked.",
        benefits: [
          {
            key: "premium",
            label: "Premium Access",
            description: "Open locked chapters.",
          },
        ],
      },
    } as T);

  const controller = createSubscriptionController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
    readerRouteId: APP_ROUTE_IDS.reader,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    tocRouteId: APP_ROUTE_IDS.toc,
  });

  await controller.load();
  await controller.purchaseMembership("quarterly");
  const continueResult = await controller.continueAfterPurchase();

  assert.equal(continueResult.ok, true);
  assert.equal(controller.store.getState().lockedMessage, "Access is now unlocked for the chapter you selected in the directory.");
  assert.equal(
    controller.store.getState().returnContextLabel,
    "Return path will reopen the directory with lantern_ch_05 still in focus.",
  );
  assert.deepEqual(routeCalls, [`${APP_ROUTE_IDS.toc}:{"novelId":"novel_lantern","chapterId":"lantern_ch_05"}`]);
});
