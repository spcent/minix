import type { AppRouteId } from "@minix/contracts";
import {
  defineFeatureManifest,
  defineSharedHostBehavior,
  mergeFeaturePageState,
  pickDefinedManifestOptions,
  type AppKernel,
} from "@minix/core";

import { createCatalogController } from "./controller";
import { createInitialCatalogState, type CatalogState } from "./model";

export interface CatalogFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  catalogRouteId?: AppRouteId;
  detailRouteId: AppRouteId;
  readerRouteId?: AppRouteId;
  tocRouteId?: AppRouteId;
  bookshelfRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  initialState?: Partial<CatalogState>;
}

export const catalogFeatureManifest = defineFeatureManifest<
  CatalogFeatureControllerOptions,
  CatalogState,
  ReturnType<typeof createCatalogController>
>()({
  featureKey: "catalog",
  pageKey: "catalog",
  packageName: "@minix/feature-catalog",
  exportName: "catalogFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: CatalogFeatureControllerOptions,
    pageData: CatalogState,
  ) {
    return createCatalogController({
      kernel,
      detailRouteId: options.detailRouteId,
      ...pickDefinedManifestOptions(options, [
        "loginRouteId",
        "catalogRouteId",
        "readerRouteId",
        "tocRouteId",
        "bookshelfRouteId",
        "settingsRouteId",
      ] as const),
      initialState: mergeFeaturePageState(pageData, options.initialState),
    });
  },
  hosts: defineSharedHostBehavior<ReturnType<typeof createCatalogController>>()(
    {
      onShow: "loadInitial",
      onTapLoadMore: "loadMore",
      onTapOpenSelected: "openSelectedNovel",
      onTapLatestMilestone: "openLatestMilestone",
      onTapMilestoneHistoryItem: "openMilestoneHistoryItem",
      onTapBookshelf: "goToBookshelf",
      onTapSettings: "goToSettings",
    },
    {
      wechat: {
        onTapSelectNovel: "selectNovel",
        onTapOpenNovel: "goToNovelDetail",
        onTapContinueNovel: "continueReading",
      },
    },
  ),
});

export { createInitialCatalogState };
