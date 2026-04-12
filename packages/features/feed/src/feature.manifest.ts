import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

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
      ...(options.feedRouteId ? { feedRouteId: options.feedRouteId } : {}),
      ...(options.detailRouteId ? { detailRouteId: options.detailRouteId } : {}),
      ...(options.settingsRouteId ? { settingsRouteId: options.settingsRouteId } : {}),
      ...(options.loginRouteId ? { loginRouteId: options.loginRouteId } : {}),
      ...(options.requestPath ? { requestPath: options.requestPath } : {}),
      ...(options.authRedirectSource ? { authRedirectSource: options.authRedirectSource } : {}),
      initialState: {
        ...createDefaultFeedState(),
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "loadInitial",
        onPullDownRefresh: "refresh",
        onReachBottom: "loadMore",
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
