import {
  createControllerRouterHelpers,
  createCapabilityHealthSnapshot,
  createDetailStatus,
  createListStatus,
  describeCapabilityStatus,
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
import type {
  AfterSalesDetailResponse,
  AfterSalesListResponse,
  AppRouteId,
  MembershipOverview,
  OrderListResponse,
  OrderDetailResponse,
  OrderOperationRequest,
  PaymentCatalogResponse,
  CapabilityStatus,
  PurchaseOrderRequest,
  PurchaseOrderResponse,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  SubscriptionListResponse,
  SubscriptionOperationRequest,
} from "@minix/contracts";
import { createInitialSubscriptionState, type SubscriptionState } from "../model";

function isSamplePaymentProviderMode(providerMode: NonNullable<PurchaseMembershipResponse["paymentIntent"]["gatewayReference"]>["providerMode"]): boolean {
  return providerMode === "sample";
}

export interface CreateSubscriptionControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  catalogRouteId: AppRouteId;
  membershipRouteId?: AppRouteId;
  ordersRouteId?: AppRouteId;
  novelDetailRouteId?: AppRouteId;
  readerRouteId?: AppRouteId;
  tocRouteId?: AppRouteId;
  bookshelfRouteId?: AppRouteId;
  requestPath?: string;
  purchaseRequestPath?: string;
  purchaseOrderRequestPath?: string;
  catalogRequestPath?: string;
  orderListRequestPath?: string;
  orderDetailRequestPath?: string;
  cancelRequestPath?: string;
  refundRequestPath?: string;
  reconcileRequestPath?: string;
  paymentResultRequestPath?: string;
  subscriptionsRequestPath?: string;
  cancelSubscriptionRequestPath?: string;
  renewSubscriptionRequestPath?: string;
  afterSalesListRequestPath?: string;
  afterSalesDetailRequestPath?: string;
  latestMilestoneStorageKey?: string;
  latestMilestoneHistoryStorageKey?: string;
  initialState?: Partial<SubscriptionState>;
}

export function createSubscriptionController(options: CreateSubscriptionControllerOptions) {
  const {
    kernel,
    loginRouteId,
    catalogRouteId,
    membershipRouteId,
    ordersRouteId,
    novelDetailRouteId,
    readerRouteId,
    tocRouteId,
    bookshelfRouteId,
    requestPath = "/membership",
    purchaseRequestPath = "/membership/purchase",
    purchaseOrderRequestPath = "/orders/purchase",
    catalogRequestPath = "/orders/catalog",
    orderListRequestPath = "/orders/list",
    orderDetailRequestPath = "/orders/detail",
    cancelRequestPath = "/orders/cancel",
    refundRequestPath = "/orders/refund",
    reconcileRequestPath = "/payments/reconcile",
    paymentResultRequestPath = "/payments/result",
    subscriptionsRequestPath = "/subscriptions",
    cancelSubscriptionRequestPath = "/subscriptions/cancel",
    renewSubscriptionRequestPath = "/subscriptions/renew",
    afterSalesListRequestPath = "/after-sales/list",
    afterSalesDetailRequestPath = "/after-sales/detail",
    latestMilestoneStorageKey = LATEST_READING_MILESTONE_STORAGE_KEY,
    latestMilestoneHistoryStorageKey = LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY,
    initialState,
  } = options;
  const store = createStore<SubscriptionState>({
    ...createInitialSubscriptionState(),
    ...initialState,
  });
  const { routeToLogin } = createControllerRouterHelpers({
    kernel,
    loginRouteId,
  });

  function derivePaymentCapabilitySummary(status: CapabilityStatus | undefined) {
    const base = describeCapabilityStatus(
      status,
      "Payment capability status is unavailable until the host runtime reports it.",
    );
    if (!status || !status.available) {
      return `${base} Order creation can still succeed, but a host payment bridge is required before native payment execution can continue.`;
    }

    if (status.mode === "degraded") {
      return `${base} Host payment execution may still require a follow-up confirmation step.`;
    }

    return base;
  }

  function syncPaymentCapabilityState() {
    const statusResult = kernel.capability?.status("payment");
    const paymentCapabilityStatus = statusResult?.ok ? statusResult.value : undefined;
    store.setState({
      paymentCapabilityStatus,
      paymentCapabilitySnapshot: createCapabilityHealthSnapshot(
        "payment",
        paymentCapabilityStatus,
        "Payment capability status is unavailable until the host runtime reports it.",
      ),
      paymentCapabilitySummary: derivePaymentCapabilitySummary(paymentCapabilityStatus),
    });

    return paymentCapabilityStatus;
  }

  function resolveRouteParam(key: "source" | "novelId" | "chapterId"): string | undefined {
    const current = kernel.router.current();
    const value = current.ok ? current.value?.params?.[key] : undefined;
    return typeof value === "string" ? value : store.getState()[key];
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

  function applyOrderDetailToState(current: SubscriptionState, detail: OrderDetailResponse): Partial<SubscriptionState> {
    const entitlement = detail.entitlement as SubscriptionState["entitlement"];
    const paymentContinuitySummary =
      detail.paymentResult.continuitySummary ??
      detail.operationResult?.continuitySummary ??
      detail.afterSalesCases?.[0]?.continuitySummary;
    const diagnosticsParts = [
      detail.paymentIntent.capabilitySummary,
      detail.paymentIntent.executionSummary,
      detail.commercePosture?.gatewaySummary,
      detail.commercePosture?.callbackSummary,
      detail.callbackVerification.diagnosticsSummary,
      detail.reconciliation.diagnosticsSummary,
      detail.reconciliation.ledgerAuditSummary,
    ].filter((value): value is string => Boolean(value));
    return {
      selectedOrderId: detail.order.orderId,
      order: detail.order,
      paymentIntent: detail.paymentIntent,
      paymentResult: detail.paymentResult,
      callbackVerification: detail.callbackVerification,
      reconciliation: detail.reconciliation,
      commercePosture: detail.commercePosture,
      paymentContinuitySummary,
      paymentDiagnosticsSummary: diagnosticsParts.length > 0 ? diagnosticsParts.join(" ") : undefined,
      afterSalesContinuitySummary: detail.afterSalesCases?.[0]?.continuitySummary,
      commerceDetailStatus: createDetailStatus("ready", {
        entryContext: "list",
        requestedDetailId: detail.order.orderId,
      }),
      entitlement,
      ...(detail.afterSalesCases ? { afterSalesCases: detail.afterSalesCases } : {}),
      transactionMessage: detail.operationResult?.message ?? detail.paymentResult.message,
      canCancelOrder: detail.order.status === "created" || detail.order.status === "pending_payment",
      canRefundOrder: detail.order.status === "paid",
      canCancelSubscription: detail.subscription?.status === "active" || detail.subscription?.status === "renewal_due",
      canRenewSubscription: detail.subscription?.status === "cancelled" || detail.subscription?.status === "grace" || detail.subscription?.status === "expired",
      ...(entitlement?.productType === "membership"
        ? {
            overview: entitlement.overview,
            benefits: entitlement.overview.benefits,
            entitlementSummary: deriveEntitlementSummary(entitlement.overview),
            recommendedPlanId: deriveRecommendedPlanId(current.source, entitlement.overview),
          }
        : {}),
    };
  }

  function applyCommerceSnapshot(input: {
    catalog?: PaymentCatalogResponse;
    orderList?: OrderListResponse;
    subscriptions?: SubscriptionListResponse;
    afterSales?: AfterSalesListResponse;
  }): Partial<SubscriptionState> {
    const nextState: Partial<SubscriptionState> = {};
    if (input.catalog && Array.isArray(input.catalog.products) && Array.isArray(input.catalog.skus)) {
      nextState.catalogProducts = input.catalog.products;
      nextState.catalogSkus = input.catalog.skus;
      nextState.selectedSkuId = store.getState().selectedSkuId ?? input.catalog.products[0]?.defaultSkuId ?? input.catalog.skus[0]?.skuId;
    }
    if (input.orderList?.orderList && Array.isArray(input.orderList.orderList.items)) {
      const currentSelectedOrderId = store.getState().selectedOrderId;
      const selectedOrderId =
        currentSelectedOrderId && input.orderList.orderList.items.some((item) => item.orderId === currentSelectedOrderId)
          ? currentSelectedOrderId
          : input.orderList.orderList.items[0]?.orderId;
      nextState.orderList = input.orderList.orderList;
      nextState.commercePosture = input.orderList.commercePosture ?? store.getState().commercePosture;
      nextState.orderListStatus = createListStatus(
        input.orderList.orderList.items.length > 0 ? "ready" : "empty",
        {
          firstLoaded: true,
          ...(selectedOrderId ? { restoredSelectionId: selectedOrderId } : {}),
        },
      );
      nextState.selectedOrderId = selectedOrderId;
    }
    if (input.subscriptions && Array.isArray(input.subscriptions.subscriptions)) {
      nextState.subscriptions = input.subscriptions.subscriptions;
      nextState.canCancelSubscription = input.subscriptions.subscriptions.some((item) => item.status === "active" || item.status === "renewal_due");
      nextState.canRenewSubscription = input.subscriptions.subscriptions.some(
        (item) => item.status === "cancelled" || item.status === "grace" || item.status === "expired",
      );
    }
    if (input.afterSales && Array.isArray(input.afterSales.cases)) {
      nextState.afterSalesCases = input.afterSales.cases;
      nextState.selectedAfterSalesCase = input.afterSales.cases[0];
    }
    return nextState;
  }

  async function refreshCommerceData() {
    const current = store.getState();
    store.setState({
      orderListStatus: createListStatus(
        current.orderList && current.orderList.items.length > 0 ? "refreshing" : "loading",
        {
          firstLoaded: Boolean(current.orderList),
          partialData: Boolean(current.orderList?.items.length),
          staleData: Boolean(current.orderList?.items.length),
          ...(current.selectedOrderId ? { restoredSelectionId: current.selectedOrderId } : {}),
        },
      ),
    });

    const [catalog, orderList, subscriptions, afterSales] = await Promise.all([
      kernel.request.get<PaymentCatalogResponse>(catalogRequestPath),
      kernel.request.get<OrderListResponse>(orderListRequestPath),
      kernel.request.get<SubscriptionListResponse>(subscriptionsRequestPath),
      kernel.request.get<AfterSalesListResponse>(afterSalesListRequestPath),
    ]);

    const nextState: Partial<SubscriptionState> = {};
    if (catalog.ok) {
      Object.assign(nextState, applyCommerceSnapshot({ catalog: catalog.value }));
    }
    if (orderList.ok) {
      Object.assign(nextState, applyCommerceSnapshot({ orderList: orderList.value }));
    } else {
      nextState.orderListStatus = createListStatus(current.orderList?.items.length ? "partial" : "error", {
        firstLoaded: Boolean(current.orderList),
        partialData: Boolean(current.orderList?.items.length),
        staleData: Boolean(current.orderList?.items.length),
        ...(current.selectedOrderId ? { restoredSelectionId: current.selectedOrderId } : {}),
      });
    }
    if (subscriptions.ok) {
      Object.assign(nextState, applyCommerceSnapshot({ subscriptions: subscriptions.value }));
    }
    if (afterSales.ok) {
      Object.assign(nextState, applyCommerceSnapshot({ afterSales: afterSales.value }));
    }
    store.setState(nextState);
  }

  function handleCommerceDetailFailure(
    code: string | undefined,
    message: string,
    requestedDetailId?: string,
  ): Partial<SubscriptionState> {
    const current = store.getState();
    const hasDetail = Boolean(current.order || current.selectedAfterSalesCase);
    const loadState =
      code === "NOT_FOUND"
        ? "unavailable"
        : code === "FORBIDDEN"
          ? "forbidden"
          : code === "OFFLINE"
            ? "offline"
            : hasDetail
              ? "stale"
              : "error";

    return {
      errorText: message,
      commerceDetailStatus: createDetailStatus(loadState, {
        entryContext: current.commerceDetailStatus.entryContext,
        recoveredFromLink: current.commerceDetailStatus.recoveredFromLink,
        stale: loadState === "stale",
        ...(requestedDetailId ? { requestedDetailId } : {}),
      }),
    };
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
    const paymentCapabilityStatus = syncPaymentCapabilityState();
    if (!kernel.capability || !paymentCapabilityStatus?.available) {
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
        orderListStatus: createListStatus("loading"),
        commerceDetailStatus: createDetailStatus("idle"),
        paymentCapabilityStatus: undefined,
        paymentCapabilitySnapshot: {
          capability: "payment",
          available: false,
          mode: "unknown",
          summary: "Payment capability status is unavailable until the host runtime reports it.",
        },
        paymentCapabilitySummary: "Payment capability status is unavailable until the host runtime reports it.",
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
      syncPaymentCapabilityState();

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
        callbackVerification: undefined,
        reconciliation: undefined,
        commercePosture: undefined,
        entitlement: undefined,
        paymentExecutionDetail: undefined,
        transactionMessage: undefined,
        canCancelOrder: false,
        canRefundOrder: false,
        selectedOrderId: undefined,
        commerceDetailStatus: createDetailStatus("idle"),
        entitlementSummary: deriveEntitlementSummary(result.value),
        recommendedPlanId: deriveRecommendedPlanId(source, result.value),
        unlockOutcomeLabel: deriveUnlockOutcomeLabel(source),
        returnContextLabel: deriveReturnContextLabel(source, novelId, chapterId),
        benefits: result.value.benefits,
        errorText: undefined,
      });

      await refreshCommerceData();

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
      const providerMode = result.value.paymentIntent.gatewayReference?.providerMode ?? "sample";
      const sampleProviderMode = isSamplePaymentProviderMode(providerMode);
      store.setState({
        purchasing: false,
        title: result.value.overview.headline,
        overview: result.value.overview,
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
        ...applyOrderDetailToState(current, {
          order: result.value.order,
          paymentIntent: result.value.paymentIntent,
          paymentResult: result.value.paymentResult,
          ...(result.value.commercePosture ? { commercePosture: result.value.commercePosture } : {}),
          ...(result.value.operationResult ? { operationResult: result.value.operationResult } : {}),
          callbackVerification: {
            status: "pending",
            message:
              sampleProviderMode
                ? "Callback verification is pending until the sample gateway confirms the order."
                : "Callback verification is pending until the gateway confirms the order.",
            diagnosticsSummary:
              sampleProviderMode
                ? "Callback verification is still waiting on the sample gateway payload."
                : "Callback verification is still waiting on the production gateway payload.",
            operatorActionSummary:
              sampleProviderMode
                ? "Operators can still inspect callback and reconciliation evidence even while the gateway remains in explicit sample mode."
                : "Operators can inspect callback and reconciliation evidence without changing the shared commerce envelope.",
          },
          reconciliation: {
            status: result.value.paymentResult.status === "success" ? "pending" : "not_required",
            message:
              result.value.paymentResult.status === "success"
                ? sampleProviderMode
                  ? "The sample order still needs reconciliation."
                  : "The order still needs reconciliation."
                : "Reconciliation is not required for this transaction state.",
            diagnosticsSummary:
              result.value.paymentResult.status === "success"
                ? "Reconciliation is still pending, so callback and order state should be treated as provisional continuity checkpoints."
                : "Reconciliation is not required for the current payment posture.",
            ledgerAuditSummary: "Callback and reconciliation ledgers will keep the append-only audit trail for this order.",
          },
          entitlement: result.value.entitlement,
        }),
      });

      await refreshCommerceData();
      await reservePlatformPayment(result.value);

      return result;
    },

    async refreshTransaction() {
      const orderId = store.getState().order?.orderId;
      if (!orderId) {
        return ok(undefined);
      }

      const detail = await kernel.request.get<OrderDetailResponse>(orderDetailRequestPath, { orderId });
      if (!detail.ok) {
        store.setState(handleCommerceDetailFailure(detail.error.code, detail.error.message, orderId));
        return detail;
      }

      store.setState({
        commerceDetailStatus: createDetailStatus("refreshing", {
          entryContext: "list",
          requestedDetailId: orderId,
        }),
      });
      const paymentResult = await kernel.request.get<typeof detail.value.paymentResult>(paymentResultRequestPath, { orderId });
      store.setState({
        errorText: undefined,
        ...applyOrderDetailToState(store.getState(), {
          ...detail.value,
          ...(paymentResult.ok ? { paymentResult: paymentResult.value } : {}),
        }),
      });
      await refreshCommerceData();
      return ok(undefined);
    },

    async cancelOrder(reason?: string) {
      const orderId = store.getState().order?.orderId;
      if (!orderId) {
        return ok(undefined);
      }

      store.setState({
        purchasing: true,
        errorText: undefined,
      });

      const result = await kernel.request.post<OrderDetailResponse>(cancelRequestPath, {
        orderId,
        ...(reason ? { reason } : {}),
      } satisfies OrderOperationRequest);
      if (!result.ok) {
        store.setState({
          purchasing: false,
          ...handleCommerceDetailFailure(result.error.code, result.error.message, orderId),
        });
        return result;
      }

      store.setState({
        purchasing: false,
        ...applyOrderDetailToState(store.getState(), result.value),
      });
      await refreshCommerceData();
      return ok(undefined);
    },

    async refundOrder(reason?: string) {
      const orderId = store.getState().order?.orderId;
      if (!orderId) {
        return ok(undefined);
      }

      store.setState({
        purchasing: true,
        errorText: undefined,
      });

      const result = await kernel.request.post<OrderDetailResponse>(refundRequestPath, {
        orderId,
        ...(reason ? { reason } : {}),
      } satisfies OrderOperationRequest);
      if (!result.ok) {
        store.setState({
          purchasing: false,
          ...handleCommerceDetailFailure(result.error.code, result.error.message, orderId),
        });
        return result;
      }

      store.setState({
        purchasing: false,
        ...applyOrderDetailToState(store.getState(), result.value),
      });
      await refreshCommerceData();
      return ok(undefined);
    },

    async reconcileOrder() {
      const orderId = store.getState().order?.orderId;
      if (!orderId) {
        return ok(undefined);
      }

      const result = await kernel.request.post<OrderDetailResponse>(reconcileRequestPath, {
        orderId,
      } satisfies OrderOperationRequest);
      if (!result.ok) {
        store.setState(handleCommerceDetailFailure(result.error.code, result.error.message, orderId));
        return result;
      }

      store.setState({
        errorText: undefined,
        ...applyOrderDetailToState(store.getState(), result.value),
      });
      await refreshCommerceData();
      return ok(undefined);
    },

    selectSku(skuId: string) {
      store.setState({ selectedSkuId: skuId });
      return ok(undefined);
    },

    async purchaseSku(skuId?: string) {
      const selectedSkuId = skuId ?? store.getState().selectedSkuId;
      if (!selectedSkuId) {
        return ok(undefined);
      }

      const current = store.getState();
      store.setState({
        purchasing: true,
        errorText: undefined,
      });

      const result = await kernel.request.post<PurchaseOrderResponse>(purchaseOrderRequestPath, {
        skuId: selectedSkuId,
        ...(current.source ? { source: current.source } : {}),
        ...(current.novelId ? { novelId: current.novelId } : {}),
        ...(current.chapterId ? { chapterId: current.chapterId } : {}),
      } satisfies PurchaseOrderRequest);
      if (!result.ok) {
        store.setState({
          purchasing: false,
          ...handleCommerceDetailFailure(result.error.code, result.error.message),
        });
        return result;
      }

      store.setState({
        purchasing: false,
        transactionMessage: result.value.operationResult?.message ?? result.value.paymentResult.message,
        ...applyOrderDetailToState(store.getState(), {
          order: result.value.order,
          product: result.value.product,
          sku: result.value.sku,
          paymentIntent: result.value.paymentIntent,
          paymentResult: result.value.paymentResult,
          callbackVerification: result.value.callbackVerification,
          reconciliation: result.value.reconciliation,
          ...(result.value.operationResult ? { operationResult: result.value.operationResult } : {}),
          ...(result.value.entitlement ? { entitlement: result.value.entitlement } : {}),
          ...(result.value.subscription ? { subscription: result.value.subscription } : {}),
        }),
      });
      await refreshCommerceData();
      return result;
    },

    async loadOrderDetail(orderId: string) {
      store.setState({
        commerceDetailStatus: createDetailStatus("loading", {
          entryContext: "list",
          requestedDetailId: orderId,
        }),
        selectedOrderId: orderId,
      });
      const result = await kernel.request.get<OrderDetailResponse>(orderDetailRequestPath, { orderId });
      if (!result.ok) {
        store.setState(handleCommerceDetailFailure(result.error.code, result.error.message, orderId));
        return result;
      }
      store.setState({
        errorText: undefined,
        ...applyOrderDetailToState(store.getState(), result.value),
      });
      await refreshCommerceData();
      return result;
    },

    async cancelSubscription(subscriptionId?: string, reason?: string) {
      const targetId = subscriptionId ?? store.getState().subscriptions[0]?.subscriptionId;
      if (!targetId) {
        return ok(undefined);
      }

      const result = await kernel.request.post<OrderDetailResponse>(cancelSubscriptionRequestPath, {
        subscriptionId: targetId,
        ...(reason ? { reason } : {}),
      } satisfies SubscriptionOperationRequest);
      if (!result.ok) {
        store.setState(handleCommerceDetailFailure(result.error.code, result.error.message, targetId));
        return result;
      }
      store.setState({
        errorText: undefined,
        ...applyOrderDetailToState(store.getState(), result.value),
      });
      await refreshCommerceData();
      return ok(undefined);
    },

    async renewSubscription(subscriptionId?: string, skuId?: string) {
      const targetId = subscriptionId ?? store.getState().subscriptions[0]?.subscriptionId;
      if (!targetId) {
        return ok(undefined);
      }
      const result = await kernel.request.post<PurchaseOrderResponse>(renewSubscriptionRequestPath, {
        subscriptionId: targetId,
        ...(skuId ? { skuId } : {}),
      } satisfies SubscriptionOperationRequest);
      if (!result.ok) {
        store.setState(handleCommerceDetailFailure(result.error.code, result.error.message, targetId));
        return result;
      }
      store.setState({
        errorText: undefined,
        transactionMessage: result.value.operationResult?.message ?? result.value.paymentResult.message,
        ...applyOrderDetailToState(store.getState(), {
          order: result.value.order,
          product: result.value.product,
          sku: result.value.sku,
          paymentIntent: result.value.paymentIntent,
          paymentResult: result.value.paymentResult,
          callbackVerification: result.value.callbackVerification,
          reconciliation: result.value.reconciliation,
          ...(result.value.operationResult ? { operationResult: result.value.operationResult } : {}),
          ...(result.value.entitlement ? { entitlement: result.value.entitlement } : {}),
          ...(result.value.subscription ? { subscription: result.value.subscription } : {}),
        }),
      });
      await refreshCommerceData();
      return result;
    },

    async loadAfterSalesDetail(caseId?: string) {
      const targetId = caseId ?? store.getState().afterSalesCases[0]?.caseId;
      if (!targetId) {
        return ok(undefined);
      }
      store.setState({
        commerceDetailStatus: createDetailStatus("loading", {
          entryContext: "list",
          requestedDetailId: targetId,
        }),
      });
      const result = await kernel.request.get<AfterSalesDetailResponse>(afterSalesDetailRequestPath, { caseId: targetId });
      if (!result.ok) {
        store.setState(handleCommerceDetailFailure(result.error.code, result.error.message, targetId));
        return result;
      }
      const selectedAfterSalesCase =
        store.getState().afterSalesCases.find((item) => item.caseId === result.value.caseItem.caseId) ?? result.value.caseItem;
      store.setState({
        selectedAfterSalesCase,
        transactionMessage: result.value.operationResult?.message ?? store.getState().transactionMessage,
        commerceDetailStatus: createDetailStatus("ready", {
          entryContext: "list",
          requestedDetailId: result.value.caseItem.caseId,
        }),
      });
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

    async goToMembership() {
      if (!membershipRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(membershipRouteId);
    },

    async goToOrders() {
      if (!ordersRouteId) {
        return ok(undefined);
      }

      return kernel.router.toRoute(ordersRouteId);
    },
  };
}
