import type { AppRouteId } from "@minix/contracts";
import { defineFeatureManifest, pickDefinedManifestOptions, type AppKernel } from "@minix/core";

import { createTocController } from "./controller";
import { createInitialTocState, type TocState } from "./model";

export interface TocFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  catalogRouteId: AppRouteId;
  novelDetailRouteId: AppRouteId;
  readerRouteId: AppRouteId;
  membershipRouteId?: AppRouteId;
  progressRequestPath?: string;
  initialState?: Partial<TocState>;
}

export const tocFeatureManifest = defineFeatureManifest<
  TocFeatureControllerOptions,
  TocState,
  ReturnType<typeof createTocController>
>()({
  featureKey: "toc",
  pageKey: "toc",
  packageName: "@minix/feature-toc",
  exportName: "tocFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: TocFeatureControllerOptions,
    pageData: TocState,
  ) {
    return createTocController({
      kernel,
      catalogRouteId: options.catalogRouteId,
      novelDetailRouteId: options.novelDetailRouteId,
      readerRouteId: options.readerRouteId,
      ...pickDefinedManifestOptions(options, ["membershipRouteId", "loginRouteId", "progressRequestPath"] as const),
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
        onTapOpenSelected: "openSelectedChapter",
        onTapNovelDetail: "goToNovelDetail",
        onTapCatalog: "goToCatalog",
        onTapSelectChapter: "selectChapter",
        onTapToggleVolume: "toggleVolume",
        onTapCurrentChapter: "jumpToCurrentChapter",
        onTapReadChapter: "goToReader",
        onTapMembership: "goToMembership",
      },
    },
    h5: {
      entryActions: {
        onShow: "load",
        onTapOpenSelected: "openSelectedChapter",
        onTapNovelDetail: "goToNovelDetail",
        onTapCatalog: "goToCatalog",
        onTapSelectChapter: "selectChapter",
        onTapToggleVolume: "toggleVolume",
        onTapCurrentChapter: "jumpToCurrentChapter",
        onTapReadChapter: "goToReader",
        onTapMembership: "goToMembership",
      },
    },
  },
});

export { createInitialTocState };
