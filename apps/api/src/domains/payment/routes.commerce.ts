import type {
  ListOrdersRequest,
  MembershipEntitlement,
  OrderDetailResponse,
  OrderListResponse,
  PaymentCatalogResponse,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  PurchaseOrderRequest,
  PurchaseOrderResponse,
  SubscriptionListResponse,
} from "@minix/contracts";

import { DEFAULT_MEMBERSHIP_OVERVIEW } from "../../content";
import {
  loadRouteClientContext,
  loadRouteUserState,
  parseRouteBody,
  parseRouteQuery,
} from "../../http/route-context";
import { jsonError } from "../../http/response";
import { pickDefinedApiFields } from "../schema-helpers";
import { createMembershipOverview, createPaymentCatalogResponse } from "./catalog";
import {
  appendPaymentAssetLedgerEntries,
  createPaymentOperationResult,
} from "./ledger";
import {
  createMembershipOrderDetail,
  createMembershipPurchaseResponse,
  createProductOrderDetail,
  listOrders,
  withPaymentCommercePosture,
} from "./orders";
import type { RegisterPaymentRoutesOptions } from "./route-options";
import {
  listOrdersQuerySchema,
  purchaseMembershipSchema,
  purchaseOrderSchema,
  subscriptionOperationSchema,
} from "./schemas";
import { listSubscriptions } from "./subscriptions";

export function registerPaymentCommerceRoutes(options: RegisterPaymentRoutesOptions) {
  const {
    app,
    resolveStore,
    resolveClientId,
    resolveRequestDeviceId,
    guardPaymentRateLimit,
    appendPaymentAudit,
    schedulePaymentReconciliation,
  } = options;

  app.get("/membership", async (c) => {
    const { userState } = await loadRouteUserState(c, resolveStore);
    return c.json(
      userState.membershipPlanId
        ? createMembershipOverview(userState.membershipPlanId)
        : DEFAULT_MEMBERSHIP_OVERVIEW,
    );
  });

  app.post("/membership/purchase", async (c) => {
    const payload = await parseRouteBody(c, purchaseMembershipSchema);
    if (payload instanceof Response) {
      return payload;
    }
    const purchasePayload: PurchaseMembershipRequest = {
      planId: payload.planId,
      ...pickDefinedApiFields(payload, [
        "channel",
        "providerMode",
        "paymentScenario",
        "idempotencyKey",
        "source",
        "novelId",
        "chapterId",
      ]),
    };

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const clientContext = loadRouteClientContext(c, resolveClientId, resolveRequestDeviceId);
    const rateLimitGuard = await guardPaymentRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      platform: session.platform,
      ...clientContext,
      traceId,
    });
    if (!rateLimitGuard.allowed) {
      return rateLimitGuard.response;
    }

    const existingOrderId = purchasePayload.idempotencyKey
      ? userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey]
      : undefined;
    const existingOrder = existingOrderId
      ? userState.ordersById[existingOrderId]
      : undefined;
    if (existingOrder?.entitlement && "overview" in existingOrder.entitlement) {
      const message =
        existingOrder.order.status === "paid"
          ? "Idempotency key matched an existing paid order. Returning the stored result without another charge."
          : "Idempotency key matched an existing order. Returning the stored gateway intent without creating another charge.";
      return c.json(
        createMembershipPurchaseResponse(
          {
            order: {
              ...existingOrder.order,
              duplicateProtected: true,
            },
            paymentIntent: existingOrder.paymentIntent,
            paymentResult: {
              ...existingOrder.paymentResult,
              duplicateProtected: true,
              message,
            },
            ...(existingOrder.commercePosture ? { commercePosture: existingOrder.commercePosture } : {}),
            callbackVerification: existingOrder.callbackVerification,
            reconciliation: existingOrder.reconciliation,
            ...(existingOrder.paymentLedger
              ? { paymentLedger: existingOrder.paymentLedger }
              : {}),
            ...(existingOrder.operationLedger
              ? { operationLedger: existingOrder.operationLedger }
              : {}),
            ...(existingOrder.callbackLedger
              ? { callbackLedger: existingOrder.callbackLedger }
              : {}),
            ...(existingOrder.reconciliationLedger
              ? { reconciliationLedger: existingOrder.reconciliationLedger }
              : {}),
            entitlement: existingOrder.entitlement as MembershipEntitlement,
          },
          purchasePayload,
        ) satisfies PurchaseMembershipResponse,
      );
    }

    const duplicateProtected = Boolean(userState.latestPaidOrderId);
    const orderDetail = withPaymentCommercePosture(createMembershipOrderDetail(
      session,
      purchasePayload,
      duplicateProtected,
    ));
    const assetLedgerIds = appendPaymentAssetLedgerEntries({
      userState,
      detail: orderDetail,
      action: orderDetail.order.status === "paid" ? "purchase_paid" : "purchase_pending",
    });
    if (orderDetail.operationResult) {
      orderDetail.operationResult.assetLedgerIds = assetLedgerIds;
    }
    userState.ordersById[orderDetail.order.orderId] = orderDetail;
    if (orderDetail.order.status === "paid") {
      userState.membershipPlanId = purchasePayload.planId;
      userState.latestPaidOrderId = orderDetail.order.orderId;
    }
    if (purchasePayload.idempotencyKey) {
      userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey] =
        orderDetail.order.orderId;
    }
    appendPaymentAudit({
      userState,
      actorUserId: session.userId,
      ...clientContext,
      platform: session.platform,
      traceId,
      action: "membership_purchase",
      result: orderDetail.order.status === "paid" ? "allowed" : "review",
      message: `Membership purchase ${orderDetail.order.status} for ${purchasePayload.planId}.`,
    });
    if (orderDetail.reconciliation.status !== "reconciled") {
      await schedulePaymentReconciliation({
        store,
        userId: session.userId,
        userState,
        orderId: orderDetail.order.orderId,
      });
    }
    await store.saveUserState(session.userId, userState);

    return c.json(
      createMembershipPurchaseResponse(
        orderDetail,
        purchasePayload,
      ) satisfies PurchaseMembershipResponse,
    );
  });

  app.get("/orders/catalog", async () => {
    return Response.json(createPaymentCatalogResponse() satisfies PaymentCatalogResponse);
  });

  app.post("/orders/purchase", async (c) => {
    const payload = await parseRouteBody(c, purchaseOrderSchema);
    if (payload instanceof Response) {
      return payload;
    }
    const purchasePayload: PurchaseOrderRequest = {
      skuId: payload.skuId,
      ...pickDefinedApiFields(payload, [
        "channel",
        "providerMode",
        "paymentScenario",
        "idempotencyKey",
        "source",
        "novelId",
        "chapterId",
        "subscriptionId",
      ]),
    };

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existingOrderId = purchasePayload.idempotencyKey
      ? userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey]
      : undefined;
    const existingOrder = existingOrderId
      ? userState.ordersById[existingOrderId]
      : undefined;
    if (existingOrder?.product && existingOrder.sku) {
      return c.json({
        order: existingOrder.order,
        product: existingOrder.product,
        sku: existingOrder.sku,
        paymentIntent: existingOrder.paymentIntent,
        paymentResult: existingOrder.paymentResult,
        ...(existingOrder.commercePosture ? { commercePosture: existingOrder.commercePosture } : {}),
        callbackVerification: existingOrder.callbackVerification,
        reconciliation: existingOrder.reconciliation,
        ...(existingOrder.operationResult
          ? { operationResult: existingOrder.operationResult }
          : {}),
        ...(existingOrder.entitlement ? { entitlement: existingOrder.entitlement } : {}),
        ...(existingOrder.subscription ? { subscription: existingOrder.subscription } : {}),
      } satisfies PurchaseOrderResponse);
    }

    const duplicateProtected = Boolean(userState.latestPaidOrderId);
    const createdOrderDetail = createProductOrderDetail(
      session,
      purchasePayload,
      duplicateProtected,
    );
    const orderDetail = createdOrderDetail ? withPaymentCommercePosture(createdOrderDetail) : null;
    if (!orderDetail?.product || !orderDetail.sku) {
      return jsonError("BAD_REQUEST", "Unknown SKU.", 400, traceId);
    }
    const assetLedgerIds = appendPaymentAssetLedgerEntries({
      userState,
      detail: orderDetail,
      action: orderDetail.order.status === "paid" ? "purchase_paid" : "purchase_pending",
    });
    if (orderDetail.operationResult) {
      orderDetail.operationResult.assetLedgerIds = assetLedgerIds;
    }
    userState.ordersById[orderDetail.order.orderId] = orderDetail;
    if (purchasePayload.idempotencyKey) {
      userState.orderIdByIdempotencyKey[purchasePayload.idempotencyKey] =
        orderDetail.order.orderId;
    }
    if (orderDetail.reconciliation.status !== "reconciled") {
      await schedulePaymentReconciliation({
        store,
        userId: session.userId,
        userState,
        orderId: orderDetail.order.orderId,
      });
    }
    await store.saveUserState(session.userId, userState);
    return c.json({
      order: orderDetail.order,
      product: orderDetail.product,
      sku: orderDetail.sku,
      paymentIntent: orderDetail.paymentIntent,
      paymentResult: orderDetail.paymentResult,
      callbackVerification: orderDetail.callbackVerification,
      reconciliation: orderDetail.reconciliation,
      commercePosture: orderDetail.commercePosture,
      ...(orderDetail.operationResult ? { operationResult: orderDetail.operationResult } : {}),
      ...(orderDetail.entitlement ? { entitlement: orderDetail.entitlement } : {}),
      ...(orderDetail.subscription ? { subscription: orderDetail.subscription } : {}),
    } satisfies PurchaseOrderResponse);
  });

  app.get("/orders/list", async (c) => {
    const query = parseRouteQuery(c, listOrdersQuerySchema);
    if (query instanceof Response) {
      return query;
    }
    const request: ListOrdersRequest = pickDefinedApiFields(query, [
      "page",
      "pageSize",
      "status",
      "productType",
    ]);
    const { userState } = await loadRouteUserState(c, resolveStore);
    return c.json(listOrders(userState, request) satisfies OrderListResponse);
  });

  app.get("/subscriptions", async (c) => {
    const { userState } = await loadRouteUserState(c, resolveStore);
    return c.json(listSubscriptions(userState) satisfies SubscriptionListResponse);
  });

  app.post("/subscriptions/cancel", async (c) => {
    const payload = await parseRouteBody(c, subscriptionOperationSchema);
    if (payload instanceof Response) {
      return payload;
    }
    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const targetEntry = Object.entries(userState.ordersById).find(
      ([, detail]) => detail.subscription?.subscriptionId === payload.subscriptionId,
    );
    if (!targetEntry) {
      return jsonError("NOT_FOUND", "Subscription not found.", 404, traceId);
    }
    const [orderId, existing] = targetEntry;
    if (!existing.subscription) {
      return jsonError("BAD_REQUEST", "Subscription not found.", 400, traceId);
    }
    const processedAt = new Date().toISOString();
    const nextOrder: OrderDetailResponse = {
      ...existing,
      subscription: {
        ...existing.subscription,
        status: "cancelled",
        statusLabel: "Auto-renew disabled. Access remains until the current term ends.",
        autoRenew: false,
        cancelledAt: processedAt,
        ...(existing.subscription.renewsAt
          ? { graceEndsAt: existing.subscription.renewsAt }
          : {}),
      },
      operationResult: createPaymentOperationResult({
        operation: "cancel",
        applied: true,
        orderStatus: existing.order.status,
        paymentStatus: existing.paymentResult.status,
        message: "Subscription auto-renew was disabled for the current term.",
        processedAt,
      }),
    };
    userState.ordersById[orderId] = withPaymentCommercePosture(nextOrder);
    await store.saveUserState(session.userId, userState);
    return c.json(userState.ordersById[orderId]! satisfies OrderDetailResponse);
  });

  app.post("/subscriptions/renew", async (c) => {
    const payload = await parseRouteBody(c, subscriptionOperationSchema);
    if (payload instanceof Response) {
      return payload;
    }
    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
    const existing = Object.values(userState.ordersById).find(
      (detail) => detail.subscription?.subscriptionId === payload.subscriptionId,
    );
    if (!existing?.sku) {
      return jsonError("NOT_FOUND", "Subscription not found.", 404, traceId);
    }
    const createdRenewalDetail = createProductOrderDetail(
      session,
      {
        skuId: payload.skuId ?? existing.sku.skuId,
        subscriptionId: payload.subscriptionId,
        paymentScenario: "instant_success",
        ...pickDefinedApiFields(existing.order, ["source", "novelId", "chapterId"]),
      },
      Boolean(userState.latestPaidOrderId),
    );
    const renewalDetail = createdRenewalDetail ? withPaymentCommercePosture(createdRenewalDetail) : null;
    if (!renewalDetail?.subscription) {
      return jsonError("BAD_REQUEST", "Subscription renewal failed.", 400, traceId);
    }
    renewalDetail.subscription = {
      ...renewalDetail.subscription,
      subscriptionId: payload.subscriptionId,
      status: "active",
      statusLabel: "Renewal succeeded for the next subscription term.",
    };
    const assetLedgerIds = appendPaymentAssetLedgerEntries({
      userState,
      detail: renewalDetail,
      action: "purchase_paid",
    });
    renewalDetail.operationResult = createPaymentOperationResult({
      operation: "reconcile",
      applied: true,
      orderStatus: renewalDetail.order.status,
      paymentStatus: renewalDetail.paymentResult.status,
      message: "Subscription renewal created the next paid term.",
    });
    renewalDetail.operationResult.assetLedgerIds = assetLedgerIds;
    userState.ordersById[renewalDetail.order.orderId] = renewalDetail;
    await store.saveUserState(session.userId, userState);
    return c.json({
      order: renewalDetail.order,
      product: renewalDetail.product!,
      sku: renewalDetail.sku!,
      paymentIntent: renewalDetail.paymentIntent,
      paymentResult: renewalDetail.paymentResult,
      callbackVerification: renewalDetail.callbackVerification,
      reconciliation: renewalDetail.reconciliation,
      commercePosture: renewalDetail.commercePosture,
      ...(renewalDetail.operationResult
        ? { operationResult: renewalDetail.operationResult }
        : {}),
      ...(renewalDetail.entitlement ? { entitlement: renewalDetail.entitlement } : {}),
      subscription: renewalDetail.subscription,
    } satisfies PurchaseOrderResponse);
  });
}
