import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { createAccountController } from "./controller";
import { createDefaultAccountState, type AccountState } from "./model";

export interface AccountFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  overviewRouteId?: AppRouteId;
  requestPath?: string;
  authRedirectSource?: string;
  initialState?: Partial<AccountState>;
}

export const accountCapabilityRequirements: CapabilityRequirement[] = [
  { capability: "clipboard", required: false },
];
export const accountGuardPolicy: GuardPolicy = {
  name: "authenticated-account",
  requirements: {
    authenticated: true,
  },
};
export const accountFeatureConfig: FeatureConfig = {
  surface: "account",
};

export const accountFeatureManifest = defineFeatureManifest<
  AccountFeatureControllerOptions,
  AccountState,
  ReturnType<typeof createAccountController>
>()({
  featureKey: "account",
  pageKey: "account",
  packageName: "@minix/feature-account",
  exportName: "accountFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: AccountFeatureControllerOptions,
    pageData: AccountState,
  ) {
    return createAccountController({
      kernel,
      ...(options.loginRouteId ? { loginRouteId: options.loginRouteId } : {}),
      ...(options.settingsRouteId ? { settingsRouteId: options.settingsRouteId } : {}),
      ...(options.overviewRouteId ? { overviewRouteId: options.overviewRouteId } : {}),
      ...(options.requestPath ? { requestPath: options.requestPath } : {}),
      ...(options.authRedirectSource ? { authRedirectSource: options.authRedirectSource } : {}),
      initialState: {
        ...createDefaultAccountState(),
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
        onTapCopyUserId: "copyUserId",
        onTapSettings: "goToSettings",
        onTapOverview: "goToOverview",
        onTapLogin: "goToLogin",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
        onTapCopyUserId: "copyUserId",
        onTapSettings: "goToSettings",
        onTapOverview: "goToOverview",
        onTapLogin: "goToLogin",
      },
    },
  },
});

export { createDefaultAccountState };
