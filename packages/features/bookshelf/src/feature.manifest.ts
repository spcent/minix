import type { AppRouteId } from "@minix/contracts";
import {
  defineFeatureManifest,
  defineSharedHostBehavior,
  mergeFeaturePageState,
  pickDefinedManifestOptions,
  type AppKernel,
} from "@minix/core";

import { createBookshelfController } from "./controller";
import { createInitialBookshelfState, type BookshelfState } from "./model";

export interface BookshelfFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  catalogRouteId: AppRouteId;
  novelDetailRouteId: AppRouteId;
  readerRouteId: AppRouteId;
  tocRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  initialState?: Partial<BookshelfState>;
}

export const bookshelfFeatureManifest = defineFeatureManifest<
  BookshelfFeatureControllerOptions,
  BookshelfState,
  ReturnType<typeof createBookshelfController>
>()({
  featureKey: "bookshelf",
  pageKey: "bookshelf",
  packageName: "@minix/feature-bookshelf",
  exportName: "bookshelfFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: BookshelfFeatureControllerOptions,
    pageData: BookshelfState,
  ) {
    return createBookshelfController({
      kernel,
      catalogRouteId: options.catalogRouteId,
      novelDetailRouteId: options.novelDetailRouteId,
      readerRouteId: options.readerRouteId,
      ...pickDefinedManifestOptions(options, ["tocRouteId", "loginRouteId", "settingsRouteId"] as const),
      initialState: mergeFeaturePageState(pageData, options.initialState),
    });
  },
  hosts: defineSharedHostBehavior<ReturnType<typeof createBookshelfController>>()(
    {
      onShow: "load",
      onTapOpenSelected: "openSelectedNovel",
      onTapContinueReading: "continueSelectedNovel",
      onTapCatalog: "goToCatalog",
      onTapSettings: "goToSettings",
      onTapPinNovel: "pinNovel",
      onTapClearPinned: "clearPinnedNovel",
      onTapMilestoneHistoryItem: "openMilestoneHistoryItem",
    },
    {
      wechat: {
        onTapSelectNovel: "selectNovel",
        onTapOpenNovel: "openNovel",
        onTapContinueNovel: "continueNovel",
        onTapRemoveNovel: "removeNovel",
        onTapSortRecent: "setSortRecent",
        onTapSortUpdated: "setSortUpdated",
        onTapSortProgress: "setSortProgress",
        onTapFilterAll: "setFilterAll",
        onTapFilterUpdates: "setFilterUpdates",
        onTapFilterCompleted: "setFilterCompleted",
      },
    },
  ),
});

export { createInitialBookshelfState };
