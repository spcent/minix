import {
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  ok,
  createStore,
  createAuthRedirectParams,
  READER_DISPLAY_STORAGE_KEY,
  READING_CENTER_STORAGE_KEY,
  type AppKernel,
  type ModalOptions,
  type ReaderDisplayPreferences,
  type ReaderMode,
  type ReaderTheme,
  type ReadingCenterPreferences,
  type SettingsItem,
  type SettingsPageModel,
  type SettingsSection,
  type ToastOptions,
  type UserSession,
} from "@minix/core";
import {
  SETTINGS_NETWORK_STRATEGIES,
  SETTINGS_PROFILE_VISIBILITIES,
  type AppRouteId,
  type SettingsResponse,
  type UpdateSettingsRequest,
} from "@minix/contracts";

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

function hasActiveSession(session: UserSession | null | undefined): boolean {
  if (!session?.loggedIn || !session.token?.accessToken) {
    return false;
  }

  if (session.token.expiresAt === undefined) {
    return true;
  }

  return session.token.expiresAt > Date.now();
}

function canRefreshSession(session: UserSession | null | undefined): session is UserSession {
  return Boolean(session?.loggedIn && session.token?.refreshToken);
}

function shouldClearAfterRefreshFailure(code: string): boolean {
  return code === "TOKEN_EXPIRED" || code === "UNAUTHORIZED" || code === "FORBIDDEN";
}

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

function updateSectionItemValue(
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

function applyRemoteSettings(model: SettingsPageModel, response: SettingsResponse, env: AppKernel["env"]): SettingsPageModel {
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

function applyDisplayPreferences(
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

function applyReadingCenterPreferences(
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
    return persistRemoteSettings({
      preferences: {
        notificationsEnabled: nextValue,
      },
    });
  }

  function setDevicePreference<T extends keyof NonNullable<NonNullable<UpdateSettingsRequest["preferences"]>["device"]>>(
    key: T,
    itemKey: string,
    value: NonNullable<NonNullable<UpdateSettingsRequest["preferences"]>["device"]>[T],
  ) {
    void itemKey;
    return persistRemoteSettings({
      preferences: {
        device: {
          [key]: value,
        },
      },
    });
  }

  function setPrivacyPreference<T extends keyof NonNullable<UpdateSettingsRequest["privacyOptions"]>>(
    key: T,
    itemKey: string,
    value: NonNullable<UpdateSettingsRequest["privacyOptions"]>[T],
  ) {
    void itemKey;
    return persistRemoteSettings({
      privacyOptions: {
        [key]: value,
      },
    });
  }

  function setDeveloperPreference<T extends keyof NonNullable<NonNullable<UpdateSettingsRequest["preferences"]>["developerOptions"]>>(
    key: T,
    itemKey: string,
    value: NonNullable<NonNullable<UpdateSettingsRequest["preferences"]>["developerOptions"]>[T],
  ) {
    void itemKey;
    return persistRemoteSettings({
      preferences: {
        developerOptions: {
          [key]: value,
        },
      },
    });
  }

  async function routeToOptional(routeId?: AppRouteId, params?: Record<string, string | number | boolean>) {
    if (!routeId) {
      return ok(undefined);
    }

    return kernel.router.toRoute(routeId, params);
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
      const result = await kernel.session.get();
      if (!result.ok) {
        return result;
      }

      if (!hasActiveSession(result.value)) {
        if (canRefreshSession(result.value) && kernel.auth.refreshSession) {
          const refreshed = await kernel.auth.refreshSession(result.value);
          if (refreshed.ok) {
            const remoteSettings = await hydrateRemoteSettings();
            if (!remoteSettings.ok) {
              if (remoteSettings.error.code === "UNAUTHORIZED") {
                const current = kernel.router.current();
                return kernel.router.replaceRoute(
                  loginRouteId,
                  createAuthRedirectParams({
                    ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
                    ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
                    ...(authRedirectSource ? { source: authRedirectSource } : {}),
                    reason: "auth-required",
                  }),
                );
              }

              return remoteSettings;
            }

            await hydrateDisplayPreferences();
            await hydrateReadingCenterPreferences();
            return ok(undefined);
          }

          if (shouldClearAfterRefreshFailure(refreshed.error.code)) {
            await kernel.session.clear();
          } else {
            return refreshed;
          }
        } else if (result.value) {
          await kernel.session.clear();
        }

        const current = kernel.router.current();
        return kernel.router.replaceRoute(
          loginRouteId,
          createAuthRedirectParams({
            ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
            ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
            ...(authRedirectSource ? { source: authRedirectSource } : {}),
            reason: "auth-required",
          }),
        );
      }

      const remoteSettings = await hydrateRemoteSettings();
      if (!remoteSettings.ok) {
        if (remoteSettings.error.code === "UNAUTHORIZED") {
          const current = kernel.router.current();
          return kernel.router.replaceRoute(
            loginRouteId,
            createAuthRedirectParams({
              ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
              ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
              ...(authRedirectSource ? { source: authRedirectSource } : {}),
              reason: "auth-required",
            }),
          );
        }

        return remoteSettings;
      }

      await hydrateDisplayPreferences();
      await hydrateReadingCenterPreferences();
      return ok(undefined);
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
