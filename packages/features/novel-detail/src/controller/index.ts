import {
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  createAuthRedirectParams,
  createDetailStatus,
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
    ...(initialState.detail ? { detail: cloneStateSnapshot(initialState.detail) } : {}),
    ...(initialState.detailData ? { detailData: cloneStateSnapshot(initialState.detailData) } : {}),
    detailStatus: cloneStateSnapshot(initialState.detailStatus),
    detailActions: cloneStateSnapshotArray(initialState.detailActions),
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
  if (detail.contentAccess?.summaryLabel) {
    return detail.trialRuleLabel
      ? `${detail.trialRuleLabel}. ${detail.contentAccess.summaryLabel}`
      : detail.contentAccess.summaryLabel;
  }

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

  if (detail.contentDetail?.display?.recommendationSlotLabel) {
    return `${detail.contentDetail.display.recommendationSlotLabel} keeps this title legible as a reusable return point instead of a one-off merch surface.`;
  }

  return "Adding this title to shelf turns the page into a reusable reading return point instead of a one-off merch surface.";
}

function deriveEntryContext(kernel: AppKernel): NovelDetailState["detailStatus"]["entryContext"] {
  const current = kernel.router.current();
  if (!current.ok) {
    return "unknown";
  }

  const source = typeof current.value?.params?.source === "string" ? current.value.params.source : undefined;
  if (source === "share") {
    return "share";
  }

  if (source && ["catalog", "feed", "items", "bookshelf", "messages", "search", "list"].includes(source)) {
    return "list";
  }

  return current.value?.path ? "deep_link" : "unknown";
}

function createDetailActions(detail: NovelDetail, state: Pick<NovelDetailState, "membershipLocked" | "bookshelfBusy">) {
  const actions: NovelDetailState["detailActions"] = [];
  const primaryLabel = state.membershipLocked ? "Unlock membership" : detail.continueChapterId ? "Continue reading" : "Start reading";

  actions.push({
    key: state.membershipLocked ? "open-membership" : detail.continueChapterId ? "continue-reading" : "start-reading",
    label: primaryLabel,
    enabled: true,
    emphasis: "primary",
  });

  actions.push({
    key: detail.inBookshelf ? "remove-bookshelf" : "add-bookshelf",
    label: detail.inBookshelf ? "Remove from shelf" : "Add to shelf",
    enabled: !state.bookshelfBusy,
    emphasis: detail.inBookshelf ? "secondary" : "secondary",
  });

  actions.push({
    key: "open-toc",
    label: "Open table of contents",
    enabled: true,
    emphasis: "secondary",
  });

  if (detail.requiresMembership && !detail.isPurchased) {
    actions.push({
      key: "view-membership",
      label: "View membership",
      enabled: true,
      emphasis: "secondary",
    });
  }

  return actions;
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
          detailStatus: {
            ...store.getState().detailStatus,
            loadState: "error",
            entryContext: deriveEntryContext(kernel),
          },
        });
        return ok(undefined);
      }

      store.setState({
        loading: true,
        errorText: undefined,
        bookshelfBusy: false,
        bookshelfNotice: undefined,
        detailStatus: {
          ...store.getState().detailStatus,
          loadState: "loading",
          entryContext: deriveEntryContext(kernel),
          invalidated: false,
          deleted: false,
          permissionDenied: false,
          offline: false,
          unpublished: false,
        },
      });

      const [detailResult, progressResult] = await Promise.all([
        kernel.request.get<NovelDetail>(requestPath, { novelId }),
        kernel.request.get<LoadReadingProgressResponse>(progressRequestPath, { novelId }),
      ]);

      if (!detailResult.ok) {
        store.setState({
          loading: false,
          errorText: detailResult.error.message,
          detailStatus: {
            ...store.getState().detailStatus,
            loadState: detailResult.error.code === "FORBIDDEN" ? "forbidden" : "error",
            permissionDenied: detailResult.error.code === "FORBIDDEN",
          },
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
          detailStatus: {
            ...store.getState().detailStatus,
            loadState: "error",
          },
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
      const membershipLocked = Boolean(detail.requiresMembership && !detail.isPurchased && !detail.isTrial && !detail.isFree);
      const detailActions = createDetailActions(detail, {
        membershipLocked,
        bookshelfBusy: false,
      });

      store.setState({
        ready: true,
        loading: false,
        novelId,
        detail,
        detailData: detail,
        title: detail.title,
        detailStatus: createDetailStatus("ready", {
          entryContext: deriveEntryContext(kernel),
        }),
        detailActions,
        membershipLocked,
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
        detailActions: current.detail ? createDetailActions(current.detail, {
          membershipLocked: current.membershipLocked,
          bookshelfBusy: true,
        }) : current.detailActions,
      });

      const result = await kernel.request.post<BookshelfMutationResponse>(bookshelfRequestPath, {
        novelId,
      } satisfies AddToBookshelfRequest);

      if (!result.ok) {
        store.setState({
          bookshelfBusy: false,
          errorText: result.error.message,
          detailActions: current.detail
            ? createDetailActions(current.detail, {
                membershipLocked: current.membershipLocked,
                bookshelfBusy: false,
              })
            : current.detailActions,
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
        detailData: {
          ...detail,
          inBookshelf: result.value.inBookshelf,
          bookshelfCount: result.value.bookshelfCount,
        },
        bookshelfSummary: "This title is already on shelf, so the next return can happen from the shelf workspace as well as from detail.",
        bookshelfBusy: false,
        bookshelfNotice: "Added to shelf. You can now resume it from the bookshelf workspace.",
        errorText: undefined,
        detailActions: createDetailActions(
          {
            ...detail,
            inBookshelf: result.value.inBookshelf,
            bookshelfCount: result.value.bookshelfCount,
          },
          {
            membershipLocked: current.membershipLocked,
            bookshelfBusy: false,
          },
        ),
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
        detailActions: current.detail ? createDetailActions(current.detail, {
          membershipLocked: current.membershipLocked,
          bookshelfBusy: true,
        }) : current.detailActions,
      });

      const result = await kernel.request.delete<BookshelfMutationResponse>(bookshelfRequestPath, {
        novelId,
      } satisfies RemoveFromBookshelfRequest);

      if (!result.ok) {
        store.setState({
          bookshelfBusy: false,
          errorText: result.error.message,
          detailActions: current.detail
            ? createDetailActions(current.detail, {
                membershipLocked: current.membershipLocked,
                bookshelfBusy: false,
              })
            : current.detailActions,
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
        detailData: {
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
        detailActions: createDetailActions(
          {
            ...detail,
            inBookshelf: result.value.inBookshelf,
            bookshelfCount: result.value.bookshelfCount,
          },
          {
            membershipLocked: current.membershipLocked,
            bookshelfBusy: false,
          },
        ),
      });

      return result;
    },
  };
}
