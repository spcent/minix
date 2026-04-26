import type { AppRouteId } from "@minix/contracts";
import {
  defineFeatureManifest,
  pickDefinedManifestOptions,
  type AppKernel,
  type ModalOptions,
  type SettingsPageModel,
  type ToastOptions,
} from "@minix/core";

import { createSettingsController } from "./controller";

export interface SettingsFeatureControllerOptions {
  loginRouteId: AppRouteId;
  itemsRouteId?: AppRouteId;
  overviewRouteId?: AppRouteId;
  accountRouteId?: AppRouteId;
  membershipRouteId?: AppRouteId;
  ordersRouteId?: AppRouteId;
  feedRouteId?: AppRouteId;
  messagesRouteId?: AppRouteId;
  feedbackRouteId?: AppRouteId;
  mediaToolsRouteId?: AppRouteId;
  readerRouteId?: AppRouteId;
  authRedirectSource?: "preferences";
  requestPath?: string;
  confirmLogout?: ModalOptions;
  successToast?: ToastOptions;
  showErrorToast?: boolean;
}

export const settingsFeatureManifest = defineFeatureManifest<
  SettingsFeatureControllerOptions,
  SettingsPageModel,
  ReturnType<typeof createSettingsController>
>()({
  featureKey: "settings",
  pageKey: "settings",
  packageName: "@minix/feature-settings",
  exportName: "settingsFeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: SettingsFeatureControllerOptions,
    pageData: SettingsPageModel,
  ) {
    return createSettingsController({
      kernel,
      loginRouteId: options.loginRouteId,
      ...pickDefinedManifestOptions(options, [
        "itemsRouteId",
        "overviewRouteId",
        "accountRouteId",
        "membershipRouteId",
        "ordersRouteId",
        "feedRouteId",
        "messagesRouteId",
        "feedbackRouteId",
        "mediaToolsRouteId",
        "readerRouteId",
        "authRedirectSource",
        "requestPath",
      ] as const),
      model: pageData,
      ...pickDefinedManifestOptions(options, ["confirmLogout", "successToast", "showErrorToast"] as const),
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "ensureAuthenticated",
        onTapOverview: "goToOverview",
        onTapPlan: "goToItems",
        onTapAccount: "goToAccount",
        onTapMembership: "goToMembership",
        onTapOrders: "goToOrders",
        onTapDiscover: "goToFeed",
        onTapInbox: "goToMessages",
        onTapFeedback: "goToFeedback",
        onTapMediaTools: "goToMediaTools",
        onTapReader: "goToReader",
        onTapApplyReader: "applyReaderSettingsAndReturn",
        onTapCycleReaderTheme: "cycleReaderTheme",
        onTapCycleReaderMode: "cycleReaderMode",
        onTapCycleNightModeDefault: "cycleNightModeDefault",
        onTapIncreaseReaderFontScale: "increaseReaderFontScale",
        onTapDecreaseReaderFontScale: "decreaseReaderFontScale",
        onTapCycleResumeMode: "cycleResumeMode",
        onTapCycleShelfOrder: "cycleShelfOrder",
        onTapCycleDigestMode: "cycleDigestMode",
        onTapCycleSyncMode: "cycleSyncMode",
        onTapCycleReminderMode: "cycleReminderMode",
        onTapLogout: "logout",
      },
    },
    h5: {
      entryActions: {
        onShow: "ensureAuthenticated",
        onTapOverview: "goToOverview",
        onTapPlan: "goToItems",
        onTapAccount: "goToAccount",
        onTapMembership: "goToMembership",
        onTapOrders: "goToOrders",
        onTapDiscover: "goToFeed",
        onTapInbox: "goToMessages",
        onTapFeedback: "goToFeedback",
        onTapMediaTools: "goToMediaTools",
        onTapReader: "goToReader",
        onTapApplyReader: "applyReaderSettingsAndReturn",
        onTapCycleReaderTheme: "cycleReaderTheme",
        onTapCycleReaderMode: "cycleReaderMode",
        onTapCycleNightModeDefault: "cycleNightModeDefault",
        onTapIncreaseReaderFontScale: "increaseReaderFontScale",
        onTapDecreaseReaderFontScale: "decreaseReaderFontScale",
        onTapCycleResumeMode: "cycleResumeMode",
        onTapCycleShelfOrder: "cycleShelfOrder",
        onTapCycleDigestMode: "cycleDigestMode",
        onTapCycleSyncMode: "cycleSyncMode",
        onTapCycleReminderMode: "cycleReminderMode",
        onTapLogout: "logout",
      },
    },
  },
});
