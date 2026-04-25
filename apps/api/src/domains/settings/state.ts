import type {
  SettingsEffectivePolicy,
  SettingsFeatureToggles,
  SettingsNotificationChannel,
  SettingsNotificationChannelPreference,
  SettingsNotificationPreset,
  SettingsPolicySummary,
  SettingsPreferences,
  SettingsPrivacyOptions,
  SettingsProfileVisibility,
} from "@minix/contracts";

import type { ApiBindings, UserState } from "../../types";
import { resolveProviderPostureMode } from "../provider-posture";

const DEFAULT_UPLOAD_CHUNK_SIZE_BYTES = 64 * 1024;
const REDUCED_UPLOAD_CHUNK_SIZE_BYTES = 16 * 1024;
const WEAK_NETWORK_UPLOAD_CHUNK_SIZE_BYTES = 8 * 1024;

export type NotificationChannelProviderRuntimeEnv = Pick<
  ApiBindings,
  | "MINIX_MESSAGE_TOUCHPOINT_PROVIDER_MODE"
  | "MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_KEY"
  | "MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_LABEL"
  | "MINIX_MESSAGE_SMS_PROVIDER_KEY"
  | "MINIX_MESSAGE_SMS_PROVIDER_LABEL"
  | "MINIX_MESSAGE_EMAIL_PROVIDER_KEY"
  | "MINIX_MESSAGE_EMAIL_PROVIDER_LABEL"
  | "MINIX_MESSAGE_PUSH_PROVIDER_KEY"
  | "MINIX_MESSAGE_PUSH_PROVIDER_LABEL"
>;

interface NotificationChannelProviderConfig {
  providerKey: string;
  providerLabel: string;
  providerMode: "sample" | "production";
  locale: string;
  fallbackToInApp: boolean;
  defaultEnabled: boolean;
}

function createNotificationPreset(input: {
  presetKey: SettingsNotificationPreset["presetKey"];
  label: string;
  description: string;
  active: boolean;
}): SettingsNotificationPreset {
  return {
    presetKey: input.presetKey,
    label: input.label,
    description: input.description,
    active: input.active,
    domains: ["account", "messages", "feedback"],
  };
}

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

const PRODUCTION_NOTIFICATION_CHANNEL_PROVIDER_DEFAULTS: Record<
  SettingsNotificationChannel,
  {
    providerKey: string;
    providerLabel: string;
  }
> = {
  subscription_message: {
    providerKey: "wechat_subscription_provider",
    providerLabel: "WeChat Subscription Provider",
  },
  sms: {
    providerKey: "sms_provider",
    providerLabel: "SMS Provider",
  },
  email: {
    providerKey: "email_provider",
    providerLabel: "Email Provider",
  },
  push: {
    providerKey: "push_provider",
    providerLabel: "Push Provider",
  },
};

export function resolveMessageTouchpointProviderMode(
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): "sample" | "production" {
  return resolveProviderPostureMode(runtimeEnv?.MINIX_MESSAGE_TOUCHPOINT_PROVIDER_MODE);
}

export function resolveNotificationChannelProviderConfig(
  channel: SettingsNotificationChannel,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): NotificationChannelProviderConfig {
  const providerMode = resolveMessageTouchpointProviderMode(runtimeEnv);
  const sampleConfig = NOTIFICATION_CHANNEL_PROVIDER_CONFIG[channel];
  if (providerMode === "sample") {
    return {
      ...sampleConfig,
      providerMode,
    };
  }

  const defaults = PRODUCTION_NOTIFICATION_CHANNEL_PROVIDER_DEFAULTS[channel];
  const providerKey =
    channel === "subscription_message"
      ? runtimeEnv?.MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_KEY
      : channel === "sms"
        ? runtimeEnv?.MINIX_MESSAGE_SMS_PROVIDER_KEY
        : channel === "email"
          ? runtimeEnv?.MINIX_MESSAGE_EMAIL_PROVIDER_KEY
          : runtimeEnv?.MINIX_MESSAGE_PUSH_PROVIDER_KEY;
  const providerLabel =
    channel === "subscription_message"
      ? runtimeEnv?.MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_LABEL
      : channel === "sms"
        ? runtimeEnv?.MINIX_MESSAGE_SMS_PROVIDER_LABEL
        : channel === "email"
          ? runtimeEnv?.MINIX_MESSAGE_EMAIL_PROVIDER_LABEL
          : runtimeEnv?.MINIX_MESSAGE_PUSH_PROVIDER_LABEL;
  return {
    providerKey: providerKey || defaults.providerKey,
    providerLabel: providerLabel || defaults.providerLabel,
    providerMode,
    locale: sampleConfig.locale,
    fallbackToInApp: sampleConfig.fallbackToInApp,
    defaultEnabled: sampleConfig.defaultEnabled,
  };
}

export function resolveSettingsState(
  userState: UserState,
  deployEnv: string | undefined,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): {
  preferences: SettingsPreferences;
  featureToggles: SettingsFeatureToggles;
  privacyOptions: SettingsPrivacyOptions;
  effectivePolicy: SettingsEffectivePolicy;
  policySummary: SettingsPolicySummary;
  notificationChannels: SettingsNotificationChannelPreference[];
  notificationPresets: SettingsNotificationPreset[];
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
    const providerConfig = resolveNotificationChannelProviderConfig(channel, runtimeEnv);
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
            ? providerConfig.providerMode === "sample"
              ? `${providerConfig.providerLabel} is active in sample mode for ${channel.replace("_", " ")} delivery.`
              : `${providerConfig.providerLabel} is active for ${channel.replace("_", " ")} delivery.`
            : `${channel.replace("_", " ")} delivery is paused by user preference.`;
    return {
      channel,
      enabled,
      unsubscribed,
      providerKey: providerConfig.providerKey,
      providerLabel: providerConfig.providerLabel,
      providerMode: providerConfig.providerMode,
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
  const notificationPresetKey: SettingsNotificationPreset["presetKey"] = !preferences.notificationsEnabled
    ? "paused"
    : eligibleChannels.length <= 1
      ? "in_app_only"
      : notificationChannels.every((item) => !item.enabled || item.unsubscribed || item.channel === "subscription_message" || item.channel === "push")
        ? "balanced"
        : "all_eligible";
  const notificationPresetLabel =
    notificationPresetKey === "paused"
      ? "Notifications paused"
      : notificationPresetKey === "in_app_only"
        ? "In-app only"
        : notificationPresetKey === "balanced"
          ? "Balanced delivery"
          : "All eligible channels";
  const notificationPresets: SettingsNotificationPreset[] = [
    createNotificationPreset({
      presetKey: "all_eligible",
      label: "All eligible channels",
      description: "Use every eligible remote channel plus in-app fallback when notifications remain enabled.",
      active: notificationPresetKey === "all_eligible",
    }),
    createNotificationPreset({
      presetKey: "balanced",
      label: "Balanced delivery",
      description: "Prefer in-app, subscription messages, and lightweight push posture before heavier external channels.",
      active: notificationPresetKey === "balanced",
    }),
    createNotificationPreset({
      presetKey: "in_app_only",
      label: "In-app only",
      description: "Keep notification follow-up inside the shared signed-in workspace without remote delivery.",
      active: notificationPresetKey === "in_app_only",
    }),
    createNotificationPreset({
      presetKey: "paused",
      label: "Paused",
      description: "Pause notification delivery while preserving the same shared policy vocabulary across account, messages, and feedback.",
      active: notificationPresetKey === "paused",
    }),
  ];
  const notificationPolicySourceSummary =
    preferences.notificationsEnabled
      ? `${notificationPresetLabel} derived from global notification preference, per-channel toggles, and provider readiness.`
      : "Notifications are globally disabled before per-channel policy is applied.";
  const privacyPolicySourceSummary = `Privacy visibility resolves from profile visibility, recommendation consent, and analytics consent inside the shared settings workspace.`;
  const autoplaySummary = preferences.device.autoplay
    ? preferences.device.weakNetworkMode
      ? "Autoplay preference is on, but weak-network mode forces autoplay off."
      : "Autoplay stays enabled for capable devices."
    : "Autoplay is disabled by user preference.";
  const weakNetworkSummary = preferences.device.weakNetworkMode
    ? "Weak-network mode is active and reduces upload chunk size plus autoplay behavior."
    : "Weak-network mode is inactive and standard upload behavior applies.";
  const diagnosticsSummary =
    deployEnv === "production"
      ? "Diagnostics stay locked in production regardless of local debug toggles."
      : preferences.developerOptions.logsEnabled
        ? "Diagnostics remain available in debug environments."
        : "Diagnostics are disabled by the current debug preference.";
  const developerPolicySourceSummary =
    deployEnv === "production"
      ? "Developer controls are locked by environment policy."
      : "Developer controls follow debug-environment preferences and shared experiment governance.";
  const developerExposureSummary =
    deployEnv === "production"
      ? "Production hides editable diagnostics and experiment switches."
      : "Debug hosts may expose diagnostics and experiment switches through the shared settings workspace.";
  const policySummary: SettingsPolicySummary = {
    presetSummary: notificationPresetLabel,
    lockedSettingsSummary:
      lockedSettingKeys.length > 0
        ? `${lockedSettingKeys.length} settings are locked by environment policy.`
        : "No shared settings are locked by environment policy.",
    channelDefaultSummary:
      resolveMessageTouchpointProviderMode(runtimeEnv) === "production"
        ? "Notification channel defaults resolve from production provider configuration."
        : "Notification channel defaults use sample providers with in-app fallback.",
    privacySummary: privacyPolicySourceSummary,
    deviceSummary: weakNetworkSummary,
    developerSummary: developerPolicySourceSummary,
  };

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
        presetKey: notificationPresetKey,
        presetLabel: notificationPresetLabel,
        policySourceSummary: notificationPolicySourceSummary,
      },
      privacy: {
        profileVisibility: privacyOptions.profileVisibility,
        profileSearchVisible: privacyOptions.profileVisibility !== "signed_in_only",
        relationSearchVisible: privacyOptions.profileVisibility !== "signed_in_only",
        personalizedRankingEnabled: privacyOptions.personalizedRecommendations,
        analyticsCollectionEnabled: privacyOptions.analyticsEnabled,
        policySourceSummary: privacyPolicySourceSummary,
      },
      device: {
        autoplayEnabled: preferences.device.autoplay && !preferences.device.weakNetworkMode,
        weakNetworkMode: preferences.device.weakNetworkMode,
        networkStrategy: preferences.device.networkStrategy,
        uploadChunkSizeBytes,
        diagnosticsEnabled: preferences.developerOptions.logsEnabled && deployEnv !== "production",
        autoplaySummary,
        weakNetworkSummary,
        diagnosticsSummary,
        policySourceSummary: "Device policy resolves from network strategy, weak-network mode, autoplay preference, and environment diagnostics posture.",
      },
      developer: {
        environment: deployEnv === "production" ? "production" : "debug",
        logsEditable: deployEnv !== "production",
        experimentsEditable: deployEnv !== "production",
        logsEnabled: preferences.developerOptions.logsEnabled,
        experimentsEnabled: featureToggles.experimentsEnabled,
        exposureSummary: developerExposureSummary,
        policySourceSummary: developerPolicySourceSummary,
        ...(deployEnv === "production"
          ? { lockedReason: "Developer diagnostics are locked in production." }
          : {}),
      },
    },
    policySummary,
    notificationChannels,
    notificationPresets,
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
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
) {
  const current = resolveSettingsState(userState, deployEnv, runtimeEnv);
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

  return resolveSettingsState(userState, deployEnv, runtimeEnv);
}
