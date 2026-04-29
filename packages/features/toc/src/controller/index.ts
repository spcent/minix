import {
  cloneStateSnapshotArray,
  createControllerRouterHelpers,
  ok,
  createStore,
  deriveNovelAccessPresentation,
  LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
  LATEST_READING_MILESTONE_STORAGE_KEY,
  mergeLatestReadingMilestoneHistory,
  type AppKernel,
  type LatestReadingMilestoneSnapshot,
} from "@minix/core";
import { type AppRouteId, type ChapterListResponse, type LoadReadingProgressResponse } from "@minix/contracts";

import { createInitialTocState, type TocState } from "../model";

export interface CreateTocControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  catalogRouteId: AppRouteId;
  novelDetailRouteId: AppRouteId;
  readerRouteId: AppRouteId;
  membershipRouteId?: AppRouteId;
  requestPath?: string;
  progressRequestPath?: string;
  latestMilestoneStorageKey?: string;
  latestMilestoneHistoryStorageKey?: string;
  initialState?: Partial<TocState>;
}

function cloneInitialState(initialState: TocState): TocState {
  return {
    ...initialState,
    volumes: cloneStateSnapshotArray(initialState.volumes),
    readChapterIds: cloneStateSnapshotArray(initialState.readChapterIds),
  };
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

function deriveSelectedChapterPresentation(
  response: ChapterListResponse,
  chapterId: string | undefined,
) {
  const chapter = chapterId
    ? response.volumes.flatMap((volume) => volume.chapters).find((item) => item.id === chapterId)
    : undefined;

  if (!chapter) {
    return {
      selectedChapterAccessSummary: undefined,
      selectedChapterPrimaryActionLabel: undefined,
      selectedChapterMembershipActionLabel: undefined,
      selectedChapterLocked: false,
    };
  }

  const access = deriveNovelAccessPresentation(chapter);
  return {
    selectedChapterAccessSummary: access.accessSummary,
    selectedChapterPrimaryActionLabel: access.accessState === "locked" ? "Focus locked chapter" : chapterId === response.continueChapterId ? "Resume selected chapter" : "Open selected chapter",
    selectedChapterMembershipActionLabel: access.membershipActionLabel,
    selectedChapterLocked: access.accessState !== "open",
  };
}

function findVolumeIdByChapterId(response: ChapterListResponse, chapterId: string | undefined): string | undefined {
  if (!chapterId) {
    return undefined;
  }

  return response.volumes.find((volume) => volume.chapters.some((chapter) => chapter.id === chapterId))?.id;
}

function deriveExpandedVolumeId(response: ChapterListResponse, currentVolumeId: string | undefined): string | undefined {
  if (currentVolumeId && response.volumes.some((volume) => volume.id === currentVolumeId)) {
    return currentVolumeId;
  }

  return response.volumes[0]?.id;
}

function createCurrentVolumeProgressLabel(response: ChapterListResponse, currentVolumeId: string | undefined, readChapterIds: string[]): string | undefined {
  if (!currentVolumeId) {
    return undefined;
  }

  const volume = response.volumes.find((item) => item.id === currentVolumeId);
  if (!volume) {
    return undefined;
  }

  const readCount = volume.chapters.filter((chapter) => readChapterIds.includes(chapter.id)).length;
  return `${volume.title} · ${readCount}/${volume.chapters.length} chapters tracked`;
}

function createCurrentVolumeSummary(response: ChapterListResponse, currentVolumeId: string | undefined, continueChapterId: string | undefined): string | undefined {
  if (!currentVolumeId) {
    return undefined;
  }

  const volume = response.volumes.find((item) => item.id === currentVolumeId);
  if (!volume) {
    return undefined;
  }

  const continueChapter = continueChapterId
    ? volume.chapters.find((chapter) => chapter.id === continueChapterId)
    : undefined;

  return continueChapter
    ? `${volume.title} is the active program lane, with ${continueChapter.title} still acting as the fastest re-entry point.`
    : `${volume.title} is the active program lane for the current reading run.`;
}

function createNextVolumeHandoffLabel(response: ChapterListResponse, currentVolumeId: string | undefined, readChapterIds: string[]): string | undefined {
  if (!currentVolumeId) {
    return undefined;
  }

  const currentIndex = response.volumes.findIndex((item) => item.id === currentVolumeId);
  if (currentIndex === -1) {
    return undefined;
  }

  const volume = response.volumes[currentIndex];
  if (!volume) {
    return undefined;
  }
  const nextVolume = response.volumes[currentIndex + 1];
  const readCount = volume.chapters.filter((chapter) => readChapterIds.includes(chapter.id)).length;
  const volumeComplete = volume.chapters.length > 0 && readCount >= volume.chapters.length;

  if (nextVolume && volumeComplete) {
    return `${nextVolume.title} is the next volume handoff now that ${volume.title} is fully tracked.`;
  }

  if (nextVolume) {
    return `${nextVolume.title} is already queued as the next volume handoff while ${volume.title} remains active.`;
  }

  if (volumeComplete) {
    return `${volume.title} is fully tracked and no later volume handoff is queued yet.`;
  }

  return `${volume.title} is still the final active volume in this directory view.`;
}

function createBacklogReentryLabel(response: ChapterListResponse, readChapterIds: string[]): string | undefined {
  const finishedVolumes = response.volumes.filter((volume) => volume.chapters.every((chapter) => readChapterIds.includes(chapter.id)));
  const backlogVolume = finishedVolumes[finishedVolumes.length - 1];

  if (!backlogVolume) {
    return "No finished volume has moved into backlog re-entry yet.";
  }

  return `${backlogVolume.title} is fully tracked, so it can now behave like a quiet backlog re-entry lane instead of an active run.`;
}

function findLatestFinishedVolume(response: ChapterListResponse, readChapterIds: string[]) {
  const finishedVolumes = response.volumes.filter((volume) => volume.chapters.length > 0 && volume.chapters.every((chapter) => readChapterIds.includes(chapter.id)));
  return finishedVolumes[finishedVolumes.length - 1];
}

function createProgramMilestoneTitle(response: ChapterListResponse, readChapterIds: string[]): string | undefined {
  const volume = findLatestFinishedVolume(response, readChapterIds);
  return volume ? `${volume.title} complete` : undefined;
}

function createProgramMilestoneCopy(response: ChapterListResponse, readChapterIds: string[]): string | undefined {
  const volume = findLatestFinishedVolume(response, readChapterIds);
  if (!volume) {
    return undefined;
  }

  const volumeIndex = response.volumes.findIndex((item) => item.id === volume.id);
  const nextVolume = volumeIndex >= 0 ? response.volumes[volumeIndex + 1] : undefined;

  if (nextVolume) {
    return `${volume.title} is now a stable volume milestone, and ${nextVolume.title} is staged as the next active lane.`;
  }

  return `${volume.title} is fully tracked and now behaves like a stable reading milestone instead of an active lane.`;
}

function createProgramMilestoneMeta(response: ChapterListResponse, readChapterIds: string[]): string | undefined {
  const volume = findLatestFinishedVolume(response, readChapterIds);
  if (!volume) {
    return undefined;
  }

  return `${volume.chapters.length}/${volume.chapters.length} chapters tracked`;
}

export function createTocController(options: CreateTocControllerOptions) {
  const {
    kernel,
    loginRouteId,
    catalogRouteId,
    novelDetailRouteId,
    readerRouteId,
    membershipRouteId,
    requestPath = "/chapters",
    progressRequestPath = "/reading-progress",
    latestMilestoneStorageKey = LATEST_READING_MILESTONE_STORAGE_KEY,
    latestMilestoneHistoryStorageKey = LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
    initialState,
  } = options;
  const store = createStore<TocState>({
    ...cloneInitialState(createInitialTocState()),
    ...initialState,
  });
  const { routeToLogin } = createControllerRouterHelpers({
    kernel,
    loginRouteId,
  });

  function resolveNovelId(): string | undefined {
    const current = kernel.router.current();
    if (current.ok && typeof current.value?.params?.novelId === "string") {
      return current.value.params.novelId;
    }

    return store.getState().novelId;
  }

  function resolveRouteChapterId(): string | undefined {
    const current = kernel.router.current();
    if (current.ok && typeof current.value?.params?.chapterId === "string") {
      return current.value.params.chapterId;
    }

    return store.getState().highlightedChapterId;
  }

  function deriveSelectedChapterId(response: ChapterListResponse, fallback?: string): string | undefined {
    if (fallback && response.volumes.some((volume) => volume.chapters.some((chapter) => chapter.id === fallback))) {
      return fallback;
    }

    return response.continueChapterId ?? response.volumes[0]?.chapters[0]?.id;
  }

  function chapterExists(response: ChapterListResponse, chapterId: string | undefined): chapterId is string {
    return typeof chapterId === "string" && response.volumes.some((volume) => volume.chapters.some((chapter) => chapter.id === chapterId));
  }

  async function persistLatestMilestone(
    novelId: string,
    chapterId: string | undefined,
    title: string | undefined,
    copy: string | undefined,
    meta: string | undefined,
  ) {
    if (!title || !copy) {
      return ok(undefined);
    }

    const snapshot: LatestReadingMilestoneSnapshot = {
      novelId,
      ...(chapterId ? { chapterId } : {}),
      title,
      copy,
      ...(meta ? { meta } : {}),
      source: "toc",
      type: "volume-complete",
      savedAt: new Date().toISOString(),
    };
    const historyResult = await kernel.storage.get<LatestReadingMilestoneSnapshot[]>(latestMilestoneHistoryStorageKey);
    const nextHistory = mergeLatestReadingMilestoneHistory(historyResult.ok ? historyResult.value : [], snapshot);
    const latestResult = await kernel.storage.set<LatestReadingMilestoneSnapshot>(latestMilestoneStorageKey, snapshot);
    if (!latestResult.ok) {
      return latestResult;
    }

    return kernel.storage.set<LatestReadingMilestoneSnapshot[]>(latestMilestoneHistoryStorageKey, nextHistory);
  }

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    selectChapter(chapterId: string) {
      const current = store.getState();
      const selectedVolumeId = current.volumes.find((volume) => volume.chapters.some((chapter) => chapter.id === chapterId))?.id;
      const presentation = deriveSelectedChapterPresentation(
        {
          novelId: current.novelId ?? "",
          volumes: current.volumes,
          totalChapters: current.volumes.flatMap((volume) => volume.chapters).length,
          ...(current.continueChapterId ? { continueChapterId: current.continueChapterId } : {}),
        },
        chapterId,
      );

      store.setState({
        selectedChapterId: chapterId,
        highlightedChapterId: chapterId,
        ...(selectedVolumeId ? { expandedVolumeId: selectedVolumeId } : {}),
        ...presentation,
      });
    },

    toggleVolume(volumeId: string) {
      const current = store.getState();
      const exists = current.volumes.some((volume) => volume.id === volumeId);
      if (!exists) {
        return;
      }

      store.setState({
        expandedVolumeId: current.expandedVolumeId === volumeId ? undefined : volumeId,
      });
    },

    jumpToCurrentChapter() {
      const current = store.getState();
      if (!current.currentChapterId) {
        return;
      }

      const currentVolumeId = current.currentVolumeId;
      const presentation = deriveSelectedChapterPresentation(
        {
          novelId: current.novelId ?? "",
          volumes: current.volumes,
          totalChapters: current.volumes.flatMap((volume) => volume.chapters).length,
          ...(current.continueChapterId ? { continueChapterId: current.continueChapterId } : {}),
        },
        current.currentChapterId,
      );

      store.setState({
        selectedChapterId: current.currentChapterId,
        highlightedChapterId: current.currentChapterId,
        ...(currentVolumeId ? { expandedVolumeId: currentVolumeId } : {}),
        ...presentation,
      });
    },

    async load() {
      const novelId = resolveNovelId();
      if (!novelId) {
        store.setState({
          loading: false,
          errorText: "Novel id is missing.",
        });
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorText: undefined,
      });

      const [chaptersResult, progressResult] = await Promise.all([
        kernel.request.get<ChapterListResponse>(requestPath, { novelId }),
        kernel.request.get<LoadReadingProgressResponse>(progressRequestPath, { novelId }),
      ]);

      if (!chaptersResult.ok) {
        store.setState({
          loading: false,
          errorText: chaptersResult.error.message,
        });

        if (chaptersResult.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return chaptersResult;
      }

      if (!progressResult.ok && progressResult.error.code === "UNAUTHORIZED") {
        store.setState({
          loading: false,
          errorText: progressResult.error.message,
        });

        return routeToLogin();
      }

      const progressChapterId =
        progressResult.ok && progressResult.value.progress?.novelId === novelId
          ? progressResult.value.progress.chapterId
          : undefined;
      const routeChapterId = resolveRouteChapterId();
      const continueChapterId = chapterExists(chaptersResult.value, progressChapterId)
        ? progressChapterId
        : chaptersResult.value.continueChapterId;
      const highlightedChapterId = chapterExists(chaptersResult.value, routeChapterId)
        ? routeChapterId
        : continueChapterId;
      const currentVolumeId = findVolumeIdByChapterId(chaptersResult.value, highlightedChapterId);
      const readChapterIds = deriveReadChapterIds(chaptersResult.value, highlightedChapterId);

      const selectedChapterId = deriveSelectedChapterId(
        {
          ...chaptersResult.value,
          ...(highlightedChapterId ? { continueChapterId: highlightedChapterId } : {}),
        },
        store.getState().selectedChapterId,
      );

      store.setState({
        ready: true,
        loading: false,
        novelId,
        volumes: chaptersResult.value.volumes,
        continueChapterId,
        currentChapterId: highlightedChapterId,
        currentVolumeId,
        highlightedChapterId,
        expandedVolumeId: deriveExpandedVolumeId(chaptersResult.value, currentVolumeId),
        readChapterIds,
        currentVolumeProgressLabel: createCurrentVolumeProgressLabel(chaptersResult.value, currentVolumeId, readChapterIds),
        currentVolumeSummary: createCurrentVolumeSummary(chaptersResult.value, currentVolumeId, continueChapterId),
        nextVolumeHandoffLabel: createNextVolumeHandoffLabel(chaptersResult.value, currentVolumeId, readChapterIds),
        backlogReentryLabel: createBacklogReentryLabel(chaptersResult.value, readChapterIds),
        programMilestoneTitle: createProgramMilestoneTitle(chaptersResult.value, readChapterIds),
        programMilestoneCopy: createProgramMilestoneCopy(chaptersResult.value, readChapterIds),
        programMilestoneMeta: createProgramMilestoneMeta(chaptersResult.value, readChapterIds),
        selectedChapterId,
        ...deriveSelectedChapterPresentation(
          {
            ...chaptersResult.value,
            ...(highlightedChapterId ? { continueChapterId: highlightedChapterId } : {}),
          },
          selectedChapterId,
        ),
        errorText: undefined,
      });
      await persistLatestMilestone(
        novelId,
        selectedChapterId,
        createProgramMilestoneTitle(chaptersResult.value, readChapterIds),
        createProgramMilestoneCopy(chaptersResult.value, readChapterIds),
        createProgramMilestoneMeta(chaptersResult.value, readChapterIds),
      );

      return chaptersResult;
    },

    async goToReader(chapterId?: string) {
      const current = store.getState();
      const novelId = resolveNovelId();
      const targetChapterId = chapterId ?? current.selectedChapterId ?? current.continueChapterId;
      if (!novelId || !targetChapterId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(readerRouteId, {
        novelId,
        chapterId: targetChapterId,
      });
    },

    async openSelectedChapter() {
      return this.goToReader();
    },

    async goToNovelDetail() {
      const novelId = resolveNovelId();
      if (!novelId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(novelDetailRouteId, { novelId });
    },

    async goToCatalog() {
      return kernel.router.toRoute(catalogRouteId);
    },

    async goToMembership(chapterId?: string) {
      const novelId = resolveNovelId();
      const targetChapterId = chapterId ?? store.getState().selectedChapterId;
      if (!membershipRouteId || !novelId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(membershipRouteId, {
        novelId,
        ...(targetChapterId ? { chapterId: targetChapterId } : {}),
        source: "toc",
      });
    },
  };
}
