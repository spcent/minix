import type {
  AfterSalesCase,
  AfterSalesDetailResponse,
  AfterSalesListResponse,
  OrderDetailResponse,
} from "@minix/contracts";

import type { UserState } from "../../types";

export function attachAfterSalesCase(
  detail: OrderDetailResponse,
  caseItem: AfterSalesCase,
): OrderDetailResponse {
  return {
    ...detail,
    afterSalesCases: [caseItem, ...(detail.afterSalesCases ?? [])],
  };
}

export function listAfterSalesCases(userState: UserState): AfterSalesListResponse {
  const cases = Object.values(userState.afterSalesById).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
  return {
    cases,
    ...(cases[0]?.caseId ? { selectedCaseId: cases[0].caseId } : {}),
  };
}

export function getAfterSalesCaseDetail(
  userState: UserState,
  caseId: string,
): AfterSalesDetailResponse | null {
  const caseItem = userState.afterSalesById[caseId];
  if (!caseItem) {
    return null;
  }
  const orderDetail = userState.ordersById[caseItem.orderId];
  if (!orderDetail) {
    return null;
  }
  return {
    caseItem,
    order: orderDetail.order,
    ...(orderDetail.operationResult ? { operationResult: orderDetail.operationResult } : {}),
  };
}

export function createAfterSalesCaseRecord(input: {
  kind: AfterSalesCase["kind"];
  detail: OrderDetailResponse;
  reason?: string;
  processedAt: string;
}): AfterSalesCase {
  const providerMode = input.detail.paymentIntent.gatewayReference?.providerMode ?? "sample";
  return {
    caseId: `as_${input.kind}_${crypto.randomUUID()}`,
    orderId: input.detail.order.orderId,
    kind: input.kind,
    status: "completed",
    title: input.kind === "refund" ? "Refund request" : "Cancellation request",
    resultLabel:
      input.kind === "refund"
        ? providerMode === "sample"
          ? "Refund completed in sample after-sales flow"
          : "Refund completed in after-sales flow"
        : "Pending order cancelled before settlement",
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.kind === "refund"
      ? { refundAmountCents: input.detail.order.totalAmountCents }
      : {}),
    createdAt: input.processedAt,
    updatedAt: input.processedAt,
    completedAt: input.processedAt,
  };
}
