import type {
  AfterSalesDetailResponse,
  AfterSalesListResponse,
  AuthRateLimitState,
  ListOrdersRequest,
  MembershipEntitlement,
  OrderDetailResponse,
  OrderListResponse,
  PaymentCallbackRequest,
  PaymentCatalogResponse,
  PaymentResult,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  PurchaseOrderRequest,
  PurchaseOrderResponse,
  SubscriptionListResponse,
} from "@minix/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";

import { DEFAULT_MEMBERSHIP_OVERVIEW } from "../../content";
import { parseJsonBody, parseQuery } from "../../http/parsing";
import { jsonError } from "../../http/response";
import type { ApiBindings, ApiStore, UserState } from "../../types";
import {
  appendOperationalAuditRecord,
  appendOperationalMonitoringEvent,
  cloneOperationalState,
} from "../ops/jobs";
import {
  attachAfterSalesCase,
  createAfterSalesCaseRecord,
  getAfterSalesCaseDetail,
  listAfterSalesCases,
} from "./after-sales";
import { createMembershipOverview, createPaymentCatalogResponse } from "./catalog";
import {
  appendCallbackLedger,
  appendPaymentAssetLedgerEntries,
  applyOrderCancellation,
  applyOrderRefund,
  applyPaymentCallback,
  applyPaymentReconciliation,
  createPaymentOperationResult,
  resolveMembershipPlanIdFromOrder,
  verifyPaymentCallback,
} from "./ledger";
import {
  createMembershipOrderDetail,
  createMembershipPurchaseResponse,
  createProductOrderDetail,
  listOrders,
} from "./orders";
import {
  afterSalesDetailQuerySchema,
  listOrdersQuerySchema,
  orderIdQuerySchema,
  orderOperationSchema,
  paymentCallbackSchema,
  purchaseMembershipSchema,
  purchaseOrderSchema,
  subscriptionOperationSchema,
} from "./schemas";
import { listSubscriptions } from "./subscriptions";

export interface RegisterPaymentRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  resolveClientId: (request: Request) => string;
  resolveRequestDeviceId: (c: Context<any>) => string | undefined;
  guardPaymentRateLimit: (input: {
    c: Context<any>;
    store: ApiStore;
    userId: string;
    userState: UserState;
    platform: string;
    clientId: string;
    deviceId?: string;
    traceId: string;
  }) => Promise<
    | {
        allowed: true;
        rateLimitState: AuthRateLimitState;
      }
    | {
        allowed: false;
        rateLimitState: AuthRateLimitState;
        response: Response;
      }
  >;
  appendPaymentAudit: (input: {
    userState: UserState;
    actorUserId: string;
    clientId: string;
    deviceId?: string;
    platform: string;
    traceId: string;
    action: "membership_purchase";
    result: "allowed" | "review";
    message: string;
  }) => void;
  schedulePaymentReconciliation: (input: {
    store: ApiStore;
    userId: string;
    userState: UserState;
    orderId: string;
  }) => Promise<void>;
  resolveWebhookSecret: (env: ApiBindings | undefined) => string;
}

export function registerPaymentRoutes(options: RegisterPaymentRoutesOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    resolveClientId,
    resolveRequestDeviceId,
    guardPaymentRateLimit,
    appendPaymentAudit,
    schedulePaymentReconciliation,
    resolveWebhookSecret,
  } = options;

  app.use("/membership", requireSession);
  app.use("/membership/*", requireSession);
  app.use("/orders", requireSession);
  app.use("/orders/*", requireSession);
  app.use("/payments", requireSession);
  app.use("/payments/*", requireSession);
  app.use("/subscriptions", requireSession);
  app.use("/subscriptions/*", requireSession);
  app.use("/after-sales", requireSession);
  app.use("/after-sales/*", requireSession);

  app.get("/membership", async (c) => {
    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    return c.json(
      userState.membershipPlanId
        ? createMembershipOverview(userState.membershipPlanId)
        : DEFAULT_MEMBERSHIP_OVERVIEW,
    );
  });

  app.post("/membership/purchase", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, purchaseMembershipSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    const purchasePayload: PurchaseMembershipRequest = {
      planId: payload.planId,
      ...(payload.channel ? { channel: payload.channel } : {}),
      ...(payload.providerMode ? { providerMode: payload.providerMode } : {}),
      ...(payload.paymentScenario ? { paymentScenario: payload.paymentScenario } : {}),
      ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
      ...(payload.source ? { source: payload.source } : {}),
      ...(payload.novelId ? { novelId: payload.novelId } : {}),
      ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    };

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const clientId = resolveClientId(c.req.raw);
    const deviceId = resolveRequestDeviceId(c);
    const rateLimitGuard = await guardPaymentRateLimit({
      c,
      store,
      userId: session.userId,
      userState,
      platform: session.platform,
      clientId,
      ...(deviceId ? { deviceId } : {}),
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
    const orderDetail = createMembershipOrderDetail(
      session,
      purchasePayload,
      duplicateProtected,
    );
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
      clientId,
      ...(deviceId ? { deviceId } : {}),
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

  app.get("/orders/catalog", async (c) => {
    return c.json(createPaymentCatalogResponse() satisfies PaymentCatalogResponse);
  });

  app.post("/orders/purchase", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, purchaseOrderSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    const purchasePayload: PurchaseOrderRequest = {
      skuId: payload.skuId,
      ...(payload.channel ? { channel: payload.channel } : {}),
      ...(payload.providerMode ? { providerMode: payload.providerMode } : {}),
      ...(payload.paymentScenario ? { paymentScenario: payload.paymentScenario } : {}),
      ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
      ...(payload.source ? { source: payload.source } : {}),
      ...(payload.novelId ? { novelId: payload.novelId } : {}),
      ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
      ...(payload.subscriptionId ? { subscriptionId: payload.subscriptionId } : {}),
    };

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
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
    const orderDetail = createProductOrderDetail(
      session,
      purchasePayload,
      duplicateProtected,
    );
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
      ...(orderDetail.operationResult ? { operationResult: orderDetail.operationResult } : {}),
      ...(orderDetail.entitlement ? { entitlement: orderDetail.entitlement } : {}),
      ...(orderDetail.subscription ? { subscription: orderDetail.subscription } : {}),
    } satisfies PurchaseOrderResponse);
  });

  app.get("/orders/list", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), listOrdersQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }
    const request: ListOrdersRequest = {
      ...(query.page ? { page: query.page } : {}),
      ...(query.pageSize ? { pageSize: query.pageSize } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.productType ? { productType: query.productType } : {}),
    };
    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    return c.json(listOrders(userState, request) satisfies OrderListResponse);
  });

  app.get("/subscriptions", async (c) => {
    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    return c.json(listSubscriptions(userState) satisfies SubscriptionListResponse);
  });

  app.post("/subscriptions/cancel", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, subscriptionOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
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
    userState.ordersById[orderId] = nextOrder;
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
  });

  app.post("/subscriptions/renew", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, subscriptionOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }
    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const existing = Object.values(userState.ordersById).find(
      (detail) => detail.subscription?.subscriptionId === payload.subscriptionId,
    );
    if (!existing?.sku) {
      return jsonError("NOT_FOUND", "Subscription not found.", 404, traceId);
    }
    const renewalDetail = createProductOrderDetail(
      session,
      {
        skuId: payload.skuId ?? existing.sku.skuId,
        subscriptionId: payload.subscriptionId,
        paymentScenario: "instant_success",
        ...(existing.order.source ? { source: existing.order.source } : {}),
        ...(existing.order.novelId ? { novelId: existing.order.novelId } : {}),
        ...(existing.order.chapterId ? { chapterId: existing.order.chapterId } : {}),
      },
      Boolean(userState.latestPaidOrderId),
    );
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
      ...(renewalDetail.operationResult
        ? { operationResult: renewalDetail.operationResult }
        : {}),
      ...(renewalDetail.entitlement ? { entitlement: renewalDetail.entitlement } : {}),
      subscription: renewalDetail.subscription,
    } satisfies PurchaseOrderResponse);
  });

  app.get("/after-sales/list", async (c) => {
    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    return c.json(listAfterSalesCases(userState) satisfies AfterSalesListResponse);
  });

  app.get("/after-sales/detail", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), afterSalesDetailQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }
    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const detail = getAfterSalesCaseDetail(userState, query.caseId);
    if (!detail) {
      return jsonError("NOT_FOUND", "After-sales case not found.", 404, traceId);
    }
    return c.json(detail satisfies AfterSalesDetailResponse);
  });

  app.get("/orders/detail", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), orderIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const orderDetail = userState.ordersById[query.orderId];
    if (!orderDetail) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    return c.json(orderDetail satisfies OrderDetailResponse);
  });

  app.post("/orders/cancel", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, orderOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
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
      userState.ordersById[payload.orderId] = attachAfterSalesCase(nextOrder, caseItem);
      await store.saveUserState(session.userId, userState);
      return c.json(userState.ordersById[payload.orderId]! satisfies OrderDetailResponse);
    }
    userState.ordersById[payload.orderId] = nextOrder;
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
  });

  app.post("/orders/refund", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, orderOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
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
      userState.ordersById[payload.orderId] = attachAfterSalesCase(nextOrder, caseItem);
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
    userState.ordersById[payload.orderId] = nextOrder;
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
  });

  app.get("/payments/result", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), orderIdQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const orderDetail = userState.ordersById[query.orderId];
    if (!orderDetail) {
      return jsonError("NOT_FOUND", "Payment result not found.", 404, traceId);
    }

    const nextResult = {
      ...orderDetail.paymentResult,
      polledAt: new Date().toISOString(),
    } satisfies PaymentResult;
    userState.ordersById[query.orderId] = {
      ...orderDetail,
      paymentResult: nextResult,
    };
    await store.saveUserState(session.userId, userState);
    return c.json(nextResult);
  });

  app.post("/payments/callback", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, paymentCallbackSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const existing = userState.ordersById[payload.orderId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    const now = Date.now();
    const verification = verifyPaymentCallback({
      detail: existing,
      payload: {
        orderId: payload.orderId,
        outcome: payload.outcome,
        ...(payload.verified !== undefined ? { verified: payload.verified } : {}),
        ...(payload.callbackReference ? { callbackReference: payload.callbackReference } : {}),
        ...(payload.provider ? { provider: payload.provider } : {}),
        ...(payload.gatewayTransactionId
          ? { gatewayTransactionId: payload.gatewayTransactionId }
          : {}),
        ...(payload.nonce ? { nonce: payload.nonce } : {}),
        ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
        ...(payload.signature ? { signature: payload.signature } : {}),
      },
      secret: resolveWebhookSecret(c.env),
      now,
    });
    if (!verification.ok) {
      const rejected = structuredClone(existing);
      const receivedAt = new Date(now).toISOString();
      rejected.callbackVerification = {
        status: "rejected",
        message: verification.message,
        callbackReference: verification.callbackReference,
      };
      appendCallbackLedger(rejected, {
        callbackReference: verification.callbackReference,
        orderId: payload.orderId,
        outcome: payload.outcome,
        verificationStatus: "rejected",
        ...(payload.nonce ? { nonce: payload.nonce } : {}),
        ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
        ...(verification.signatureDigest ? { signatureDigest: verification.signatureDigest } : {}),
        replayProtected: true,
        message: verification.message,
        receivedAt,
      });
      userState.ordersById[payload.orderId] = rejected;
      const operationalState = cloneOperationalState(await store.getOperationalState());
      appendOperationalMonitoringEvent(operationalState, {
        level: "warn",
        scope: "security",
        message: `Payment callback rejected for order ${payload.orderId}: ${verification.message}`,
        createdAt: receivedAt,
        userId: session.userId,
        dedupeKey: verification.callbackReference,
      });
      appendOperationalAuditRecord(operationalState, {
        category: "governance",
        action: "payment_callback_rejected",
        message: verification.message,
        createdAt: receivedAt,
        userId: session.userId,
        recordId: payload.orderId,
        metadata: {
          callbackVerified: false,
        },
      });
      await store.saveOperationalState(operationalState);
      await store.saveUserState(session.userId, userState);
      return jsonError(
        "PAYMENT_CALLBACK_REJECTED",
        verification.message,
        400,
        traceId,
      );
    }

    const callbackPayload: PaymentCallbackRequest = {
      orderId: payload.orderId,
      outcome: payload.outcome,
      verified: true,
      callbackReference: verification.callbackReference,
      ...(payload.provider ? { provider: payload.provider } : {}),
      ...(payload.gatewayTransactionId
        ? { gatewayTransactionId: payload.gatewayTransactionId }
        : {}),
      ...(payload.nonce ? { nonce: payload.nonce } : {}),
      ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
      ...(payload.signature ? { signature: payload.signature } : {}),
    };
    const nextOrder = applyPaymentCallback(existing, callbackPayload);
    if (payload.outcome === "success" && nextOrder.order.status === "paid") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "callback_success",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
    } else if (payload.outcome === "failure") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "callback_failure",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
    } else if (payload.outcome === "cancelled") {
      const assetLedgerIds = appendPaymentAssetLedgerEntries({
        userState,
        detail: nextOrder,
        action: "callback_cancelled",
      });
      if (nextOrder.operationResult) {
        nextOrder.operationResult.assetLedgerIds = assetLedgerIds;
      }
    }
    appendCallbackLedger(nextOrder, {
      callbackReference: verification.callbackReference,
      orderId: payload.orderId,
      outcome: payload.outcome,
      verificationStatus: "verified",
      ...(payload.nonce ? { nonce: payload.nonce } : {}),
      ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
      ...(verification.signatureDigest ? { signatureDigest: verification.signatureDigest } : {}),
      replayProtected: true,
      message: verification.message,
      receivedAt: new Date(now).toISOString(),
    });
    userState.ordersById[payload.orderId] = nextOrder;
    if (nextOrder.order.status === "paid" && nextOrder.entitlement && "overview" in nextOrder.entitlement) {
      userState.membershipPlanId = resolveMembershipPlanIdFromOrder(nextOrder) ?? "quarterly";
      userState.latestPaidOrderId = payload.orderId;
    }
    if (nextOrder.reconciliation.status !== "reconciled") {
      await schedulePaymentReconciliation({
        store,
        userId: session.userId,
        userState,
        orderId: nextOrder.order.orderId,
      });
    }
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
  });

  app.post("/payments/reconcile", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, orderOperationSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const existing = userState.ordersById[payload.orderId];
    if (!existing) {
      return jsonError("NOT_FOUND", "Order not found.", 404, traceId);
    }

    const nextOrder = applyPaymentReconciliation(existing);
    userState.ordersById[payload.orderId] = nextOrder;
    await store.saveUserState(session.userId, userState);
    return c.json(nextOrder satisfies OrderDetailResponse);
  });
}
