import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import {
  defineFeatureManifest,
  mergeFeaturePageState,
  pickDefinedManifestOptions,
  type AppKernel,
  type FeatureConfig,
} from "@minix/core";

import { createFeedController } from "./controller";
import { createDefaultFeedState, type FeedState } from "./model";

export interface FeedFeatureControllerOptions {
  feedRouteId?: AppRouteId;
  detailRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  requestPath?: string;
  authRedirectSource?: string;
  initialState?: Partial<FeedState>;
}

export const feedCapabilityRequirements: CapabilityRequirement[] = [];
export const feedGuardPolicy: GuardPolicy | undefined = undefined;
export const feedFeatureConfig: FeatureConfig = {
  surface: "search",
};

export const feedFeatureManifest = defineFeatureManifest<
  FeedFeatureControllerOptions,
  FeedState,
  ReturnType<typeof createFeedController>
>()({
  featureKey: "feed",
  pageKey: "feed",
  packageName: "@minix/feature-feed",
  exportName: "feedFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: FeedFeatureControllerOptions,
    pageData: FeedState,
  ) {
    return createFeedController({
      kernel,
      ...pickDefinedManifestOptions(options, [
        "feedRouteId",
        "detailRouteId",
        "settingsRouteId",
        "loginRouteId",
        "requestPath",
        "authRedirectSource",
      ] as const),
      initialState: mergeFeaturePageState(createDefaultFeedState(), pageData, options.initialState),
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "loadInitial",
        onPullDownRefresh: "refresh",
        onReachBottom: "loadMore",
        onTapRefreshReviewQueue: "loadReviewQueue",
        onTapLoadMore: "loadMore",
        onTapSearch: "submitSearch",
        onTapClearSearch: "clearSearch",
        onTapOpenItem: "openItem",
        onTapSettings: "goToSettings",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
        onTapRefreshReviewQueue: "loadReviewQueue",
        onTapLoadMore: "loadMore",
        onTapSearch: "submitSearch",
        onTapClearSearch: "clearSearch",
        onTapOpenItem: "openItem",
        onTapSettings: "goToSettings",
      },
    },
  },
});

export { createDefaultFeedState };
