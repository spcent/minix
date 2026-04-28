import type { AppRouteId } from "@minix/contracts";
import {
  defineFeatureManifest,
  defineSharedHostBehavior,
  mergeFeaturePageState,
  pickDefinedManifestOptions,
  type AppKernel,
} from "@minix/core";

import { createNovelDetailController } from "./controller";
import { createInitialNovelDetailState, type NovelDetailState } from "./model";

export interface NovelDetailFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  novelDetailRouteId: AppRouteId;
  catalogRouteId: AppRouteId;
  tocRouteId: AppRouteId;
  readerRouteId: AppRouteId;
  bookshelfRouteId?: AppRouteId;
  membershipRouteId?: AppRouteId;
  progressRequestPath?: string;
  initialState?: Partial<NovelDetailState>;
}

export const novelDetailFeatureManifest = defineFeatureManifest<
  NovelDetailFeatureControllerOptions,
  NovelDetailState,
  ReturnType<typeof createNovelDetailController>
>()({
  featureKey: "novel-detail",
  pageKey: "novelDetail",
  packageName: "@minix/feature-novel-detail",
  exportName: "novelDetailFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: NovelDetailFeatureControllerOptions,
    pageData: NovelDetailState,
  ) {
    return createNovelDetailController({
      kernel,
      novelDetailRouteId: options.novelDetailRouteId,
      catalogRouteId: options.catalogRouteId,
      tocRouteId: options.tocRouteId,
      readerRouteId: options.readerRouteId,
      ...pickDefinedManifestOptions(options, [
        "loginRouteId",
        "bookshelfRouteId",
        "membershipRouteId",
        "progressRequestPath",
      ] as const),
      initialState: mergeFeaturePageState(pageData, options.initialState),
    });
  },
  hosts: defineSharedHostBehavior<ReturnType<typeof createNovelDetailController>>()(
    {
      onShow: "load",
      onTapRead: "startReading",
      onTapContinue: "continueReading",
      onTapToc: "goToToc",
      onTapMembership: "goToMembership",
      onTapCatalog: "goToCatalog",
      onTapBookshelf: "goToBookshelf",
      onTapLatestMilestone: "openLatestMilestone",
    },
    {
      wechat: {
        onTapToggleSummary: "toggleSummary",
        onTapAddToBookshelf: "addToBookshelf",
        onTapRemoveFromBookshelf: "removeFromBookshelf",
        onTapRelatedNovel: "goToRelatedNovel",
      },
    },
  ),
});

export { createInitialNovelDetailState };
