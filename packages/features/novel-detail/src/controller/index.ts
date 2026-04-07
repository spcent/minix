import {
  createAuthRedirectParams,
  ok,
  createStore,
  deriveLatestMilestoneContinuity,
  deriveNovelAccessPresentation,
  LATEST_READING_MILESTONE_STORAGE_KEY,
  type AppKernel,
  type LatestReadingMilestoneSnapshot,
} from "@minix/core";
import {
  type AddToBookshelfRequest,
  type AppRouteId,
  type BookshelfMutationResponse,
  type LoadReadingProgressResponse,
  type NovelDetail,
  type RemoveFromBookshelfRequest,
} from "@minix/contracts";

import { createInitialNovelDetailState, type NovelDetailState } from "../model";

export interface CreateNovelDetailControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  novelDetailRouteId: AppRouteId;
  catalogRouteId: AppRouteId;
  tocRouteId: AppRouteId;
  readerRouteId: AppRouteId;
  bookshelfRouteId?: AppRouteId;
  membershipRouteId?: AppRouteId;
  requestPath?: string;
  progressRequestPath?: string;
  bookshelfRequestPath?: string;
  latestMilestoneStorageKey?: string;
  initialState?: Partial<NovelDetailState>;
}

function cloneInitialState(initialState: NovelDetailState): NovelDetailState {
  return {
    ...initialState,
    ...(initialState.detail ? { detail: { ...initialState.detail } } : {}),
  };
}

function createReputationSummary(detail: NovelDetail): string {
  if (detail.ratingScore !== undefined && detail.ratingCount !== undefined) {
    const favoritePart =
      detail.favoriteCount !== undefined
        ? ` and ${detail.favoriteCount} shelf-side favorites`
        : "";
    return `${detail.ratingScore.toFixed(1)} average from ${detail.ratingCount} reader ratings${favoritePart}.`;
  }

  if (detail.favoriteCount !== undefined) {
    return `${detail.favoriteCount} readers have already marked this title for return or collection value.`;
  }

  return "Reader reputation is still forming, so the dossier should lean harder on editorial framing and access clarity.";
}

function createCadenceSummary(detail: NovelDetail): string {
  if (detail.updateCadenceLabel && detail.updateHistoryLabel) {
    return `${detail.updateCadenceLabel}. ${detail.updateHistoryLabel}`;
  }

  if (detail.updateCadenceLabel) {
    return `${detail.updateCadenceLabel}. Release rhythm is already part of the reading promise for this title.`;
  }

  if (detail.latestChapter?.title) {
    return `${detail.latestChapter.title} is the latest visible movement on this title.`;
  }

  return "Release rhythm is still quiet, so the detail page should explain the title through story promise rather than freshness alone.";
}

function createTrialSummary(detail: NovelDetail, accessSummary: string | undefined): string {
  if (detail.trialRuleLabel && detail.accessRuleSummaryLabel) {
    return `${detail.trialRuleLabel}. ${detail.accessRuleSummaryLabel}`;
  }

  if (detail.trialRuleLabel) {
    return detail.trialRuleLabel;
  }

  if (detail.accessRuleSummaryLabel) {
    return detail.accessRuleSummaryLabel;
  }

  if (accessSummary) {
    return accessSummary;
  }

  return detail.requiresMembership
    ? "Premium access applies after the visible free or trial boundary."
    : "Open-access reading starts here, with continuation available once progress is saved.";
}

function createBookshelfSummary(detail: NovelDetail): string {
  if (detail.inBookshelf) {
    return "This title is already on shelf, so the next return can happen from the shelf workspace as well as from detail.";
  }

  if (detail.bookshelfCount !== undefined) {
    return `${detail.bookshelfCount} shelf adds suggest this title already behaves like a strong return candidate.`;
  }

  return "Adding this title to shelf turns the page into a reusable reading return point instead of a one-off merch surface.";
}

export function createNovelDetailController(options: CreateNovelDetailControllerOptions) {
  const {
    kernel,
    loginRouteId,
    novelDetailRouteId,
    catalogRouteId,
    tocRouteId,
    readerRouteId,
    bookshelfRouteId,
    membershipRouteId,
    requestPath = "/novels/detail",
    progressRequestPath = "/reading-progress",
    bookshelfRequestPath = "/bookshelf",
    latestMilestoneStorageKey = LATEST_READING_MILESTONE_STORAGE_KEY,
    initialState,
  } = options;
  const store = createStore<NovelDetailState>({
    ...cloneInitialState(createInitialNovelDetailState()),
    ...initialState,
  });

  function resolveNovelId(): string | undefined {
    const current = kernel.router.current();
    if (current.ok && typeof current.value?.params?.novelId === "string") {
      return current.value.params.novelId;
    }

    return store.getState().novelId;
  }

  async function routeToOptional(routeId: AppRouteId | undefined, params?: Record<string, string | number | boolean>) {
    if (!routeId) {
      return ok(undefined);
    }

    return kernel.router.toRoute(routeId, params);
  }

  async function routeToLogin() {
    if (!loginRouteId) {
      return ok(undefined);
    }

    const current = kernel.router.current();
    return kernel.router.replaceRoute(
      loginRouteId,
      createAuthRedirectParams({
        ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
        ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
        reason: "auth-required",
      }),
    );
  }

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    setNovelId(novelId: string) {
      store.setState({
        novelId,
      });
    },

    toggleSummary() {
      const current = store.getState();
      store.setState({
        summaryExpanded: !current.summaryExpanded,
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
        bookshelfBusy: false,
        bookshelfNotice: undefined,
      });

      const [detailResult, progressResult] = await Promise.all([
        kernel.request.get<NovelDetail>(requestPath, { novelId }),
        kernel.request.get<LoadReadingProgressResponse>(progressRequestPath, { novelId }),
      ]);

      if (!detailResult.ok) {
        store.setState({
          loading: false,
          errorText: detailResult.error.message,
        });

        if (detailResult.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return detailResult;
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
      const detail = {
        ...detailResult.value,
        ...(progressChapterId ? { continueChapterId: progressChapterId } : {}),
      };
      const access = deriveNovelAccessPresentation(detail);
      const milestoneResult = await kernel.storage.get<LatestReadingMilestoneSnapshot>(latestMilestoneStorageKey);
      const milestone = milestoneResult.ok ? milestoneResult.value : null;
      const milestoneContinuity = deriveLatestMilestoneContinuity(milestone);

      store.setState({
        ready: true,
        loading: false,
        novelId,
        detail,
        title: detail.title,
        membershipLocked: Boolean(detail.requiresMembership && !detail.isPurchased && !detail.isTrial && !detail.isFree),
        membershipMessage: access.accessState !== "open" ? access.accessSummary : undefined,
        accessBadgeLabel: access.accessBadgeLabel,
        accessSummary: access.accessSummary,
        reputationSummary: createReputationSummary(detail),
        cadenceSummary: createCadenceSummary(detail),
        trialSummary: createTrialSummary(detail, access.accessSummary),
        bookshelfSummary: createBookshelfSummary(detail),
        latestMilestoneTitle: milestone?.title,
        latestMilestoneCopy: milestone?.copy,
        latestMilestoneMeta: milestone?.meta,
        latestMilestoneNovelId: milestone?.novelId,
        latestMilestoneChapterId: milestone?.chapterId,
        latestMilestoneSource: milestone?.source,
        latestMilestoneSourceLabel: milestoneContinuity?.sourceLabel,
        latestMilestoneRecencyLabel: milestoneContinuity?.recencyLabel,
        latestMilestoneReturnLabel: milestoneContinuity?.returnLabel,
        latestMilestoneReturnHint: milestoneContinuity?.returnHint,
        primaryActionLabel: access.primaryActionLabel,
        startActionLabel: access.startActionLabel,
        membershipActionLabel: access.membershipActionLabel,
        bookshelfBusy: false,
        bookshelfNotice: undefined,
        errorText: undefined,
      });

      return detailResult;
    },

    async goToCatalog() {
      return kernel.router.toRoute(catalogRouteId);
    },

    async goToRelatedNovel(novelId: string) {
      if (!novelId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(novelDetailRouteId, { novelId });
    },

    async goToBookshelf() {
      return routeToOptional(bookshelfRouteId);
    },

    async goToToc() {
      const novelId = resolveNovelId();
      if (!novelId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(tocRouteId, { novelId });
    },

    async startReading() {
      const current = store.getState();
      const novelId = resolveNovelId();
      const chapterId = current.detail?.firstChapterId ?? current.detail?.continueChapterId;
      if (!novelId || !chapterId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(readerRouteId, {
        novelId,
        chapterId,
      });
    },

    async continueReading() {
      const current = store.getState();
      const novelId = resolveNovelId();
      if (current.membershipLocked && membershipRouteId && novelId) {
        return kernel.router.toRoute(membershipRouteId, {
          novelId,
          source: "detail",
        });
      }

      const chapterId = current.detail?.continueChapterId ?? current.detail?.firstChapterId;
      if (!novelId || !chapterId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(readerRouteId, {
        novelId,
        chapterId,
      });
    },

    async goToMembership() {
      const novelId = resolveNovelId();
      if (!membershipRouteId || !novelId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(membershipRouteId, {
        novelId,
        source: "detail",
      });
    },

    async openLatestMilestone() {
      const current = store.getState();

      if (current.latestMilestoneSource === "reader" && current.latestMilestoneNovelId && current.latestMilestoneChapterId) {
        return kernel.router.toRoute(readerRouteId, {
          novelId: current.latestMilestoneNovelId,
          chapterId: current.latestMilestoneChapterId,
        });
      }

      if (current.latestMilestoneSource === "toc" && current.latestMilestoneNovelId) {
        return kernel.router.toRoute(tocRouteId, {
          novelId: current.latestMilestoneNovelId,
          ...(current.latestMilestoneChapterId ? { chapterId: current.latestMilestoneChapterId } : {}),
        });
      }

      if (current.latestMilestoneSource === "bookshelf" && bookshelfRouteId) {
        return kernel.router.toRoute(bookshelfRouteId);
      }

      if (current.latestMilestoneNovelId) {
        return kernel.router.toRoute(novelDetailRouteId, {
          novelId: current.latestMilestoneNovelId,
        });
      }

      return ok(undefined);
    },

    async addToBookshelf() {
      const current = store.getState();
      const novelId = resolveNovelId();
      const detail = current.detail;
      if (!novelId || !detail || detail.inBookshelf) {
        return ok(undefined);
      }

      store.setState({
        bookshelfBusy: true,
        bookshelfNotice: undefined,
      });

      const result = await kernel.request.post<BookshelfMutationResponse>(bookshelfRequestPath, {
        novelId,
      } satisfies AddToBookshelfRequest);

      if (!result.ok) {
        store.setState({
          bookshelfBusy: false,
          errorText: result.error.message,
        });

        if (result.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return result;
      }

      store.setState({
        detail: {
          ...detail,
          inBookshelf: result.value.inBookshelf,
          bookshelfCount: result.value.bookshelfCount,
        },
        bookshelfSummary: "This title is already on shelf, so the next return can happen from the shelf workspace as well as from detail.",
        bookshelfBusy: false,
        bookshelfNotice: "Added to shelf. You can now resume it from the bookshelf workspace.",
        errorText: undefined,
      });

      return result;
    },

    async removeFromBookshelf() {
      const current = store.getState();
      const novelId = resolveNovelId();
      const detail = current.detail;
      if (!novelId || !detail || !detail.inBookshelf) {
        return ok(undefined);
      }

      store.setState({
        bookshelfBusy: true,
        bookshelfNotice: undefined,
      });

      const result = await kernel.request.delete<BookshelfMutationResponse>(bookshelfRequestPath, {
        novelId,
      } satisfies RemoveFromBookshelfRequest);

      if (!result.ok) {
        store.setState({
          bookshelfBusy: false,
          errorText: result.error.message,
        });

        if (result.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return result;
      }

      store.setState({
        detail: {
          ...detail,
          inBookshelf: result.value.inBookshelf,
          bookshelfCount: result.value.bookshelfCount,
        },
        bookshelfSummary: createBookshelfSummary({
          ...detail,
          inBookshelf: result.value.inBookshelf,
          bookshelfCount: result.value.bookshelfCount,
        }),
        bookshelfBusy: false,
        bookshelfNotice: "Removed from shelf. The title can still be opened from the library or detail route.",
        errorText: undefined,
      });

      return result;
    },
  };
}
