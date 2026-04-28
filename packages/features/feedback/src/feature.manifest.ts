import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import {
  defineFeatureManifest,
  defineSharedHostBehavior,
  mergeFeaturePageState,
  pickDefinedManifestOptions,
  type AppKernel,
  type FeatureConfig,
} from "@minix/core";

import { createFeedbackController } from "./controller";
import { createDefaultFeedbackState, type FeedbackState } from "./model";

export interface FeedbackFeatureControllerOptions {
  feedbackRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  messagesRouteId?: AppRouteId;
  cancelRouteId?: AppRouteId;
  bootstrapPath?: string;
  submitPath?: string;
  detailPath?: string;
  listPath?: string;
  actionPath?: string;
  authRedirectSource?: string;
  initialState?: Partial<FeedbackState>;
}

export const feedbackCapabilityRequirements: CapabilityRequirement[] = [];
export const feedbackGuardPolicy: GuardPolicy = {
  name: "authenticated-feedback",
  requirements: {
    authenticated: true,
  },
};
export const feedbackFeatureConfig: FeatureConfig = {
  surface: "feedback",
  template: "form",
};

export const feedbackFeatureManifest = defineFeatureManifest<
  FeedbackFeatureControllerOptions,
  FeedbackState,
  ReturnType<typeof createFeedbackController>
>()({
  featureKey: "feedback",
  pageKey: "feedback",
  packageName: "@minix/feature-feedback",
  exportName: "feedbackFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: FeedbackFeatureControllerOptions,
    pageData: FeedbackState,
  ) {
    return createFeedbackController({
      kernel,
      ...pickDefinedManifestOptions(options, [
        "feedbackRouteId",
        "loginRouteId",
        "settingsRouteId",
        "messagesRouteId",
        "cancelRouteId",
        "bootstrapPath",
        "submitPath",
        "detailPath",
        "listPath",
        "actionPath",
        "authRedirectSource",
      ] as const),
      initialState: mergeFeaturePageState(createDefaultFeedbackState(), pageData, options.initialState),
    });
  },
  hosts: defineSharedHostBehavior<ReturnType<typeof createFeedbackController>>()({
    onShow: "loadInitial",
    onTapRefreshLatestStatus: "refreshLatestStatus",
    onTapSupportEntry: "openSupportEntry",
    onTapFaq: "openFaq",
    onTapSettings: "goToSettings",
  }),
});

export { createDefaultFeedbackState };
