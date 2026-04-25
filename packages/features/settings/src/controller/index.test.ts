import assert from "node:assert/strict";
import test from "node:test";

import { APP_ROUTE_IDS, type SettingsResponse } from "@minix/contracts";
import { ok, type AppKernel, type Result, type UserSession } from "@minix/core";

import { createSettingsPageModel } from "../model";
import { createSettingsController } from "./index";

function createSession(overrides?: {
  loggedIn?: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}): UserSession {
  return {
    identity: { userId: "user_1" },
    loggedIn: overrides?.loggedIn ?? true,
    platform: "wechat" as const,
    token: {
      accessToken: overrides?.accessToken ?? "token_1",
      ...(overrides?.refreshToken ? { refreshToken: overrides.refreshToken } : {}),
      ...(overrides?.expiresAt !== undefined ? { expiresAt: overrides.expiresAt } : {}),
    },
  };
}

function createKernelStub() {
  const routerCalls: string[] = [];
  let loggedOut = false;
  const toasts: string[] = [];
  const storageValues = new Map<string, unknown>();
  let sessionValue: UserSession | null = createSession();
  let refreshResult: Result<UserSession> = ok(createSession({ accessToken: "token_2", refreshToken: "refresh_1" }));
  let refreshCalls = 0;
  let clearCalls = 0;
  let settingsResponse: SettingsResponse = {
    preferences: {
      language: "zh-CN",
      theme: "system",
      fontScale: "md",
      notificationsEnabled: true,
      device: {
        cacheLabel: "Clear local cache only",
        networkStrategy: "balanced",
        autoplay: true,
        weakNetworkMode: false,
      },
      account: {
        profileEntryLabel: "Edit profile",
        phoneEntryLabel: "Bind phone",
        unbindEntryLabel: "Bind WeChat",
        providerEntryLabel: "Linked providers",
        cancellationEntryLabel: "Cancellation entry",
      },
      content: {
        sortOrder: "recommended",
        filterMode: "all",
        readingMode: "scroll",
        historyEnabled: true,
      },
      developerOptions: {
        logsEnabled: true,
        experimentsEnabled: true,
      },
    },
    featureToggles: {
      pushEnabled: true,
      smsEnabled: false,
      emailEnabled: false,
      accountCenterEnabled: true,
      readingSyncEnabled: true,
      experimentsEnabled: true,
    },
    privacyOptions: {
      profileVisibility: "signed_in_only",
      profileVisibilityLabel: "Visible inside signed-in surfaces only",
      personalizedRecommendations: true,
      searchHistoryEnabled: true,
      analyticsEnabled: true,
      screenshotFeedbackEnabled: true,
    },
    effectivePolicy: {
      notification: {
        inAppEnabled: true,
        subscriptionMessageEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        emailEnabled: false,
        eligibleChannels: ["in_app", "subscription_message", "push"],
        stationFallbackEnabled: true,
        presetKey: "balanced",
        presetLabel: "Balanced delivery",
        policySourceSummary: "Balanced delivery derived from global notification preference, per-channel toggles, and provider readiness.",
      },
      privacy: {
        profileVisibility: "signed_in_only",
        profileSearchVisible: false,
        relationSearchVisible: false,
        personalizedRankingEnabled: true,
        analyticsCollectionEnabled: true,
        policySourceSummary:
          "Privacy visibility resolves from profile visibility, recommendation consent, and analytics consent inside the shared settings workspace.",
      },
      device: {
        autoplayEnabled: true,
        weakNetworkMode: false,
        networkStrategy: "balanced",
        uploadChunkSizeBytes: 65536,
        diagnosticsEnabled: true,
        autoplaySummary: "Autoplay stays enabled for capable devices.",
        weakNetworkSummary: "Weak-network mode is inactive and standard upload behavior applies.",
        diagnosticsSummary: "Diagnostics remain available in debug environments.",
        policySourceSummary:
          "Device policy resolves from network strategy, weak-network mode, autoplay preference, and environment diagnostics posture.",
      },
      developer: {
        environment: "debug",
        logsEditable: true,
        experimentsEditable: true,
        logsEnabled: true,
        experimentsEnabled: true,
        exposureSummary: "Debug hosts may expose diagnostics and experiment switches through the shared settings workspace.",
        policySourceSummary:
          "Developer controls follow debug-environment preferences and shared experiment governance.",
      },
    },
    policySummary: {
      presetSummary: "Balanced delivery",
      lockedSettingsSummary: "No shared settings are locked by environment policy.",
      channelDefaultSummary: "Notification channel defaults use sample providers with in-app fallback.",
      privacySummary:
        "Privacy visibility resolves from profile visibility, recommendation consent, and analytics consent inside the shared settings workspace.",
      deviceSummary: "Weak-network mode is inactive and standard upload behavior applies.",
      developerSummary: "Developer controls follow debug-environment preferences and shared experiment governance.",
    },
    notificationChannels: [
      {
        channel: "subscription_message",
        enabled: true,
        unsubscribed: false,
        providerKey: "wechat_subscription_sample",
        providerLabel: "WeChat Subscription Provider",
        locale: "zh-CN",
        fallbackToInApp: true,
        statusLabel: "WeChat Subscription Provider is active in sample mode for subscription message delivery.",
        unsubscribable: true,
      },
      {
        channel: "sms",
        enabled: false,
        unsubscribed: false,
        providerKey: "sms_sample",
        providerLabel: "Sample SMS Provider",
        locale: "zh-CN",
        fallbackToInApp: true,
        statusLabel: "sms delivery is paused by user preference.",
        unsubscribable: true,
      },
      {
        channel: "email",
        enabled: false,
        unsubscribed: false,
        providerKey: "email_sample",
        providerLabel: "Sample Email Provider",
        locale: "zh-CN",
        fallbackToInApp: true,
        statusLabel: "email delivery is paused by user preference.",
        unsubscribable: true,
      },
      {
        channel: "push",
        enabled: true,
        unsubscribed: false,
        providerKey: "push_sample",
        providerLabel: "Sample Push Provider",
        locale: "zh-CN",
        fallbackToInApp: true,
        statusLabel: "Sample Push Provider is active in sample mode for push delivery.",
        unsubscribable: false,
      },
    ],
    notificationPresets: [
      {
        presetKey: "all_eligible",
        label: "All eligible channels",
        description: "Use every eligible remote channel plus in-app fallback when notifications remain enabled.",
        active: false,
        domains: ["account", "messages", "feedback"],
      },
      {
        presetKey: "balanced",
        label: "Balanced delivery",
        description: "Prefer in-app, subscription messages, and lightweight push posture before heavier external channels.",
        active: true,
        domains: ["account", "messages", "feedback"],
      },
      {
        presetKey: "in_app_only",
        label: "In-app only",
        description: "Keep notification follow-up inside the shared signed-in workspace without remote delivery.",
        active: false,
        domains: ["account", "messages", "feedback"],
      },
      {
        presetKey: "paused",
        label: "Paused",
        description: "Pause notification delivery while preserving the same shared policy vocabulary across account, messages, and feedback.",
        active: false,
        domains: ["account", "messages", "feedback"],
      },
    ],
    lockedSettingKeys: [],
  };

  const kernel = {
    env: {
      appId: "demo",
      appName: "demo",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "wechat",
      version: "1.0.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {
      async get<T>(key: string) {
        return ok((storageValues.get(key) as T | undefined) ?? null);
      },
      async set<T>(key: string, value: T) {
        storageValues.set(key, value);
        return ok(undefined);
      },
      async remove(key: string) {
        storageValues.delete(key);
        return ok(undefined);
      },
      async clear() {
        storageValues.clear();
        return ok(undefined);
      },
    } as AppKernel["storage"],
    session: {
      async get() {
        return ok(sessionValue);
      },
      async clear() {
        sessionValue = null;
        clearCalls += 1;
        return ok(undefined);
      },
    } as AppKernel["session"],
    request: {
      async get<T>() {
        return ok(settingsResponse as T);
      },
      async post<T>(_path: string, body?: unknown) {
        const payload = body as {
          preferences?: {
            notificationsEnabled?: boolean;
            device?: { networkStrategy?: SettingsResponse["preferences"]["device"]["networkStrategy"]; autoplay?: boolean; weakNetworkMode?: boolean };
            developerOptions?: { logsEnabled?: boolean; experimentsEnabled?: boolean };
          };
          featureToggles?: { pushEnabled?: boolean; smsEnabled?: boolean; emailEnabled?: boolean };
          notificationChannels?: Array<{
            channel: "subscription_message" | "sms" | "email" | "push";
            enabled?: boolean;
            unsubscribed?: boolean;
          }>;
          privacyOptions?: {
            profileVisibility?: SettingsResponse["privacyOptions"]["profileVisibility"];
            personalizedRecommendations?: boolean;
            searchHistoryEnabled?: boolean;
            analyticsEnabled?: boolean;
            screenshotFeedbackEnabled?: boolean;
          };
        };
        const nextNotificationsEnabled =
          payload.preferences?.notificationsEnabled ?? settingsResponse.preferences.notificationsEnabled;
        const nextPushEnabled = payload.featureToggles?.pushEnabled ?? settingsResponse.featureToggles.pushEnabled;
        const nextSmsEnabled = payload.featureToggles?.smsEnabled ?? settingsResponse.featureToggles.smsEnabled;
        const nextEmailEnabled = payload.featureToggles?.emailEnabled ?? settingsResponse.featureToggles.emailEnabled;
        const nextNetworkStrategy =
          payload.preferences?.device?.networkStrategy ?? settingsResponse.preferences.device.networkStrategy;
        const nextAutoplay = payload.preferences?.device?.autoplay ?? settingsResponse.preferences.device.autoplay;
        const nextWeakNetworkMode =
          payload.preferences?.device?.weakNetworkMode ?? settingsResponse.preferences.device.weakNetworkMode;
        const nextLogsEnabled =
          payload.preferences?.developerOptions?.logsEnabled ?? settingsResponse.preferences.developerOptions.logsEnabled;
        const nextExperimentsEnabled =
          payload.preferences?.developerOptions?.experimentsEnabled ??
          settingsResponse.preferences.developerOptions.experimentsEnabled;
        const nextNotificationChannels =
          settingsResponse.notificationChannels?.map((channel) => {
            const override = payload.notificationChannels?.find((item) => item.channel === channel.channel);
            if (!override) {
              return channel;
            }
            const enabled = override.enabled ?? channel.enabled;
            const unsubscribed = override.unsubscribed ?? channel.unsubscribed;
            return {
              ...channel,
              enabled,
              unsubscribed,
              statusLabel: unsubscribed
                ? `Unsubscribed from ${channel.channel.replace("_", " ")} delivery.`
                : enabled
                  ? `${channel.providerLabel} is active for ${channel.channel.replace("_", " ")} delivery.`
                  : `${channel.channel} delivery is paused by user preference.`,
            };
          }) ?? settingsResponse.notificationChannels;
        const eligibleChannels: SettingsResponse["effectivePolicy"]["notification"]["eligibleChannels"] = [];
        if (nextNotificationsEnabled) {
          eligibleChannels.push("in_app", "subscription_message");
          if (nextNotificationChannels?.find((item) => item.channel === "push")?.enabled) {
            eligibleChannels.push("push");
          }
          if (nextNotificationChannels?.find((item) => item.channel === "sms")?.enabled) {
            eligibleChannels.push("sms");
          }
          if (nextNotificationChannels?.find((item) => item.channel === "email")?.enabled) {
            eligibleChannels.push("email");
          }
        }
        const uploadChunkSizeBytes = nextWeakNetworkMode ? 8192 : nextNetworkStrategy === "data-saver" ? 16384 : 65536;
        const presetKey =
          !nextNotificationsEnabled
            ? "paused"
            : eligibleChannels.length <= 1
              ? "in_app_only"
              : nextNotificationChannels?.every((item) => !item.enabled || item.unsubscribed || item.channel === "subscription_message" || item.channel === "push")
                ? "balanced"
                : "all_eligible";
        const presetLabel =
          presetKey === "paused"
            ? "Notifications paused"
            : presetKey === "in_app_only"
              ? "In-app only"
              : presetKey === "balanced"
                ? "Balanced delivery"
                : "All eligible channels";
        settingsResponse = {
          ...settingsResponse,
          preferences: {
            ...settingsResponse.preferences,
            ...(payload.preferences ?? {}),
            device: {
              ...settingsResponse.preferences.device,
              ...(payload.preferences?.device ?? {}),
            },
            developerOptions: {
              ...settingsResponse.preferences.developerOptions,
              ...(payload.preferences?.developerOptions ?? {}),
            },
          },
          featureToggles: {
            ...settingsResponse.featureToggles,
            ...(payload.featureToggles ?? {}),
            ...(payload.preferences?.developerOptions?.experimentsEnabled !== undefined
              ? { experimentsEnabled: payload.preferences.developerOptions.experimentsEnabled }
              : {}),
          },
          privacyOptions: {
            ...settingsResponse.privacyOptions,
            ...(payload.privacyOptions ?? {}),
            profileVisibility: payload.privacyOptions?.profileVisibility ?? settingsResponse.privacyOptions.profileVisibility,
            profileVisibilityLabel:
              payload.privacyOptions?.profileVisibility === "public"
                ? "Public inside discovery and relation surfaces"
                : payload.privacyOptions?.profileVisibility === "followers_only"
                  ? "Visible to mutual and follower-driven discovery"
                  : settingsResponse.privacyOptions.profileVisibilityLabel,
          },
          effectivePolicy: {
            ...settingsResponse.effectivePolicy,
            notification: {
              ...settingsResponse.effectivePolicy.notification,
              inAppEnabled: nextNotificationsEnabled,
              subscriptionMessageEnabled: Boolean(nextNotificationsEnabled && nextNotificationChannels?.find((item) => item.channel === "subscription_message")?.enabled),
              pushEnabled: Boolean(nextNotificationsEnabled && nextNotificationChannels?.find((item) => item.channel === "push")?.enabled),
              smsEnabled: Boolean(nextNotificationsEnabled && nextNotificationChannels?.find((item) => item.channel === "sms")?.enabled),
              emailEnabled: Boolean(nextNotificationsEnabled && nextNotificationChannels?.find((item) => item.channel === "email")?.enabled),
              eligibleChannels,
              stationFallbackEnabled: true,
              presetKey,
              presetLabel,
              policySourceSummary: nextNotificationsEnabled
                ? `${presetLabel} derived from global notification preference, per-channel toggles, and provider readiness.`
                : "Notifications are globally disabled before per-channel policy is applied.",
            },
            privacy: {
              ...settingsResponse.effectivePolicy.privacy,
              ...(payload.privacyOptions?.profileVisibility
                ? {
                    profileVisibility: payload.privacyOptions.profileVisibility,
                    profileSearchVisible: payload.privacyOptions.profileVisibility !== "signed_in_only",
                    relationSearchVisible: payload.privacyOptions.profileVisibility !== "signed_in_only",
                  }
                : {}),
              ...(payload.privacyOptions?.personalizedRecommendations !== undefined
                ? { personalizedRankingEnabled: payload.privacyOptions.personalizedRecommendations }
                : {}),
              ...(payload.privacyOptions?.analyticsEnabled !== undefined
                ? { analyticsCollectionEnabled: payload.privacyOptions.analyticsEnabled }
                : {}),
              policySourceSummary:
                "Privacy visibility resolves from profile visibility, recommendation consent, and analytics consent inside the shared settings workspace.",
            },
            device: {
              ...settingsResponse.effectivePolicy.device,
              autoplayEnabled: nextAutoplay && !nextWeakNetworkMode,
              weakNetworkMode: nextWeakNetworkMode,
              networkStrategy: nextNetworkStrategy,
              uploadChunkSizeBytes,
              diagnosticsEnabled: nextLogsEnabled,
              autoplaySummary: nextAutoplay
                ? nextWeakNetworkMode
                  ? "Autoplay preference is on, but weak-network mode forces autoplay off."
                  : "Autoplay stays enabled for capable devices."
                : "Autoplay is disabled by user preference.",
              weakNetworkSummary: nextWeakNetworkMode
                ? "Weak-network mode is active and reduces upload chunk size plus autoplay behavior."
                : "Weak-network mode is inactive and standard upload behavior applies.",
              diagnosticsSummary: nextLogsEnabled
                ? "Diagnostics remain available in debug environments."
                : "Diagnostics are disabled by the current debug preference.",
              policySourceSummary:
                "Device policy resolves from network strategy, weak-network mode, autoplay preference, and environment diagnostics posture.",
            },
            developer: {
              ...settingsResponse.effectivePolicy.developer,
              logsEnabled: nextLogsEnabled,
              experimentsEnabled: nextExperimentsEnabled,
              exposureSummary: "Debug hosts may expose diagnostics and experiment switches through the shared settings workspace.",
              policySourceSummary:
                "Developer controls follow debug-environment preferences and shared experiment governance.",
            },
          },
          policySummary: {
            presetSummary: presetLabel,
            lockedSettingsSummary: settingsResponse.policySummary.lockedSettingsSummary,
            channelDefaultSummary: settingsResponse.policySummary.channelDefaultSummary,
            privacySummary:
              "Privacy visibility resolves from profile visibility, recommendation consent, and analytics consent inside the shared settings workspace.",
            deviceSummary: nextWeakNetworkMode
              ? "Weak-network mode is active and reduces upload chunk size plus autoplay behavior."
              : "Weak-network mode is inactive and standard upload behavior applies.",
            developerSummary: "Developer controls follow debug-environment preferences and shared experiment governance.",
          },
          notificationPresets: [
            {
              presetKey: "all_eligible",
              label: "All eligible channels",
              description: "Use every eligible remote channel plus in-app fallback when notifications remain enabled.",
              active: presetKey === "all_eligible",
              domains: ["account", "messages", "feedback"],
            },
            {
              presetKey: "balanced",
              label: "Balanced delivery",
              description: "Prefer in-app, subscription messages, and lightweight push posture before heavier external channels.",
              active: presetKey === "balanced",
              domains: ["account", "messages", "feedback"],
            },
            {
              presetKey: "in_app_only",
              label: "In-app only",
              description: "Keep notification follow-up inside the shared signed-in workspace without remote delivery.",
              active: presetKey === "in_app_only",
              domains: ["account", "messages", "feedback"],
            },
            {
              presetKey: "paused",
              label: "Paused",
              description: "Pause notification delivery while preserving the same shared policy vocabulary across account, messages, and feedback.",
              active: presetKey === "paused",
              domains: ["account", "messages", "feedback"],
            },
          ],
          ...(nextNotificationChannels ? { notificationChannels: nextNotificationChannels } : {}),
        };
        return ok(settingsResponse as T);
      },
      async put<T>() {
        return ok({} as T);
      },
      async patch<T>() {
        return ok({} as T);
      },
      async delete<T>() {
        return ok({} as T);
      },
    } as AppKernel["request"],
    auth: {
      async ensureLogin() {
        throw new Error("not implemented");
      },
      async login() {
        throw new Error("not implemented");
      },
      async logout() {
        loggedOut = true;
        return ok(undefined);
      },
      async refreshSession() {
        refreshCalls += 1;
        return refreshResult;
      },
      async exchangeToken() {
        throw new Error("not implemented");
      },
    },
    router: {
      async to() {
        return ok(undefined);
      },
      async replace(path: string) {
        routerCalls.push(path);
        return ok(undefined);
      },
      async toRoute(routeId: string) {
        routerCalls.push(`to:${routeId}`);
        return ok(undefined);
      },
      async replaceRoute(routeId: string) {
        routerCalls.push(routeId);
        return ok(undefined);
      },
      resolve(routeId: string) {
        return ok(routeId);
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok(null);
      },
    },
    ui: {
      async toast(options) {
        toasts.push(options.title);
        return ok(undefined);
      },
      async loading() {
        return ok(undefined);
      },
      async modal() {
        return ok(true);
      },
    },
  } as AppKernel;

  return {
    kernel,
    routerCalls,
    toasts,
    storageValues,
    setSession(nextSession: ReturnType<typeof createSession> | null) {
      sessionValue = nextSession;
    },
    setRefreshResult(nextResult: Result<UserSession>) {
      refreshResult = nextResult;
    },
    setSettingsResponse(nextResponse: SettingsResponse) {
      settingsResponse = nextResponse;
    },
    get loggedOut() {
      return loggedOut;
    },
    get refreshCalls() {
      return refreshCalls;
    },
    get clearCalls() {
      return clearCalls;
    },
  };
}

test("settings controller logs out and routes back to login", async () => {
  const runtime = createKernelStub();
  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
    confirmLogout: {
      title: "Sign out",
      content: "Do you want to sign out from the current session?",
      confirmText: "Sign out",
      cancelText: "Cancel",
    },
    successToast: {
      title: "Signed out",
      icon: "success",
    },
    showErrorToast: true,
  });

  const result = await controller.logout();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(runtime.loggedOut, true);
  assert.deepEqual(runtime.routerCalls, ["auth.login"]);
  assert.deepEqual(runtime.toasts, ["Signed out"]);
});

test("settings controller can route back to the lesson plan", async () => {
  const runtime = createKernelStub();
  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    itemsRouteId: APP_ROUTE_IDS.items,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  const result = await controller.goToItems();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(runtime.routerCalls, ["to:items.list"]);
});

test("settings controller can route to overview", async () => {
  const runtime = createKernelStub();
  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    overviewRouteId: APP_ROUTE_IDS.overview,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  const result = await controller.goToOverview();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(runtime.routerCalls, ["to:overview.index"]);
});

test("settings controller can route back to reader", async () => {
  const runtime = createKernelStub();
  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    readerRouteId: APP_ROUTE_IDS.reader,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  const result = await controller.goToReader();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(runtime.routerCalls, ["to:reader.chapter"]);
});

test("settings controller can apply reader settings and return with a display refresh flag", async () => {
  const runtime = createKernelStub();
  runtime.kernel.router.toRoute = async (routeId: string, params?: Record<string, string | number | boolean>) => {
    runtime.routerCalls.push(`to:${routeId}:${JSON.stringify(params ?? null)}`);
    return ok(undefined);
  };

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    readerRouteId: APP_ROUTE_IDS.reader,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  const result = await controller.applyReaderSettingsAndReturn();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(runtime.routerCalls, ['to:reader.chapter:{"displaySync":"1","source":"settings"}']);
});

test("settings controller stops when user cancels sign out", async () => {
  const runtime = createKernelStub();
  runtime.kernel.ui.modal = async () => ok(false);

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
    confirmLogout: {
      title: "Sign out",
      content: "Do you want to sign out from the current session?",
      confirmText: "Sign out",
      cancelText: "Cancel",
    },
    successToast: {
      title: "Signed out",
      icon: "success",
    },
    showErrorToast: true,
  });
  const result = await controller.logout();

  assert.deepEqual(result, { ok: true, value: false });
  assert.equal(runtime.loggedOut, false);
  assert.deepEqual(runtime.routerCalls, []);
});

test("settings controller redirects unauthenticated users back to home", async () => {
  const runtime = createKernelStub();
  runtime.setSession(null);
  runtime.kernel.router.replaceRoute = async (routeId: string, params?: Record<string, string | number | boolean>) => {
    runtime.routerCalls.push(`${routeId}:${JSON.stringify(params ?? null)}`);
    return ok(undefined);
  };

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    authRedirectSource: "preferences",
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  const result = await controller.ensureAuthenticated();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(runtime.routerCalls, ['auth.login:{"redirectSource":"preferences","redirectReason":"auth-required"}']);
});

test("settings controller refreshes an expired session before hydrating preferences", async () => {
  const runtime = createKernelStub();
  runtime.storageValues.set("reader.display", {
    theme: "night",
    mode: "page",
    fontScale: 1.2,
    nightModeDefault: "after-dusk",
  });
  runtime.setSession(
    createSession({
      accessToken: "expired_token",
      refreshToken: "refresh_1",
      expiresAt: Date.now() - 10_000,
    }),
  );
  runtime.setRefreshResult(
    ok(
      createSession({
        accessToken: "token_2",
        refreshToken: "refresh_1",
        expiresAt: Date.now() + 10_000,
      }),
    ),
  );

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "display-defaults",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  controller.store.setState({
    title: "Settings",
    sections: [
      {
        key: "display-defaults",
        title: "Display Defaults",
        items: [
          { key: "theme", label: "Reader Theme", type: "text", value: "Paper with warm contrast" },
          { key: "mode", label: "Reading Mode", type: "text", value: "Scroll for browsing and archive movement" },
          { key: "font-scale", label: "Font Scale", type: "text", value: "Comfort size at 100%" },
          { key: "night-mode-default", label: "Night Mode Default", type: "text", value: "Not set" },
        ],
      },
    ],
  });

  const result = await controller.ensureAuthenticated();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(runtime.refreshCalls, 1);
  const displaySection = controller.store.getState().sections[0];
  assert.equal(displaySection?.items[0]?.value, "Night contrast for late sessions");
  assert.equal(displaySection?.items[1]?.value, "Page mode for focused chapter reading");
  assert.equal(controller.store.getState().preferences?.language, "zh-CN");
  assert.equal(controller.store.getState().policySummary?.presetSummary, "Balanced delivery");
  assert.equal(
    controller
      .store
      .getState()
      .sections
      .find((section) => section.key === "policy-summary")
      ?.items.some(
        (item) =>
          item.key === "policy-summary-channel-defaults" &&
          item.value === "Notification channel defaults use sample providers with in-app fallback.",
      ),
    true,
  );
  assert.deepEqual(controller.store.getState().lockedSettingKeys, []);
  assert.ok(controller.store.getState().sections.some((section) => section.key === "common-preferences"));
  assert.equal(
    controller
      .store
      .getState()
      .sections
      .find((section) => section.key === "feature-toggles")
      ?.items.some((item) => item.key === "feature-experiments-enabled" && item.value === true),
    true,
  );
});

test("settings controller clears an expired session and redirects when refresh is no longer valid", async () => {
  const runtime = createKernelStub();
  runtime.setSession(
    createSession({
      accessToken: "expired_token",
      refreshToken: "refresh_1",
      expiresAt: Date.now() - 10_000,
    }),
  );
  runtime.setRefreshResult({
    ok: false,
    error: {
      code: "TOKEN_EXPIRED",
      message: "refresh expired",
      recoverable: true,
    },
  });
  runtime.kernel.router.replaceRoute = async (routeId: string, params?: Record<string, string | number | boolean>) => {
    runtime.routerCalls.push(`${routeId}:${JSON.stringify(params ?? null)}`);
    return ok(undefined);
  };

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    authRedirectSource: "preferences",
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  const result = await controller.ensureAuthenticated();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(runtime.refreshCalls, 1);
  assert.equal(runtime.clearCalls, 1);
  assert.deepEqual(runtime.routerCalls, ['auth.login:{"redirectSource":"preferences","redirectReason":"auth-required"}']);
});

test("settings controller hydrates and updates reader display preferences", async () => {
  const runtime = createKernelStub();
  runtime.storageValues.set("reader.display", {
    theme: "night",
    mode: "page",
    fontScale: 1.2,
    nightModeDefault: "after-dusk",
  });

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "display-defaults",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  controller.store.setState({
    title: "Settings",
    sections: [
      {
        key: "display-defaults",
        title: "Display Defaults",
        items: [
          { key: "theme", label: "Reader Theme", type: "text", value: "Paper with warm contrast" },
          { key: "mode", label: "Reading Mode", type: "text", value: "Scroll for browsing and archive movement" },
          { key: "font-scale", label: "Font Scale", type: "text", value: "Comfort size at 100%" },
          { key: "night-mode-default", label: "Night Mode Default", type: "text", value: "Not set" },
        ],
      },
    ],
  });

  await controller.ensureAuthenticated();
  await controller.cycleReaderTheme();
  await controller.increaseReaderFontScale();
  await controller.cycleNightModeDefault();

  const displaySection = controller.store.getState().sections[0];
  assert.equal(displaySection?.items[0]?.value, "Paper with warm contrast");
  assert.equal(displaySection?.items[1]?.value, "Page mode for focused chapter reading");
  assert.equal(displaySection?.items[2]?.value, "Comfort size at 130%");
  assert.equal(displaySection?.items[3]?.value, "Always enter the reader in night contrast, regardless of the stored base theme");
});

test("settings controller hydrates and updates reading-center preferences", async () => {
  const runtime = createKernelStub();
  runtime.storageValues.set("novel.reading-center", {
    resume: "detail-first",
    shelfOrder: "pinned",
    digest: "important",
    sync: "device-first",
    reminders: "chapter-moves",
  });

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    model: {
      title: "Reading Preferences",
      sections: [
        {
          key: "continuity",
          title: "Continuity",
          items: [
            { key: "resume", label: "Resume Point", type: "text", value: "Not set" },
            { key: "shelf-order", label: "Shelf Priority", type: "text", value: "Not set" },
            { key: "digest", label: "Release Digest", type: "text", value: "Not set" },
            { key: "reminders", label: "Reading Reminders", type: "text", value: "Not set" },
          ],
        },
        {
          key: "account",
          title: "Account",
          items: [
            { key: "sync", label: "Sync", type: "text", value: "Not set" },
          ],
        },
      ],
    },
  });

  await controller.ensureAuthenticated();

  const continuitySection = controller.store.getState().sections[0];
  const accountSection = controller.store.getState().sections[1];
  assert.equal(continuitySection?.items[0]?.value, "Open the title dossier first, then restore the chapter from there");
  assert.equal(continuitySection?.items[1]?.value, "Pinned titles first, then recent reading, then completed runs");
  assert.equal(continuitySection?.items[2]?.value, "Important release alerts only when a followed title moves");
  assert.equal(continuitySection?.items[3]?.value, "Only alert when an active title you touched receives a meaningful chapter move");
  assert.equal(accountSection?.items[0]?.value, "Keep progress on this device first, then reconcile later across hosts");

  await controller.cycleResumeMode();
  await controller.cycleShelfOrder();
  await controller.cycleDigestMode();
  await controller.cycleSyncMode();
  await controller.cycleReminderMode();

  assert.deepEqual(runtime.storageValues.get("novel.reading-center"), {
    resume: "toc-first",
    shelfOrder: "recent",
    digest: "paused",
    sync: "cross-host",
    reminders: "paused",
  });
});

test("settings controller can exercise device privacy and debug operations beyond passive display", async () => {
  const runtime = createKernelStub();
  runtime.storageValues.set("reader.display", {
    theme: "night",
    mode: "page",
    fontScale: 1.2,
    nightModeDefault: "after-dusk",
  });
  runtime.storageValues.set("novel.reading-center", {
    resume: "detail-first",
    shelfOrder: "pinned",
    digest: "important",
    sync: "device-first",
    reminders: "chapter-moves",
  });

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  await controller.ensureAuthenticated();
  await controller.cycleProfileVisibility();
  await controller.togglePushEnabled();
  await controller.toggleSmsEnabled();
  await controller.toggleEmailEnabled();
  await controller.toggleNotificationsEnabled();
  await controller.cycleNetworkStrategy();
  await controller.toggleAutoplay();
  await controller.toggleWeakNetworkMode();
  await controller.togglePersonalizedRecommendations();
  await controller.toggleAnalyticsEnabled();
  await controller.toggleLogsEnabled();
  await controller.toggleExperimentsEnabled();
  await controller.clearLocalCache();

  assert.equal(controller.store.getState().privacyOptions?.profileVisibility, "followers_only");
  assert.equal(
    controller.store.getState().privacyOptions?.profileVisibilityLabel,
    "Visible to mutual and follower-driven discovery",
  );
  assert.equal(controller.store.getState().featureToggles?.pushEnabled, false);
  assert.equal(controller.store.getState().featureToggles?.smsEnabled, true);
  assert.equal(controller.store.getState().featureToggles?.emailEnabled, true);
  assert.equal(controller.store.getState().preferences?.notificationsEnabled, false);
  assert.equal(controller.store.getState().preferences?.device.networkStrategy, "wifi-first");
  assert.equal(controller.store.getState().preferences?.device.autoplay, false);
  assert.equal(controller.store.getState().preferences?.device.weakNetworkMode, true);
  assert.equal(controller.store.getState().privacyOptions?.personalizedRecommendations, false);
  assert.equal(controller.store.getState().privacyOptions?.analyticsEnabled, false);
  assert.equal(controller.store.getState().effectivePolicy?.notification.pushEnabled, false);
  assert.equal(controller.store.getState().effectivePolicy?.notification.smsEnabled, false);
  assert.equal(controller.store.getState().effectivePolicy?.notification.emailEnabled, false);
  assert.deepEqual(controller.store.getState().effectivePolicy?.notification.eligibleChannels, []);
  assert.equal(controller.store.getState().effectivePolicy?.privacy.profileVisibility, "followers_only");
  assert.equal(controller.store.getState().effectivePolicy?.privacy.personalizedRankingEnabled, false);
  assert.equal(controller.store.getState().effectivePolicy?.privacy.analyticsCollectionEnabled, false);
  assert.equal(controller.store.getState().effectivePolicy?.device.networkStrategy, "wifi-first");
  assert.equal(controller.store.getState().effectivePolicy?.device.weakNetworkMode, true);
  assert.equal(controller.store.getState().effectivePolicy?.device.uploadChunkSizeBytes, 8192);
  assert.equal(controller.store.getState().effectivePolicy?.developer.logsEnabled, false);
  assert.equal(controller.store.getState().effectivePolicy?.developer.experimentsEnabled, false);
  assert.equal(controller.store.getState().policySummary?.presetSummary, "Notifications paused");
  assert.match(controller.store.getState().policySummary?.deviceSummary ?? "", /Weak-network mode is active/i);
  assert.equal(controller.store.getState().preferences?.developerOptions.logsEnabled, false);
  assert.equal(controller.store.getState().preferences?.developerOptions.experimentsEnabled, false);
  assert.equal(controller.store.getState().featureToggles?.experimentsEnabled, false);
  assert.equal(controller.store.getState().effectivePolicy?.notification.presetKey, "paused");
  assert.match(
    controller.store.getState().effectivePolicy?.notification.policySourceSummary ?? "",
    /globally disabled|per-channel policy/i,
  );
  assert.match(
    controller.store.getState().effectivePolicy?.device.weakNetworkSummary ?? "",
    /Weak-network mode is active/i,
  );
  assert.match(
    controller.store.getState().effectivePolicy?.developer.policySourceSummary ?? "",
    /debug-environment preferences/i,
  );
  assert.equal(
    controller.store.getState().sections.find((section) => section.key === "effective-policy")?.items.some((item) => item.key === "eligible-channels"),
    true,
  );
  assert.equal(
    controller.store.getState().sections.find((section) => section.key === "notification-presets")?.items.some((item) => item.key === "preset-paused-active" && item.value === true),
    true,
  );
  assert.equal(runtime.storageValues.has("reader.display"), false);
  assert.equal(runtime.storageValues.has("novel.reading-center"), false);
});

test("settings controller surfaces locked shared settings and developer lock summaries", async () => {
  const runtime = createKernelStub();
  runtime.setSettingsResponse({
    preferences: {
      language: "zh-CN",
      theme: "system",
      fontScale: "md",
      notificationsEnabled: true,
      device: {
        cacheLabel: "Clear local cache only",
        networkStrategy: "balanced",
        autoplay: true,
        weakNetworkMode: false,
      },
      account: {
        profileEntryLabel: "Edit profile",
        phoneEntryLabel: "Bind phone",
        unbindEntryLabel: "Bind WeChat",
        providerEntryLabel: "Linked providers",
        cancellationEntryLabel: "Cancellation entry",
      },
      content: {
        sortOrder: "recommended",
        filterMode: "all",
        readingMode: "scroll",
        historyEnabled: true,
      },
      developerOptions: {
        logsEnabled: false,
        experimentsEnabled: false,
      },
    },
    featureToggles: {
      pushEnabled: true,
      smsEnabled: false,
      emailEnabled: false,
      accountCenterEnabled: true,
      readingSyncEnabled: true,
      experimentsEnabled: false,
    },
    privacyOptions: {
      profileVisibility: "signed_in_only",
      profileVisibilityLabel: "Visible inside signed-in surfaces only",
      personalizedRecommendations: true,
      searchHistoryEnabled: true,
      analyticsEnabled: true,
      screenshotFeedbackEnabled: true,
    },
    effectivePolicy: {
      notification: {
        inAppEnabled: true,
        subscriptionMessageEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        emailEnabled: false,
        eligibleChannels: ["in_app", "subscription_message", "push"],
        stationFallbackEnabled: true,
        presetKey: "balanced",
        presetLabel: "Balanced delivery",
        policySourceSummary: "Balanced delivery derived from global notification preference, per-channel toggles, and provider readiness.",
      },
      privacy: {
        profileVisibility: "signed_in_only",
        profileSearchVisible: false,
        relationSearchVisible: false,
        personalizedRankingEnabled: true,
        analyticsCollectionEnabled: true,
        policySourceSummary:
          "Privacy visibility resolves from profile visibility, recommendation consent, and analytics consent inside the shared settings workspace.",
      },
      device: {
        autoplayEnabled: true,
        weakNetworkMode: false,
        networkStrategy: "balanced",
        uploadChunkSizeBytes: 65536,
        diagnosticsEnabled: false,
        autoplaySummary: "Autoplay stays enabled for capable devices.",
        weakNetworkSummary: "Weak-network mode is inactive and standard upload behavior applies.",
        diagnosticsSummary: "Diagnostics stay locked in production regardless of local debug toggles.",
        policySourceSummary:
          "Device policy resolves from network strategy, weak-network mode, autoplay preference, and environment diagnostics posture.",
      },
      developer: {
        environment: "production",
        logsEditable: false,
        experimentsEditable: false,
        logsEnabled: false,
        experimentsEnabled: false,
        lockedReason: "Developer diagnostics are locked in production.",
        exposureSummary: "Production hides editable diagnostics and experiment switches.",
        policySourceSummary: "Developer controls are locked by environment policy.",
      },
    },
    policySummary: {
      presetSummary: "Balanced delivery",
      lockedSettingsSummary:
        "Locked by environment policy: preferences.developerOptions.logsEnabled, preferences.developerOptions.experimentsEnabled, featureToggles.experimentsEnabled.",
      channelDefaultSummary: "Notification channel defaults use sample providers with in-app fallback.",
      privacySummary:
        "Privacy visibility resolves from profile visibility, recommendation consent, and analytics consent inside the shared settings workspace.",
      deviceSummary: "Weak-network mode is inactive and standard upload behavior applies.",
      developerSummary: "Developer controls are locked by environment policy.",
    },
    notificationChannels: [
      {
        channel: "push",
        enabled: true,
        unsubscribed: false,
        providerKey: "push_sample",
        providerLabel: "Sample Push Provider",
        locale: "zh-CN",
        fallbackToInApp: true,
        statusLabel: "Sample Push Provider is active in sample mode for push delivery.",
        unsubscribable: false,
      },
    ],
    notificationPresets: [
      {
        presetKey: "balanced",
        label: "Balanced delivery",
        description: "Prefer in-app, subscription messages, and lightweight push posture before heavier external channels.",
        active: true,
        domains: ["account", "messages", "feedback"],
      },
    ],
    lockedSettingKeys: [
      "preferences.developerOptions.logsEnabled",
      "preferences.developerOptions.experimentsEnabled",
      "featureToggles.experimentsEnabled",
    ],
  } satisfies SettingsResponse);

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  await controller.ensureAuthenticated();

  assert.deepEqual(controller.store.getState().lockedSettingKeys, [
    "preferences.developerOptions.logsEnabled",
    "preferences.developerOptions.experimentsEnabled",
    "featureToggles.experimentsEnabled",
  ]);
  assert.equal(
    controller
      .store
      .getState()
      .sections
      .find((section) => section.key === "settings-summary")
      ?.items.some(
        (item) =>
          item.key === "summary-developer-posture" &&
          item.value === "Developer diagnostics are locked in production.",
      ),
    true,
  );
  assert.equal(
    controller
      .store
      .getState()
      .sections
      .find((section) => section.key === "locked-settings")
      ?.items.some((item) => item.label === "featureToggles.experimentsEnabled"),
    true,
  );
  assert.equal(
    controller.store.getState().sections.find((section) => section.key === "effective-policy")?.items.some(
      (item) => item.key === "developer-policy-source" && item.value === "Developer controls are locked by environment policy.",
    ),
    true,
  );
  assert.equal(
    controller.store.getState().sections.find((section) => section.key === "policy-summary")?.items.some(
      (item) => item.key === "policy-summary-developer" && item.value === "Developer controls are locked by environment policy.",
    ),
    true,
  );
  assert.equal(
    controller.store.getState().sections.find((section) => section.key === "notification-presets")?.items.some(
      (item) => item.key === "preset-balanced-active" && item.value === true,
    ),
    true,
  );
});

test("settings controller can manage notification channels and unsubscribe controls", async () => {
  const runtime = createKernelStub();
  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  await controller.ensureAuthenticated();
  await controller.toggleNotificationChannel("sms");
  await controller.toggleNotificationUnsubscribe("email");

  const smsChannel = controller.store.getState().notificationChannels?.find((item) => item.channel === "sms");
  const emailChannel = controller.store.getState().notificationChannels?.find((item) => item.channel === "email");
  assert.equal(smsChannel?.enabled, true);
  assert.equal(emailChannel?.unsubscribed, true);
  assert.equal(
    controller.store.getState().sections.find((section) => section.key === "notification-channels")?.items.some((item) => item.key === "channel-email-unsubscribed"),
    true,
  );
});

test("settings controller can route bounded account entries into the shared account center", async () => {
  const runtime = createKernelStub();
  runtime.kernel.router.toRoute = async (routeId: string, params?: Record<string, string | number | boolean>) => {
    runtime.routerCalls.push(`to:${routeId}:${JSON.stringify(params ?? null)}`);
    return ok(undefined);
  };

  const controller = createSettingsController({
    kernel: runtime.kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    accountRouteId: APP_ROUTE_IDS.account,
    model: createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  });

  await controller.openProfileEntry();
  await controller.openPhoneEntry();
  await controller.openUnbindEntry();
  await controller.openCancellationEntry();

  assert.deepEqual(runtime.routerCalls, [
    'to:account.index:{"operation":"edit_profile"}',
    'to:account.index:{"operation":"change_phone"}',
    'to:account.index:{"operation":"unbind_wechat"}',
    'to:account.index:{"operation":"request_cancellation"}',
  ]);
});
