import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { createMessagesController } from "./controller";
import { createDefaultMessagesState, type MessagesState } from "./model";

export interface MessagesFeatureControllerOptions {
  messagesRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  requestPath?: string;
  markReadPath?: string;
  authRedirectSource?: string;
  initialState?: Partial<MessagesState>;
}

export const messagesCapabilityRequirements: CapabilityRequirement[] = [];
export const messagesGuardPolicy: GuardPolicy = {
  name: "authenticated-messages",
  requirements: {
    authenticated: true,
  },
};
export const messagesFeatureConfig: FeatureConfig = {
  surface: "messages",
  template: "list",
};

export const messagesFeatureManifest = defineFeatureManifest<
  MessagesFeatureControllerOptions,
  MessagesState,
  ReturnType<typeof createMessagesController>
>()({
  featureKey: "messages",
  pageKey: "messages",
  packageName: "@minix/feature-messages",
  exportName: "messagesFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: MessagesFeatureControllerOptions,
    pageData: MessagesState,
  ) {
    return createMessagesController({
      kernel,
      ...(options.messagesRouteId ? { messagesRouteId: options.messagesRouteId } : {}),
      ...(options.loginRouteId ? { loginRouteId: options.loginRouteId } : {}),
      ...(options.settingsRouteId ? { settingsRouteId: options.settingsRouteId } : {}),
      ...(options.requestPath ? { requestPath: options.requestPath } : {}),
      ...(options.markReadPath ? { markReadPath: options.markReadPath } : {}),
      ...(options.authRedirectSource ? { authRedirectSource: options.authRedirectSource } : {}),
      initialState: {
        ...createDefaultMessagesState(),
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
        onTapMarkVisibleRead: "markVisibleRead",
        onTapSettings: "goToSettings",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
        onTapLoadMore: "loadMore",
        onTapMarkVisibleRead: "markVisibleRead",
        onTapSettings: "goToSettings",
      },
    },
  },
});

export { createDefaultMessagesState };
