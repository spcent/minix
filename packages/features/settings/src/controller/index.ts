import {
  ok,
  createStore,
  READER_DISPLAY_STORAGE_KEY,
  READING_CENTER_STORAGE_KEY,
  type AppKernel,
  type ModalOptions,
  type ReaderDisplayPreferences,
  type ReaderMode,
  type ReaderTheme,
  type ReadingCenterPreferences,
  type SettingsPageModel,
  type ToastOptions,
} from "@minix/core";
import {
  SETTINGS_NETWORK_STRATEGIES,
  SETTINGS_PROFILE_VISIBILITIES,
  type AppRouteId,
  type SettingsResponse,
  type UpdateSettingsRequest,
} from "@minix/contracts";

import { ensureSettingsAuthenticated } from "./auth-flow";
import { createSettingsNavigation } from "./navigation";
import {
  applyDisplayPreferences,
  applyReadingCenterPreferences,
  applyRemoteSettings,
  updateSectionItemValue,
} from "./preferences-flow";
import {
  createDeveloperPreferenceUpdate,
  createDevicePreferenceUpdate,
  createNotificationsEnabledUpdate,
  createPrivacyPreferenceUpdate,
} from "./settings-actions";

export interface CreateSettingsControllerOptions {
  kernel: AppKernel;
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
  model: SettingsPageModel;
  displaySettingsStorageKey?: string;
  readingCenterStorageKey?: string;
  requestPath?: string;
  updateRequestPath?: string;
  confirmLogout?: ModalOptions;
  successToast?: ToastOptions;
  showErrorToast?: boolean;
}

const READER_THEMES: ReaderTheme[] = ["paper", "sepia", "night"];
const READER_MODES: ReaderMode[] = ["scroll", "page"];
const NIGHT_MODE_DEFAULTS: ReaderDisplayPreferences["nightModeDefault"][] = ["manual-only", "after-dusk", "always-night"];
const RESUME_MODES: ReadingCenterPreferences["resume"][] = ["latest-chapter", "detail-first", "toc-first"];
const SHELF_ORDERS: ReadingCenterPreferences["shelfOrder"][] = ["recent", "updates", "pinned"];
const DIGEST_MODES: ReadingCenterPreferences["digest"][] = ["weekly", "weekend", "important", "paused"];
const SYNC_MODES: ReadingCenterPreferences["sync"][] = ["cross-host", "device-first"];
const REMINDER_MODES: ReadingCenterPreferences["reminders"][] = ["nightly", "chapter-moves", "paused"];
const PROFILE_VISIBILITIES = [...SETTINGS_PROFILE_VISIBILITIES];

function createNextValue<T extends string>(values: readonly T[], current: T): T {
  const currentIndex = values.indexOf(current);
  return values[(currentIndex + 1) % values.length] ?? values[0]!;
}

export function createSettingsController(options: CreateSettingsControllerOptions) {
  const {
    kernel,
    loginRouteId,
    itemsRouteId,
    overviewRouteId,
    accountRouteId,
    membershipRouteId,
    ordersRouteId,
    feedRouteId,
    messagesRouteId,
    feedbackRouteId,
    mediaToolsRouteId,
    readerRouteId,
    authRedirectSource,
    model,
    displaySettingsStorageKey = READER_DISPLAY_STORAGE_KEY,
    readingCenterStorageKey = READING_CENTER_STORAGE_KEY,
    requestPath = "/settings",
    updateRequestPath = "/settings",
    confirmLogout,
    successToast,
    showErrorToast = false,
  } = options;
  let displayPreferences: ReaderDisplayPreferences = {
    theme: "paper",
    mode: "scroll",
    fontScale: 1,
    nightModeDefault: "manual-only",
  };
  let readingCenterPreferences: ReadingCenterPreferences = {
    resume: "latest-chapter",
    shelfOrder: "recent",
    digest: "weekly",
    sync: "cross-host",
    reminders: "nightly",
  };
  const store = createStore(
    applyReadingCenterPreferences(applyDisplayPreferences(model, displayPreferences), readingCenterPreferences),
  );
  const { routeToOptional } = createSettingsNavigation(kernel);

  async function hydrateRemoteSettings() {
    const result = await kernel.request.get<SettingsResponse>(requestPath);
    if (!result.ok) {
      return result;
    }

    store.replaceState(applyRemoteSettings(store.getState(), result.value, kernel.env));
    return ok(undefined);
  }

  async function persistRemoteSettings(update: UpdateSettingsRequest) {
    const result = await kernel.request.post<SettingsResponse>(updateRequestPath, update);
    if (!result.ok) {
      return result;
    }

    store.replaceState(applyRemoteSettings(store.getState(), result.value, kernel.env));
    return ok(undefined);
  }

  async function hydrateDisplayPreferences() {
    const result = await kernel.storage.get<ReaderDisplayPreferences>(displaySettingsStorageKey);
    if (!result.ok) {
      return result;
    }

    displayPreferences = {
      ...displayPreferences,
      ...(result.value ?? {}),
    };
    store.setState(applyDisplayPreferences(store.getState(), displayPreferences));
    return ok(undefined);
  }

  async function hydrateReadingCenterPreferences() {
    const result = await kernel.storage.get<ReadingCenterPreferences>(readingCenterStorageKey);
    if (!result.ok) {
      return result;
    }

    readingCenterPreferences = {
      ...readingCenterPreferences,
      ...(result.value ?? {}),
    };
    store.setState(applyReadingCenterPreferences(store.getState(), readingCenterPreferences));
    return ok(undefined);
  }

  async function persistDisplayPreferences(nextPreferences: ReaderDisplayPreferences) {
    const result = await kernel.storage.set(displaySettingsStorageKey, nextPreferences);
    if (!result.ok) {
      return result;
    }

    displayPreferences = nextPreferences;
    store.setState(applyDisplayPreferences(store.getState(), displayPreferences));
    return ok(undefined);
  }

  async function persistReadingCenterPreferences(nextPreferences: ReadingCenterPreferences) {
    const result = await kernel.storage.set(readingCenterStorageKey, nextPreferences);
    if (!result.ok) {
      return result;
    }

    readingCenterPreferences = nextPreferences;
    store.setState(applyReadingCenterPreferences(store.getState(), readingCenterPreferences));
    return ok(undefined);
  }

  function setNotificationsEnabled(nextValue: boolean) {
    return persistRemoteSettings(createNotificationsEnabledUpdate(nextValue));
  }

  function setDevicePreference<T extends keyof NonNullable<NonNullable<UpdateSettingsRequest["preferences"]>["device"]>>(
    key: T,
    itemKey: string,
    value: NonNullable<NonNullable<UpdateSettingsRequest["preferences"]>["device"]>[T],
  ) {
    void itemKey;
    return persistRemoteSettings(createDevicePreferenceUpdate(key, value));
  }

  function setPrivacyPreference<T extends keyof NonNullable<UpdateSettingsRequest["privacyOptions"]>>(
    key: T,
    itemKey: string,
    value: NonNullable<UpdateSettingsRequest["privacyOptions"]>[T],
  ) {
    void itemKey;
    return persistRemoteSettings(createPrivacyPreferenceUpdate(key, value));
  }

  function setDeveloperPreference<T extends keyof NonNullable<NonNullable<UpdateSettingsRequest["preferences"]>["developerOptions"]>>(
    key: T,
    itemKey: string,
    value: NonNullable<NonNullable<UpdateSettingsRequest["preferences"]>["developerOptions"]>[T],
  ) {
    void itemKey;
    return persistRemoteSettings(createDeveloperPreferenceUpdate(key, value));
  }

  function createNextTheme(currentTheme: ReaderTheme): ReaderTheme {
    const currentIndex = READER_THEMES.indexOf(currentTheme);
    return READER_THEMES[(currentIndex + 1) % READER_THEMES.length] ?? "paper";
  }

  function createNextMode(currentMode: ReaderMode): ReaderMode {
    const currentIndex = READER_MODES.indexOf(currentMode);
    return READER_MODES[(currentIndex + 1) % READER_MODES.length] ?? "scroll";
  }

  return {
    store,

    async ensureAuthenticated() {
      return ensureSettingsAuthenticated({
        kernel,
        loginRouteId,
        authRedirectSource,
        hydrateRemoteSettings,
        hydrateDisplayPreferences,
        hydrateReadingCenterPreferences,
      });
    },

    async cycleReaderTheme() {
      const nextPreferences: ReaderDisplayPreferences = {
        ...displayPreferences,
        theme: createNextTheme(displayPreferences.theme),
      };

      return persistDisplayPreferences(nextPreferences);
    },

    async cycleReaderMode() {
      const nextPreferences: ReaderDisplayPreferences = {
        ...displayPreferences,
        mode: createNextMode(displayPreferences.mode),
      };

      return persistDisplayPreferences(nextPreferences);
    },

    async increaseReaderFontScale() {
      const nextPreferences: ReaderDisplayPreferences = {
        ...displayPreferences,
        fontScale: Math.min(1.5, Number((displayPreferences.fontScale + 0.1).toFixed(2))),
      };

      return persistDisplayPreferences(nextPreferences);
    },

    async decreaseReaderFontScale() {
      const nextPreferences: ReaderDisplayPreferences = {
        ...displayPreferences,
        fontScale: Math.max(0.8, Number((displayPreferences.fontScale - 0.1).toFixed(2))),
      };

      return persistDisplayPreferences(nextPreferences);
    },

    async cycleNightModeDefault() {
      return persistDisplayPreferences({
        ...displayPreferences,
        nightModeDefault: createNextValue(NIGHT_MODE_DEFAULTS, displayPreferences.nightModeDefault),
      });
    },

    async cycleResumeMode() {
      return persistReadingCenterPreferences({
        ...readingCenterPreferences,
        resume: createNextValue(RESUME_MODES, readingCenterPreferences.resume),
      });
    },

    async cycleShelfOrder() {
      return persistReadingCenterPreferences({
        ...readingCenterPreferences,
        shelfOrder: createNextValue(SHELF_ORDERS, readingCenterPreferences.shelfOrder),
      });
    },

    async cycleDigestMode() {
      return persistReadingCenterPreferences({
        ...readingCenterPreferences,
        digest: createNextValue(DIGEST_MODES, readingCenterPreferences.digest),
      });
    },

    async cycleSyncMode() {
      return persistReadingCenterPreferences({
        ...readingCenterPreferences,
        sync: createNextValue(SYNC_MODES, readingCenterPreferences.sync),
      });
    },

    async cycleReminderMode() {
      return persistReadingCenterPreferences({
        ...readingCenterPreferences,
        reminders: createNextValue(REMINDER_MODES, readingCenterPreferences.reminders),
      });
    },

    async toggleNotificationsEnabled() {
      return setNotificationsEnabled(!(store.getState().preferences?.notificationsEnabled ?? true));
    },

    async cycleProfileVisibility() {
      const current = store.getState().privacyOptions?.profileVisibility ?? "signed_in_only";
      return setPrivacyPreference(
        "profileVisibility",
        "profile-visibility",
        createNextValue(PROFILE_VISIBILITIES, current),
      );
    },

    async togglePushEnabled() {
      return persistRemoteSettings({
        featureToggles: {
          pushEnabled: !(store.getState().featureToggles?.pushEnabled ?? true),
        },
      });
    },

    async toggleSmsEnabled() {
      return persistRemoteSettings({
        featureToggles: {
          smsEnabled: !(store.getState().featureToggles?.smsEnabled ?? false),
        },
      });
    },

    async toggleEmailEnabled() {
      return persistRemoteSettings({
        featureToggles: {
          emailEnabled: !(store.getState().featureToggles?.emailEnabled ?? false),
        },
      });
    },

    async toggleNotificationChannel(channel: "subscription_message" | "sms" | "email" | "push") {
      const current = store.getState().notificationChannels?.find((item) => item.channel === channel);
      return persistRemoteSettings({
        notificationChannels: [
          {
            channel,
            enabled: !(current?.enabled ?? false),
          },
        ],
      });
    },

    async toggleNotificationUnsubscribe(channel: "subscription_message" | "sms" | "email" | "push") {
      const current = store.getState().notificationChannels?.find((item) => item.channel === channel);
      return persistRemoteSettings({
        notificationChannels: [
          {
            channel,
            unsubscribed: !(current?.unsubscribed ?? false),
          },
        ],
      });
    },

    async cycleNetworkStrategy() {
      const current = store.getState().preferences?.device.networkStrategy ?? "balanced";
      return setDevicePreference(
        "networkStrategy",
        "network-strategy",
        createNextValue(SETTINGS_NETWORK_STRATEGIES, current),
      );
    },

    async toggleAutoplay() {
      return setDevicePreference("autoplay", "autoplay", !(store.getState().preferences?.device.autoplay ?? true));
    },

    async toggleWeakNetworkMode() {
      return setDevicePreference(
        "weakNetworkMode",
        "weak-network-mode",
        !(store.getState().preferences?.device.weakNetworkMode ?? false),
      );
    },

    async clearLocalCache() {
      const removeDisplayResult = await kernel.storage.remove(displaySettingsStorageKey);
      if (!removeDisplayResult.ok) {
        return removeDisplayResult;
      }
      const removeReadingCenterResult = await kernel.storage.remove(readingCenterStorageKey);
      if (!removeReadingCenterResult.ok) {
        return removeReadingCenterResult;
      }

      displayPreferences = {
        theme: "paper",
        mode: "scroll",
        fontScale: 1,
        nightModeDefault: "manual-only",
      };
      readingCenterPreferences = {
        resume: "latest-chapter",
        shelfOrder: "recent",
        digest: "weekly",
        sync: "cross-host",
        reminders: "nightly",
      };

      const nextModel = updateSectionItemValue(
        applyReadingCenterPreferences(applyDisplayPreferences(store.getState(), displayPreferences), readingCenterPreferences),
        "device-settings",
        "cache-label",
        "Local cache cleared for reader and reading-center preferences",
      );
      if (nextModel.preferences) {
        nextModel.preferences = {
          ...nextModel.preferences,
          device: {
            ...nextModel.preferences.device,
            cacheLabel: "Local cache cleared for reader and reading-center preferences",
          },
        };
      }
      store.replaceState(nextModel);
      return ok(undefined);
    },

    async togglePersonalizedRecommendations() {
      return setPrivacyPreference(
        "personalizedRecommendations",
        "personalized-recommendations",
        !(store.getState().privacyOptions?.personalizedRecommendations ?? true),
      );
    },

    async toggleSearchHistoryEnabled() {
      return setPrivacyPreference(
        "searchHistoryEnabled",
        "search-history",
        !(store.getState().privacyOptions?.searchHistoryEnabled ?? true),
      );
    },

    async toggleAnalyticsEnabled() {
      return setPrivacyPreference(
        "analyticsEnabled",
        "analytics",
        !(store.getState().privacyOptions?.analyticsEnabled ?? true),
      );
    },

    async toggleScreenshotFeedbackEnabled() {
      return setPrivacyPreference(
        "screenshotFeedbackEnabled",
        "screenshot-feedback",
        !(store.getState().privacyOptions?.screenshotFeedbackEnabled ?? true),
      );
    },

    async toggleLogsEnabled() {
      return setDeveloperPreference(
        "logsEnabled",
        "logs-enabled",
        !(store.getState().preferences?.developerOptions.logsEnabled ?? true),
      );
    },

    async toggleExperimentsEnabled() {
      const nextValue = !(store.getState().preferences?.developerOptions.experimentsEnabled ?? true);
      return setDeveloperPreference("experimentsEnabled", "experiments-enabled", nextValue);
    },

    async openProfileEntry() {
      return routeToOptional(accountRouteId, { operation: "edit_profile" });
    },

    async openPhoneEntry() {
      return routeToOptional(accountRouteId, { operation: "change_phone" });
    },

    async openUnbindEntry() {
      return routeToOptional(accountRouteId, { operation: "unbind_wechat" });
    },

    async openCancellationEntry() {
      return routeToOptional(accountRouteId, { operation: "request_cancellation" });
    },

    async goToAccount() {
      return routeToOptional(accountRouteId);
    },

    async goToMembership() {
      return routeToOptional(membershipRouteId);
    },

    async goToOrders() {
      return routeToOptional(ordersRouteId);
    },

    async goToFeed() {
      return routeToOptional(feedRouteId);
    },

    async goToMessages() {
      return routeToOptional(messagesRouteId);
    },

    async goToFeedback() {
      return routeToOptional(feedbackRouteId);
    },

    async goToMediaTools() {
      return routeToOptional(mediaToolsRouteId);
    },

    async goToItems() {
      if (!itemsRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(itemsRouteId);
    },

    async goToOverview() {
      if (!overviewRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(overviewRouteId);
    },

    async goToReader() {
      if (!readerRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(readerRouteId);
    },

    async applyReaderSettingsAndReturn() {
      if (!readerRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(readerRouteId, {
        displaySync: "1",
        source: "settings",
      });
    },

    async logout() {
      if (confirmLogout) {
        const confirmed = await kernel.ui.modal(confirmLogout);
        if (!confirmed.ok) {
          return confirmed;
        }

        if (!confirmed.value) {
          return confirmed;
        }
      }

      const result = await kernel.auth.logout();
      if (!result.ok) {
        if (showErrorToast) {
          await kernel.ui.toast({
            title: result.error.message,
            icon: "error",
          });
        }
        return result;
      }

      if (successToast) {
        await kernel.ui.toast(successToast);
      }

      return kernel.router.replaceRoute(loginRouteId);
    },
  };
}
