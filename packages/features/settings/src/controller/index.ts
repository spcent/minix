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
  type UserSession,
} from "@minix/core";
import { type AppRouteId } from "@minix/contracts";

export interface CreateSettingsControllerOptions {
  kernel: AppKernel;
  loginRouteId: AppRouteId;
  itemsRouteId?: AppRouteId;
  overviewRouteId?: AppRouteId;
  readerRouteId?: AppRouteId;
  authRedirectSource?: "preferences";
  model: SettingsPageModel;
  displaySettingsStorageKey?: string;
  readingCenterStorageKey?: string;
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
    sections: model.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
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
        return { ...item, value: formatTheme(preferences.theme) };
      }

      if (item.key === "mode") {
        return { ...item, value: formatMode(preferences.mode) };
      }

      if (item.key === "font-scale") {
        return { ...item, value: formatFontScale(preferences.fontScale) };
      }

      if (item.key === "night-mode-default") {
        return { ...item, value: formatNightModeDefault(preferences.nightModeDefault) };
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
        return { ...item, value: formatResumeMode(preferences.resume) };
      }

      if (item.key === "shelf-order") {
        return { ...item, value: formatShelfOrder(preferences.shelfOrder) };
      }

      if (item.key === "digest") {
        return { ...item, value: formatDigestMode(preferences.digest) };
      }

      if (item.key === "sync") {
        return { ...item, value: formatSyncMode(preferences.sync) };
      }

      if (item.key === "reminders") {
        return { ...item, value: formatReminderMode(preferences.reminders) };
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
    readerRouteId,
    authRedirectSource,
    model,
    displaySettingsStorageKey = READER_DISPLAY_STORAGE_KEY,
    readingCenterStorageKey = READING_CENTER_STORAGE_KEY,
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

        return kernel.router.replaceRoute(
          loginRouteId,
          authRedirectSource ? { from: authRedirectSource, reason: "auth-required" } : undefined,
        );
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
