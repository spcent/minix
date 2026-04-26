import type { AppRouteId } from "@minix/contracts";
import { defineFeatureManifest, mergeFeaturePageState, pickDefinedManifestOptions, type AppKernel } from "@minix/core";

import { createReaderController } from "./controller";
import { createInitialReaderState, type ReaderState } from "./model";

export interface ReaderFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  readerRouteId: AppRouteId;
  novelDetailRouteId: AppRouteId;
  tocRouteId: AppRouteId;
  bookshelfRouteId?: AppRouteId;
  membershipRouteId?: AppRouteId;
  displaySettingsStorageKey?: string;
  initialState?: Partial<ReaderState>;
}

export const readerFeatureManifest = defineFeatureManifest<
  ReaderFeatureControllerOptions,
  ReaderState,
  ReturnType<typeof createReaderController>
>()({
  featureKey: "reader",
  pageKey: "reader",
  packageName: "@minix/feature-reader",
  exportName: "readerFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: ReaderFeatureControllerOptions,
    pageData: ReaderState,
  ) {
    return createReaderController({
      kernel,
      readerRouteId: options.readerRouteId,
      novelDetailRouteId: options.novelDetailRouteId,
      tocRouteId: options.tocRouteId,
      ...pickDefinedManifestOptions(options, [
        "loginRouteId",
        "bookshelfRouteId",
        "membershipRouteId",
        "displaySettingsStorageKey",
      ] as const),
      initialState: mergeFeaturePageState(pageData, options.initialState),
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "load",
        onTapNextChapter: "goToNextChapter",
        onTapPreviousChapter: "goToPreviousChapter",
        onTapCompleteChapter: "completeChapter",
        onTapCompleteNext: "completeChapterAndContinue",
        onTapToc: "goToToc",
        onTapNovelDetail: "goToNovelDetail",
        onTapMembership: "goToMembership",
        onTapBookshelf: "goToBookshelf",
      },
    },
    h5: {
      entryActions: {
        onShow: "load",
        onTapNextChapter: "goToNextChapter",
        onTapPreviousChapter: "goToPreviousChapter",
        onTapCompleteChapter: "completeChapter",
        onTapCompleteNext: "completeChapterAndContinue",
        onTapToc: "goToToc",
        onTapNovelDetail: "goToNovelDetail",
        onTapMembership: "goToMembership",
        onTapBookshelf: "goToBookshelf",
      },
    },
  },
});

export { createInitialReaderState };
