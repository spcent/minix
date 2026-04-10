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
        version: "1.0.0",
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
      order: {
        orderId: "ord_reader_1",
        title: "Monthly Membership",
        status: "paid",
        productType: "membership",
        channel: "h5_pay",
        currency: "CNY",
        totalAmountCents: 1900,
        duplicateProtected: false,
        source: "reader",
        novelId: "novel_lantern",
        chapterId: "lantern_ch_04",
        createdAt: "2026-04-08T10:00:00.000Z",
        updatedAt: "2026-04-08T10:00:00.000Z",
        lineItems: [
          {
            productId: "membership_monthly",
            productType: "membership",
            title: "Monthly Membership",
            quantity: 1,
            unitAmountCents: 1900,
            totalAmountCents: 1900,
          },
        ],
      },
      paymentIntent: {
        intentId: "pi_reader_1",
        orderId: "ord_reader_1",
        channel: "h5_pay",
        status: "succeeded",
        clientAction: "h5_redirect",
      },
      paymentResult: {
        orderId: "ord_reader_1",
        status: "success",
        paid: true,
        duplicateProtected: false,
        callbackVerified: false,
        message: "Payment completed in the sample payment domain.",
      },
      entitlement: {
        entitlementId: "ent_membership_ord_reader_1",
        productType: "membership",
        active: true,
        statusLabel: "Membership active with premium reading unlocked",
        sourceOrderId: "ord_reader_1",
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
      },
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
  assert.equal(controller.store.getState().order?.orderId, "ord_reader_1");
  assert.equal(controller.store.getState().paymentResult?.status, "success");
  assert.equal(controller.store.getState().entitlement?.sourceOrderId, "ord_reader_1");
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
      order: {
        orderId: "ord_toc_1",
        title: "Quarterly Membership",
        status: "paid",
        productType: "membership",
        channel: "h5_pay",
        currency: "CNY",
        totalAmountCents: 4900,
        duplicateProtected: false,
        source: "toc",
        novelId: "novel_lantern",
        chapterId: "lantern_ch_05",
        createdAt: "2026-04-08T10:00:00.000Z",
        updatedAt: "2026-04-08T10:00:00.000Z",
        lineItems: [
          {
            productId: "membership_quarterly",
            productType: "membership",
            title: "Quarterly Membership",
            quantity: 1,
            unitAmountCents: 4900,
            totalAmountCents: 4900,
          },
        ],
      },
      paymentIntent: {
        intentId: "pi_toc_1",
        orderId: "ord_toc_1",
        channel: "h5_pay",
        status: "succeeded",
        clientAction: "h5_redirect",
      },
      paymentResult: {
        orderId: "ord_toc_1",
        status: "success",
        paid: true,
        duplicateProtected: false,
        callbackVerified: false,
        message: "Payment completed in the sample payment domain.",
      },
      entitlement: {
        entitlementId: "ent_membership_ord_toc_1",
        productType: "membership",
        active: true,
        statusLabel: "Membership active with premium reading unlocked",
        sourceOrderId: "ord_toc_1",
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
      },
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

test("subscription controller can refresh, cancel, refund, and reconcile transaction state", async () => {
  const { kernel } = createKernelStub();
  let latestOrderDetail = {
    order: {
      orderId: "ord_pending_1",
      title: "Monthly Membership",
      status: "pending_payment" as const,
      productType: "membership" as const,
      channel: "h5_pay" as const,
      currency: "CNY",
      totalAmountCents: 1900,
      duplicateProtected: false,
      createdAt: "2026-04-08T10:00:00.000Z",
      updatedAt: "2026-04-08T10:00:00.000Z",
      lineItems: [
        {
          productId: "membership_monthly",
          productType: "membership" as const,
          title: "Monthly Membership",
          quantity: 1,
          unitAmountCents: 1900,
          totalAmountCents: 1900,
        },
      ],
    },
    paymentIntent: {
      intentId: "pi_pending_1",
      orderId: "ord_pending_1",
      channel: "h5_pay" as const,
      status: "processing" as const,
      clientAction: "h5_redirect" as const,
    },
    paymentResult: {
      orderId: "ord_pending_1",
      status: "pending" as const,
      paid: false,
      duplicateProtected: false,
      callbackVerified: false,
      message: "Payment is pending gateway confirmation in the sample payment domain.",
    },
    callbackVerification: {
      status: "pending" as const,
      message: "The sample gateway callback has not been verified yet.",
    },
    reconciliation: {
      status: "pending" as const,
      message: "The sample order has not been reconciled yet.",
    },
    entitlement: {
      entitlementId: "ent_membership_ord_pending_1",
      productType: "membership" as const,
      active: false,
      statusLabel: "Pending payment confirmation",
      sourceOrderId: "ord_pending_1",
      overview: {
        active: false,
        tier: "signed-in" as const,
        entitlementScope: "none" as const,
        statusLabel: "Payment pending",
        renewalLabel: "Renews monthly",
        headline: "Awaiting Payment",
        subheadline: "The order is created but membership is not active until the callback is verified.",
        benefits: [],
      },
    },
  } as any;

  kernel.request.post = async <T>(path: string) => {
    if (path === "/membership/purchase") {
      return ok({
        purchased: true,
        order: latestOrderDetail.order,
        paymentIntent: latestOrderDetail.paymentIntent,
        paymentResult: latestOrderDetail.paymentResult,
        entitlement: latestOrderDetail.entitlement,
        source: "reader",
        novelId: "novel_lantern",
        chapterId: "lantern_ch_04",
        returnTarget: "reader",
        overview: latestOrderDetail.entitlement.overview,
      } as T);
    }

    if (path === "/orders/cancel") {
      latestOrderDetail = {
        ...latestOrderDetail,
        order: { ...latestOrderDetail.order, status: "cancelled", updatedAt: "2026-04-08T10:10:00.000Z" },
        paymentIntent: { ...latestOrderDetail.paymentIntent, status: "cancelled" },
        paymentResult: { ...latestOrderDetail.paymentResult, status: "cancelled", message: "Order cancelled before payment completion." },
        reconciliation: { status: "reconciled", message: "Order cancellation and payment result are aligned.", checkedAt: "2026-04-08T10:10:00.000Z" },
        operationResult: {
          operation: "cancel",
          applied: true,
          orderStatus: "cancelled",
          paymentStatus: "cancelled",
          message: "Order cancelled before payment completion.",
          processedAt: "2026-04-08T10:10:00.000Z",
        },
      };
      return ok(latestOrderDetail as T);
    }

    if (path === "/payments/reconcile") {
      latestOrderDetail = {
        ...latestOrderDetail,
        reconciliation: { status: "reconciled", message: "The stored payment result matches the current order state.", checkedAt: "2026-04-08T10:11:00.000Z" },
        operationResult: {
          operation: "reconcile",
          applied: true,
          orderStatus: latestOrderDetail.order.status,
          paymentStatus: latestOrderDetail.paymentResult.status,
          message: "The stored payment result matches the current order state.",
          processedAt: "2026-04-08T10:11:00.000Z",
        },
      };
      return ok(latestOrderDetail as T);
    }

    if (path === "/orders/refund") {
      latestOrderDetail = {
        ...latestOrderDetail,
        order: { ...latestOrderDetail.order, status: "refunded", updatedAt: "2026-04-08T10:20:00.000Z" },
        paymentResult: { ...latestOrderDetail.paymentResult, status: "refunded", paid: false, message: "Refund completed in the sample payment domain." },
        entitlement: { ...latestOrderDetail.entitlement, active: false, statusLabel: "Refunded" },
        reconciliation: { status: "reconciled", message: "Refund state reconciled with the stored order record.", checkedAt: "2026-04-08T10:20:00.000Z" },
        operationResult: {
          operation: "refund",
          applied: true,
          orderStatus: "refunded",
          paymentStatus: "refunded",
          message: "Refund completed in the sample payment domain.",
          processedAt: "2026-04-08T10:20:00.000Z",
        },
      };
      return ok(latestOrderDetail as T);
    }

    return ok({} as T);
  };

  kernel.request.get = async <T>(path: string) => {
    if (path === "/orders/detail") {
      return ok(latestOrderDetail as T);
    }

    if (path === "/payments/result") {
      return ok(latestOrderDetail.paymentResult as T);
    }

    return ok({
      active: false,
      tier: "signed-in",
      entitlementScope: "none",
      statusLabel: "Signed in with standard reading access",
      renewalLabel: "Upgrade to unlock reading",
      headline: "Membership Center",
      subheadline: "Unlock premium reading.",
      benefits: [],
    } as T);
  };

  const controller = createSubscriptionController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
  });

  await controller.load();
  await controller.purchaseMembership("monthly");
  assert.equal(controller.store.getState().canCancelOrder, true);
  assert.equal(controller.store.getState().paymentResult?.status, "pending");

  await controller.refreshTransaction();
  await controller.cancelOrder();
  assert.equal(controller.store.getState().order?.status, "cancelled");
  assert.equal(controller.store.getState().transactionMessage, "Order cancelled before payment completion.");

  latestOrderDetail = {
    ...latestOrderDetail,
    order: { ...latestOrderDetail.order, status: "paid" },
    paymentIntent: { ...latestOrderDetail.paymentIntent, status: "succeeded" },
    paymentResult: { ...latestOrderDetail.paymentResult, status: "success", paid: true, message: "Payment callback confirmed the successful payment result." },
    entitlement: { ...latestOrderDetail.entitlement, active: true, statusLabel: "Membership active" },
  };
  await controller.refreshTransaction();
  await controller.reconcileOrder();
  assert.equal(controller.store.getState().reconciliation?.status, "reconciled");

  await controller.refundOrder();
  assert.equal(controller.store.getState().order?.status, "refunded");
  assert.equal(controller.store.getState().paymentResult?.status, "refunded");
  assert.equal(controller.store.getState().canRefundOrder, false);
});
