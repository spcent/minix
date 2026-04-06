import type { CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { createFeedController } from "./controller";
import { createInitialFeedState, type FeedState } from "./model";

export interface FeedFeatureControllerOptions {
  initialState?: Partial<FeedState>;
}

export const feedCapabilityRequirements: CapabilityRequirement[] = [];
export const feedGuardPolicy: GuardPolicy | undefined = undefined;
export const feedFeatureConfig: FeatureConfig = {};

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
    _kernel: AppKernel,
    options: FeedFeatureControllerOptions,
    pageData: FeedState,
  ) {
    return createFeedController({
      initialState: {
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "markReady",
        onTapReady: "markReady",
      },
    },
    h5: {
      entryActions: {
        onShow: "markReady",
        onTapReady: "markReady",
      },
    },
  },
});

export { createInitialFeedState };
