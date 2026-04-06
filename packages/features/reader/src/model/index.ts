import type { ChapterContent } from "@minix/contracts";
import type { NightModeDefault, ReaderDisplayPreferences, ReaderMode, ReaderTheme } from "@minix/core";

export type { ReaderDisplayPreferences, ReaderMode, ReaderTheme };

export interface ReaderState {
  ready: boolean;
  title: string;
  novelId: string | undefined;
  chapterId: string | undefined;
  chapter: ChapterContent | undefined;
  totalChapters: number;
  currentVolumeTitle: string | undefined;
  currentVolumeReadCount: number;
  currentVolumeChapterCount: number;
  nextVolumeTitle: string | undefined;
  nextChapterStartsNextVolume: boolean;
  continueChapterId: string | undefined;
  readChapterIds: string[];
  previousChapterTitle: string | undefined;
  nextChapterTitle: string | undefined;
  volumeProgressLabel: string | undefined;
  activeProgramSummary: string | undefined;
  volumeHandoffLabel: string | undefined;
  backlogReentryLabel: string | undefined;
  programMilestoneTitle: string | undefined;
  programMilestoneCopy: string | undefined;
  programMilestoneMeta: string | undefined;
  loading: boolean;
  savingProgress: boolean;
  errorText: string | undefined;
  theme: ReaderTheme;
  mode: ReaderMode;
  fontScale: number;
  nightModeDefault: NightModeDefault;
  progressPercent: number;
  lastSavedAt: string | undefined;
  saveStatusLabel: string | undefined;
  sessionStartedAt: string | undefined;
  sessionElapsedMinutes: number;
  sessionElapsedLabel: string | undefined;
  chapterCompletionState: "reading" | "completed" | "continued";
  readingStateLabel: string | undefined;
  chapterCompletionMessage: string | undefined;
  nextStepLabel: string | undefined;
  completionSummaryTitle: string | undefined;
  completionSummaryCopy: string | undefined;
  completionSummaryMeta: string | undefined;
  displaySyncMessage: string | undefined;
  accessState: "open" | "trial" | "locked";
  accessBadgeLabel: string | undefined;
  accessMessage: string | undefined;
  membershipActionLabel: string | undefined;
  previewContent: string | undefined;
}

export interface CreateReaderStateOptions {
  title?: string;
  novelId?: string;
  chapterId?: string;
}

export function createInitialReaderState(options: CreateReaderStateOptions = {}): ReaderState {
  return {
    ready: false,
    title: options.title ?? "Reader",
    novelId: options.novelId,
    chapterId: options.chapterId,
    chapter: undefined,
    totalChapters: 0,
    currentVolumeTitle: undefined,
    currentVolumeReadCount: 0,
    currentVolumeChapterCount: 0,
    nextVolumeTitle: undefined,
    nextChapterStartsNextVolume: false,
    continueChapterId: undefined,
    readChapterIds: [],
    previousChapterTitle: undefined,
    nextChapterTitle: undefined,
    volumeProgressLabel: undefined,
    activeProgramSummary: undefined,
    volumeHandoffLabel: undefined,
    backlogReentryLabel: undefined,
    programMilestoneTitle: undefined,
    programMilestoneCopy: undefined,
    programMilestoneMeta: undefined,
    loading: false,
    savingProgress: false,
    errorText: undefined,
    theme: "paper",
    mode: "scroll",
    fontScale: 1,
    nightModeDefault: "manual-only",
    progressPercent: 0,
    lastSavedAt: undefined,
    saveStatusLabel: undefined,
    sessionStartedAt: undefined,
    sessionElapsedMinutes: 0,
    sessionElapsedLabel: undefined,
    chapterCompletionState: "reading",
    readingStateLabel: undefined,
    chapterCompletionMessage: undefined,
    nextStepLabel: undefined,
    completionSummaryTitle: undefined,
    completionSummaryCopy: undefined,
    completionSummaryMeta: undefined,
    displaySyncMessage: undefined,
    accessState: "open",
    accessBadgeLabel: undefined,
    accessMessage: undefined,
    membershipActionLabel: undefined,
    previewContent: undefined,
  };
}
