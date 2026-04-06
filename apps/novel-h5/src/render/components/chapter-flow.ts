import type { ChapterSummary, VolumeSummary } from "@minix/contracts";

export interface ChapterFlowSnapshot {
  currentChapterId: string | undefined;
  continueChapterId: string | undefined;
  nextChapterId: string | undefined;
  readChapterIds: string[];
}

export interface ChapterFlowDescriptor {
  chips: string[];
  copy: string;
  actionLabel: string;
}

export function flattenChapterVolumes(volumes: VolumeSummary[]): ChapterSummary[] {
  return volumes.flatMap((volume) => volume.chapters);
}

export function findChapterById(volumes: VolumeSummary[], chapterId?: string): ChapterSummary | undefined {
  if (!chapterId) {
    return undefined;
  }

  return flattenChapterVolumes(volumes).find((chapter) => chapter.id === chapterId);
}

export function findNextChapter(volumes: VolumeSummary[], currentChapterId?: string): ChapterSummary | undefined {
  if (!currentChapterId) {
    return undefined;
  }

  const orderedChapters = flattenChapterVolumes(volumes);
  const currentIndex = orderedChapters.findIndex((chapter) => chapter.id === currentChapterId);
  if (currentIndex === -1) {
    return undefined;
  }

  return orderedChapters[currentIndex + 1];
}

export function describeChapterFlow(
  chapter: ChapterSummary,
  snapshot: ChapterFlowSnapshot,
): ChapterFlowDescriptor {
  const isCurrent = snapshot.currentChapterId === chapter.id;
  const isContinue = snapshot.continueChapterId === chapter.id;
  const isRead = snapshot.readChapterIds.includes(chapter.id);
  const isNextUp = snapshot.nextChapterId === chapter.id;
  const isLocked = chapter.requiresMembership && !chapter.isPurchased;

  const chips = [
    ...(isCurrent ? ["Current"] : []),
    ...(isContinue ? ["Continue"] : []),
    ...(isRead ? ["Read"] : ["Unread"]),
    ...(chapter.isTrial ? ["Trial"] : []),
    ...(isLocked ? ["Locked"] : chapter.requiresMembership ? ["Membership"] : []),
    ...(isNextUp ? ["Next up"] : []),
  ];

  if (isCurrent) {
    return {
      chips,
      copy: "This is the active chapter in the live reading session.",
      actionLabel: "Current",
    };
  }

  if (isNextUp) {
    return {
      chips,
      copy: "This chapter is next in the current reading run.",
      actionLabel: "Next up",
    };
  }

  if (isContinue) {
    return {
      chips,
      copy: "This chapter remains the saved continuation point for the current trail.",
      actionLabel: "Resume",
    };
  }

  if (isRead) {
    return {
      chips,
      copy: "Already covered in the current reading trail.",
      actionLabel: "Review",
    };
  }

  if (isLocked) {
    return {
      chips,
      copy: "This chapter sits beyond the current membership boundary.",
      actionLabel: "Preview",
    };
  }

  return {
    chips,
    copy: "Available to open from the live directory.",
    actionLabel: "Read",
  };
}
