import type { AppRouteId } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel } from "@minix/core";

import { createSubscriptionController } from "./controller";
import { createInitialSubscriptionState, type SubscriptionState } from "./model";

export interface SubscriptionFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  catalogRouteId: AppRouteId;
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
      ...(options.loginRouteId ? { loginRouteId: options.loginRouteId } : {}),
      ...(options.novelDetailRouteId ? { novelDetailRouteId: options.novelDetailRouteId } : {}),
      ...(options.readerRouteId ? { readerRouteId: options.readerRouteId } : {}),
      ...(options.tocRouteId ? { tocRouteId: options.tocRouteId } : {}),
      ...(options.bookshelfRouteId ? { bookshelfRouteId: options.bookshelfRouteId } : {}),
      initialState: {
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "load",
        onTapPurchaseMembership: "purchaseMembership",
        onTapContinueAfterPurchase: "continueAfterPurchase",
        onTapLatestMilestone: "openLatestMilestone",
        onTapMilestoneHistoryItem: "openMilestoneHistoryItem",
        onTapCatalog: "goToCatalog",
      },
    },
    h5: {
      entryActions: {
        onShow: "load",
        onTapPurchaseMembership: "purchaseMembership",
        onTapContinueAfterPurchase: "continueAfterPurchase",
        onTapLatestMilestone: "openLatestMilestone",
        onTapMilestoneHistoryItem: "openMilestoneHistoryItem",
        onTapCatalog: "goToCatalog",
      },
    },
  },
});

export { createInitialSubscriptionState };
