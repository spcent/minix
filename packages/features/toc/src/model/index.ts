import type { VolumeSummary } from "@minix/contracts";

export interface TocState {
  ready: boolean;
  title: string;
  novelId: string | undefined;
  volumes: VolumeSummary[];
  loading: boolean;
  errorText: string | undefined;
  selectedChapterId: string | undefined;
  continueChapterId: string | undefined;
  currentChapterId: string | undefined;
  currentVolumeId: string | undefined;
  highlightedChapterId: string | undefined;
  expandedVolumeId: string | undefined;
  readChapterIds: string[];
  currentVolumeProgressLabel: string | undefined;
  currentVolumeSummary: string | undefined;
  nextVolumeHandoffLabel: string | undefined;
  backlogReentryLabel: string | undefined;
  programMilestoneTitle: string | undefined;
  programMilestoneCopy: string | undefined;
  programMilestoneMeta: string | undefined;
  selectedChapterAccessSummary: string | undefined;
  selectedChapterPrimaryActionLabel: string | undefined;
  selectedChapterMembershipActionLabel: string | undefined;
  selectedChapterLocked: boolean;
}

export interface CreateTocStateOptions {
  title?: string;
  novelId?: string;
}

export function createInitialTocState(options: CreateTocStateOptions = {}): TocState {
  return {
    ready: false,
    title: options.title ?? "Chapter Directory",
    novelId: options.novelId,
    volumes: [],
    loading: false,
    errorText: undefined,
    selectedChapterId: undefined,
    continueChapterId: undefined,
    currentChapterId: undefined,
    currentVolumeId: undefined,
    highlightedChapterId: undefined,
    expandedVolumeId: undefined,
    readChapterIds: [],
    currentVolumeProgressLabel: undefined,
    currentVolumeSummary: undefined,
    nextVolumeHandoffLabel: undefined,
    backlogReentryLabel: undefined,
    programMilestoneTitle: undefined,
    programMilestoneCopy: undefined,
    programMilestoneMeta: undefined,
    selectedChapterAccessSummary: undefined,
    selectedChapterPrimaryActionLabel: undefined,
    selectedChapterMembershipActionLabel: undefined,
    selectedChapterLocked: false,
  };
}
