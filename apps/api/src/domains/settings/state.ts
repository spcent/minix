import type {
  SettingsEffectivePolicy,
  SettingsFeatureToggles,
  SettingsNotificationChannel,
  SettingsNotificationChannelPreference,
  SettingsPreferences,
  SettingsPrivacyOptions,
  SettingsProfileVisibility,
} from "@minix/contracts";

import type { UserState } from "../../types";

const DEFAULT_UPLOAD_CHUNK_SIZE_BYTES = 64 * 1024;
const REDUCED_UPLOAD_CHUNK_SIZE_BYTES = 16 * 1024;
const WEAK_NETWORK_UPLOAD_CHUNK_SIZE_BYTES = 8 * 1024;

export function createDefaultSettingsPreferences(deployEnv: string | undefined): SettingsPreferences {
  return {
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
      phoneEntryLabel: "Edit phone",
      unbindEntryLabel: "Manage WeChat binding",
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
      logsEnabled: deployEnv !== "production",
      experimentsEnabled: deployEnv !== "production",
    },
  };
}

export function createDefaultSettingsFeatureToggles(deployEnv: string | undefined): SettingsFeatureToggles {
  return {
    pushEnabled: true,
    smsEnabled: false,
    emailEnabled: false,
    accountCenterEnabled: true,
    readingSyncEnabled: true,
    experimentsEnabled: deployEnv !== "production",
  };
}

export function createDefaultSettingsPrivacyOptions(): SettingsPrivacyOptions {
  return {
    profileVisibility: "signed_in_only",
    profileVisibilityLabel: "Visible inside signed-in surfaces only",
    personalizedRecommendations: true,
    searchHistoryEnabled: true,
    analyticsEnabled: true,
    screenshotFeedbackEnabled: true,
  };
}

function createProfileVisibilityLabel(visibility: SettingsProfileVisibility): string {
  if (visibility === "public") {
    return "Public inside discovery and relation surfaces";
  }

  if (visibility === "followers_only") {
    return "Visible to mutual and follower-driven discovery";
  }

  return "Visible inside signed-in surfaces only";
}

export const NOTIFICATION_CHANNEL_PROVIDER_CONFIG: Record<
  SettingsNotificationChannel,
  {
    providerKey: string;
    providerLabel: string;
    locale: string;
    fallbackToInApp: boolean;
    defaultEnabled: boolean;
  }
> = {
  subscription_message: {
    providerKey: "wechat_subscription_sample",
    providerLabel: "WeChat Subscription Provider",
    locale: "zh-CN",
    fallbackToInApp: true,
    defaultEnabled: true,
  },
  sms: {
    providerKey: "sms_sample",
    providerLabel: "Sample SMS Provider",
    locale: "zh-CN",
    fallbackToInApp: true,
    defaultEnabled: false,
  },
  email: {
    providerKey: "email_sample",
    providerLabel: "Sample Email Provider",
    locale: "zh-CN",
    fallbackToInApp: true,
    defaultEnabled: false,
  },
  push: {
    providerKey: "push_sample",
    providerLabel: "Sample Push Provider",
    locale: "zh-CN",
    fallbackToInApp: true,
    defaultEnabled: true,
  },
};

export function resolveSettingsState(userState: UserState, deployEnv: string | undefined): {
  preferences: SettingsPreferences;
  featureToggles: SettingsFeatureToggles;
  privacyOptions: SettingsPrivacyOptions;
  effectivePolicy: SettingsEffectivePolicy;
  notificationChannels: SettingsNotificationChannelPreference[];
  lockedSettingKeys: string[];
} {
  const defaultPreferences = createDefaultSettingsPreferences(deployEnv);
  const defaultFeatureToggles = createDefaultSettingsFeatureToggles(deployEnv);
  const defaultPrivacyOptions = createDefaultSettingsPrivacyOptions();
  const preferences: SettingsPreferences = {
    ...defaultPreferences,
    ...(userState.settingsState?.preferences ?? {}),
    device: {
      ...defaultPreferences.device,
      ...(userState.settingsState?.preferences?.device ?? {}),
    },
    account: defaultPreferences.account,
    content: defaultPreferences.content,
    developerOptions: {
      ...defaultPreferences.developerOptions,
      ...(userState.settingsState?.preferences?.developerOptions ?? {}),
    },
  };
  const featureToggles: SettingsFeatureToggles = {
    ...defaultFeatureToggles,
    ...(userState.settingsState?.featureToggles ?? {}),
  };
  const privacyOptions: SettingsPrivacyOptions = {
    ...defaultPrivacyOptions,
    ...(userState.settingsState?.privacyOptions ?? {}),
    profileVisibility:
      userState.settingsState?.privacyOptions?.profileVisibility ?? defaultPrivacyOptions.profileVisibility,
    profileVisibilityLabel: createProfileVisibilityLabel(
      userState.settingsState?.privacyOptions?.profileVisibility ?? defaultPrivacyOptions.profileVisibility,
    ),
  };

  const lockedSettingKeys: string[] = [];
  if (deployEnv === "production") {
    preferences.developerOptions.logsEnabled = false;
    preferences.developerOptions.experimentsEnabled = false;
    featureToggles.experimentsEnabled = false;
    lockedSettingKeys.push(
      "preferences.developerOptions.logsEnabled",
      "preferences.developerOptions.experimentsEnabled",
      "featureToggles.experimentsEnabled",
    );
  } else {
    featureToggles.experimentsEnabled = preferences.developerOptions.experimentsEnabled;
  }

  const storedNotificationChannels = userState.settingsState?.notificationChannels ?? {};
  const notificationChannels = (Object.keys(
    NOTIFICATION_CHANNEL_PROVIDER_CONFIG,
  ) as SettingsNotificationChannel[]).map((channel) => {
    const providerConfig = NOTIFICATION_CHANNEL_PROVIDER_CONFIG[channel];
    const stored = storedNotificationChannels[channel];
    const toggleEnabled =
      channel === "subscription_message"
        ? true
        : channel === "push"
          ? featureToggles.pushEnabled
          : channel === "sms"
            ? featureToggles.smsEnabled
            : featureToggles.emailEnabled;
    const enabled =
      preferences.notificationsEnabled &&
      toggleEnabled &&
      (stored?.enabled ?? providerConfig.defaultEnabled);
    const unsubscribed = Boolean(stored?.unsubscribed);
    const statusLabel = !preferences.notificationsEnabled
      ? "All notification delivery is disabled."
      : !toggleEnabled
        ? `${channel.replace("_", " ")} delivery is disabled by the current account policy.`
        : unsubscribed
          ? `Unsubscribed from ${channel.replace("_", " ")} delivery.`
          : enabled
            ? `${providerConfig.providerLabel} is active for ${channel.replace("_", " ")} delivery.`
            : `${channel.replace("_", " ")} delivery is paused by user preference.`;
    return {
      channel,
      enabled,
      unsubscribed,
      providerKey: providerConfig.providerKey,
      providerLabel: providerConfig.providerLabel,
      locale: providerConfig.locale,
      fallbackToInApp: providerConfig.fallbackToInApp,
      statusLabel,
      unsubscribable: channel !== "push",
      ...(stored?.unsubscribedAt ? { unsubscribedAt: stored.unsubscribedAt } : {}),
    };
  });

  const eligibleChannels: SettingsEffectivePolicy["notification"]["eligibleChannels"] = [];
  if (preferences.notificationsEnabled) {
    eligibleChannels.push("in_app", "subscription_message");
    if (notificationChannels.find((item) => item.channel === "push")?.enabled) {
      eligibleChannels.push("push");
    }
    if (notificationChannels.find((item) => item.channel === "sms")?.enabled) {
      eligibleChannels.push("sms");
    }
    if (notificationChannels.find((item) => item.channel === "email")?.enabled) {
      eligibleChannels.push("email");
    }
  }

  const uploadChunkSizeBytes = preferences.device.weakNetworkMode
    ? WEAK_NETWORK_UPLOAD_CHUNK_SIZE_BYTES
    : preferences.device.networkStrategy === "data-saver"
      ? REDUCED_UPLOAD_CHUNK_SIZE_BYTES
      : DEFAULT_UPLOAD_CHUNK_SIZE_BYTES;

  return {
    preferences,
    featureToggles,
    privacyOptions,
    effectivePolicy: {
      notification: {
        inAppEnabled: preferences.notificationsEnabled,
        subscriptionMessageEnabled: Boolean(
          notificationChannels.find((item) => item.channel === "subscription_message")?.enabled,
        ),
        pushEnabled: Boolean(notificationChannels.find((item) => item.channel === "push")?.enabled),
        smsEnabled: Boolean(notificationChannels.find((item) => item.channel === "sms")?.enabled),
        emailEnabled: Boolean(notificationChannels.find((item) => item.channel === "email")?.enabled),
        eligibleChannels,
        stationFallbackEnabled: true,
      },
      privacy: {
        profileVisibility: privacyOptions.profileVisibility,
        profileSearchVisible: privacyOptions.profileVisibility !== "signed_in_only",
        relationSearchVisible: privacyOptions.profileVisibility !== "signed_in_only",
        personalizedRankingEnabled: privacyOptions.personalizedRecommendations,
        analyticsCollectionEnabled: privacyOptions.analyticsEnabled,
      },
      device: {
        autoplayEnabled: preferences.device.autoplay && !preferences.device.weakNetworkMode,
        weakNetworkMode: preferences.device.weakNetworkMode,
        networkStrategy: preferences.device.networkStrategy,
        uploadChunkSizeBytes,
        diagnosticsEnabled: preferences.developerOptions.logsEnabled && deployEnv !== "production",
      },
      developer: {
        environment: deployEnv === "production" ? "production" : "debug",
        logsEditable: deployEnv !== "production",
        experimentsEditable: deployEnv !== "production",
        logsEnabled: preferences.developerOptions.logsEnabled,
        experimentsEnabled: featureToggles.experimentsEnabled,
        ...(deployEnv === "production"
          ? { lockedReason: "Developer diagnostics are locked in production." }
          : {}),
      },
    },
    notificationChannels,
    lockedSettingKeys,
  };
}

export function applySettingsUpdate(
  userState: UserState,
  update: {
    preferences?: {
      notificationsEnabled?: boolean;
      device?: Partial<Pick<SettingsPreferences["device"], "networkStrategy" | "autoplay" | "weakNetworkMode">>;
      developerOptions?: Partial<SettingsPreferences["developerOptions"]>;
    };
    featureToggles?: Partial<Pick<SettingsFeatureToggles, "pushEnabled" | "smsEnabled" | "emailEnabled">>;
    notificationChannels?: Array<{
      channel: SettingsNotificationChannel;
      enabled?: boolean;
      unsubscribed?: boolean;
    }>;
    privacyOptions?: Partial<
      Pick<
        SettingsPrivacyOptions,
        | "profileVisibility"
        | "personalizedRecommendations"
        | "searchHistoryEnabled"
        | "analyticsEnabled"
        | "screenshotFeedbackEnabled"
      >
    >;
  },
  deployEnv: string | undefined,
) {
  const current = resolveSettingsState(userState, deployEnv);
  const nextPreferences: NonNullable<UserState["settingsState"]>["preferences"] = {
    notificationsEnabled:
      update.preferences?.notificationsEnabled ?? current.preferences.notificationsEnabled,
    device: {
      networkStrategy:
        update.preferences?.device?.networkStrategy ?? current.preferences.device.networkStrategy,
      autoplay: update.preferences?.device?.autoplay ?? current.preferences.device.autoplay,
      weakNetworkMode:
        update.preferences?.device?.weakNetworkMode ?? current.preferences.device.weakNetworkMode,
    },
    developerOptions: {
      logsEnabled:
        deployEnv === "production"
          ? false
          : update.preferences?.developerOptions?.logsEnabled ??
            current.preferences.developerOptions.logsEnabled,
      experimentsEnabled:
        deployEnv === "production"
          ? false
          : update.preferences?.developerOptions?.experimentsEnabled ??
            current.preferences.developerOptions.experimentsEnabled,
    },
  };
  const nextFeatureToggles: NonNullable<UserState["settingsState"]>["featureToggles"] = {
    pushEnabled: update.featureToggles?.pushEnabled ?? current.featureToggles.pushEnabled,
    smsEnabled: update.featureToggles?.smsEnabled ?? current.featureToggles.smsEnabled,
    emailEnabled: update.featureToggles?.emailEnabled ?? current.featureToggles.emailEnabled,
  };
  const nextNotificationChannels: NonNullable<UserState["settingsState"]>["notificationChannels"] = {
    ...(userState.settingsState?.notificationChannels ?? {}),
  };
  for (const channelUpdate of update.notificationChannels ?? []) {
    const currentChannel = nextNotificationChannels[channelUpdate.channel] ?? {};
    nextNotificationChannels[channelUpdate.channel] = {
      ...currentChannel,
      ...(channelUpdate.enabled !== undefined ? { enabled: channelUpdate.enabled } : {}),
      ...(channelUpdate.unsubscribed !== undefined
        ? { unsubscribed: channelUpdate.unsubscribed }
        : {}),
      ...(channelUpdate.unsubscribed !== undefined
        ? channelUpdate.unsubscribed
          ? { unsubscribedAt: new Date().toISOString() }
          : {}
        : {}),
    };
  }
  const nextPrivacyOptions: NonNullable<UserState["settingsState"]>["privacyOptions"] = {
    profileVisibility:
      update.privacyOptions?.profileVisibility ?? current.privacyOptions.profileVisibility,
    personalizedRecommendations:
      update.privacyOptions?.personalizedRecommendations ??
      current.privacyOptions.personalizedRecommendations,
    searchHistoryEnabled:
      update.privacyOptions?.searchHistoryEnabled ?? current.privacyOptions.searchHistoryEnabled,
    analyticsEnabled:
      update.privacyOptions?.analyticsEnabled ?? current.privacyOptions.analyticsEnabled,
    screenshotFeedbackEnabled:
      update.privacyOptions?.screenshotFeedbackEnabled ??
      current.privacyOptions.screenshotFeedbackEnabled,
  };

  userState.settingsState = {
    preferences: nextPreferences,
    featureToggles: nextFeatureToggles,
    notificationChannels: nextNotificationChannels,
    privacyOptions: nextPrivacyOptions,
  };

  return resolveSettingsState(userState, deployEnv);
}
