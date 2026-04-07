import type { SettingsFeatureToggles, SettingsPreferences, SettingsPrivacyOptions } from "@minix/contracts";

export interface SettingsItem {
  key: string;
  label: string;
  type: "link" | "switch" | "text";
  value?: string | boolean;
  targetPath?: string;
}

export interface SettingsSection {
  key: string;
  title?: string;
  items: SettingsItem[];
}

export interface SettingsPageModel {
  title: string;
  subtitle?: string;
  sections: SettingsSection[];
  preferences?: SettingsPreferences;
  featureToggles?: SettingsFeatureToggles;
  privacyOptions?: SettingsPrivacyOptions;
}
