import {
  ok,
  mergeLatestReadingMilestoneHistory,
  type AppKernel,
  type LatestReadingMilestoneSnapshot,
  type LatestMilestoneType,
} from "@minix/core";
import type { ChapterListResponse } from "@minix/contracts";

function findLatestFinishedVolume(response: ChapterListResponse | null, readChapterIds: string[]) {
  if (!response) {
    return undefined;
  }

  const finishedVolumes = response.volumes.filter((volume) => volume.chapters.length > 0 && volume.chapters.every((chapter) => readChapterIds.includes(chapter.id)));
  return finishedVolumes[finishedVolumes.length - 1];
}

export function createProgramMilestoneTitle(response: ChapterListResponse | null, readChapterIds: string[]): string | undefined {
  const volume = findLatestFinishedVolume(response, readChapterIds);
  return volume ? `${volume.title} complete` : undefined;
}

export function createProgramMilestoneCopy(response: ChapterListResponse | null, readChapterIds: string[]): string | undefined {
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

export function createProgramMilestoneMeta(response: ChapterListResponse | null, readChapterIds: string[]): string | undefined {
  const volume = findLatestFinishedVolume(response, readChapterIds);
  if (!volume) {
    return undefined;
  }

  return `${volume.chapters.length}/${volume.chapters.length} chapters tracked`;
}

export async function persistLatestReadingMilestone(input: {
  kernel: AppKernel;
  latestMilestoneStorageKey: string;
  latestMilestoneHistoryStorageKey: string;
  now: () => Date;
  novelId: string;
  chapterId: string;
  title: string | undefined;
  copy: string | undefined;
  meta: string | undefined;
  type: LatestMilestoneType;
}) {
  if (!input.title || !input.copy) {
    return ok(undefined);
  }

  const snapshot: LatestReadingMilestoneSnapshot = {
    novelId: input.novelId,
    chapterId: input.chapterId,
    title: input.title,
    copy: input.copy,
    ...(input.meta ? { meta: input.meta } : {}),
    source: "reader",
    type: input.type,
    savedAt: input.now().toISOString(),
  };
  const historyResult = await input.kernel.storage.get<LatestReadingMilestoneSnapshot[]>(
    input.latestMilestoneHistoryStorageKey,
  );
  const nextHistory = mergeLatestReadingMilestoneHistory(historyResult.ok ? historyResult.value : [], snapshot);
  const latestResult = await input.kernel.storage.set<LatestReadingMilestoneSnapshot>(
    input.latestMilestoneStorageKey,
    snapshot,
  );
  if (!latestResult.ok) {
    return latestResult;
  }

  return input.kernel.storage.set<LatestReadingMilestoneSnapshot[]>(
    input.latestMilestoneHistoryStorageKey,
    nextHistory,
  );
}
