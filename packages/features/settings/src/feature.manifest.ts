import type { AppRouteId } from "@minix/contracts";
import {
  defineFeatureManifest,
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
      ...(options.itemsRouteId ? { itemsRouteId: options.itemsRouteId } : {}),
      ...(options.overviewRouteId ? { overviewRouteId: options.overviewRouteId } : {}),
      ...(options.accountRouteId ? { accountRouteId: options.accountRouteId } : {}),
      ...(options.readerRouteId ? { readerRouteId: options.readerRouteId } : {}),
      ...(options.authRedirectSource ? { authRedirectSource: options.authRedirectSource } : {}),
      ...(options.requestPath ? { requestPath: options.requestPath } : {}),
      model: pageData,
      ...(options.confirmLogout ? { confirmLogout: options.confirmLogout } : {}),
      ...(options.successToast ? { successToast: options.successToast } : {}),
      ...(options.showErrorToast !== undefined ? { showErrorToast: options.showErrorToast } : {}),
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "ensureAuthenticated",
        onTapOverview: "goToOverview",
        onTapPlan: "goToItems",
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
