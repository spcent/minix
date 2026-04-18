export const SETTINGS_THEMES = ["system", "light", "sepia", "night"] as const;
export type SettingsTheme = (typeof SETTINGS_THEMES)[number];

export const SETTINGS_FONT_SCALES = ["sm", "md", "lg", "xl"] as const;
export type SettingsFontScale = (typeof SETTINGS_FONT_SCALES)[number];

export const SETTINGS_NETWORK_STRATEGIES = ["balanced", "wifi-first", "data-saver"] as const;
export type SettingsNetworkStrategy = (typeof SETTINGS_NETWORK_STRATEGIES)[number];

export const SETTINGS_READING_MODES = ["scroll", "page"] as const;
export type SettingsReadingMode = (typeof SETTINGS_READING_MODES)[number];

export const SETTINGS_PROFILE_VISIBILITIES = ["signed_in_only", "followers_only", "public"] as const;
export type SettingsProfileVisibility = (typeof SETTINGS_PROFILE_VISIBILITIES)[number];
export const SETTINGS_NOTIFICATION_CHANNELS = ["subscription_message", "sms", "email", "push"] as const;
export type SettingsNotificationChannel = (typeof SETTINGS_NOTIFICATION_CHANNELS)[number];
export const SETTINGS_NOTIFICATION_PRESET_KEYS = ["all_eligible", "balanced", "in_app_only", "paused"] as const;
export type SettingsNotificationPresetKey = (typeof SETTINGS_NOTIFICATION_PRESET_KEYS)[number];

export interface SettingsPreferences {
  language: string;
  theme: SettingsTheme;
  fontScale: SettingsFontScale;
  notificationsEnabled: boolean;
  device: {
    cacheLabel: string;
    networkStrategy: SettingsNetworkStrategy;
    autoplay: boolean;
    weakNetworkMode: boolean;
  };
  account: {
    profileEntryLabel: string;
    phoneEntryLabel: string;
    unbindEntryLabel: string;
    providerEntryLabel: string;
    cancellationEntryLabel: string;
  };
  content: {
    sortOrder: string;
    filterMode: string;
    readingMode: SettingsReadingMode;
    historyEnabled: boolean;
  };
  developerOptions: {
    logsEnabled: boolean;
    experimentsEnabled: boolean;
  };
}

export interface SettingsFeatureToggles {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  accountCenterEnabled: boolean;
  readingSyncEnabled: boolean;
  experimentsEnabled: boolean;
}

export interface SettingsPrivacyOptions {
  profileVisibility: SettingsProfileVisibility;
  profileVisibilityLabel: string;
  personalizedRecommendations: boolean;
  searchHistoryEnabled: boolean;
  analyticsEnabled: boolean;
  screenshotFeedbackEnabled: boolean;
}

export interface SettingsNotificationPolicy {
  inAppEnabled: boolean;
  subscriptionMessageEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  eligibleChannels: Array<"in_app" | "subscription_message" | "push" | "sms" | "email">;
  stationFallbackEnabled?: boolean;
  presetKey?: SettingsNotificationPresetKey;
  presetLabel?: string;
  policySourceSummary?: string;
}

export interface SettingsNotificationChannelPreference {
  channel: SettingsNotificationChannel;
  enabled: boolean;
  unsubscribed: boolean;
  providerKey: string;
  providerLabel: string;
  providerMode?: "sample" | "production";
  locale: string;
  fallbackToInApp: boolean;
  statusLabel: string;
  unsubscribable: boolean;
  unsubscribedAt?: string;
}

export interface SettingsNotificationPreset {
  presetKey: SettingsNotificationPresetKey;
  label: string;
  description: string;
  active: boolean;
  domains: Array<"account" | "messages" | "feedback">;
}

export interface SettingsPrivacyPolicy {
  profileVisibility: SettingsProfileVisibility;
  profileSearchVisible: boolean;
  relationSearchVisible: boolean;
  personalizedRankingEnabled: boolean;
  analyticsCollectionEnabled: boolean;
  policySourceSummary?: string;
}

export interface SettingsDevicePolicy {
  autoplayEnabled: boolean;
  weakNetworkMode: boolean;
  networkStrategy: SettingsNetworkStrategy;
  uploadChunkSizeBytes: number;
  diagnosticsEnabled: boolean;
  autoplaySummary?: string;
  weakNetworkSummary?: string;
  diagnosticsSummary?: string;
  policySourceSummary?: string;
}

export interface SettingsDeveloperPolicy {
  environment: "debug" | "production";
  logsEditable: boolean;
  experimentsEditable: boolean;
  logsEnabled: boolean;
  experimentsEnabled: boolean;
  lockedReason?: string;
  exposureSummary?: string;
  policySourceSummary?: string;
}

export interface SettingsEffectivePolicy {
  notification: SettingsNotificationPolicy;
  privacy: SettingsPrivacyPolicy;
  device: SettingsDevicePolicy;
  developer: SettingsDeveloperPolicy;
}

export interface SettingsResponse {
  preferences: SettingsPreferences;
  featureToggles: SettingsFeatureToggles;
  privacyOptions: SettingsPrivacyOptions;
  effectivePolicy: SettingsEffectivePolicy;
  notificationChannels?: SettingsNotificationChannelPreference[];
  notificationPresets?: SettingsNotificationPreset[];
  lockedSettingKeys: string[];
}

export interface UpdateSettingsRequest {
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
  privacyOptions?: Partial<Pick<SettingsPrivacyOptions, "profileVisibility" | "personalizedRecommendations" | "searchHistoryEnabled" | "analyticsEnabled" | "screenshotFeedbackEnabled">>;
}
