import { createDetailStatus, createListStatus } from "@minix/core";
import type {
  AfterSalesListResponse,
  MembershipOverview,
  OrderDetailResponse,
  OrderListResponse,
  PaymentCatalogResponse,
  SubscriptionListResponse,
} from "@minix/contracts";

import type { SubscriptionState } from "../model";
import { deriveRecommendedPlanId } from "./return-context";

export function deriveEntitlementSummary(overview: MembershipOverview | undefined) {
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

export function applyOrderDetailToState(current: SubscriptionState, detail: OrderDetailResponse): Partial<SubscriptionState> {
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

export function applyCommerceSnapshot(
  current: SubscriptionState,
  input: {
    catalog?: PaymentCatalogResponse;
    orderList?: OrderListResponse;
    subscriptions?: SubscriptionListResponse;
    afterSales?: AfterSalesListResponse;
  },
): Partial<SubscriptionState> {
  const nextState: Partial<SubscriptionState> = {};
  if (input.catalog && Array.isArray(input.catalog.products) && Array.isArray(input.catalog.skus)) {
    nextState.catalogProducts = input.catalog.products;
    nextState.catalogSkus = input.catalog.skus;
    nextState.selectedSkuId = current.selectedSkuId ?? input.catalog.products[0]?.defaultSkuId ?? input.catalog.skus[0]?.skuId;
  }
  if (input.orderList?.orderList && Array.isArray(input.orderList.orderList.items)) {
    const currentSelectedOrderId = current.selectedOrderId;
    const selectedOrderId =
      currentSelectedOrderId && input.orderList.orderList.items.some((item) => item.orderId === currentSelectedOrderId)
        ? currentSelectedOrderId
        : input.orderList.orderList.items[0]?.orderId;
    nextState.orderList = input.orderList.orderList;
    nextState.commercePosture = input.orderList.commercePosture ?? current.commercePosture;
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

export function handleCommerceDetailFailure(
  current: SubscriptionState,
  code: string | undefined,
  message: string,
  requestedDetailId?: string,
): Partial<SubscriptionState> {
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
