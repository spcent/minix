import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { createFeedbackController } from "./controller";
import { createDefaultFeedbackState, type FeedbackState } from "./model";

export interface FeedbackFeatureControllerOptions {
  feedbackRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  cancelRouteId?: AppRouteId;
  bootstrapPath?: string;
  submitPath?: string;
  detailPath?: string;
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
      ...(options.feedbackRouteId ? { feedbackRouteId: options.feedbackRouteId } : {}),
      ...(options.loginRouteId ? { loginRouteId: options.loginRouteId } : {}),
      ...(options.settingsRouteId ? { settingsRouteId: options.settingsRouteId } : {}),
      ...(options.cancelRouteId ? { cancelRouteId: options.cancelRouteId } : {}),
      ...(options.bootstrapPath ? { bootstrapPath: options.bootstrapPath } : {}),
      ...(options.submitPath ? { submitPath: options.submitPath } : {}),
      ...(options.detailPath ? { detailPath: options.detailPath } : {}),
      ...(options.authRedirectSource ? { authRedirectSource: options.authRedirectSource } : {}),
      initialState: {
        ...createDefaultFeedbackState(),
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "loadInitial",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
      },
    },
  },
});

export { createDefaultFeedbackState };
