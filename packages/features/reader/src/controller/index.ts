import {
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  createControllerRouterHelpers,
  createSingleFlightHydrator,
  ok,
  createStore,
  deriveNovelAccessPresentation,
  LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
  LATEST_READING_MILESTONE_STORAGE_KEY,
  mergeLatestReadingMilestoneHistory,
  READER_DISPLAY_STORAGE_KEY,
  type AppKernel,
  type LatestReadingMilestoneSnapshot,
  type LatestMilestoneType,
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

interface ReaderSessionSnapshot {
  novelId: string;
  chapterId: string;
  startedAt: string;
}

function cloneInitialState(initialState: ReaderState): ReaderState {
  return {
    ...initialState,
    ...(initialState.chapter ? { chapter: cloneStateSnapshot(initialState.chapter) } : {}),
    readChapterIds: cloneStateSnapshotArray(initialState.readChapterIds),
  };
}

const READER_THEMES: ReaderState["theme"][] = ["paper", "sepia", "night"];
const READER_MODES: ReaderState["mode"][] = ["scroll", "page"];
const DEFAULT_READER_SESSION_STORAGE_KEY = "reader.session";
const ACTIVE_READER_SESSION_WINDOW_MS = 1000 * 60 * 90;

function createDisplayPreferences(state: ReaderState): ReaderDisplayPreferences {
  return {
    theme: state.theme,
    mode: state.mode,
    fontScale: state.fontScale,
    nightModeDefault: state.nightModeDefault,
  };
}

function applyDisplayPreferences(
  state: ReaderState,
  preferences: ReaderDisplayPreferences | null,
): Pick<ReaderState, "theme" | "mode" | "fontScale" | "nightModeDefault"> {
  return {
    theme: preferences?.theme ?? state.theme,
    mode: preferences?.mode ?? state.mode,
    fontScale: preferences?.fontScale ?? state.fontScale,
    nightModeDefault: preferences?.nightModeDefault ?? state.nightModeDefault,
  };
}

function isDuskReadingWindow(currentTime: Date): boolean {
  const hour = currentTime.getHours();
  return hour >= 20 || hour < 6;
}

function applyNightModeDefault(
  displayState: Pick<ReaderState, "theme" | "mode" | "fontScale" | "nightModeDefault">,
  currentTime: Date,
): Pick<ReaderState, "theme" | "mode" | "fontScale" | "nightModeDefault"> {
  if (displayState.nightModeDefault === "always-night") {
    return {
      ...displayState,
      theme: "night",
    };
  }

  if (displayState.nightModeDefault === "after-dusk" && isDuskReadingWindow(currentTime)) {
    return {
      ...displayState,
      theme: "night",
    };
  }

  return displayState;
}

function deriveReadChapterIds(response: ChapterListResponse, currentChapterId?: string): string[] {
  if (!currentChapterId) {
    return [];
  }

  const orderedChapters = response.volumes.flatMap((volume) => volume.chapters);
  const currentIndex = orderedChapters.findIndex((chapter) => chapter.id === currentChapterId);
  if (currentIndex === -1) {
    return [];
  }

  return orderedChapters.slice(0, currentIndex + 1).map((chapter) => chapter.id);
}

function findChapterSummary(response: ChapterListResponse, chapterId?: string) {
  if (!chapterId) {
    return undefined;
  }

  return response.volumes.flatMap((volume) => volume.chapters).find((chapter) => chapter.id === chapterId);
}

function findVolumeTitle(response: ChapterListResponse, chapterId?: string): string | undefined {
  if (!chapterId) {
    return undefined;
  }

  return response.volumes.find((volume) => volume.chapters.some((chapter) => chapter.id === chapterId))?.title;
}

interface VolumeProgramSnapshot {
  currentVolumeTitle: string | undefined;
  currentVolumeReadCount: number;
  currentVolumeChapterCount: number;
  nextVolumeTitle: string | undefined;
  nextChapterStartsNextVolume: boolean;
}

function deriveVolumeProgramSnapshot(
  response: ChapterListResponse | null,
  currentChapterId: string | undefined,
  nextChapterId: string | undefined,
  readChapterIds: string[],
): VolumeProgramSnapshot {
  if (!response || !currentChapterId) {
    return {
      currentVolumeTitle: undefined,
      currentVolumeReadCount: 0,
      currentVolumeChapterCount: 0,
      nextVolumeTitle: undefined,
      nextChapterStartsNextVolume: false,
    };
  }

  const currentVolumeIndex = response.volumes.findIndex((volume) => volume.chapters.some((chapter) => chapter.id === currentChapterId));
  if (currentVolumeIndex === -1) {
    return {
      currentVolumeTitle: undefined,
      currentVolumeReadCount: 0,
      currentVolumeChapterCount: 0,
      nextVolumeTitle: undefined,
      nextChapterStartsNextVolume: false,
    };
  }

  const currentVolume = response.volumes[currentVolumeIndex];
  if (!currentVolume) {
    return {
      currentVolumeTitle: undefined,
      currentVolumeReadCount: 0,
      currentVolumeChapterCount: 0,
      nextVolumeTitle: undefined,
      nextChapterStartsNextVolume: false,
    };
  }
  const nextVolume = response.volumes[currentVolumeIndex + 1];
  const nextChapterVolume = nextChapterId
    ? response.volumes.find((volume) => volume.chapters.some((chapter) => chapter.id === nextChapterId))
    : undefined;

  return {
    currentVolumeTitle: currentVolume.title,
    currentVolumeReadCount: currentVolume.chapters.filter((chapter) => readChapterIds.includes(chapter.id)).length,
    currentVolumeChapterCount: currentVolume.chapters.length,
    nextVolumeTitle: nextVolume?.title,
    nextChapterStartsNextVolume: Boolean(nextChapterVolume && nextChapterVolume.id !== currentVolume.id),
  };
}

function clampSessionMinutes(startedAt: string | undefined, now: Date): number {
  if (!startedAt) {
    return 0;
  }

  const startMs = Date.parse(startedAt);
  if (Number.isNaN(startMs)) {
    return 0;
  }

  return Math.max(1, Math.round((now.getTime() - startMs) / (1000 * 60)));
}

function formatSessionElapsedLabel(minutes: number): string | undefined {
  if (minutes <= 0) {
    return undefined;
  }

  if (minutes < 60) {
    return `${minutes} min active`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr active`;
  }

  return `${hours} hr ${remainingMinutes} min active`;
}

function formatSaveStatusLabel(updatedAt: string | undefined, nowDate: Date, saving = false): string {
  if (saving) {
    return "Saving progress...";
  }

  if (!updatedAt) {
    return "Not saved yet";
  }

  const updatedAtMs = Date.parse(updatedAt);
  if (Number.isNaN(updatedAtMs)) {
    return "Progress saved";
  }

  const diffMinutes = Math.max(0, Math.round((nowDate.getTime() - updatedAtMs) / (1000 * 60)));
  if (diffMinutes <= 1) {
    return "Saved just now";
  }

  if (diffMinutes < 60) {
    return `Saved ${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Saved ${diffHours} hr ago`;
  }

  return "Saved earlier";
}

function createCompletionMessage(nextChapterTitle?: string, completedNow = true): string {
  if (completedNow) {
    return nextChapterTitle
      ? `Chapter complete. ${nextChapterTitle} is ready as the next reading step.`
      : "Chapter complete. You are at the end of the current available run.";
  }

  return nextChapterTitle
    ? `Previous chapter complete. You are now in ${nextChapterTitle}.`
    : "Previous chapter complete. You are now at the edge of the current reading run.";
}

function createReadingStateLabel(
  state: ReaderState["chapterCompletionState"],
  nextChapterTitle?: string,
): string {
  if (state === "continued") {
    return nextChapterTitle ? `Continued into ${nextChapterTitle}` : "Continued into the latest available chapter";
  }

  if (state === "completed") {
    return nextChapterTitle ? `Chapter complete · ${nextChapterTitle} next` : "Chapter complete · latest available point";
  }

  return "Reading in progress";
}

function createNextStepLabel(nextChapterTitle?: string, completionState: ReaderState["chapterCompletionState"] = "reading"): string {
  if (completionState === "continued") {
    return nextChapterTitle ? `Keep moving forward into ${nextChapterTitle}.` : "You are already at the latest available chapter in this run.";
  }

  if (completionState === "completed") {
    return nextChapterTitle ? `${nextChapterTitle} is ready as the next reading step.` : "You are at the edge of the current available run.";
  }

  return nextChapterTitle ? `Next up: ${nextChapterTitle}.` : "No next chapter is currently available.";
}

function createCompletionSummaryTitle(
  completionState: ReaderState["chapterCompletionState"],
  chapterTitle?: string,
  nextChapterTitle?: string,
): string | undefined {
  if (completionState === "completed") {
    return chapterTitle ? `${chapterTitle} complete` : "Chapter complete";
  }

  if (completionState === "continued") {
    return nextChapterTitle ? `Moved into ${nextChapterTitle}` : "Moved into the latest available chapter";
  }

  return undefined;
}

function createCompletionSummaryCopy(
  completionState: ReaderState["chapterCompletionState"],
  nextChapterTitle?: string,
  sessionElapsedLabel?: string,
  saveStatusLabel?: string,
): string | undefined {
  const sessionClause = sessionElapsedLabel ? `${sessionElapsedLabel}. ` : "";
  const saveClause = saveStatusLabel ? `${saveStatusLabel}.` : "Progress is saved.";

  if (completionState === "completed") {
    return nextChapterTitle
      ? `${sessionClause}This chapter is closed cleanly and ${nextChapterTitle} is ready as the next reading step. ${saveClause}`
      : `${sessionClause}This chapter is closed cleanly and the current run is caught up. ${saveClause}`;
  }

  if (completionState === "continued") {
    return nextChapterTitle
      ? `${sessionClause}The previous chapter is closed and this session has already moved forward into ${nextChapterTitle}. ${saveClause}`
      : `${sessionClause}The previous chapter is closed and this session is already at the latest available point. ${saveClause}`;
  }

  return undefined;
}

function createCompletionSummaryMeta(
  completionState: ReaderState["chapterCompletionState"],
  readChapterIds: string[],
  totalChapters: number,
  currentVolumeTitle?: string,
): string | undefined {
  if (completionState === "reading") {
    return undefined;
  }

  const trailLabel = totalChapters > 0 ? `${readChapterIds.length}/${totalChapters} chapters tracked` : `${readChapterIds.length} chapters tracked`;
  return currentVolumeTitle ? `${currentVolumeTitle} · ${trailLabel}` : trailLabel;
}

function createVolumeProgressLabel(currentVolumeTitle: string | undefined, currentVolumeReadCount: number, currentVolumeChapterCount: number): string | undefined {
  if (!currentVolumeTitle) {
    return currentVolumeChapterCount > 0 ? `${currentVolumeReadCount}/${currentVolumeChapterCount} chapters tracked` : undefined;
  }

  return currentVolumeChapterCount > 0
    ? `${currentVolumeTitle} · ${currentVolumeReadCount}/${currentVolumeChapterCount} chapters tracked`
    : `${currentVolumeTitle} · active reading lane`;
}

function createActiveProgramSummary(
  currentVolumeTitle: string | undefined,
  nextChapterTitle: string | undefined,
  completionState: ReaderState["chapterCompletionState"],
  nextVolumeTitle?: string,
  nextChapterStartsNextVolume = false,
): string | undefined {
  const lane = currentVolumeTitle ?? "Current reading lane";

  if (completionState === "continued" && nextChapterStartsNextVolume && nextVolumeTitle) {
    return `${nextVolumeTitle} is now active after a clean handoff from ${lane}.`;
  }

  if (completionState === "continued") {
    return nextChapterTitle
      ? `${lane} is still moving and the session has already advanced into ${nextChapterTitle}.`
      : `${lane} has advanced to the latest available chapter in the current run.`;
  }

  if (completionState === "completed" && nextChapterStartsNextVolume && nextVolumeTitle) {
    return `${lane} is closed for this chapter and ${nextVolumeTitle} is staged as the next volume handoff.`;
  }

  if (completionState === "completed") {
    return nextChapterTitle
      ? `${lane} is cleanly closed for this chapter and ready to push into ${nextChapterTitle}.`
      : `${lane} is caught up to the current available edge.`;
  }

  if (nextChapterStartsNextVolume && nextVolumeTitle) {
    return `${lane} is nearing a handoff, and ${nextVolumeTitle} is already queued as the next volume lane.`;
  }

  return nextChapterTitle
    ? `${lane} is active, and ${nextChapterTitle} is already staged as the next program step.`
    : `${lane} is active and currently sitting at the latest available point.`;
}

function createBacklogReentryLabel(
  completionState: ReaderState["chapterCompletionState"],
  currentVolumeTitle: string | undefined,
  nextVolumeTitle?: string,
  currentVolumeReadCount = 0,
  currentVolumeChapterCount = 0,
): string | undefined {
  const lane = currentVolumeTitle ?? "This reading lane";
  const volumeComplete = currentVolumeChapterCount > 0 && currentVolumeReadCount >= currentVolumeChapterCount;

  if (volumeComplete && nextVolumeTitle) {
    return `${lane} is fully tracked, so backlog re-entry can stay quiet while ${nextVolumeTitle} becomes the next active lane.`;
  }

  if (volumeComplete) {
    return `${lane} is fully tracked and can now re-enter later from shelf or directory without losing context.`;
  }

  if (completionState === "completed" || completionState === "continued") {
    return `${lane} now has enough tracked progress to re-enter later from shelf or directory without losing context.`;
  }

  return `${lane} is still active, so backlog re-entry should wait until this run stabilizes further.`;
}

function createVolumeHandoffLabel(
  currentVolumeTitle: string | undefined,
  nextVolumeTitle: string | undefined,
  completionState: ReaderState["chapterCompletionState"],
  nextChapterStartsNextVolume: boolean,
  currentVolumeReadCount: number,
  currentVolumeChapterCount: number,
): string | undefined {
  const lane = currentVolumeTitle ?? "Current reading lane";
  const volumeComplete = currentVolumeChapterCount > 0 && currentVolumeReadCount >= currentVolumeChapterCount;

  if (!nextVolumeTitle) {
    return volumeComplete
      ? `${lane} is fully tracked and no later volume handoff is queued yet.`
      : `${lane} is still the final active volume in this reading run.`;
  }

  if (completionState === "continued" && nextChapterStartsNextVolume) {
    return `${nextVolumeTitle} is now the active handoff lane after the last chapter transition.`;
  }

  if (completionState === "completed" && nextChapterStartsNextVolume) {
    return `${nextVolumeTitle} is the immediate handoff once this chapter closes.`;
  }

  if (volumeComplete) {
    return `${nextVolumeTitle} is now queued as the next full-volume handoff.`;
  }

  return `${nextVolumeTitle} is waiting as the next volume handoff while ${lane} stays active.`;
}

function findLatestFinishedVolume(response: ChapterListResponse | null, readChapterIds: string[]) {
  if (!response) {
    return undefined;
  }

  const finishedVolumes = response.volumes.filter((volume) => volume.chapters.length > 0 && volume.chapters.every((chapter) => readChapterIds.includes(chapter.id)));
  return finishedVolumes[finishedVolumes.length - 1];
}

function createProgramMilestoneTitle(response: ChapterListResponse | null, readChapterIds: string[]): string | undefined {
  const volume = findLatestFinishedVolume(response, readChapterIds);
  return volume ? `${volume.title} complete` : undefined;
}

function createProgramMilestoneCopy(response: ChapterListResponse | null, readChapterIds: string[]): string | undefined {
  const volume = findLatestFinishedVolume(response, readChapterIds);
  if (!response || !volume) {
    return undefined;
  }

  const volumeIndex = response.volumes.findIndex((item) => item.id === volume.id);
  const nextVolume = volumeIndex >= 0 ? response.volumes[volumeIndex + 1] : undefined;

  if (nextVolume) {
    return `${volume.title} has closed as a stable volume milestone, and ${nextVolume.title} is now the next lane to carry forward.`;
  }

  return `${volume.title} is fully tracked and now behaves like a stable milestone at the edge of the reading run.`;
}

function createProgramMilestoneMeta(response: ChapterListResponse | null, readChapterIds: string[]): string | undefined {
  const volume = findLatestFinishedVolume(response, readChapterIds);
  if (!volume) {
    return undefined;
  }

  return `${volume.chapters.length}/${volume.chapters.length} chapters tracked`;
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
    ...cloneInitialState(createInitialReaderState()),
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

  async function restoreOrCreateSession(
    novelId: string,
    chapterId: string,
    fallbackStartedAt?: string,
  ): Promise<Pick<ReaderState, "sessionStartedAt" | "sessionElapsedMinutes" | "sessionElapsedLabel">> {
    const currentTime = now();
    const stored = await kernel.storage.get<ReaderSessionSnapshot>(sessionStorageKey);
    const storedValue = stored.ok ? stored.value : null;
    const storedStartedAt = storedValue?.startedAt;
    const storedAgeMs = storedStartedAt ? currentTime.getTime() - Date.parse(storedStartedAt) : Number.POSITIVE_INFINITY;
    const isStoredSessionLive =
      !!storedValue &&
      storedValue.novelId === novelId &&
      storedAgeMs >= 0 &&
      storedAgeMs <= ACTIVE_READER_SESSION_WINDOW_MS;
    const fallbackAgeMs = fallbackStartedAt ? currentTime.getTime() - Date.parse(fallbackStartedAt) : Number.POSITIVE_INFINITY;
    const canReuseFallback = fallbackStartedAt && fallbackAgeMs >= 0 && fallbackAgeMs <= ACTIVE_READER_SESSION_WINDOW_MS;
    const startedAt =
      (isStoredSessionLive ? storedValue?.startedAt : undefined) ??
      (canReuseFallback ? fallbackStartedAt : undefined) ??
      currentTime.toISOString();
    const elapsedMinutes = clampSessionMinutes(startedAt, currentTime);

    await kernel.storage.set<ReaderSessionSnapshot>(sessionStorageKey, {
      novelId,
      chapterId,
      startedAt,
    });

    return {
      sessionStartedAt: startedAt,
      sessionElapsedMinutes: elapsedMinutes,
      sessionElapsedLabel: formatSessionElapsedLabel(elapsedMinutes),
    };
  }

  async function refreshReadingSession(chapterIdOverride?: string) {
    const current = store.getState();
    if (!current.novelId || !current.chapterId) {
      return;
    }

    const currentTime = now();
    const startedAt = current.sessionStartedAt ?? currentTime.toISOString();
    const elapsedMinutes = clampSessionMinutes(startedAt, currentTime);
    const chapterId = chapterIdOverride ?? current.chapterId;

    await kernel.storage.set<ReaderSessionSnapshot>(sessionStorageKey, {
      novelId: current.novelId,
      chapterId,
      startedAt,
    });

    store.setState({
      sessionStartedAt: startedAt,
      sessionElapsedMinutes: elapsedMinutes,
      sessionElapsedLabel: formatSessionElapsedLabel(elapsedMinutes),
    });
  }

  async function persistLatestMilestone(
    novelId: string,
    chapterId: string,
    title: string | undefined,
    copy: string | undefined,
    meta: string | undefined,
    type: LatestMilestoneType,
  ) {
    if (!title || !copy) {
      return ok(undefined);
    }

    const snapshot: LatestReadingMilestoneSnapshot = {
      novelId,
      chapterId,
      title,
      copy,
      ...(meta ? { meta } : {}),
      source: "reader",
      type,
      savedAt: now().toISOString(),
    };
    const historyResult = await kernel.storage.get<LatestReadingMilestoneSnapshot[]>(latestMilestoneHistoryStorageKey);
    const nextHistory = mergeLatestReadingMilestoneHistory(historyResult.ok ? historyResult.value : [], snapshot);
    const latestResult = await kernel.storage.set<LatestReadingMilestoneSnapshot>(latestMilestoneStorageKey, snapshot);
    if (!latestResult.ok) {
      return latestResult;
    }

    return kernel.storage.set<LatestReadingMilestoneSnapshot[]>(latestMilestoneHistoryStorageKey, nextHistory);
  }

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

  function resolveAccessState(
    chapter: ChapterContent,
  ): Pick<ReaderState, "accessState" | "accessBadgeLabel" | "accessMessage" | "membershipActionLabel" | "previewContent"> {
    const access = deriveNovelAccessPresentation(chapter);

    if (access.accessState === "trial" && typeof chapter.trialEndOffset === "number") {
      return {
        accessState: access.accessState,
        accessBadgeLabel: access.accessBadgeLabel,
        accessMessage: "Trial preview ends here. Unlock membership to keep reading.",
        membershipActionLabel: access.membershipActionLabel,
        previewContent: chapter.content.slice(0, chapter.trialEndOffset).trimEnd(),
      };
    }

    if (access.accessState === "locked") {
      return {
        accessState: access.accessState,
        accessBadgeLabel: access.accessBadgeLabel,
        accessMessage: access.accessSummary,
        membershipActionLabel: access.membershipActionLabel,
        previewContent: chapter.content.slice(0, 220).trimEnd(),
      };
    }

    return {
      accessState: access.accessState,
      accessBadgeLabel: access.accessBadgeLabel,
      accessMessage: undefined,
      membershipActionLabel: access.membershipActionLabel,
      previewContent: undefined,
    };
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
      await persistLatestMilestone(
        novelId,
        chapterId,
        store.getState().programMilestoneTitle ?? store.getState().completionSummaryTitle,
        store.getState().programMilestoneCopy ?? store.getState().completionSummaryCopy,
        store.getState().programMilestoneMeta ?? store.getState().completionSummaryMeta,
        store.getState().programMilestoneTitle ? "volume-complete" : "chapter-recap",
      );

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
      const sessionState = await restoreOrCreateSession(novelId, chapterId, progress?.updatedAt);
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
      await persistLatestMilestone(
        novelId,
        chapterId,
        createProgramMilestoneTitle(chapterList, readChapterIds),
        createProgramMilestoneCopy(chapterList, readChapterIds),
        createProgramMilestoneMeta(chapterList, readChapterIds),
        "volume-complete",
      );

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
