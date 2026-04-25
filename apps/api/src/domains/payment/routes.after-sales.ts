import type {
  AfterSalesDetailResponse,
  AfterSalesListResponse,
  OrderDetailResponse,
} from "@minix/contracts";

import { loadRouteUserState, parseRouteBody, parseRouteQuery } from "../../http/route-context";
import { jsonError } from "../../http/response";
import {
  attachAfterSalesCase,
  createAfterSalesCaseRecord,
  getAfterSalesCaseDetail,
  listAfterSalesCases,
} from "./after-sales";
import {
  appendPaymentAssetLedgerEntries,
  applyOrderCancellation,
  applyOrderRefund,
} from "./ledger";
import type { RegisterPaymentRoutesOptions } from "./route-options";
import {
  afterSalesDetailQuerySchema,
  orderIdQuerySchema,
  orderOperationSchema,
} from "./schemas";
import { withPaymentCommercePosture } from "./orders";

export function registerPaymentAfterSalesRoutes(options: RegisterPaymentRoutesOptions) {
  const { app, resolveStore } = options;

  app.get("/after-sales/list", async (c) => {
    const { userState } = await loadRouteUserState(c, resolveStore);
    return c.json(listAfterSalesCases(userState) satisfies AfterSalesListResponse);
  });

  app.get("/after-sales/detail", async (c) => {
    const query = parseRouteQuery(c, afterSalesDetailQuerySchema);
    if (query instanceof Response) {
      return query;
    }
    const { traceId, userState } = await loadRouteUserState(c, resolveStore);
    const detail = getAfterSalesCaseDetail(userState, query.caseId);
    if (!detail) {
      return jsonError("NOT_FOUND", "After-sales case not found.", 404, traceId);
    }
    return c.json(detail satisfies AfterSalesDetailResponse);
  });

  app.get("/orders/detail", async (c) => {
    const query = parseRouteQuery(c, orderIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { traceId, userState } = await loadRouteUserState(c, resolveStore);
    const orderDetail = userState.ordersById[query.orderId];
    if (!orderDetail) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    return c.json(withPaymentCommercePosture(orderDetail) satisfies OrderDetailResponse);
  });

  app.post("/orders/cancel", async (c) => {
    const payload = await parseRouteBody(c, orderOperationSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing = userState.ordersById[payload.orderId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    const nextOrder = applyOrderCancellation(existing, payload.reason);
    if (nextOrder.order.status === "cancelled") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "cancel_pending",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
      const caseItem = createAfterSalesCaseRecord({
        kind: "cancel",
        detail: nextOrder,
        ...(payload.reason ? { reason: payload.reason } : {}),
        processedAt: nextOrder.operationResult?.processedAt ?? nextOrder.order.updatedAt,
      });
      userState.afterSalesById[caseItem.caseId] = caseItem;
      userState.ordersById[payload.orderId] = withPaymentCommercePosture(attachAfterSalesCase(nextOrder, caseItem));
      await store.saveUserState(session.userId, userState);
      return c.json(userState.ordersById[payload.orderId]! satisfies OrderDetailResponse);
    }
    userState.ordersById[payload.orderId] = withPaymentCommercePosture(nextOrder);
    await store.saveUserState(session.userId, userState);
    return c.json(userState.ordersById[payload.orderId]! satisfies OrderDetailResponse);
  });

  app.post("/orders/refund", async (c) => {
    const payload = await parseRouteBody(c, orderOperationSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing = userState.ordersById[payload.orderId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    const nextOrder = applyOrderRefund(existing, payload.reason);
    if (nextOrder.order.status === "refunded") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "refund_paid",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
      const caseItem = createAfterSalesCaseRecord({
        kind: "refund",
        detail: nextOrder,
        ...(payload.reason ? { reason: payload.reason } : {}),
        processedAt: nextOrder.operationResult?.processedAt ?? nextOrder.order.updatedAt,
      });
      userState.afterSalesById[caseItem.caseId] = caseItem;
      userState.ordersById[payload.orderId] = withPaymentCommercePosture(attachAfterSalesCase(nextOrder, caseItem));
      if (
        nextOrder.order.status === "refunded" &&
        userState.latestPaidOrderId === payload.orderId
      ) {
        delete userState.latestPaidOrderId;
        delete userState.membershipPlanId;
      }
      await store.saveUserState(session.userId, userState);
      return c.json(userState.ordersById[payload.orderId]! satisfies OrderDetailResponse);
    }
    userState.ordersById[payload.orderId] = withPaymentCommercePosture(nextOrder);
    await store.saveUserState(session.userId, userState);
    return c.json(userState.ordersById[payload.orderId]! satisfies OrderDetailResponse);
  });
}
