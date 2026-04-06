import test from "node:test";
import assert from "node:assert/strict";

import { APP_ROUTE_IDS } from "@minix/contracts";
import { ok, type AppKernel } from "@minix/core";
import type { ChapterContent, ChapterListResponse, LoadReadingProgressResponse, SaveReadingProgressRequest } from "@minix/contracts";

import { createReaderController } from "./index";

interface KernelStubOptions {
  chapter?: ChapterContent;
  progress?: LoadReadingProgressResponse;
  currentParams?: Record<string, string>;
  now?: string;
}

function createKernelStub(options: KernelStubOptions = {}) {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const savedPayloads: SaveReadingProgressRequest[] = [];
  const storageValues = new Map<string, unknown>();
  const currentParams = options.currentParams ?? {
    novelId: "novel_lantern",
    chapterId: "lantern_ch_02",
  };
  const chapter: ChapterContent =
    options.chapter ?? {
      id: "lantern_ch_02",
      novelId: "novel_lantern",
      title: "Chapter 2 · A Door Behind Smoke",
      order: 2,
      content: "The room behind the wall contained no treasure.\n\nIt held a table and an erased witness statement.",
      wordCount: 4380,
      updatedAt: "2026-03-22T08:00:00.000Z",
      nav: {
        previousChapterId: "lantern_ch_01",
        nextChapterId: "lantern_ch_03",
      },
      isFree: true,
      isTrial: true,
      requiresMembership: false,
      isPurchased: true,
    };
  const progress: LoadReadingProgressResponse = options.progress ?? {
    progress: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_02",
      progressPercent: 0.36,
      updatedAt: "2026-03-24T10:00:00.000Z",
    },
  };
  const chapterList: ChapterListResponse = {
    novelId: chapter.novelId,
    totalChapters: 3,
    volumes: [
      {
        id: "lantern_vol_01",
        novelId: chapter.novelId,
        title: "Volume I",
        order: 1,
        chapters: [
          {
            id: "lantern_ch_01",
            novelId: chapter.novelId,
            volumeId: "lantern_vol_01",
            title: "Chapter 1 · Lantern Alley",
            order: 1,
            wordCount: 4100,
            updatedAt: "2026-03-21T08:00:00.000Z",
            isFree: true,
            isTrial: true,
            requiresMembership: false,
            isPurchased: true,
          },
          {
            id: "lantern_ch_02",
            novelId: chapter.novelId,
            volumeId: "lantern_vol_01",
            title: "Chapter 2 · A Door Behind Smoke",
            order: 2,
            wordCount: 4380,
            updatedAt: "2026-03-22T08:00:00.000Z",
            isFree: true,
            isTrial: true,
            requiresMembership: false,
            isPurchased: true,
          },
          {
            id: "lantern_ch_03",
            novelId: chapter.novelId,
            volumeId: "lantern_vol_01",
            title: "Chapter 3 · The Room with No Witness",
            order: 3,
            wordCount: 4520,
            updatedAt: "2026-03-23T08:00:00.000Z",
            isFree: true,
            isTrial: true,
            requiresMembership: false,
            isPurchased: true,
          },
        ],
      },
    ],
    ...(currentParams.chapterId ? { continueChapterId: currentParams.chapterId } : {}),
  };

  const kernel: AppKernel = {
    env: {
      appId: "test",
      appName: "test",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "0.1.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {
      async get<T>(key: string) { return ok((storageValues.get(key) as T | undefined) ?? null); },
      async set<T>(key: string, value: T) {
        storageValues.set(key, value);
        return ok(undefined);
      },
      async remove(key: string) {
        storageValues.delete(key);
        return ok(undefined);
      },
      async clear() {
        storageValues.clear();
        return ok(undefined);
      },
    },
    session: {
      async get() { return ok(null); },
      async set() { return ok(undefined); },
      async clear() { return ok(undefined); },
      async isLoggedIn() { return ok(false); },
    },
    request: {
      async get<T>(url: string) {
        if (url === "/chapters/content") {
          return ok(chapter as T);
        }

        if (url === "/chapters") {
          return ok(chapterList as T);
        }

        if (url === "/reading-progress") {
          return ok(progress as T);
        }

        return ok({} as T);
      },
      async post<T>(url: string, body?: unknown) {
        if (url === "/reading-progress") {
          savedPayloads.push(body as SaveReadingProgressRequest);
          return ok({
            saved: true,
            progress: {
              ...(body as SaveReadingProgressRequest),
              updatedAt: "2026-03-24T10:05:00.000Z",
            },
          } as T);
        }

        return ok({} as T);
      },
      async put<T>() { return ok({} as T); },
      async patch<T>() { return ok({} as T); },
      async delete<T>() { return ok({} as T); },
    },
    auth: {
      async ensureLogin() {
        return ok({ loggedIn: true, platform: "h5", identity: { userId: "u" }, token: { accessToken: "t" } });
      },
      async login() {
        return ok({ loggedIn: true, platform: "h5", identity: { userId: "u" }, token: { accessToken: "t" } });
      },
      async logout() { return ok(undefined); },
      async exchangeToken() {
        return ok({ loggedIn: true, platform: "h5", identity: { userId: "u" }, token: { accessToken: "t" } });
      },
    },
    router: {
      async to() { return ok(undefined); },
      async replace() { return ok(undefined); },
      async toRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      async replaceRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      resolve() { return ok("/reader"); },
      async back() { return ok(undefined); },
      current() {
        return ok({
          path: "/reader",
          params: currentParams,
        });
      },
    },
    ui: {
      async toast() { return ok(undefined); },
      async loading() { return ok(undefined); },
      async modal() { return ok(true); },
    },
  };

  return { kernel, routeCalls, savedPayloads, storageValues };
}

function createControllerHarness(options: KernelStubOptions = {}) {
  const harness = createKernelStub(options);
  const controller = createReaderController({
    kernel: harness.kernel,
    readerRouteId: APP_ROUTE_IDS.reader,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    tocRouteId: APP_ROUTE_IDS.toc,
    now: () => new Date(options.now ?? "2026-03-24T10:18:00.000Z"),
  });

  return {
    ...harness,
    controller,
  };
}

test("reader controller marks state ready", () => {
  const { controller } = createControllerHarness();

  assert.equal(controller.store.getState().ready, false);
  controller.markReady();
  assert.equal(controller.store.getState().ready, true);
});

test("reader controller loads chapter content and persisted progress", async () => {
  const { controller } = createControllerHarness();

  const result = await controller.load();

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().chapter?.id, "lantern_ch_02");
  assert.equal(controller.store.getState().progressPercent, 0.36);
  assert.equal(controller.store.getState().lastSavedAt, "2026-03-24T10:00:00.000Z");
  assert.equal(controller.store.getState().currentVolumeTitle, "Volume I");
  assert.equal(controller.store.getState().nextChapterTitle, "Chapter 3 · The Room with No Witness");
  assert.deepEqual(controller.store.getState().readChapterIds, ["lantern_ch_01", "lantern_ch_02"]);
  assert.equal(controller.store.getState().sessionElapsedMinutes, 18);
  assert.equal(controller.store.getState().sessionElapsedLabel, "18 min active");
  assert.equal(controller.store.getState().volumeProgressLabel, "Volume I · 2/3 chapters tracked");
  assert.match(controller.store.getState().activeProgramSummary ?? "", /active program step|active/i);
  assert.match(controller.store.getState().volumeHandoffLabel ?? "", /no later volume handoff|final active volume/i);
  assert.equal(controller.store.getState().programMilestoneTitle, undefined);
});

test("reader controller forces a display refresh notice after returning from settings", async () => {
  const { controller, storageValues } = createControllerHarness({
    currentParams: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_02",
      displaySync: "1",
      source: "settings",
    },
  });
  storageValues.set("reader.display", {
    theme: "night",
    mode: "page",
    fontScale: 1.2,
    nightModeDefault: "manual-only",
  });
  const result = await controller.load();

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().theme, "night");
  assert.equal(controller.store.getState().mode, "page");
  assert.equal(controller.store.getState().fontScale, 1.2);
  assert.equal(
    controller.store.getState().displaySyncMessage,
    "Display preferences refreshed from settings for this reading session.",
  );
});

test("reader controller saves progress before routing to next chapter", async () => {
  const { controller, routeCalls, savedPayloads } = createControllerHarness();

  await controller.load();
  const result = await controller.goToNextChapter();

  assert.equal(result.ok, true);
  assert.deepEqual(savedPayloads.at(-1), {
    novelId: "novel_lantern",
    chapterId: "lantern_ch_02",
    progressPercent: 1,
  });
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.reader,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
      completedFrom: "1",
    },
  });
  assert.equal(controller.store.getState().lastSavedAt, "2026-03-24T10:05:00.000Z");
  assert.equal(controller.store.getState().progressPercent, 1);
});

test("reader controller can mark the current chapter complete without leaving the page", async () => {
  const { controller, routeCalls, savedPayloads, storageValues } = createControllerHarness();

  await controller.load();
  const result = await controller.completeChapter();

  assert.equal(result.ok, true);
  assert.deepEqual(savedPayloads.at(-1), {
    novelId: "novel_lantern",
    chapterId: "lantern_ch_02",
    progressPercent: 1,
  });
  assert.equal(routeCalls.length, 0);
  assert.equal(controller.store.getState().progressPercent, 1);
  assert.equal(controller.store.getState().chapterCompletionState, "completed");
  assert.equal(
    controller.store.getState().chapterCompletionMessage,
    "Chapter complete. Chapter 3 · The Room with No Witness is ready as the next reading step.",
  );
  assert.equal(
    controller.store.getState().completionSummaryTitle,
    "Chapter 2 · A Door Behind Smoke complete",
  );
  assert.equal(
    controller.store.getState().completionSummaryMeta,
    "Volume I · 2/3 chapters tracked",
  );
  assert.equal(
    (storageValues.get("novel.latest-milestone") as { type?: string } | undefined)?.type,
    "chapter-recap",
  );
});

test("reader controller can complete the current chapter and continue to the next one", async () => {
  const { controller, routeCalls, savedPayloads } = createControllerHarness();

  await controller.load();
  const result = await controller.completeChapterAndContinue();

  assert.equal(result.ok, true);
  assert.deepEqual(savedPayloads.at(-1), {
    novelId: "novel_lantern",
    chapterId: "lantern_ch_02",
    progressPercent: 1,
  });
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.reader,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
      completedFrom: "1",
    },
  });
});

test("reader controller shows a continued-reading completion cue after advancing to the next chapter", async () => {
  const { controller } = createControllerHarness({
    chapter: {
      id: "lantern_ch_03",
      novelId: "novel_lantern",
      title: "Chapter 3 · The Room with No Witness",
      order: 3,
      content: "The witness room still held the shape of a recent conversation.",
      wordCount: 4520,
      updatedAt: "2026-03-23T08:00:00.000Z",
      nav: {
        previousChapterId: "lantern_ch_02",
      },
      isFree: true,
      isTrial: true,
      requiresMembership: false,
      isPurchased: true,
    },
    progress: {
      progress: {
        novelId: "novel_lantern",
        chapterId: "lantern_ch_03",
        progressPercent: 0.12,
        updatedAt: "2026-03-24T10:10:00.000Z",
      },
    },
    currentParams: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
      completedFrom: "1",
    },
  });

  await controller.load();

  assert.equal(controller.store.getState().chapterCompletionState, "continued");
  assert.equal(
    controller.store.getState().chapterCompletionMessage,
    "Previous chapter complete. You are now in Chapter 3 · The Room with No Witness.",
  );
  assert.equal(
    controller.store.getState().completionSummaryTitle,
    "Moved into the latest available chapter",
  );
});

test("reader controller promotes completed volumes into program milestones", async () => {
  const { controller, storageValues } = createControllerHarness({
    chapter: {
      id: "lantern_ch_03",
      novelId: "novel_lantern",
      title: "Chapter 3 · The Room with No Witness",
      order: 3,
      content: "The witness room still held the shape of a recent conversation.",
      wordCount: 4520,
      updatedAt: "2026-03-23T08:00:00.000Z",
      nav: {
        previousChapterId: "lantern_ch_02",
      },
      isFree: true,
      isTrial: true,
      requiresMembership: false,
      isPurchased: true,
    },
    progress: {
      progress: {
        novelId: "novel_lantern",
        chapterId: "lantern_ch_03",
        progressPercent: 1,
        updatedAt: "2026-03-24T10:10:00.000Z",
      },
    },
    currentParams: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
    },
  });

  await controller.load();

  assert.equal(controller.store.getState().programMilestoneTitle, "Volume I complete");
  assert.match(controller.store.getState().programMilestoneCopy ?? "", /stable volume milestone|stable milestone/i);
  assert.equal(controller.store.getState().programMilestoneMeta, "3/3 chapters tracked");
  assert.equal(
    (storageValues.get("novel.latest-milestone") as { type?: string } | undefined)?.type,
    "volume-complete",
  );
});

test("reader controller routes to toc with the active chapter id for persistent highlighting", async () => {
  const { controller, routeCalls, savedPayloads } = createControllerHarness();

  await controller.load();
  const result = await controller.goToToc();

  assert.equal(result.ok, true);
  assert.deepEqual(savedPayloads.at(-1), {
    novelId: "novel_lantern",
    chapterId: "lantern_ch_02",
    progressPercent: 0.36,
  });
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.toc,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_02",
    },
  });
});

test("reader controller can jump to a selected chapter from the reader surface", async () => {
  const { controller, routeCalls, savedPayloads } = createControllerHarness();

  await controller.load();
  controller.setProgress(0.58);
  const result = await controller.goToChapter("lantern_ch_01");

  assert.equal(result.ok, true);
  assert.deepEqual(savedPayloads.at(-1), {
    novelId: "novel_lantern",
    chapterId: "lantern_ch_02",
    progressPercent: 0.58,
  });
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.reader,
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_01",
    },
  });
});

test("reader controller marks premium chapters as locked and can route to membership", async () => {
  const { kernel, routeCalls } = createKernelStub({
    chapter: {
      id: "brocade_ch_03",
      novelId: "novel_brocade",
      title: "Chapter 3 · The Unnamed Seal",
      order: 3,
      content: "Behind the third drawer lay a wax seal without a household mark.",
      wordCount: 5340,
      updatedAt: "2026-03-24T08:00:00.000Z",
      nav: {
        previousChapterId: "brocade_ch_02",
        nextChapterId: "brocade_ch_04",
      },
      isFree: false,
      isTrial: false,
      requiresMembership: true,
      isPurchased: false,
    },
    progress: {
      progress: {
        novelId: "novel_brocade",
        chapterId: "brocade_ch_03",
        progressPercent: 0.1,
        updatedAt: "2026-03-24T10:00:00.000Z",
      },
    },
    currentParams: {
      novelId: "novel_brocade",
      chapterId: "brocade_ch_03",
    },
  });
  const controller = createReaderController({
    kernel,
    readerRouteId: APP_ROUTE_IDS.reader,
    novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
    tocRouteId: APP_ROUTE_IDS.toc,
    membershipRouteId: APP_ROUTE_IDS.membership,
  });

  await controller.load();
  await controller.goToMembership();

  assert.equal(controller.store.getState().accessState, "locked");
  assert.equal(controller.store.getState().accessMessage, "Membership is required before this title or chapter can continue.");
  assert.equal(controller.store.getState().membershipActionLabel, "Unlock full title");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.membership,
    params: {
      novelId: "novel_brocade",
      chapterId: "brocade_ch_03",
      source: "reader",
    },
  });
});

test("reader controller hydrates and persists display preferences", async () => {
  const { controller, storageValues } = createControllerHarness();
  storageValues.set("reader.display", {
    theme: "sepia",
    mode: "page",
    fontScale: 1.2,
    nightModeDefault: "manual-only",
  });

  await controller.load();
  assert.equal(controller.store.getState().theme, "sepia");
  assert.equal(controller.store.getState().mode, "page");
  assert.equal(controller.store.getState().fontScale, 1.2);

  await controller.cycleTheme();
  await controller.cycleMode();
  await controller.increaseFontScale();

  const stored = storageValues.get("reader.display") as {
    theme: string;
    mode: string;
    fontScale: number;
    nightModeDefault: string;
  };

  assert.deepEqual(stored, {
    theme: "night",
    mode: "scroll",
    fontScale: 1.3,
    nightModeDefault: "manual-only",
  });
});

test("reader controller applies after-dusk night mode default on load", async () => {
  const { controller, storageValues } = createControllerHarness({
    now: "2026-03-24T21:18:00.000Z",
  });
  storageValues.set("reader.display", {
    theme: "paper",
    mode: "scroll",
    fontScale: 1,
    nightModeDefault: "after-dusk",
  });

  await controller.load();

  assert.equal(controller.store.getState().theme, "night");
  assert.equal(controller.store.getState().nightModeDefault, "after-dusk");
});
