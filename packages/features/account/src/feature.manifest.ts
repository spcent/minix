import type { CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { createAccountController } from "./controller";
import { createInitialAccountState, type AccountState } from "./model";

export interface AccountFeatureControllerOptions {
  initialState?: Partial<AccountState>;
}

export const accountCapabilityRequirements: CapabilityRequirement[] = [];
export const accountGuardPolicy: GuardPolicy | undefined = undefined;
export const accountFeatureConfig: FeatureConfig = {};

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
    _kernel: AppKernel,
    options: AccountFeatureControllerOptions,
    pageData: AccountState,
  ) {
    return createAccountController({
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

export { createInitialAccountState };
