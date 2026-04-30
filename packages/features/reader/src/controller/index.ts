import {
  createControllerRouterHelpers,
  createSingleFlightHydrator,
  ok,
  createStore,
  LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
  LATEST_READING_MILESTONE_STORAGE_KEY,
  READER_DISPLAY_STORAGE_KEY,
  type AppKernel,
  type ReaderDisplayPreferences,
  type Result,
} from "@minix/core";
import {
  type AppRouteId,
  type ChapterListResponse,
  type ChapterContent,
  type LoadReadingProgressResponse,
  type SaveReadingProgressRequest,
} from "@minix/contracts";

import {
  createInitialReaderState,
  type ReaderState,
} from "../model";
import { resolveAccessState } from "./access-presentation";
import {
  applyDisplayPreferences,
  applyNightModeDefault,
  createDisplayPreferences,
  READER_MODES,
  READER_THEMES,
} from "./display-preferences";
import {
  createProgramMilestoneCopy,
  createProgramMilestoneMeta,
  createProgramMilestoneTitle,
  persistLatestReadingMilestone,
} from "./milestone-flow";
import {
  DEFAULT_READER_SESSION_STORAGE_KEY,
  refreshReaderSession,
  restoreOrCreateReaderSession,
} from "./reading-session";
import {
  cloneInitialReaderState,
  createActiveProgramSummary,
  createBacklogReentryLabel,
  createCompletionMessage,
  createCompletionSummaryCopy,
  createCompletionSummaryMeta,
  createCompletionSummaryTitle,
  createNextStepLabel,
  createReadingStateLabel,
  createVolumeHandoffLabel,
  createVolumeProgressLabel,
  deriveReadChapterIds,
  deriveVolumeProgramSnapshot,
  findChapterSummary,
  formatSaveStatusLabel,
} from "./projection";

export interface CreateReaderControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  readerRouteId: AppRouteId;
  novelDetailRouteId: AppRouteId;
  tocRouteId: AppRouteId;
  bookshelfRouteId?: AppRouteId;
  membershipRouteId?: AppRouteId;
  chapterRequestPath?: string;
  chapterListRequestPath?: string;
  progressRequestPath?: string;
  displaySettingsStorageKey?: string;
  sessionStorageKey?: string;
  latestMilestoneStorageKey?: string;
  latestMilestoneHistoryStorageKey?: string;
  now?: () => Date;
  initialState?: Partial<ReaderState>;
}

export function createReaderController(options: CreateReaderControllerOptions) {
  const {
    kernel,
    loginRouteId,
    readerRouteId,
    novelDetailRouteId,
    tocRouteId,
    bookshelfRouteId,
    membershipRouteId,
    chapterRequestPath = "/chapters/content",
    chapterListRequestPath = "/chapters",
    progressRequestPath = "/reading-progress",
    displaySettingsStorageKey = READER_DISPLAY_STORAGE_KEY,
    sessionStorageKey = DEFAULT_READER_SESSION_STORAGE_KEY,
    latestMilestoneStorageKey = LATEST_READING_MILESTONE_STORAGE_KEY,
    latestMilestoneHistoryStorageKey = LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
    now = () => new Date(),
    initialState,
  } = options;
  const store = createStore<ReaderState>({
    ...cloneInitialReaderState(createInitialReaderState()),
    ...initialState,
  });
  const { routeToLogin } = createControllerRouterHelpers({
    kernel,
    loginRouteId,
  });

  function resolveRouteValue(key: "novelId" | "chapterId"): string | undefined {
    const current = kernel.router.current();
    const routeValue = current.ok ? current.value?.params?.[key] : undefined;
    if (typeof routeValue === "string") {
      return routeValue;
    }

    return store.getState()[key];
  }

  function resolveRouteParam(key: string): string | undefined {
    const current = kernel.router.current();
    const routeValue = current.ok ? current.value?.params?.[key] : undefined;
    return typeof routeValue === "string" ? routeValue : undefined;
  }

  async function persistDisplayPreferences() {
    const current = store.getState();
    return kernel.storage.set(displaySettingsStorageKey, createDisplayPreferences(current));
  }

  const hydrateDisplayPreferences = createSingleFlightHydrator<void>(
    async (): Promise<Result<void>> => {
      const current = store.getState();
      const result = await kernel.storage.get<ReaderDisplayPreferences>(displaySettingsStorageKey);
      if (!result.ok) {
        return result;
      }

      store.setState(applyNightModeDefault(applyDisplayPreferences(current, result.value), now()));
      return ok(undefined);
    },
  );

  async function updateDisplayPreferences(
    nextState: Pick<ReaderState, "theme" | "mode" | "fontScale" | "nightModeDefault">,
  ): Promise<Result<void>> {
    const current = store.getState();
    store.setState({
      ...nextState,
      errorText: undefined,
    });

    const result = await persistDisplayPreferences();
    if (!result.ok) {
      store.setState({
        ...applyDisplayPreferences(current, null),
        errorText: result.error.message,
      });
      return result;
    }

    return ok(undefined);
  }

  async function refreshReadingSession(chapterIdOverride?: string) {
    const sessionPatch = await refreshReaderSession({
      kernel,
      sessionStorageKey,
      now,
      state: store.getState(),
      ...(chapterIdOverride ? { chapterIdOverride } : {}),
    });
    if (sessionPatch) {
      store.setState(sessionPatch);
    }
  }

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    async hydrateDisplayPreferences() {
      return hydrateDisplayPreferences();
    },

    setProgress(progressPercent: number) {
      const next = Math.max(0, Math.min(1, progressPercent));
      store.setState({
        progressPercent: next,
        chapterCompletionState: next >= 1 ? "completed" : "reading",
        chapterCompletionMessage: next >= 1 ? createCompletionMessage(store.getState().nextChapterTitle) : undefined,
        activeProgramSummary: createActiveProgramSummary(
          store.getState().currentVolumeTitle,
          store.getState().nextChapterTitle,
          next >= 1 ? "completed" : "reading",
          store.getState().nextVolumeTitle,
          store.getState().nextChapterStartsNextVolume,
        ),
        volumeHandoffLabel: createVolumeHandoffLabel(
          store.getState().currentVolumeTitle,
          store.getState().nextVolumeTitle,
          next >= 1 ? "completed" : "reading",
          store.getState().nextChapterStartsNextVolume,
          store.getState().currentVolumeReadCount,
          store.getState().currentVolumeChapterCount,
        ),
        backlogReentryLabel: createBacklogReentryLabel(
          next >= 1 ? "completed" : "reading",
          store.getState().currentVolumeTitle,
          store.getState().nextVolumeTitle,
          store.getState().currentVolumeReadCount,
          store.getState().currentVolumeChapterCount,
        ),
        programMilestoneTitle: store.getState().programMilestoneTitle,
        programMilestoneCopy: store.getState().programMilestoneCopy,
        programMilestoneMeta: store.getState().programMilestoneMeta,
        completionSummaryTitle:
          next >= 1 ? createCompletionSummaryTitle("completed", store.getState().chapter?.title, store.getState().nextChapterTitle) : undefined,
        completionSummaryCopy:
          next >= 1
            ? createCompletionSummaryCopy(
                "completed",
                store.getState().nextChapterTitle,
                store.getState().sessionElapsedLabel,
                store.getState().saveStatusLabel,
              )
            : undefined,
        completionSummaryMeta:
          next >= 1
            ? createCompletionSummaryMeta(
                "completed",
                store.getState().readChapterIds,
                store.getState().totalChapters,
                store.getState().currentVolumeTitle,
              )
            : undefined,
      });
    },

    async cycleTheme() {
      const current = store.getState();
      const currentIndex = READER_THEMES.indexOf(current.theme);
      const nextTheme = READER_THEMES[(currentIndex + 1) % READER_THEMES.length] ?? "paper";
      return updateDisplayPreferences({
        theme: nextTheme,
        mode: current.mode,
        fontScale: current.fontScale,
        nightModeDefault: current.nightModeDefault,
      });
    },

    async cycleMode() {
      const current = store.getState();
      const currentIndex = READER_MODES.indexOf(current.mode);
      const nextMode = READER_MODES[(currentIndex + 1) % READER_MODES.length] ?? "scroll";
      return updateDisplayPreferences({
        theme: current.theme,
        mode: nextMode,
        fontScale: current.fontScale,
        nightModeDefault: current.nightModeDefault,
      });
    },

    async increaseFontScale() {
      const current = store.getState();
      return updateDisplayPreferences({
        theme: current.theme,
        mode: current.mode,
        fontScale: Math.min(1.5, Number((current.fontScale + 0.1).toFixed(2))),
        nightModeDefault: current.nightModeDefault,
      });
    },

    async decreaseFontScale() {
      const current = store.getState();
      return updateDisplayPreferences({
        theme: current.theme,
        mode: current.mode,
        fontScale: Math.max(0.8, Number((current.fontScale - 0.1).toFixed(2))),
        nightModeDefault: current.nightModeDefault,
      });
    },

    async saveProgress(progressPercent?: number) {
      const current = store.getState();
      const novelId = resolveRouteValue("novelId");
      const chapterId = resolveRouteValue("chapterId");
      if (!novelId || !chapterId) {
        return ok(undefined);
      }

      const payload: SaveReadingProgressRequest = {
        novelId,
        chapterId,
        progressPercent: progressPercent ?? current.progressPercent,
      };

      store.setState({
        savingProgress: true,
      });

      const result = await kernel.request.post<{ saved: true; progress: SaveReadingProgressRequest & { updatedAt: string } }>(
        progressRequestPath,
        payload,
      );

      if (!result.ok) {
        store.setState({
          savingProgress: false,
          errorText: result.error.message,
        });

        if (result.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return result;
      }

      store.setState({
        savingProgress: false,
        progressPercent: result.value.progress.progressPercent,
        lastSavedAt: result.value.progress.updatedAt,
        saveStatusLabel: formatSaveStatusLabel(result.value.progress.updatedAt, now()),
        chapterCompletionState: result.value.progress.progressPercent >= 1 ? "completed" : "reading",
        readingStateLabel: createReadingStateLabel(
          result.value.progress.progressPercent >= 1 ? "completed" : "reading",
          current.nextChapterTitle,
        ),
        chapterCompletionMessage:
          result.value.progress.progressPercent >= 1 ? createCompletionMessage(current.nextChapterTitle) : undefined,
        nextStepLabel: createNextStepLabel(
          current.nextChapterTitle,
          result.value.progress.progressPercent >= 1 ? "completed" : "reading",
        ),
        volumeProgressLabel: createVolumeProgressLabel(
          current.currentVolumeTitle,
          current.currentVolumeReadCount,
          current.currentVolumeChapterCount,
        ),
        activeProgramSummary: createActiveProgramSummary(
          current.currentVolumeTitle,
          current.nextChapterTitle,
          result.value.progress.progressPercent >= 1 ? "completed" : "reading",
          current.nextVolumeTitle,
          current.nextChapterStartsNextVolume,
        ),
        volumeHandoffLabel: createVolumeHandoffLabel(
          current.currentVolumeTitle,
          current.nextVolumeTitle,
          result.value.progress.progressPercent >= 1 ? "completed" : "reading",
          current.nextChapterStartsNextVolume,
          current.currentVolumeReadCount,
          current.currentVolumeChapterCount,
        ),
        backlogReentryLabel: createBacklogReentryLabel(
          result.value.progress.progressPercent >= 1 ? "completed" : "reading",
          current.currentVolumeTitle,
          current.nextVolumeTitle,
          current.currentVolumeReadCount,
          current.currentVolumeChapterCount,
        ),
        programMilestoneTitle: current.programMilestoneTitle,
        programMilestoneCopy: current.programMilestoneCopy,
        programMilestoneMeta: current.programMilestoneMeta,
        completionSummaryTitle:
          result.value.progress.progressPercent >= 1
            ? createCompletionSummaryTitle("completed", current.chapter?.title, current.nextChapterTitle)
            : undefined,
        completionSummaryCopy:
          result.value.progress.progressPercent >= 1
            ? createCompletionSummaryCopy(
                "completed",
                current.nextChapterTitle,
                current.sessionElapsedLabel,
                formatSaveStatusLabel(result.value.progress.updatedAt, now()),
              )
            : undefined,
        completionSummaryMeta:
          result.value.progress.progressPercent >= 1
            ? createCompletionSummaryMeta("completed", current.readChapterIds, current.totalChapters, current.currentVolumeTitle)
            : undefined,
        errorText: undefined,
      });
      await refreshReadingSession(chapterId);
      await persistLatestReadingMilestone({
        kernel,
        latestMilestoneStorageKey,
        latestMilestoneHistoryStorageKey,
        now,
        novelId,
        chapterId,
        title: store.getState().programMilestoneTitle ?? store.getState().completionSummaryTitle,
        copy: store.getState().programMilestoneCopy ?? store.getState().completionSummaryCopy,
        meta: store.getState().programMilestoneMeta ?? store.getState().completionSummaryMeta,
        type: store.getState().programMilestoneTitle ? "volume-complete" : "chapter-recap",
      });

      return result;
    },

    async completeChapter() {
      return this.saveProgress(1);
    },

    async load() {
      const shouldForceDisplayRefresh = resolveRouteParam("displaySync") === "1";
      await hydrateDisplayPreferences(shouldForceDisplayRefresh);
      const novelId = resolveRouteValue("novelId");
      const chapterId = resolveRouteValue("chapterId");
      if (!novelId || !chapterId) {
        store.setState({
          loading: false,
          errorText: "Reader location is missing.",
        });
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorText: undefined,
      });

      const [chapterResult, progressResult, chapterListResult] = await Promise.all([
        kernel.request.get<ChapterContent>(chapterRequestPath, { novelId, chapterId }),
        kernel.request.get<LoadReadingProgressResponse>(progressRequestPath, { novelId }),
        kernel.request.get<ChapterListResponse>(chapterListRequestPath, { novelId }),
      ]);

      if (!chapterResult.ok) {
        store.setState({
          loading: false,
          errorText: chapterResult.error.message,
        });

        if (chapterResult.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return chapterResult;
      }

      const progress = progressResult.ok ? progressResult.value.progress : null;
      const completionFromPreviousChapter = resolveRouteParam("completedFrom") === "1";
      const progressPercent =
        progress && progress.chapterId === chapterId
          ? progress.progressPercent
          : 0.08;
      const access = resolveAccessState(chapterResult.value);
      const chapterList = chapterListResult?.ok ? chapterListResult.value : null;
      const readChapterIds = chapterList ? deriveReadChapterIds(chapterList, chapterId) : [];
      const previousChapterTitle = chapterList ? findChapterSummary(chapterList, chapterResult.value.nav.previousChapterId)?.title : undefined;
      const nextChapterTitle = chapterList ? findChapterSummary(chapterList, chapterResult.value.nav.nextChapterId)?.title : undefined;
      const volumeProgram = deriveVolumeProgramSnapshot(
        chapterList,
        chapterId,
        chapterResult.value.nav.nextChapterId,
        readChapterIds,
      );
      const sessionState = await restoreOrCreateReaderSession({
        kernel,
        sessionStorageKey,
        now,
        novelId,
        chapterId,
        ...(progress?.updatedAt ? { fallbackStartedAt: progress.updatedAt } : {}),
      });
      const chapterCompletionState =
        progressPercent >= 1 ? "completed" : completionFromPreviousChapter ? "continued" : "reading";
      const currentTime = now();

      store.setState({
        ready: true,
        loading: false,
        novelId,
        chapterId,
        chapter: chapterResult.value,
        title: chapterResult.value.title,
        totalChapters: chapterList?.totalChapters ?? 0,
        currentVolumeTitle: volumeProgram.currentVolumeTitle,
        currentVolumeReadCount: volumeProgram.currentVolumeReadCount,
        currentVolumeChapterCount: volumeProgram.currentVolumeChapterCount,
        nextVolumeTitle: volumeProgram.nextVolumeTitle,
        nextChapterStartsNextVolume: volumeProgram.nextChapterStartsNextVolume,
        continueChapterId: chapterId,
        readChapterIds,
        previousChapterTitle,
        nextChapterTitle,
        volumeProgressLabel: createVolumeProgressLabel(
          volumeProgram.currentVolumeTitle,
          volumeProgram.currentVolumeReadCount,
          volumeProgram.currentVolumeChapterCount,
        ),
        progressPercent,
        lastSavedAt: progress?.updatedAt,
        saveStatusLabel: formatSaveStatusLabel(progress?.updatedAt, currentTime),
        ...sessionState,
        chapterCompletionState,
        readingStateLabel: createReadingStateLabel(chapterCompletionState, nextChapterTitle),
        chapterCompletionMessage:
          chapterCompletionState === "completed"
            ? createCompletionMessage(nextChapterTitle)
            : chapterCompletionState === "continued"
              ? createCompletionMessage(chapterResult.value.title, false)
              : undefined,
        nextStepLabel: createNextStepLabel(nextChapterTitle, chapterCompletionState),
        activeProgramSummary: createActiveProgramSummary(
          volumeProgram.currentVolumeTitle,
          nextChapterTitle,
          chapterCompletionState,
          volumeProgram.nextVolumeTitle,
          volumeProgram.nextChapterStartsNextVolume,
        ),
        volumeHandoffLabel: createVolumeHandoffLabel(
          volumeProgram.currentVolumeTitle,
          volumeProgram.nextVolumeTitle,
          chapterCompletionState,
          volumeProgram.nextChapterStartsNextVolume,
          volumeProgram.currentVolumeReadCount,
          volumeProgram.currentVolumeChapterCount,
        ),
        backlogReentryLabel: createBacklogReentryLabel(
          chapterCompletionState,
          volumeProgram.currentVolumeTitle,
          volumeProgram.nextVolumeTitle,
          volumeProgram.currentVolumeReadCount,
          volumeProgram.currentVolumeChapterCount,
        ),
        programMilestoneTitle: createProgramMilestoneTitle(chapterList, readChapterIds),
        programMilestoneCopy: createProgramMilestoneCopy(chapterList, readChapterIds),
        programMilestoneMeta: createProgramMilestoneMeta(chapterList, readChapterIds),
        completionSummaryTitle: createCompletionSummaryTitle(chapterCompletionState, chapterResult.value.title, nextChapterTitle),
        completionSummaryCopy: createCompletionSummaryCopy(
          chapterCompletionState,
          nextChapterTitle ?? chapterResult.value.title,
          sessionState.sessionElapsedLabel,
          formatSaveStatusLabel(progress?.updatedAt, currentTime),
        ),
        completionSummaryMeta: createCompletionSummaryMeta(
          chapterCompletionState,
          readChapterIds,
          chapterList?.totalChapters ?? 0,
          volumeProgram.currentVolumeTitle,
        ),
        displaySyncMessage: shouldForceDisplayRefresh
          ? "Display preferences refreshed from settings for this reading session."
          : undefined,
        accessState: access.accessState,
        accessBadgeLabel: access.accessBadgeLabel,
        accessMessage: access.accessMessage,
        membershipActionLabel: access.membershipActionLabel,
        previewContent: access.previewContent,
        errorText: undefined,
      });
      await persistLatestReadingMilestone({
        kernel,
        latestMilestoneStorageKey,
        latestMilestoneHistoryStorageKey,
        now,
        novelId,
        chapterId,
        title: createProgramMilestoneTitle(chapterList, readChapterIds),
        copy: createProgramMilestoneCopy(chapterList, readChapterIds),
        meta: createProgramMilestoneMeta(chapterList, readChapterIds),
        type: "volume-complete",
      });

      return chapterResult;
    },

    async goToNextChapter() {
      const current = store.getState();
      const novelId = resolveRouteValue("novelId");
      const nextChapterId = current.chapter?.nav.nextChapterId;
      if (!novelId || !nextChapterId) {
        return ok(undefined);
      }

      await this.saveProgress(1);
      return kernel.router.toRoute(readerRouteId, {
        novelId,
        chapterId: nextChapterId,
        completedFrom: "1",
      });
    },

    async completeChapterAndContinue() {
      const current = store.getState();
      if (!current.chapter?.nav.nextChapterId) {
        return this.completeChapter();
      }

      return this.goToNextChapter();
    },

    async goToChapter(targetChapterId: string) {
      const current = store.getState();
      const novelId = resolveRouteValue("novelId");
      if (!novelId || !targetChapterId) {
        return ok(undefined);
      }

      if (targetChapterId === current.chapter?.id) {
        return ok(undefined);
      }

      await this.saveProgress(Math.max(0.08, current.progressPercent));
      return kernel.router.toRoute(readerRouteId, {
        novelId,
        chapterId: targetChapterId,
      });
    },

    async goToPreviousChapter() {
      const current = store.getState();
      const novelId = resolveRouteValue("novelId");
      const previousChapterId = current.chapter?.nav.previousChapterId;
      if (!novelId || !previousChapterId) {
        return ok(undefined);
      }

      await this.saveProgress(Math.max(0.1, current.progressPercent));
      return kernel.router.toRoute(readerRouteId, {
        novelId,
        chapterId: previousChapterId,
      });
    },

    async goToToc() {
      const novelId = resolveRouteValue("novelId");
      const chapterId = store.getState().chapterId;
      if (!novelId) {
        return ok(undefined);
      }

      await this.saveProgress();
      return kernel.router.toRoute(tocRouteId, {
        novelId,
        ...(chapterId ? { chapterId } : {}),
      });
    },

    async goToNovelDetail() {
      const novelId = resolveRouteValue("novelId");
      if (!novelId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(novelDetailRouteId, { novelId });
    },

    async goToBookshelf() {
      if (!bookshelfRouteId) {
        return ok(undefined);
      }

      await this.saveProgress();
      return kernel.router.toRoute(bookshelfRouteId);
    },

    async goToMembership() {
      const novelId = resolveRouteValue("novelId");
      const chapterId = resolveRouteValue("chapterId");
      if (!membershipRouteId || !novelId) {
        return ok(undefined);
      }

      await this.saveProgress();
      return kernel.router.toRoute(membershipRouteId, {
        novelId,
        ...(chapterId ? { chapterId } : {}),
        source: "reader",
      });
    },
  };
}
