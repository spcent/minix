import type {
  OrderDetailResponse,
  PaymentCallbackRequest,
  PaymentResult,
} from "@minix/contracts";

import { loadRouteUserState, parseRouteBody, parseRouteQuery } from "../../http/route-context";
import { jsonError } from "../../http/response";
import {
  appendOperationalAuditRecord,
  appendOperationalMonitoringEvent,
  cloneOperationalState,
} from "../ops/jobs";
import {
  appendCallbackLedger,
  appendPaymentAssetLedgerEntries,
  applyPaymentCallback,
  applyPaymentReconciliation,
  resolveMembershipPlanIdFromOrder,
  verifyPaymentCallback,
} from "./ledger";
import type { RegisterPaymentRoutesOptions } from "./route-options";
import { orderIdQuerySchema, orderOperationSchema, paymentCallbackSchema } from "./schemas";

export function registerPaymentCallbackRoutes(options: RegisterPaymentRoutesOptions) {
  const { app, resolveStore, schedulePaymentReconciliation, resolveWebhookSecret } = options;

  app.get("/payments/result", async (c) => {
    const query = parseRouteQuery(c, orderIdQuerySchema);
    if (query instanceof Response) {
      return query;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
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
    const payload = await parseRouteBody(c, paymentCallbackSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
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
    const payload = await parseRouteBody(c, orderOperationSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const { traceId, session, store, userState } = await loadRouteUserState(c, resolveStore);
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
