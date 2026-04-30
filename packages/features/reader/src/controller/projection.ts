import { cloneStateSnapshot, cloneStateSnapshotArray } from "@minix/core";
import type { ChapterListResponse } from "@minix/contracts";

import type { ReaderState } from "../model";

export function cloneInitialReaderState(initialState: ReaderState): ReaderState {
  return {
    ...initialState,
    ...(initialState.chapter ? { chapter: cloneStateSnapshot(initialState.chapter) } : {}),
    readChapterIds: cloneStateSnapshotArray(initialState.readChapterIds),
  };
}

export function deriveReadChapterIds(response: ChapterListResponse, currentChapterId?: string): string[] {
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

export function findChapterSummary(response: ChapterListResponse, chapterId?: string) {
  if (!chapterId) {
    return undefined;
  }

  return response.volumes.flatMap((volume) => volume.chapters).find((chapter) => chapter.id === chapterId);
}

export interface VolumeProgramSnapshot {
  currentVolumeTitle: string | undefined;
  currentVolumeReadCount: number;
  currentVolumeChapterCount: number;
  nextVolumeTitle: string | undefined;
  nextChapterStartsNextVolume: boolean;
}

export function deriveVolumeProgramSnapshot(
  response: ChapterListResponse | null,
  currentChapterId: string | undefined,
  nextChapterId: string | undefined,
  readChapterIds: string[],
): VolumeProgramSnapshot {
  if (!response || !currentChapterId) {
    return createEmptyVolumeProgramSnapshot();
  }

  const currentVolumeIndex = response.volumes.findIndex((volume) => volume.chapters.some((chapter) => chapter.id === currentChapterId));
  if (currentVolumeIndex === -1) {
    return createEmptyVolumeProgramSnapshot();
  }

  const currentVolume = response.volumes[currentVolumeIndex];
  if (!currentVolume) {
    return createEmptyVolumeProgramSnapshot();
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

function createEmptyVolumeProgramSnapshot(): VolumeProgramSnapshot {
  return {
    currentVolumeTitle: undefined,
    currentVolumeReadCount: 0,
    currentVolumeChapterCount: 0,
    nextVolumeTitle: undefined,
    nextChapterStartsNextVolume: false,
  };
}

export function formatSaveStatusLabel(updatedAt: string | undefined, nowDate: Date, saving = false): string {
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

export function createCompletionMessage(nextChapterTitle?: string, completedNow = true): string {
  if (completedNow) {
    return nextChapterTitle
      ? `Chapter complete. ${nextChapterTitle} is ready as the next reading step.`
      : "Chapter complete. You are at the end of the current available run.";
  }

  return nextChapterTitle
    ? `Previous chapter complete. You are now in ${nextChapterTitle}.`
    : "Previous chapter complete. You are now at the edge of the current reading run.";
}

export function createReadingStateLabel(
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

export function createNextStepLabel(nextChapterTitle?: string, completionState: ReaderState["chapterCompletionState"] = "reading"): string {
  if (completionState === "continued") {
    return nextChapterTitle ? `Keep moving forward into ${nextChapterTitle}.` : "You are already at the latest available chapter in this run.";
  }

  if (completionState === "completed") {
    return nextChapterTitle ? `${nextChapterTitle} is ready as the next reading step.` : "You are at the edge of the current available run.";
  }

  return nextChapterTitle ? `Next up: ${nextChapterTitle}.` : "No next chapter is currently available.";
}

export function createCompletionSummaryTitle(
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

export function createCompletionSummaryCopy(
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

export function createCompletionSummaryMeta(
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

export function createVolumeProgressLabel(currentVolumeTitle: string | undefined, currentVolumeReadCount: number, currentVolumeChapterCount: number): string | undefined {
  if (!currentVolumeTitle) {
    return currentVolumeChapterCount > 0 ? `${currentVolumeReadCount}/${currentVolumeChapterCount} chapters tracked` : undefined;
  }

  return currentVolumeChapterCount > 0
    ? `${currentVolumeTitle} · ${currentVolumeReadCount}/${currentVolumeChapterCount} chapters tracked`
    : `${currentVolumeTitle} · active reading lane`;
}

export function createActiveProgramSummary(
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

export function createBacklogReentryLabel(
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

export function createVolumeHandoffLabel(
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
