import type { AppRouteId } from "@minix/contracts";
import {
  defineFeatureManifest,
  defineSharedHostBehavior,
  mergeFeaturePageState,
  pickDefinedManifestOptions,
  type AppKernel,
} from "@minix/core";

import { createSubscriptionController } from "./controller";
import { createInitialSubscriptionState, type SubscriptionState } from "./model";

export interface SubscriptionFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  catalogRouteId: AppRouteId;
  membershipRouteId?: AppRouteId;
  ordersRouteId?: AppRouteId;
  novelDetailRouteId?: AppRouteId;
  readerRouteId?: AppRouteId;
  tocRouteId?: AppRouteId;
  bookshelfRouteId?: AppRouteId;
  initialState?: Partial<SubscriptionState>;
}

export const subscriptionFeatureManifest = defineFeatureManifest<
  SubscriptionFeatureControllerOptions,
  SubscriptionState,
  ReturnType<typeof createSubscriptionController>
>()({
  featureKey: "subscription",
  pageKey: "subscription",
  packageName: "@minix/feature-subscription",
  exportName: "subscriptionFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: SubscriptionFeatureControllerOptions,
    pageData: SubscriptionState,
  ) {
    return createSubscriptionController({
      kernel,
      catalogRouteId: options.catalogRouteId,
      ...pickDefinedManifestOptions(options, [
        "loginRouteId",
        "membershipRouteId",
        "ordersRouteId",
        "novelDetailRouteId",
        "readerRouteId",
        "tocRouteId",
        "bookshelfRouteId",
      ] as const),
      initialState: mergeFeaturePageState(pageData, options.initialState),
    });
  },
  hosts: defineSharedHostBehavior<ReturnType<typeof createSubscriptionController>>()({
    onShow: "load",
    onTapPurchaseMembership: "purchaseMembership",
    onTapRefreshTransaction: "refreshTransaction",
    onTapCancelOrder: "cancelOrder",
    onTapRefundOrder: "refundOrder",
    onTapReconcileOrder: "reconcileOrder",
    onTapCancelSubscription: "cancelSubscription",
    onTapRenewSubscription: "renewSubscription",
    onTapAfterSalesDetail: "loadAfterSalesDetail",
    onTapOpenOrder: "loadOrderDetail",
    onTapOpenAfterSalesCase: "loadAfterSalesDetail",
    onTapMembership: "goToMembership",
    onTapOrders: "goToOrders",
    onTapContinueAfterPurchase: "continueAfterPurchase",
    onTapLatestMilestone: "openLatestMilestone",
    onTapMilestoneHistoryItem: "openMilestoneHistoryItem",
    onTapCatalog: "goToCatalog",
  }),
});

export { createInitialSubscriptionState };
