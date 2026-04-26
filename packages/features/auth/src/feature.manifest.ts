import type { AppRouteId } from "@minix/contracts";
import { defineFeatureManifest, pickDefinedManifestOptions, type AppKernel } from "@minix/core";

import { createAuthController } from "./controller";
import type { AuthPageState } from "./model";

export interface AuthFeatureControllerOptions {
  successRouteId: AppRouteId;
  stayOnSuccess?: boolean;
  overviewRouteId?: AppRouteId;
  planRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  reportError?: (kernel: AppKernel, message: string) => Promise<void>;
}

export const authFeatureManifest = defineFeatureManifest<
  AuthFeatureControllerOptions,
  AuthPageState,
  ReturnType<typeof createAuthController>
>()({
  featureKey: "auth",
  pageKey: "login",
  packageName: "@minix/feature-auth",
  exportName: "authFeatureManifest",
  createController(_host, kernel: AppKernel, options: AuthFeatureControllerOptions, _pageData: AuthPageState) {
    return createAuthController({
      kernel,
      successRouteId: options.successRouteId,
      ...pickDefinedManifestOptions(options, [
        "stayOnSuccess",
        "overviewRouteId",
        "planRouteId",
        "settingsRouteId",
      ] as const),
      ...(options.reportError
        ? {
            async reportError(message: string) {
              await options.reportError?.(kernel, message);
            },
          }
        : {}),
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "restoreSession",
        onTapLogin: "submitLogin",
        onTapEnsureLogin: "submitEnsureLogin",
        onTapContinueDestination: "goToRedirectTarget",
        onTapOverview: "goToOverview",
        onTapPlan: "goToPlan",
        onTapSettings: "goToSettings",
      },
    },
    h5: {
      entryActions: {
        onShow: "restoreSession",
        onTapLogin: "submitLogin",
        onTapContinueDestination: "goToRedirectTarget",
        onTapOverview: "goToOverview",
        onTapPlan: "goToPlan",
        onTapSettings: "goToSettings",
      },
    },
  },
});
