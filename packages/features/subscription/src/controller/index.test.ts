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
  paymentCapability?: {
    available: boolean;
    mode: "native" | "degraded" | "unavailable";
    detail: string;
    fallbackActionLabel?: string;
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
        async get<T>(path?: string) {
          if (path === "/orders/catalog") {
            return ok({
              products: [
                {
                  productId: "membership_access",
                  productType: "membership",
                  title: "Membership Access",
                  summary: "Recurring membership packages that unlock premium reading and bundled benefits.",
                  active: true,
                  defaultSkuId: "membership_quarterly",
                  fulfillmentLabel: "Membership entitlement",
                  tagLabels: ["membership", "premium"],
                },
                {
                  productId: "study_club_plus",
                  productType: "subscription",
                  title: "Study Club Plus",
                  summary: "Auto-renewing subscription for premium consultation slots and discussion archives.",
                  active: true,
                  defaultSkuId: "study_club_plus_monthly",
                  fulfillmentLabel: "Recurring subscription entitlement",
                  tagLabels: ["subscription"],
                },
              ],
              skus: [
                {
                  skuId: "membership_quarterly",
                  productId: "membership_access",
                  productType: "membership",
                  title: "Quarterly Membership",
                  billingCycle: "quarterly",
                  autoRenew: true,
                  amountCents: 4900,
                  currency: "CNY",
                  active: true,
                  channelOptions: ["h5_pay"],
                  entitlementKey: "membership:quarterly",
                  statusLabel: "Renews quarterly",
                },
                {
                  skuId: "study_club_plus_monthly",
                  productId: "study_club_plus",
                  productType: "subscription",
                  title: "Study Club Plus Monthly",
                  billingCycle: "monthly",
                  autoRenew: true,
                  amountCents: 2900,
                  currency: "CNY",
                  active: true,
                  channelOptions: ["h5_pay"],
                  entitlementKey: "subscription:study_club_plus",
                  statusLabel: "Auto-renews monthly",
                },
              ],
            } as T);
          }

          if (path === "/orders/list") {
            return ok({
              orderList: {
                items: [],
                total: 0,
                page: 1,
                pageSize: 20,
                hasMore: false,
              },
            } as T);
          }

          if (path === "/subscriptions") {
            return ok({
              subscriptions: [],
            } as T);
          }

          if (path === "/after-sales/list") {
            return ok({
              cases: [],
            } as T);
          }

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
      capability: {
        status(capability: string) {
          const paymentCapability = options?.paymentCapability ?? {
            available: true,
            mode: "native" as const,
            detail: "Configured payment runtime is available.",
          };
          return ok({
            capability: capability as "clipboard" | "device" | "location" | "payment" | "share" | "subscription" | "upload",
            available: capability === "payment" ? paymentCapability.available : false,
            mode: capability === "payment" ? paymentCapability.mode : "unavailable",
            detail: capability === "payment" ? paymentCapability.detail : `${capability} capability is unavailable.`,
            ...(capability === "payment" && paymentCapability.fallbackActionLabel
              ? { fallbackActionLabel: paymentCapability.fallbackActionLabel }
              : {}),
          });
        },
        async execute(input: { capability: string; action: string }) {
          return ok({
            capability: input.capability as "payment",
            action: input.action,
            detail: "Native payment runtime launched successfully.",
          });
        },
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
  assert.equal(controller.store.getState().catalogProducts.length, 2);
  assert.equal(controller.store.getState().catalogSkus.length, 2);
  assert.equal(controller.store.getState().selectedSkuId, "membership_quarterly");
  assert.equal(controller.store.getState().orderListStatus.loadState, "empty");
  assert.equal(controller.store.getState().orderListStatus.firstLoaded, true);
  assert.equal(controller.store.getState().recommendedPlanId, "monthly");
  assert.equal(controller.store.getState().paymentCapabilityStatus?.mode, "native");
  assert.equal(controller.store.getState().paymentCapabilitySnapshot.capability, "payment");
  assert.equal(controller.store.getState().paymentCapabilitySnapshot.mode, "native");
  assert.equal(controller.store.getState().paymentCapabilitySummary, "Configured payment runtime is available.");
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

test("subscription controller surfaces unavailable payment posture before purchase execution", async () => {
  const { kernel } = createKernelStub({
    paymentCapability: {
      available: false,
      mode: "unavailable",
      detail: "Payment runtime is unavailable on this host.",
    },
  });
  const controller = createSubscriptionController({
    kernel,
    catalogRouteId: "catalog.index",
  });

  await controller.load();

  assert.equal(controller.store.getState().paymentCapabilityStatus?.mode, "unavailable");
  assert.equal(controller.store.getState().paymentCapabilitySnapshot.mode, "unavailable");
  assert.equal(
    controller.store.getState().paymentCapabilitySummary,
    "Payment runtime is unavailable on this host. Order creation can still succeed, but a host payment bridge is required before native payment execution can continue.",
  );
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
        capabilitySummary: "H5 payment can continue through redirect-based execution and resume through the shared order detail surface.",
        executionSummary:
          "The sample h5 pay execution completed, but callback verification and reconciliation still provide the continuity checkpoints.",
      },
      paymentResult: {
        orderId: "ord_reader_1",
        status: "success",
        paid: true,
        duplicateProtected: false,
        callbackVerified: false,
        message: "Payment completed in the sample payment domain.",
        continuitySummary:
          "The payment result is successful, but shared commerce continuity still depends on callback verification and reconciliation staying aligned.",
        duplicateProtectionSummary: "No duplicate-payment guard was triggered for this commerce attempt.",
      },
      operationResult: {
        operation: "verify_callback",
        applied: true,
        orderStatus: "paid",
        paymentStatus: "success",
        message: "Ledger entries recorded for the paid membership order.",
        processedAt: "2026-04-08T10:00:00.000Z",
        assetLedgerIds: ["asset_ledger_balance_1", "asset_ledger_membership_1"],
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
  assert.equal(controller.store.getState().transactionMessage, "Ledger entries recorded for the paid membership order.");
  assert.equal(
    controller.store.getState().paymentContinuitySummary,
    "The payment result is successful, but shared commerce continuity still depends on callback verification and reconciliation staying aligned.",
  );
  assert.match(controller.store.getState().paymentDiagnosticsSummary ?? "", /H5 payment can continue through redirect-based execution/);
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

test("subscription controller marks missing order detail as unavailable", async () => {
  const { kernel } = createKernelStub();
  const originalGet = kernel.request.get.bind(kernel.request);
  kernel.request.get = async <T>(path?: string, query?: Record<string, unknown>) => {
    if (path === "/orders/detail") {
      return {
        ok: false as const,
        error: {
          code: "NOT_FOUND",
          message: "Order not found",
          recoverable: false,
        },
      };
    }

    return originalGet<T>(path ?? "/membership", query);
  };

  const controller = createSubscriptionController({
    kernel,
    catalogRouteId: "catalog.index",
  });

  await controller.load();
  await controller.loadOrderDetail("ord_missing");

  assert.equal(controller.store.getState().commerceDetailStatus.loadState, "unavailable");
  assert.equal(controller.store.getState().commerceDetailStatus.requestedDetailId, "ord_missing");
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

test("subscription controller can purchase a generic sku and manage subscription plus after-sales surfaces", async () => {
  const { kernel } = createKernelStub();
  let afterSalesCases: Array<{
    caseId: string;
    orderId: string;
    kind: "cancel" | "refund";
    status: "completed";
    title: string;
    resultLabel: string;
    createdAt: string;
    updatedAt: string;
    completedAt: string;
  }> = [];
  let subscriptionRecord: any = {
    subscriptionId: "sub_study_club",
    productId: "study_club_plus",
    skuId: "study_club_plus_monthly",
    title: "Study Club Plus Monthly",
    productType: "subscription" as const,
    status: "active" as const,
    statusLabel: "Auto-renews monthly",
    autoRenew: true,
    startedAt: "2026-04-08T10:00:00.000Z",
    renewsAt: "2026-05-08T10:00:00.000Z",
    latestOrderId: "ord_sub_1",
    entitlementId: "ent_study_club_ord_sub_1",
  };
  let latestOrderDetail: any = {
    order: {
      orderId: "ord_sub_1",
      title: "Study Club Plus Monthly",
      status: "paid" as const,
      productType: "subscription" as const,
      channel: "h5_pay" as const,
      currency: "CNY",
      totalAmountCents: 2900,
      duplicateProtected: false,
      createdAt: "2026-04-08T10:00:00.000Z",
      updatedAt: "2026-04-08T10:00:00.000Z",
      lineItems: [
        {
          productId: "study_club_plus",
          skuId: "study_club_plus_monthly",
          productType: "subscription" as const,
          title: "Study Club Plus Monthly",
          quantity: 1,
          unitAmountCents: 2900,
          totalAmountCents: 2900,
        },
      ],
    },
    product: {
      productId: "study_club_plus",
      productType: "subscription" as const,
      title: "Study Club Plus",
      summary: "Auto-renewing subscription for premium consultation slots and discussion archives.",
      active: true,
      defaultSkuId: "study_club_plus_monthly",
      fulfillmentLabel: "Recurring subscription entitlement",
      tagLabels: ["subscription"],
    },
    sku: {
      skuId: "study_club_plus_monthly",
      productId: "study_club_plus",
      productType: "subscription" as const,
      title: "Study Club Plus Monthly",
      billingCycle: "monthly" as const,
      autoRenew: true,
      amountCents: 2900,
      currency: "CNY",
      active: true,
      channelOptions: ["h5_pay" as const],
      entitlementKey: "subscription:study_club_plus",
      statusLabel: "Auto-renews monthly",
    },
    paymentIntent: {
      intentId: "pi_sub_1",
      orderId: "ord_sub_1",
      channel: "h5_pay" as const,
      status: "succeeded" as const,
      clientAction: "h5_redirect" as const,
      capabilitySummary: "H5 payment can continue through redirect-based execution and resume through the shared order detail surface.",
    },
    paymentResult: {
      orderId: "ord_sub_1",
      status: "success" as const,
      paid: true,
      duplicateProtected: false,
      callbackVerified: false,
      message: "Study Club Plus Monthly completed in the sample payment domain.",
      continuitySummary:
        "The payment result is successful, but shared commerce continuity still depends on callback verification and reconciliation staying aligned.",
    },
    callbackVerification: {
      status: "pending" as const,
      message: "The sample gateway callback has not been verified yet.",
      diagnosticsSummary: "Callback verification is still waiting on the sample gateway payload.",
    },
    reconciliation: {
      status: "pending" as const,
      message: "The sample order has not been reconciled yet.",
      diagnosticsSummary:
        "Reconciliation is still pending, so callback and order state should be treated as provisional continuity checkpoints.",
      ledgerAuditSummary: "Callback and reconciliation ledgers will keep the append-only audit trail for this order.",
    },
    entitlement: {
      entitlementId: "ent_study_club_ord_sub_1",
      productType: "subscription" as const,
      active: true,
      statusLabel: "Study Club Plus fulfilled",
      sourceOrderId: "ord_sub_1",
    },
    subscription: subscriptionRecord,
    afterSalesCases,
  };

  kernel.request.get = async <T>(path: string, query?: Record<string, string | number | boolean>) => {
    if (path === "/orders/detail") {
      return ok(latestOrderDetail as T);
    }
    if (path === "/orders/list") {
      return ok({
        orderList: {
          items: [
            {
              orderId: latestOrderDetail.order.orderId,
              title: latestOrderDetail.order.title,
              status: latestOrderDetail.order.status,
              productType: latestOrderDetail.order.productType,
              skuId: latestOrderDetail.sku.skuId,
              currency: latestOrderDetail.order.currency,
              totalAmountCents: latestOrderDetail.order.totalAmountCents,
              createdAt: latestOrderDetail.order.createdAt,
              updatedAt: latestOrderDetail.order.updatedAt,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
          selectedOrderId: latestOrderDetail.order.orderId,
        },
      } as T);
    }
    if (path === "/subscriptions") {
      return ok({
        subscriptions: [subscriptionRecord],
        selectedSubscriptionId: subscriptionRecord.subscriptionId,
      } as T);
    }
    if (path === "/after-sales/list") {
      return ok({
        cases: afterSalesCases,
        selectedCaseId: afterSalesCases[0]?.caseId,
      } as T);
    }
    if (path === "/after-sales/detail") {
      return ok({
        caseItem: afterSalesCases.find((item) => item.caseId === query?.caseId) ?? afterSalesCases[0],
        order: latestOrderDetail.order,
        operationResult: {
          operation: "refund",
          applied: true,
          orderStatus: "refunded",
          paymentStatus: "refunded",
          message: "Refund completed in the sample payment domain.",
          processedAt: "2026-04-08T10:20:00.000Z",
        },
      } as T);
    }
    return createKernelStub().kernel.request.get<T>(path);
  };

  kernel.request.post = async <T>(path: string) => {
    if (path === "/orders/purchase") {
      return ok({
        order: latestOrderDetail.order,
        product: latestOrderDetail.product,
        sku: latestOrderDetail.sku,
        paymentIntent: latestOrderDetail.paymentIntent,
        paymentResult: latestOrderDetail.paymentResult,
        callbackVerification: latestOrderDetail.callbackVerification,
        reconciliation: latestOrderDetail.reconciliation,
        entitlement: latestOrderDetail.entitlement,
        subscription: latestOrderDetail.subscription,
      } as T);
    }
    if (path === "/subscriptions/cancel") {
      subscriptionRecord = {
        ...subscriptionRecord,
        status: "cancelled",
        statusLabel: "Auto-renew disabled. Access remains until the current term ends.",
        autoRenew: false,
        cancelledAt: "2026-04-08T10:10:00.000Z",
        graceEndsAt: subscriptionRecord.renewsAt,
      };
      latestOrderDetail = {
        ...latestOrderDetail,
        subscription: subscriptionRecord,
        operationResult: {
          operation: "cancel",
          applied: true,
          orderStatus: "paid",
          paymentStatus: "success",
          message: "Subscription auto-renew was disabled for the current term.",
          processedAt: "2026-04-08T10:10:00.000Z",
        },
      };
      return ok(latestOrderDetail as T);
    }
    if (path === "/subscriptions/renew") {
      subscriptionRecord = {
        ...subscriptionRecord,
        status: "active",
        statusLabel: "Renewal succeeded for the next subscription term.",
        autoRenew: true,
      };
      latestOrderDetail = {
        ...latestOrderDetail,
        order: { ...latestOrderDetail.order, orderId: "ord_sub_renewed", updatedAt: "2026-04-08T10:15:00.000Z" },
        subscription: { ...subscriptionRecord, latestOrderId: "ord_sub_renewed" },
        operationResult: {
          operation: "reconcile",
          applied: true,
          orderStatus: "paid",
          paymentStatus: "success",
          message: "Subscription renewal created the next paid term.",
          processedAt: "2026-04-08T10:15:00.000Z",
        },
      };
      return ok({
        order: latestOrderDetail.order,
        product: latestOrderDetail.product,
        sku: latestOrderDetail.sku,
        paymentIntent: latestOrderDetail.paymentIntent,
        paymentResult: latestOrderDetail.paymentResult,
        callbackVerification: latestOrderDetail.callbackVerification,
        reconciliation: latestOrderDetail.reconciliation,
        operationResult: latestOrderDetail.operationResult,
        entitlement: latestOrderDetail.entitlement,
        subscription: latestOrderDetail.subscription,
      } as T);
    }
    return ok({} as T);
  };

  const controller = createSubscriptionController({
    kernel,
    catalogRouteId: APP_ROUTE_IDS.catalog,
  });

  await controller.load();
  await controller.selectSku("study_club_plus_monthly");
  const purchaseResult = await controller.purchaseSku();
  assert.equal(purchaseResult.ok, true);
  assert.equal(controller.store.getState().order?.productType, "subscription");
  assert.equal(controller.store.getState().subscriptions[0]?.status, "active");

  await controller.cancelSubscription("sub_study_club");
  assert.equal(controller.store.getState().canRenewSubscription, true);

  await controller.renewSubscription("sub_study_club");
  assert.equal(controller.store.getState().transactionMessage, "Subscription renewal created the next paid term.");

  afterSalesCases = [
    {
      caseId: "as_refund_1",
      orderId: latestOrderDetail.order.orderId,
      kind: "refund",
      status: "completed",
      title: "Refund request",
      resultLabel: "Refund completed in sample after-sales flow",
      createdAt: "2026-04-08T10:20:00.000Z",
      updatedAt: "2026-04-08T10:20:00.000Z",
      completedAt: "2026-04-08T10:20:00.000Z",
    },
  ];
  await controller.loadAfterSalesDetail("as_refund_1");
  assert.equal(controller.store.getState().selectedAfterSalesCase?.caseId, "as_refund_1");
  assert.equal(
    controller.store.getState().paymentContinuitySummary,
    "The payment result is successful, but shared commerce continuity still depends on callback verification and reconciliation staying aligned.",
  );
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
      capabilitySummary: "H5 payment can continue through redirect-based execution and resume through the shared order detail surface.",
    },
    paymentResult: {
      orderId: "ord_pending_1",
      status: "pending" as const,
      paid: false,
      duplicateProtected: false,
      callbackVerified: false,
      message: "Payment is pending gateway confirmation in the sample payment domain.",
      continuitySummary:
        "The order is held in pending continuity until the sample callback and reconciliation steps finish.",
    },
    callbackVerification: {
      status: "pending" as const,
      message: "The sample gateway callback has not been verified yet.",
      diagnosticsSummary: "Callback verification is still waiting on the sample gateway payload.",
    },
    reconciliation: {
      status: "pending" as const,
      message: "The sample order has not been reconciled yet.",
      diagnosticsSummary:
        "Reconciliation is still pending, so callback and order state should be treated as provisional continuity checkpoints.",
      ledgerAuditSummary: "Callback and reconciliation ledgers will keep the append-only audit trail for this order.",
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
        paymentResult: {
          ...latestOrderDetail.paymentResult,
          status: "cancelled",
          message: "Order cancelled before payment completion.",
          continuitySummary:
            "The order was cancelled before settlement, and shared commerce continuity now depends on reconciliation confirming the closed state.",
        },
        reconciliation: {
          status: "reconciled",
          message: "Order cancellation and payment result are aligned.",
          diagnosticsSummary: "Reconciliation confirmed that the cancellation and stored payment result are aligned.",
          ledgerAuditSummary: "Operation and reconciliation ledgers keep the append-only audit trail for this cancellation.",
          checkedAt: "2026-04-08T10:10:00.000Z",
        },
        operationResult: {
          operation: "cancel",
          applied: true,
          orderStatus: "cancelled",
          paymentStatus: "cancelled",
          message: "Order cancelled before payment completion.",
          continuitySummary: "Cancellation continuity now flows through the same order detail and reconciliation surfaces.",
          processedAt: "2026-04-08T10:10:00.000Z",
        },
      };
      return ok(latestOrderDetail as T);
    }

    if (path === "/payments/reconcile") {
      latestOrderDetail = {
        ...latestOrderDetail,
        reconciliation: {
          status: "reconciled",
          message: "The stored payment result matches the current order state.",
          diagnosticsSummary: "Reconciliation confirmed that stored order state, payment result, and callback posture are aligned.",
          ledgerAuditSummary: "Reconciliation and operation ledgers keep the append-only audit trail for this order.",
          checkedAt: "2026-04-08T10:11:00.000Z",
        },
        operationResult: {
          operation: "reconcile",
          applied: true,
          orderStatus: latestOrderDetail.order.status,
          paymentStatus: latestOrderDetail.paymentResult.status,
          message: "The stored payment result matches the current order state.",
          continuitySummary: "Reconciliation updated the canonical order detail without creating a second payment surface.",
          processedAt: "2026-04-08T10:11:00.000Z",
        },
      };
      return ok(latestOrderDetail as T);
    }

    if (path === "/orders/refund") {
      latestOrderDetail = {
        ...latestOrderDetail,
        order: { ...latestOrderDetail.order, status: "refunded", updatedAt: "2026-04-08T10:20:00.000Z" },
        paymentResult: {
          ...latestOrderDetail.paymentResult,
          status: "refunded",
          paid: false,
          message: "Refund completed in the sample payment domain.",
          continuitySummary:
            "The order moved into refund continuity, and shared after-sales plus ledger views remain the canonical follow-up surface.",
        },
        entitlement: { ...latestOrderDetail.entitlement, active: false, statusLabel: "Refunded" },
        reconciliation: {
          status: "reconciled",
          message: "Refund state reconciled with the stored order record.",
          diagnosticsSummary: "Reconciliation confirmed that refund state and stored order detail are aligned.",
          ledgerAuditSummary: "Refund, callback, and reconciliation ledgers keep the append-only audit trail for this order.",
          checkedAt: "2026-04-08T10:20:00.000Z",
        },
        operationResult: {
          operation: "refund",
          applied: true,
          orderStatus: "refunded",
          paymentStatus: "refunded",
          message: "Refund completed in the sample payment domain.",
          continuitySummary: "Refund continuity now flows through the same order, entitlement, and after-sales surfaces.",
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
  assert.equal(
    controller.store.getState().paymentContinuitySummary,
    "The order was cancelled before settlement, and shared commerce continuity now depends on reconciliation confirming the closed state.",
  );

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
  assert.equal(
    controller.store.getState().paymentContinuitySummary,
    "The order moved into refund continuity, and shared after-sales plus ledger views remain the canonical follow-up surface.",
  );
});
