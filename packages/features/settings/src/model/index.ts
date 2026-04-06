import type { SettingsPageModel } from "@minix/core";

export interface CreateSettingsPageModelOptions {
  title: string;
  sectionKey: string;
  logoutLabel: string;
  logoutValue: string;
}

export interface CreateDefaultSettingsPageModelOptions {
  title?: string;
  sectionKey?: string;
  logoutLabel?: string;
  logoutValue?: string;
}

export function createSettingsPageModel(options: CreateSettingsPageModelOptions): SettingsPageModel {
  return {
    title: options.title,
    sections: [
      {
        key: options.sectionKey,
        items: [
          {
            key: "logout",
            label: options.logoutLabel,
            type: "text",
            value: options.logoutValue,
          },
        ],
      },
    ],
  };
}

export function createDefaultSettingsPageModel(
  options: CreateDefaultSettingsPageModelOptions = {},
): SettingsPageModel {
  return createSettingsPageModel({
    title: options.title ?? "Settings",
    sectionKey: options.sectionKey ?? "account",
    logoutLabel: options.logoutLabel ?? "Logout",
    logoutValue: options.logoutValue ?? "Sign out",
  });
}
