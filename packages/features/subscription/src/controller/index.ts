import {
  createAuthRedirectParams,
  ok,
  createStore,
  deriveLatestMilestoneHistory,
  deriveLatestMilestoneContinuity,
  LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
  LATEST_READING_MILESTONE_STORAGE_KEY,
  type AppKernel,
  type LatestMilestoneHistoryEntry,
  type LatestReadingMilestoneSnapshot,
} from "@minix/core";
import { type AppRouteId, type MembershipOverview, type PurchaseMembershipRequest, type PurchaseMembershipResponse } from "@minix/contracts";
import { createInitialSubscriptionState, type SubscriptionState } from "../model";

export interface CreateSubscriptionControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  catalogRouteId: AppRouteId;
  novelDetailRouteId?: AppRouteId;
  readerRouteId?: AppRouteId;
  tocRouteId?: AppRouteId;
  bookshelfRouteId?: AppRouteId;
  requestPath?: string;
  purchaseRequestPath?: string;
  latestMilestoneStorageKey?: string;
  latestMilestoneHistoryStorageKey?: string;
  initialState?: Partial<SubscriptionState>;
}

export function createSubscriptionController(options: CreateSubscriptionControllerOptions) {
  const {
    kernel,
    loginRouteId,
    catalogRouteId,
    novelDetailRouteId,
    readerRouteId,
    tocRouteId,
    bookshelfRouteId,
    requestPath = "/membership",
    purchaseRequestPath = "/membership/purchase",
    latestMilestoneStorageKey = LATEST_READING_MILESTONE_STORAGE_KEY,
    latestMilestoneHistoryStorageKey = LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
    initialState,
  } = options;
  const store = createStore<SubscriptionState>({
    ...createInitialSubscriptionState(),
    ...initialState,
  });

  function resolveRouteParam(key: "source" | "novelId" | "chapterId"): string | undefined {
    const current = kernel.router.current();
    const value = current.ok ? current.value?.params?.[key] : undefined;
    return typeof value === "string" ? value : store.getState()[key];
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

  function deriveReturnTarget(source?: string) {
    if (source === "reader") {
      return "reader" as const;
    }

    if (source === "toc") {
      return "toc" as const;
    }

    if (source === "detail") {
      return "detail" as const;
    }

    return "catalog" as const;
  }

  function deriveReturnActionLabel(source?: string) {
    if (source === "reader") {
      return "Return to chapter";
    }

    if (source === "toc") {
      return "Return to directory";
    }

    if (source === "detail") {
      return "Return to title";
    }

    return "Back to library";
  }

  function deriveEntitlementSummary(overview: MembershipOverview | undefined) {
    if (!overview) {
      return undefined;
    }

    if (overview.active) {
      return `${overview.statusLabel}. Membership should now behave like a recovery path instead of a blocker.`;
    }

    if (overview.tier === "guest") {
      return "Guest access is active. Sign in or purchase before premium continuity can resume.";
    }

    return `${overview.statusLabel}. Premium continuation is still blocked until an entitlement is added.`;
  }

  function deriveRecommendedPlanId(source?: string, overview?: MembershipOverview) {
    if (overview?.active) {
      return "quarterly" as const;
    }

    if (source === "reader") {
      return "monthly" as const;
    }

    if (source === "toc" || source === "detail") {
      return "quarterly" as const;
    }

    return "annual" as const;
  }

  function deriveUnlockOutcomeLabel(source?: string, planId?: string) {
    const cadence =
      planId === "monthly"
        ? "monthly"
        : planId === "annual"
          ? "annual"
          : "quarterly";

    if (source === "reader") {
      return `Unlock happens immediately on the ${cadence} plan, then the blocked chapter can reopen without losing reading position.`;
    }

    if (source === "toc") {
      return `Unlock happens immediately on the ${cadence} plan, then the selected chapter can reopen from the directory with access already resolved.`;
    }

    if (source === "detail") {
      return `Unlock happens immediately on the ${cadence} plan, then the title dossier can continue without another paywall branch.`;
    }

    return `Unlock happens immediately on the ${cadence} plan, then premium discovery and continuation stay available across the catalog surfaces.`;
  }

  function deriveReturnContextLabel(source?: string, novelId?: string, chapterId?: string) {
    if (source === "reader") {
      return chapterId
        ? `Return path will reopen chapter ${chapterId} inside the reader flow.`
        : "Return path will reopen the blocked reader location.";
    }

    if (source === "toc") {
      return chapterId
        ? `Return path will reopen the directory with ${chapterId} still in focus.`
        : "Return path will reopen the directory with the selected chapter still focused.";
    }

    if (source === "detail") {
      return novelId
        ? `Return path will reopen the title dossier for ${novelId}.`
        : "Return path will reopen the blocked title dossier.";
    }

    return "Return path will land back in the library with premium continuity already active.";
  }

  async function reservePlatformPayment(response: PurchaseMembershipResponse) {
    if (!kernel.capability) {
      return;
    }

    const capabilityStatus = kernel.capability.status("payment");
    if (!capabilityStatus.ok || !capabilityStatus.value) {
      return;
    }

    const execution = await kernel.capability.execute({
      capability: "payment",
      action: "startPayment",
      payload: {
        orderId: response.order.orderId,
        intentId: response.paymentIntent.intentId,
        channel: response.paymentIntent.channel,
        ...(response.paymentIntent.clientPayload ? response.paymentIntent.clientPayload : {}),
      },
    });

    store.setState({
      paymentExecutionDetail: execution.ok ? execution.value.detail : execution.error.message,
    });
  }

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    async load() {
      const source = resolveRouteParam("source");
      const novelId = resolveRouteParam("novelId");
      const chapterId = resolveRouteParam("chapterId");
      const milestoneResult = await kernel.storage.get<LatestReadingMilestoneSnapshot>(latestMilestoneStorageKey);
      const milestone = milestoneResult.ok ? milestoneResult.value : null;
      const milestoneContinuity = deriveLatestMilestoneContinuity(milestone);
      const historyResult = await kernel.storage.get<LatestReadingMilestoneSnapshot[]>(latestMilestoneHistoryStorageKey);
      const milestoneHistory: LatestMilestoneHistoryEntry[] = historyResult.ok
        ? deriveLatestMilestoneHistory(historyResult.value)
        : [];

      store.setState({
        loading: true,
        purchasing: false,
        errorText: undefined,
        source,
        novelId,
        chapterId,
        returnActionLabel: deriveReturnActionLabel(source),
        recommendedPlanId: deriveRecommendedPlanId(source),
        unlockOutcomeLabel: deriveUnlockOutcomeLabel(source),
        returnContextLabel: deriveReturnContextLabel(source, novelId, chapterId),
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
        milestoneHistory,
        lockedMessage:
          source === "reader"
            ? "The current chapter is beyond the free or trial boundary."
            : source === "toc"
              ? "The selected chapter is beyond the current directory access boundary."
            : source === "detail"
              ? "This title requires membership before continuing."
              : "Membership unlocks the full reading flow.",
      });

      const result = await kernel.request.get<MembershipOverview>(requestPath);
      if (!result.ok) {
        store.setState({
          loading: false,
          errorText: result.error.message,
        });

        if (result.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return result;
      }

      store.setState({
        ready: true,
        loading: false,
        purchasing: false,
        title: result.value.headline,
        overview: result.value,
        order: undefined,
        paymentIntent: undefined,
        paymentResult: undefined,
        entitlement: undefined,
        paymentExecutionDetail: undefined,
        entitlementSummary: deriveEntitlementSummary(result.value),
        recommendedPlanId: deriveRecommendedPlanId(source, result.value),
        unlockOutcomeLabel: deriveUnlockOutcomeLabel(source),
        returnContextLabel: deriveReturnContextLabel(source, novelId, chapterId),
        benefits: result.value.benefits,
        errorText: undefined,
      });

      return result;
    },

    async purchaseMembership(planId: string) {
      const current = store.getState();
      const payload: PurchaseMembershipRequest = {
        planId: planId as PurchaseMembershipRequest["planId"],
        ...(current.source ? { source: current.source } : {}),
        ...(current.novelId ? { novelId: current.novelId } : {}),
        ...(current.chapterId ? { chapterId: current.chapterId } : {}),
      };

      store.setState({
        purchasing: true,
        errorText: undefined,
        paymentExecutionDetail: undefined,
        purchaseSuccessMessage: undefined,
        lastPurchasedPlanId: payload.planId,
        unlockOutcomeLabel: deriveUnlockOutcomeLabel(current.source, payload.planId),
      });

      const result = await kernel.request.post<PurchaseMembershipResponse>(purchaseRequestPath, payload);
      if (!result.ok) {
        store.setState({
          purchasing: false,
          errorText: result.error.message,
        });

        if (result.error.code === "UNAUTHORIZED") {
          return routeToLogin();
        }

        return result;
      }

      const nextSource = result.value.source ?? current.source;
      store.setState({
        purchasing: false,
        title: result.value.overview.headline,
        overview: result.value.overview,
        order: result.value.order,
        paymentIntent: result.value.paymentIntent,
        paymentResult: result.value.paymentResult,
        entitlement: result.value.entitlement,
        benefits: result.value.overview.benefits,
        source: nextSource,
        novelId: result.value.novelId ?? current.novelId,
        chapterId: result.value.chapterId ?? current.chapterId,
        returnActionLabel: deriveReturnActionLabel(nextSource),
        entitlementSummary: deriveEntitlementSummary(result.value.overview),
        recommendedPlanId: deriveRecommendedPlanId(nextSource, result.value.overview),
        unlockOutcomeLabel: deriveUnlockOutcomeLabel(nextSource, payload.planId),
        returnContextLabel: deriveReturnContextLabel(nextSource, result.value.novelId ?? current.novelId, result.value.chapterId ?? current.chapterId),
        purchaseSuccessMessage:
          nextSource === "reader"
            ? "Membership unlocked. Return to the blocked chapter with your reading position intact."
            : nextSource === "toc"
              ? "Membership unlocked. Return to the directory with the selected chapter still in focus."
              : nextSource === "detail"
                ? "Membership unlocked. Return to the title and continue with access already resolved."
                : "Membership unlocked. Premium discovery and continuation are now active.",
        lastPurchasedPlanId: payload.planId,
        lockedMessage:
          nextSource === "toc"
            ? "Access is now unlocked for the chapter you selected in the directory."
            : nextSource === "reader"
              ? "Access is now unlocked for the chapter that triggered this reader paywall."
              : nextSource === "detail"
                ? "Access is now unlocked for the title that triggered this detail-page paywall."
                : "Access is now unlocked for the premium flow you came from.",
        errorText: undefined,
      });

      await reservePlatformPayment(result.value);

      return result;
    },

    async continueAfterPurchase() {
      const current = store.getState();
      const returnTarget = deriveReturnTarget(current.source);

      if (returnTarget === "reader" && readerRouteId && current.novelId && current.chapterId) {
        return kernel.router.toRoute(readerRouteId, {
          novelId: current.novelId,
          chapterId: current.chapterId,
        });
      }

      if (returnTarget === "toc" && tocRouteId && current.novelId) {
        return kernel.router.toRoute(tocRouteId, {
          novelId: current.novelId,
          ...(current.chapterId ? { chapterId: current.chapterId } : {}),
        });
      }

      if (returnTarget === "detail" && novelDetailRouteId && current.novelId) {
        return kernel.router.toRoute(novelDetailRouteId, {
          novelId: current.novelId,
        });
      }

      return kernel.router.toRoute(catalogRouteId);
    },

    async openLatestMilestone() {
      const current = store.getState();

      if (current.latestMilestoneSource === "reader" && readerRouteId && current.latestMilestoneNovelId && current.latestMilestoneChapterId) {
        return kernel.router.toRoute(readerRouteId, {
          novelId: current.latestMilestoneNovelId,
          chapterId: current.latestMilestoneChapterId,
        });
      }

      if (current.latestMilestoneSource === "toc" && tocRouteId && current.latestMilestoneNovelId) {
        return kernel.router.toRoute(tocRouteId, {
          novelId: current.latestMilestoneNovelId,
          ...(current.latestMilestoneChapterId ? { chapterId: current.latestMilestoneChapterId } : {}),
        });
      }

      if (current.latestMilestoneSource === "bookshelf" && bookshelfRouteId) {
        return kernel.router.toRoute(bookshelfRouteId);
      }

      if (current.latestMilestoneNovelId && novelDetailRouteId) {
        return kernel.router.toRoute(novelDetailRouteId, {
          novelId: current.latestMilestoneNovelId,
        });
      }

      return kernel.router.toRoute(catalogRouteId);
    },

    async openMilestoneHistoryItem(indexValue?: string | number) {
      const current = store.getState();
      const index = typeof indexValue === "number" ? indexValue : Number(indexValue ?? 0);
      const item = current.milestoneHistory[index];
      if (!item) {
        return ok(undefined);
      }

      if (item.source === "reader" && readerRouteId && item.novelId && item.chapterId) {
        return kernel.router.toRoute(readerRouteId, {
          novelId: item.novelId,
          chapterId: item.chapterId,
        });
      }

      if (item.source === "toc" && tocRouteId && item.novelId) {
        return kernel.router.toRoute(tocRouteId, {
          novelId: item.novelId,
          ...(item.chapterId ? { chapterId: item.chapterId } : {}),
        });
      }

      if (item.source === "bookshelf" && bookshelfRouteId) {
        return kernel.router.toRoute(bookshelfRouteId);
      }

      if (item.novelId && novelDetailRouteId) {
        return kernel.router.toRoute(novelDetailRouteId, {
          novelId: item.novelId,
        });
      }

      return kernel.router.toRoute(catalogRouteId);
    },

    async goToCatalog() {
      return kernel.router.toRoute(catalogRouteId);
    },
  };
}
