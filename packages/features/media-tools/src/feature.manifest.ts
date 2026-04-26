import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import {
  defineFeatureManifest,
  mergeFeaturePageState,
  pickDefinedManifestOptions,
  type AppKernel,
  type FeatureConfig,
} from "@minix/core";

import { createMediaToolsController } from "./controller";
import { createDefaultMediaToolsState, type MediaToolsState } from "./model";

export interface MediaToolsFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  initialState?: Partial<MediaToolsState>;
}

export const mediaToolsCapabilityRequirements: CapabilityRequirement[] = [
  { capability: "upload", required: false },
  { capability: "share", required: false },
];
export const mediaToolsGuardPolicy: GuardPolicy = {
  name: "authenticated-media-tools",
  requirements: {
    authenticated: true,
  },
};
export const mediaToolsFeatureConfig: FeatureConfig = {
  surface: "media-tools",
  template: "workspace",
};

export const mediaToolsFeatureManifest = defineFeatureManifest<
  MediaToolsFeatureControllerOptions,
  MediaToolsState,
  ReturnType<typeof createMediaToolsController>
>()({
  featureKey: "media-tools",
  pageKey: "mediaTools",
  packageName: "@minix/feature-media-tools",
  exportName: "mediaToolsFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: MediaToolsFeatureControllerOptions,
    pageData: MediaToolsState,
  ) {
    return createMediaToolsController({
      kernel,
      ...pickDefinedManifestOptions(options, ["loginRouteId", "settingsRouteId"] as const),
      initialState: mergeFeaturePageState(createDefaultMediaToolsState(), pageData, options.initialState),
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "loadInitial",
        onTapUpload: "startUpload",
        onTapRetryPrimary: "retryPrimaryAction",
        onTapShare: "startShare",
        onTapLoadShareReport: "loadShareReport",
        onTapClearResult: "clearLastResult",
        onTapSettings: "goToSettings",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
        onTapUpload: "startUpload",
        onTapRetryPrimary: "retryPrimaryAction",
        onTapShare: "startShare",
        onTapLoadShareReport: "loadShareReport",
        onTapClearResult: "clearLastResult",
        onTapSettings: "goToSettings",
      },
    },
  },
});

export { createDefaultMediaToolsState };
