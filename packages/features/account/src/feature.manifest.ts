import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import {
  defineFeatureManifest,
  mergeFeaturePageState,
  pickDefinedManifestOptions,
  type AppKernel,
  type FeatureConfig,
} from "@minix/core";

import { createAccountController } from "./controller";
import { createDefaultAccountState, type AccountState } from "./model";

export interface AccountFeatureControllerOptions {
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  overviewRouteId?: AppRouteId;
  identityUpgradeRouteId?: AppRouteId;
  identityBindPhoneRouteId?: AppRouteId;
  identityMergeRouteId?: AppRouteId;
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
      ...pickDefinedManifestOptions(options, [
        "loginRouteId",
        "settingsRouteId",
        "overviewRouteId",
        "identityUpgradeRouteId",
        "identityBindPhoneRouteId",
        "identityMergeRouteId",
        "requestPath",
        "authRedirectSource",
      ] as const),
      initialState: mergeFeaturePageState(createDefaultAccountState(), pageData, options.initialState),
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
        onTapIdentityUpgrade: "goToIdentityUpgrade",
        onTapPhoneBinding: "goToPhoneBinding",
        onTapIdentityMerge: "goToIdentityMerge",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
        onTapCopyUserId: "copyUserId",
        onTapSettings: "goToSettings",
        onTapOverview: "goToOverview",
        onTapLogin: "goToLogin",
        onTapIdentityUpgrade: "goToIdentityUpgrade",
        onTapPhoneBinding: "goToPhoneBinding",
        onTapIdentityMerge: "goToIdentityMerge",
      },
    },
  },
});

export { createDefaultAccountState };
