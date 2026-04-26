import type { AppRouteId, ItemsListItem } from "@minix/contracts";
import { defineFeatureManifest, pickDefinedManifestOptions, type AppKernel } from "@minix/core";

import { createItemsController } from "./controller";
import type { ItemsPageModel } from "./model";

export interface ItemsFeatureControllerOptions {
  loginRouteId: AppRouteId;
  settingsRouteId: AppRouteId;
  overviewRouteId?: AppRouteId;
  planRouteId?: AppRouteId;
  authRedirectSource?: "overview" | "plan";
  requestPath?: string;
}

export const itemsFeatureManifest = defineFeatureManifest<
  ItemsFeatureControllerOptions,
  ItemsPageModel,
  ReturnType<typeof createItemsController<ItemsListItem>>
>()({
  featureKey: "items",
  pageKey: "items",
  packageName: "@minix/feature-items",
  exportName: "itemsFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: ItemsFeatureControllerOptions,
    pageData: ItemsPageModel,
  ) {
    return createItemsController<ItemsListItem>({
      kernel,
      loginRouteId: options.loginRouteId,
      settingsRouteId: options.settingsRouteId,
      ...pickDefinedManifestOptions(options, ["overviewRouteId", "planRouteId", "authRedirectSource"] as const),
      initialModel: pageData,
      ...pickDefinedManifestOptions(options, ["requestPath"] as const),
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "loadInitial",
        onPullDownRefresh: "refresh",
        onReachBottom: "loadMore",
        onTapLoadMore: "loadMore",
        onTapOverview: "goToOverview",
        onTapPlan: "goToPlan",
        onTapSettings: "goToSettings",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
        onTapLoadMore: "loadMore",
        onTapOverview: "goToOverview",
        onTapPlan: "goToPlan",
        onTapSettings: "goToSettings",
      },
    },
  },
});
