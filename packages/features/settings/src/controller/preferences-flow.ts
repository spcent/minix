import {
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  type AppKernel,
  type ReaderDisplayPreferences,
  type ReaderMode,
  type ReaderTheme,
  type ReadingCenterPreferences,
  type SettingsItem,
  type SettingsPageModel,
  type SettingsSection,
} from "@minix/core";
import type { SettingsResponse } from "@minix/contracts";

function formatTheme(theme: ReaderTheme): string {
  if (theme === "sepia") {
    return "Sepia with lower glare";
  }

  if (theme === "night") {
    return "Night contrast for late sessions";
  }

  return "Paper with warm contrast";
}

function formatMode(mode: ReaderMode): string {
  if (mode === "page") {
    return "Page mode for focused chapter reading";
  }

  return "Scroll for browsing and archive movement";
}

function formatEligibleChannels(
  channels: SettingsResponse["effectivePolicy"]["notification"]["eligibleChannels"],
): string {
  if (channels.length === 0) {
    return "No remote channels eligible";
  }

  return channels
    .map((channel) => {
      if (channel === "in_app") {
        return "In-app";
      }

      if (channel === "subscription_message") {
        return "Subscription message";
      }

      return channel.toUpperCase();
    })
    .join(", ");
}

function formatNotificationChannelSummary(
  channels: SettingsResponse["notificationChannels"] | undefined,
  notificationsEnabled: boolean,
): string {
  if (!notificationsEnabled) {
    return "Global notifications disabled";
  }

  if (!channels || channels.length === 0) {
    return "In-app only";
  }

  const enabledChannels = channels.filter((channel) => channel.enabled && !channel.unsubscribed);
  if (enabledChannels.length === 0) {
    return "In-app fallback only";
  }

  return enabledChannels.map((channel) => channel.channel).join(", ");
}

function formatLockedSettingSummary(response: SettingsResponse): string {
  if (response.lockedSettingKeys.length === 0) {
    return "No locked shared settings";
  }

  return `${response.lockedSettingKeys.length} locked shared settings`;
}

function formatFontScale(fontScale: number): string {
  return `Comfort size at ${Math.round(fontScale * 100)}%`;
}

function formatNightModeDefault(value: ReaderDisplayPreferences["nightModeDefault"]): string {
  if (value === "always-night") {
    return "Always enter the reader in night contrast, regardless of the stored base theme";
  }

  if (value === "after-dusk") {
    return "Automatically push the reader into night contrast after dusk while keeping the base theme stored";
  }

  return "Keep night mode manual so the stored reader theme stays in charge";
}

function formatResumeMode(value: ReadingCenterPreferences["resume"]): string {
  if (value === "toc-first") {
    return "Reopen the directory first so the next reading choice stays visible before entering a chapter";
  }

  return value === "detail-first"
    ? "Open the title dossier first, then restore the chapter from there"
    : "Always reopen the latest saved chapter before showing the title dossier";
}

function formatShelfOrder(value: ReadingCenterPreferences["shelfOrder"]): string {
  if (value === "updates") {
    return "Fresh chapter updates first, then active reading, then completed runs";
  }

  if (value === "pinned") {
    return "Pinned titles first, then recent reading, then completed runs";
  }

  return "Recent reading first, then active updates, then completed titles";
}

function formatDigestMode(value: ReadingCenterPreferences["digest"]): string {
  if (value === "weekend") {
    return "Bundle release notes into a slower weekend digest for backlog catch-up";
  }

  if (value === "important") {
    return "Important release alerts only when a followed title moves";
  }

  if (value === "paused") {
    return "Digest paused so the reading center stays quiet between sessions";
  }

  return "Quiet weekly recap for followed stories every Friday";
}

function formatSyncMode(value: ReadingCenterPreferences["sync"]): string {
  return value === "device-first"
    ? "Keep progress on this device first, then reconcile later across hosts"
    : "Reading progress and shelf state stay aligned across novel hosts";
}

function formatReminderMode(value: ReadingCenterPreferences["reminders"]): string {
  if (value === "chapter-moves") {
    return "Only alert when an active title you touched receives a meaningful chapter move";
  }

  if (value === "paused") {
    return "Pause reminder prompts so the reading center stays silent between sessions";
  }

  return "Send a quiet nightly reminder when an active reading session is still open";
}

function cloneModel(model: SettingsPageModel): SettingsPageModel {
  return {
    ...model,
    ...(model.subtitle ? { subtitle: model.subtitle } : {}),
    ...(model.preferences ? { preferences: cloneStateSnapshot(model.preferences) } : {}),
    ...(model.featureToggles ? { featureToggles: cloneStateSnapshot(model.featureToggles) } : {}),
    ...(model.privacyOptions ? { privacyOptions: cloneStateSnapshot(model.privacyOptions) } : {}),
    ...(model.effectivePolicy ? { effectivePolicy: cloneStateSnapshot(model.effectivePolicy) } : {}),
    ...(model.policySummary ? { policySummary: cloneStateSnapshot(model.policySummary) } : {}),
    ...(model.notificationChannels ? { notificationChannels: cloneStateSnapshot(model.notificationChannels) } : {}),
    ...(model.notificationPresets ? { notificationPresets: cloneStateSnapshot(model.notificationPresets) } : {}),
    ...(model.lockedSettingKeys ? { lockedSettingKeys: [...model.lockedSettingKeys] } : {}),
    sections: cloneStateSnapshotArray(model.sections),
  };
}

function createTextItem(key: string, label: string, value: string | boolean): SettingsItem {
  return {
    key,
    label,
    type: typeof value === "boolean" ? "switch" : "text",
    value,
  };
}

export function updateSectionItemValue(
  model: SettingsPageModel,
  sectionKey: string,
  itemKey: string,
  value: string | boolean,
): SettingsPageModel {
  const nextModel = cloneModel(model);
  nextModel.sections = nextModel.sections.map((section) =>
    section.key !== sectionKey
      ? section
      : {
          ...section,
          items: section.items.map((item) =>
            item.key === itemKey
              ? {
                  ...item,
                  type: typeof value === "boolean" ? "switch" : item.type,
                  value,
                }
              : item,
          ),
        },
  );
  return nextModel;
}

function createSettingsSections(response: SettingsResponse): SettingsSection[] {
  const policySummary = response.policySummary ?? {
    presetSummary: response.effectivePolicy.notification.presetLabel ?? "Not classified",
    lockedSettingsSummary: formatLockedSettingSummary(response),
    channelDefaultSummary: formatNotificationChannelSummary(
      response.notificationChannels,
      response.preferences.notificationsEnabled,
    ),
    privacySummary: response.effectivePolicy.privacy.policySourceSummary ?? "Privacy policy resolves from shared settings.",
    deviceSummary: response.effectivePolicy.device.weakNetworkSummary ?? "Device policy resolves from shared settings.",
    developerSummary: response.effectivePolicy.developer.policySourceSummary ?? "Developer policy resolves from shared settings.",
  };
  return [
    {
      key: "settings-summary",
      title: "Shared settings summary",
      items: [
        createTextItem("summary-language", "Language profile", response.preferences.language),
        createTextItem("summary-notification-posture", "Notification posture", formatNotificationChannelSummary(
          response.notificationChannels,
          response.preferences.notificationsEnabled,
        )),
        createTextItem("summary-privacy-posture", "Privacy posture", response.privacyOptions.profileVisibilityLabel),
        createTextItem(
          "summary-developer-posture",
          "Developer posture",
          response.effectivePolicy.developer.lockedReason ??
            (response.effectivePolicy.developer.environment === "production"
              ? "Locked in production"
              : "Editable in debug"),
        ),
        createTextItem("summary-locked-settings", "Locked settings", formatLockedSettingSummary(response)),
        createTextItem(
          "summary-policy-source",
          "Policy source",
          response.effectivePolicy.developer.policySourceSummary ??
            response.effectivePolicy.notification.policySourceSummary ??
            "Shared policy summary",
        ),
      ],
    },
    {
      key: "policy-summary",
      title: "Policy summary",
      items: [
        createTextItem("policy-summary-preset", "Preset", policySummary.presetSummary),
        createTextItem("policy-summary-locked", "Locked settings", policySummary.lockedSettingsSummary),
        createTextItem("policy-summary-channel-defaults", "Channel defaults", policySummary.channelDefaultSummary),
        createTextItem("policy-summary-privacy", "Privacy", policySummary.privacySummary),
        createTextItem("policy-summary-device", "Device", policySummary.deviceSummary),
        createTextItem("policy-summary-developer", "Developer", policySummary.developerSummary),
      ],
    },
    {
      key: "common-preferences",
      title: "Common preferences",
      items: [
        createTextItem("language", "Language", response.preferences.language),
        createTextItem("theme-mode", "Theme", response.preferences.theme),
        createTextItem("font-size", "Font size", response.preferences.fontScale),
        createTextItem("notifications", "Notifications", response.preferences.notificationsEnabled),
      ],
    },
    {
      key: "device-settings",
      title: "Device",
      items: [
        createTextItem("cache-label", "Cache", response.preferences.device.cacheLabel),
        createTextItem("network-strategy", "Network strategy", response.preferences.device.networkStrategy),
        createTextItem("autoplay", "Autoplay", response.preferences.device.autoplay),
        createTextItem("weak-network-mode", "Weak-network mode", response.preferences.device.weakNetworkMode),
      ],
    },
    {
      key: "account-controls",
      title: "Account controls",
      items: [
        createTextItem("profile-entry", "Profile", response.preferences.account.profileEntryLabel),
        createTextItem("phone-entry", "Phone", response.preferences.account.phoneEntryLabel),
        createTextItem("unbind-entry", "Binding", response.preferences.account.unbindEntryLabel),
        createTextItem("provider-entry", "Providers", response.preferences.account.providerEntryLabel),
        createTextItem("cancellation-entry", "Cancellation", response.preferences.account.cancellationEntryLabel),
      ],
    },
    {
      key: "content-preferences",
      title: "Content preferences",
      items: [
        createTextItem("sort-order", "Sort order", response.preferences.content.sortOrder),
        createTextItem("filter-mode", "Filter mode", response.preferences.content.filterMode),
        createTextItem("reading-mode", "Reading mode", response.preferences.content.readingMode),
        createTextItem("history-enabled", "History", response.preferences.content.historyEnabled),
      ],
    },
    {
      key: "privacy-options",
      title: "Privacy",
      items: [
        createTextItem("profile-visibility", "Profile visibility", response.privacyOptions.profileVisibilityLabel),
        createTextItem("personalized-recommendations", "Personalized recommendations", response.privacyOptions.personalizedRecommendations),
        createTextItem("search-history", "Search history", response.privacyOptions.searchHistoryEnabled),
        createTextItem("analytics", "Analytics", response.privacyOptions.analyticsEnabled),
        createTextItem("screenshot-feedback", "Screenshot feedback", response.privacyOptions.screenshotFeedbackEnabled),
      ],
    },
    {
      key: "effective-policy",
      title: "Effective policy",
      items: [
        createTextItem("policy-in-app", "In-app enabled", response.effectivePolicy.notification.inAppEnabled),
        createTextItem(
          "policy-subscription-message",
          "Subscription messages enabled",
          response.effectivePolicy.notification.subscriptionMessageEnabled,
        ),
        createTextItem("policy-push", "Push enabled", response.effectivePolicy.notification.pushEnabled),
        createTextItem("policy-sms", "SMS enabled", response.effectivePolicy.notification.smsEnabled),
        createTextItem("policy-email", "Email enabled", response.effectivePolicy.notification.emailEnabled),
        createTextItem("eligible-channels", "Eligible channels", formatEligibleChannels(response.effectivePolicy.notification.eligibleChannels)),
        createTextItem("notification-preset", "Notification preset", response.effectivePolicy.notification.presetLabel ?? "Not classified"),
        createTextItem("notification-policy-source", "Notification policy source", response.effectivePolicy.notification.policySourceSummary ?? "No policy-source summary"),
        createTextItem("station-fallback", "Station fallback", response.effectivePolicy.notification.stationFallbackEnabled ?? false),
        createTextItem("policy-profile-visibility", "Resolved profile visibility", response.effectivePolicy.privacy.profileVisibility),
        createTextItem("profile-search-visible", "Profile search visible", response.effectivePolicy.privacy.profileSearchVisible),
        createTextItem("relation-search-visible", "Relation search visible", response.effectivePolicy.privacy.relationSearchVisible),
        createTextItem("personalized-ranking", "Personalized ranking", response.effectivePolicy.privacy.personalizedRankingEnabled),
        createTextItem("analytics-collection", "Analytics collection", response.effectivePolicy.privacy.analyticsCollectionEnabled),
        createTextItem("privacy-policy-source", "Privacy policy source", response.effectivePolicy.privacy.policySourceSummary ?? "No privacy policy-source summary"),
        createTextItem("policy-autoplay", "Autoplay enabled", response.effectivePolicy.device.autoplayEnabled),
        createTextItem("policy-weak-network-mode", "Weak-network mode", response.effectivePolicy.device.weakNetworkMode),
        createTextItem("policy-network-strategy", "Resolved network strategy", response.effectivePolicy.device.networkStrategy),
        createTextItem("upload-chunk-size", "Upload chunk size", `${response.effectivePolicy.device.uploadChunkSizeBytes} bytes`),
        createTextItem("diagnostics-enabled", "Diagnostics enabled", response.effectivePolicy.device.diagnosticsEnabled),
        createTextItem("autoplay-summary", "Autoplay summary", response.effectivePolicy.device.autoplaySummary ?? "No autoplay summary"),
        createTextItem("weak-network-summary", "Weak-network summary", response.effectivePolicy.device.weakNetworkSummary ?? "No weak-network summary"),
        createTextItem("diagnostics-summary", "Diagnostics summary", response.effectivePolicy.device.diagnosticsSummary ?? "No diagnostics summary"),
        createTextItem("device-policy-source", "Device policy source", response.effectivePolicy.device.policySourceSummary ?? "No device policy-source summary"),
        createTextItem("developer-environment", "Environment", response.effectivePolicy.developer.environment),
        createTextItem("logs-editable", "Logs editable", response.effectivePolicy.developer.logsEditable),
        createTextItem("experiments-editable", "Experiments editable", response.effectivePolicy.developer.experimentsEditable),
        createTextItem("policy-logs-enabled", "Logs enabled", response.effectivePolicy.developer.logsEnabled),
        createTextItem("policy-experiments-enabled", "Experiments enabled", response.effectivePolicy.developer.experimentsEnabled),
        createTextItem("developer-exposure-summary", "Developer exposure", response.effectivePolicy.developer.exposureSummary ?? "No developer exposure summary"),
        createTextItem("developer-policy-source", "Developer policy source", response.effectivePolicy.developer.policySourceSummary ?? "No developer policy-source summary"),
        ...(response.effectivePolicy.developer.lockedReason
          ? [createTextItem("developer-lock-reason", "Developer lock reason", response.effectivePolicy.developer.lockedReason)]
          : []),
      ],
    },
    {
      key: "debug-settings",
      title: "Debug",
      items: [
        createTextItem("logs-enabled", "Logs", response.preferences.developerOptions.logsEnabled),
        createTextItem("experiments-enabled", "Experiments", response.preferences.developerOptions.experimentsEnabled),
      ],
    },
    {
      key: "feature-toggles",
      title: "Feature toggles",
      items: [
        createTextItem("push-enabled", "Push", response.featureToggles.pushEnabled),
        createTextItem("sms-enabled", "SMS", response.featureToggles.smsEnabled),
        createTextItem("email-enabled", "Email", response.featureToggles.emailEnabled),
        createTextItem("account-center-enabled", "Account center", response.featureToggles.accountCenterEnabled),
        createTextItem("reading-sync-enabled", "Reading sync", response.featureToggles.readingSyncEnabled),
        createTextItem("feature-experiments-enabled", "Experiments feature", response.featureToggles.experimentsEnabled),
      ],
    },
    ...(response.lockedSettingKeys.length > 0
      ? [
          {
            key: "locked-settings",
            title: "Locked settings",
            items: response.lockedSettingKeys.map((settingKey) =>
              createTextItem(`locked-${settingKey}`, settingKey, "Locked by effective policy"),
            ),
          } satisfies SettingsSection,
        ]
      : []),
    ...(response.notificationChannels && response.notificationChannels.length > 0
      ? [
          {
            key: "notification-channels",
            title: "Notification channels",
            items: response.notificationChannels.flatMap((channel) => [
              createTextItem(`channel-${channel.channel}-enabled`, channel.channel, channel.enabled),
              createTextItem(`channel-${channel.channel}-status`, `${channel.providerLabel}`, channel.statusLabel),
              ...(channel.unsubscribable
                ? [createTextItem(`channel-${channel.channel}-unsubscribed`, `${channel.channel} unsubscribe`, channel.unsubscribed)]
                : []),
            ]),
          } satisfies SettingsSection,
        ]
      : []),
    ...(response.notificationPresets && response.notificationPresets.length > 0
      ? [
          {
            key: "notification-presets",
            title: "Notification presets",
            items: response.notificationPresets.flatMap((preset) => [
              createTextItem(`preset-${preset.presetKey}-active`, preset.label, preset.active),
              createTextItem(`preset-${preset.presetKey}-description`, `${preset.label} summary`, preset.description),
              createTextItem(`preset-${preset.presetKey}-domains`, `${preset.label} domains`, preset.domains.join(", ")),
            ]),
          } satisfies SettingsSection,
        ]
      : []),
  ];
}

function mergeSectionItems(baseItems: SettingsItem[], nextItems: SettingsItem[]): SettingsItem[] {
  const merged = cloneStateSnapshotArray(baseItems);

  for (const nextItem of nextItems) {
    const existingIndex = merged.findIndex((item) => item.key === nextItem.key);
    if (existingIndex === -1) {
      merged.push(cloneStateSnapshot(nextItem));
      continue;
    }

    merged[existingIndex] = cloneStateSnapshot({ ...merged[existingIndex], ...nextItem });
  }

  return merged;
}

export function applyRemoteSettings(model: SettingsPageModel, response: SettingsResponse, env: AppKernel["env"]): SettingsPageModel {
  const nextModel = cloneModel(model);
  const remoteSections = createSettingsSections(response);
  const sections = [...nextModel.sections];

  for (const remoteSection of remoteSections) {
    const existingIndex = sections.findIndex((section) => section.key === remoteSection.key);
    if (existingIndex === -1) {
      sections.push(remoteSection);
      continue;
    }

    sections[existingIndex] = {
      ...sections[existingIndex],
      ...remoteSection,
      items: mergeSectionItems(sections[existingIndex]?.items ?? [], remoteSection.items),
    };
  }

  const debugSectionIndex = sections.findIndex((section) => section.key === "debug-settings");
  const runtimeDebugItems = [
    createTextItem("environment-label", "Environment", env.debug ? "debug" : "production"),
    createTextItem("version", "Version", env.version),
  ];
  if (debugSectionIndex === -1) {
    sections.push({
      key: "debug-settings",
      title: "Debug",
      items: runtimeDebugItems,
    });
  } else {
    const debugSection = sections[debugSectionIndex];
    if (debugSection) {
      sections[debugSectionIndex] = {
        key: debugSection.key,
        ...(debugSection.title ? { title: debugSection.title } : {}),
        items: mergeSectionItems(debugSection.items, runtimeDebugItems),
      };
    }
  }

  return {
    ...nextModel,
    subtitle: "Normalized settings domain with local reading preferences layered on top.",
    sections,
    preferences: response.preferences,
    featureToggles: response.featureToggles,
    privacyOptions: response.privacyOptions,
    effectivePolicy: response.effectivePolicy,
    policySummary: response.policySummary ?? {
      presetSummary: response.effectivePolicy.notification.presetLabel ?? "Not classified",
      lockedSettingsSummary: formatLockedSettingSummary(response),
      channelDefaultSummary: formatNotificationChannelSummary(
        response.notificationChannels,
        response.preferences.notificationsEnabled,
      ),
      privacySummary: response.effectivePolicy.privacy.policySourceSummary ?? "Privacy policy resolves from shared settings.",
      deviceSummary: response.effectivePolicy.device.weakNetworkSummary ?? "Device policy resolves from shared settings.",
      developerSummary: response.effectivePolicy.developer.policySourceSummary ?? "Developer policy resolves from shared settings.",
    },
    ...(response.notificationChannels ? { notificationChannels: response.notificationChannels } : {}),
    ...(response.notificationPresets ? { notificationPresets: response.notificationPresets } : {}),
    lockedSettingKeys: [...response.lockedSettingKeys],
  };
}

export function applyDisplayPreferences(
  model: SettingsPageModel,
  preferences: ReaderDisplayPreferences,
): SettingsPageModel {
  const nextModel = cloneModel(model);

  nextModel.sections = nextModel.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.key === "theme") {
        return cloneStateSnapshot({ ...item, value: formatTheme(preferences.theme) });
      }

      if (item.key === "mode") {
        return cloneStateSnapshot({ ...item, value: formatMode(preferences.mode) });
      }

      if (item.key === "font-scale") {
        return cloneStateSnapshot({ ...item, value: formatFontScale(preferences.fontScale) });
      }

      if (item.key === "night-mode-default") {
        return cloneStateSnapshot({ ...item, value: formatNightModeDefault(preferences.nightModeDefault) });
      }

      return item;
    }),
  }));

  return nextModel;
}

export function applyReadingCenterPreferences(
  model: SettingsPageModel,
  preferences: ReadingCenterPreferences,
): SettingsPageModel {
  const nextModel = cloneModel(model);

  nextModel.sections = nextModel.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.key === "resume") {
        return cloneStateSnapshot({ ...item, value: formatResumeMode(preferences.resume) });
      }

      if (item.key === "shelf-order") {
        return cloneStateSnapshot({ ...item, value: formatShelfOrder(preferences.shelfOrder) });
      }

      if (item.key === "digest") {
        return cloneStateSnapshot({ ...item, value: formatDigestMode(preferences.digest) });
      }

      if (item.key === "sync") {
        return cloneStateSnapshot({ ...item, value: formatSyncMode(preferences.sync) });
      }

      if (item.key === "reminders") {
        return cloneStateSnapshot({ ...item, value: formatReminderMode(preferences.reminders) });
      }

      return item;
    }),
  }));

  return nextModel;
}

