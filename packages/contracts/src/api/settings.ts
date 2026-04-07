export const SETTINGS_THEMES = ["system", "light", "sepia", "night"] as const;
export type SettingsTheme = (typeof SETTINGS_THEMES)[number];

export const SETTINGS_FONT_SCALES = ["sm", "md", "lg", "xl"] as const;
export type SettingsFontScale = (typeof SETTINGS_FONT_SCALES)[number];

export const SETTINGS_NETWORK_STRATEGIES = ["balanced", "wifi-first", "data-saver"] as const;
export type SettingsNetworkStrategy = (typeof SETTINGS_NETWORK_STRATEGIES)[number];

export const SETTINGS_READING_MODES = ["scroll", "page"] as const;
export type SettingsReadingMode = (typeof SETTINGS_READING_MODES)[number];

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
  profileVisibilityLabel: string;
  personalizedRecommendations: boolean;
  searchHistoryEnabled: boolean;
  analyticsEnabled: boolean;
  screenshotFeedbackEnabled: boolean;
}

export interface SettingsResponse {
  preferences: SettingsPreferences;
  featureToggles: SettingsFeatureToggles;
  privacyOptions: SettingsPrivacyOptions;
}
