import type { AppRouteId } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel } from "@minix/core";

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
      ...(options.loginRouteId ? { loginRouteId: options.loginRouteId } : {}),
      ...(options.catalogRouteId ? { catalogRouteId: options.catalogRouteId } : {}),
      ...(options.readerRouteId ? { readerRouteId: options.readerRouteId } : {}),
      ...(options.tocRouteId ? { tocRouteId: options.tocRouteId } : {}),
      ...(options.bookshelfRouteId ? { bookshelfRouteId: options.bookshelfRouteId } : {}),
      ...(options.settingsRouteId ? { settingsRouteId: options.settingsRouteId } : {}),
      initialState: {
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "loadInitial",
        onTapLoadMore: "loadMore",
        onTapOpenSelected: "openSelectedNovel",
        onTapSelectNovel: "selectNovel",
        onTapOpenNovel: "goToNovelDetail",
        onTapContinueNovel: "continueReading",
        onTapLatestMilestone: "openLatestMilestone",
        onTapMilestoneHistoryItem: "openMilestoneHistoryItem",
        onTapBookshelf: "goToBookshelf",
        onTapSettings: "goToSettings",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
        onTapLoadMore: "loadMore",
        onTapOpenSelected: "openSelectedNovel",
        onTapLatestMilestone: "openLatestMilestone",
        onTapMilestoneHistoryItem: "openMilestoneHistoryItem",
        onTapBookshelf: "goToBookshelf",
        onTapSettings: "goToSettings",
      },
    },
  },
});

export { createInitialCatalogState };
