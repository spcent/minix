import { createHmac } from "node:crypto";

import type {
  MembershipEntitlement,
  OrderDetailResponse,
  PaymentCallbackLedgerEntry,
  PaymentCallbackRequest,
  PaymentGatewayReference,
  PaymentLedgerEntry,
  PaymentReconciliationLedgerEntry,
  PurchaseMembershipRequest,
  UserAssetLedgerEntry,
} from "@minix/contracts";

import {
  appendUserAssetLedgerEntry,
  createAssetLedgerEntry,
} from "../account/assets";
import { isSampleProviderMode } from "../provider-posture";
import { cloneDomainSnapshot } from "../snapshot";
import type { UserState } from "../../types";
import { createLedgerId, createPaymentLedgerEntry } from "./catalog";

function cloneOrderDetail(detail: OrderDetailResponse): OrderDetailResponse {
  return cloneDomainSnapshot(detail);
}

export function createPaymentWebhookSignature(input: {
  secret: string;
  orderId: string;
  outcome: string;
  callbackReference: string;
  nonce: string;
  timestamp: number;
  gatewayTransactionId?: string | undefined;
}): string {
  return createHmac("sha256", input.secret)
    .update(
      [
        input.orderId,
        input.outcome,
        input.callbackReference,
        input.nonce,
        String(input.timestamp),
        input.gatewayTransactionId ?? "",
      ].join("\n"),
    )
    .digest("hex");
}

function appendOperationLedger(detail: OrderDetailResponse, entry: PaymentLedgerEntry) {
  detail.operationLedger = [...(detail.operationLedger ?? []), entry];
}

function appendPaymentLedger(detail: OrderDetailResponse, entry: PaymentLedgerEntry) {
  detail.paymentLedger = [...(detail.paymentLedger ?? []), entry];
}

function appendReconciliationLedger(
  detail: OrderDetailResponse,
  entry: PaymentReconciliationLedgerEntry,
) {
  detail.reconciliationLedger = [...(detail.reconciliationLedger ?? []), entry];
}

export function appendCallbackLedger(
  detail: OrderDetailResponse,
  entry: PaymentCallbackLedgerEntry,
) {
  detail.callbackLedger = [...(detail.callbackLedger ?? []), entry];
}

export function resolveMembershipPlanIdFromOrder(
  detail: OrderDetailResponse,
): PurchaseMembershipRequest["planId"] | undefined {
  const membershipSkuId =
    detail.sku?.skuId ??
    detail.order.lineItems.find((item) => item.productType === "membership")?.skuId ??
    "";
  return membershipSkuId.endsWith("_annual")
    ? "annual"
    : membershipSkuId.endsWith("_monthly")
      ? "monthly"
      : membershipSkuId.endsWith("_quarterly")
        ? "quarterly"
        : undefined;
}

function createAssetLedgerEntitlement(
  detail: OrderDetailResponse,
  status: NonNullable<UserAssetLedgerEntry["entitlement"]>["status"],
) {
  if (!detail.entitlement) {
    return undefined;
  }

  const planId = resolveMembershipPlanIdFromOrder(detail);
  const membershipEntitlement =
    detail.entitlement.productType === "membership" && "overview" in detail.entitlement
      ? (detail.entitlement as MembershipEntitlement)
      : undefined;
  return {
    entitlementId: detail.entitlement.entitlementId,
    key: detail.sku?.entitlementKey ?? `${detail.entitlement.productType}:${detail.order.orderId}`,
    label:
      membershipEntitlement && planId
        ? membershipEntitlement.overview.headline
        : detail.product?.title ?? detail.order.title,
    status,
    active: status === "active",
    productType: detail.entitlement.productType,
    ...(planId ? { planId } : {}),
    sourceOrderId: detail.order.orderId,
    ...(detail.subscription?.renewsAt ? { expiresAt: detail.subscription.renewsAt } : {}),
  } satisfies NonNullable<UserAssetLedgerEntry["entitlement"]>;
}

function resolveEntitlementLedgerSubject(
  detail: OrderDetailResponse,
): UserAssetLedgerEntry["subject"] {
  return detail.entitlement?.productType === "membership"
    ? "membership"
    : "entitlement";
}

export function appendPaymentAssetLedgerEntries(input: {
  userState: UserState;
  detail: OrderDetailResponse;
  action:
    | "purchase_paid"
    | "purchase_pending"
    | "cancel_pending"
    | "refund_paid"
    | "callback_success"
    | "callback_failure"
    | "callback_cancelled";
}): string[] {
  const planId = resolveMembershipPlanIdFromOrder(input.detail);
  const amountCents = input.detail.order.totalAmountCents;
  const createdAt = input.detail.order.updatedAt;
  const ledgerIds: string[] = [];
  const append = (entry: Omit<UserAssetLedgerEntry, "ledgerId">) => {
    const next = createAssetLedgerEntry(entry);
    appendUserAssetLedgerEntry(input.userState, next);
    ledgerIds.push(next.ledgerId);
  };

  if (input.action === "purchase_paid") {
    append({
      subject: "balance",
      kind: "consume",
      title: `${input.detail.order.title} payment captured`,
      message: `${input.detail.order.title} order ${input.detail.order.orderId} consumed wallet balance.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      balanceDeltaCents: -amountCents,
    });
    const grantedEntitlement = createAssetLedgerEntitlement(input.detail, "active");
    if (grantedEntitlement) {
      append({
        subject: resolveEntitlementLedgerSubject(input.detail),
        kind: "grant",
        title: `${input.detail.order.title} granted`,
        message: `${input.detail.order.title} entitlement was granted after successful payment.`,
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        ...(planId ? { membershipPlanId: planId } : {}),
        entitlement: grantedEntitlement,
      });
    }
    if (input.detail.order.productType === "membership") {
      append({
        subject: "points",
        kind: "grant",
        title: "Membership purchase reward",
        message: "Membership purchase granted loyalty points.",
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        pointsDelta: 30,
      });
    }
    return ledgerIds;
  }

  if (input.action === "purchase_pending") {
    append({
      subject: "balance",
      kind: "freeze",
      title: "Payment hold created",
      message: `Pending order ${input.detail.order.orderId} froze wallet balance until callback confirmation.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      frozenBalanceDeltaCents: amountCents,
    });
    const frozenEntitlement = createAssetLedgerEntitlement(input.detail, "frozen");
    if (frozenEntitlement) {
      append({
        subject: "entitlement",
        kind: "freeze",
        title: `${input.detail.order.title} entitlement pending`,
        message: `${input.detail.order.title} entitlement is pending payment confirmation.`,
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        entitlement: frozenEntitlement,
      });
    }
    return ledgerIds;
  }

  if (input.action === "cancel_pending") {
    append({
      subject: "balance",
      kind: "unfreeze",
      title: "Payment hold released",
      message: `Pending order ${input.detail.order.orderId} was cancelled and the wallet hold was released.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      frozenBalanceDeltaCents: -amountCents,
    });
    return ledgerIds;
  }

  if (input.action === "callback_success") {
    append({
      subject: "balance",
      kind: "unfreeze",
      title: "Payment hold settled",
      message: `Callback success settled the frozen wallet amount for ${input.detail.order.orderId}.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      frozenBalanceDeltaCents: -amountCents,
    });
    append({
      subject: "balance",
      kind: "consume",
      title: `${input.detail.order.title} payment captured`,
      message: `Confirmed callback consumed the wallet amount for ${input.detail.order.orderId}.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      balanceDeltaCents: -amountCents,
    });
    const activatedEntitlement = createAssetLedgerEntitlement(input.detail, "active");
    if (activatedEntitlement) {
      append({
        subject: resolveEntitlementLedgerSubject(input.detail),
        kind: "grant",
        title: `${input.detail.order.title} activated`,
        message: `${input.detail.order.title} entitlement moved from pending to active after callback success.`,
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        ...(planId ? { membershipPlanId: planId } : {}),
        entitlement: activatedEntitlement,
      });
    }
    return ledgerIds;
  }

  if (input.action === "callback_failure" || input.action === "callback_cancelled") {
    append({
      subject: "balance",
      kind: "unfreeze",
      title: "Payment hold released",
      message: `Payment callback released the frozen wallet amount for ${input.detail.order.orderId}.`,
      createdAt,
      sourceType: "payment",
      sourceId: input.detail.order.orderId,
      frozenBalanceDeltaCents: -amountCents,
    });
    const revokedEntitlement = createAssetLedgerEntitlement(
      input.detail,
      input.action === "callback_failure" ? "revoked" : "expired",
    );
    if (revokedEntitlement) {
      append({
        subject: "entitlement",
        kind: input.action === "callback_failure" ? "revoke" : "expire",
        title:
          input.action === "callback_failure"
            ? `${input.detail.order.title} entitlement revoked`
            : `${input.detail.order.title} entitlement cancelled`,
        message:
          input.action === "callback_failure"
            ? `Pending ${input.detail.order.title} entitlement was revoked after callback failure.`
            : `Pending ${input.detail.order.title} entitlement was cancelled before activation.`,
        createdAt,
        sourceType: "payment",
        sourceId: input.detail.order.orderId,
        entitlement: revokedEntitlement,
      });
    }
    return ledgerIds;
  }

  if (input.action === "refund_paid") {
    append({
      subject: "balance",
      kind: "refund",
      title: `${input.detail.order.title} refund credited`,
      message: `Refund for ${input.detail.order.orderId} returned wallet balance.`,
      createdAt,
      sourceType: "refund",
      sourceId: input.detail.order.orderId,
      balanceDeltaCents: amountCents,
    });
    const refundedEntitlement = createAssetLedgerEntitlement(input.detail, "refunded");
    if (refundedEntitlement) {
      append({
        subject: resolveEntitlementLedgerSubject(input.detail),
        kind: "refund",
        title: `${input.detail.order.title} refunded`,
        message: `${input.detail.order.title} entitlement was refunded and revoked.`,
        createdAt,
        sourceType: "refund",
        sourceId: input.detail.order.orderId,
        ...(planId ? { membershipPlanId: planId } : {}),
        entitlement: refundedEntitlement,
      });
    }
  }

  return ledgerIds;
}

export function createPaymentOperationResult(input: {
  operation: NonNullable<OrderDetailResponse["operationResult"]>["operation"];
  applied: boolean;
  orderStatus: NonNullable<OrderDetailResponse["operationResult"]>["orderStatus"];
  paymentStatus: NonNullable<OrderDetailResponse["operationResult"]>["paymentStatus"];
  message: string;
  processedAt?: string;
}) {
  const continuitySummary =
    input.operation === "verify_callback"
      ? "Callback handling updated the shared order state, but reconciliation remains the follow-up continuity checkpoint."
      : input.operation === "reconcile"
        ? "Reconciliation updated the canonical order detail without creating a second payment surface."
        : input.operation === "refund"
          ? "Refund continuity now flows through the same order, entitlement, and after-sales surfaces."
          : "Cancellation continuity now flows through the same order detail and reconciliation surfaces.";
  return {
    operation: input.operation,
    applied: input.applied,
    orderStatus: input.orderStatus,
    paymentStatus: input.paymentStatus,
    message: input.message,
    continuitySummary,
    processedAt: input.processedAt ?? new Date().toISOString(),
  };
}

export function verifyPaymentCallback(input: {
  detail: OrderDetailResponse;
  payload: PaymentCallbackRequest;
  secret: string;
  now: number;
}): {
  ok: boolean;
  callbackReference: string;
  message: string;
  signatureDigest?: string | undefined;
} {
  const providerMode = input.detail.paymentIntent.gatewayReference?.providerMode ?? "sample";
  const callbackReference = input.payload.callbackReference ?? `cb_${input.payload.orderId}`;
  if (isSampleProviderMode(providerMode)) {
    return {
      ok: input.payload.verified !== false,
      callbackReference,
      message:
        input.payload.verified === false
          ? "Sample callback was explicitly rejected."
          : "Sample callback verification succeeded.",
    };
  }

  if (!input.payload.nonce || !input.payload.timestamp || !input.payload.signature) {
    return {
      ok: false,
      callbackReference,
      message: "Production payment callback is missing nonce, timestamp, or signature.",
    };
  }

  const ageMs = Math.abs(input.now - input.payload.timestamp);
  if (ageMs > 5 * 60_000) {
    return {
      ok: false,
      callbackReference,
      message:
        "Production payment callback timestamp is outside the accepted replay window.",
    };
  }

  const replayed = (input.detail.callbackLedger ?? []).some((entry) => {
    return (
      entry.callbackReference === callbackReference ||
      (input.payload.nonce ? entry.nonce === input.payload.nonce : false)
    );
  });
  if (replayed) {
    return {
      ok: false,
      callbackReference,
      message: "Production payment callback was rejected by replay protection.",
    };
  }

  const expected = createPaymentWebhookSignature({
    secret: input.secret,
    orderId: input.payload.orderId,
    outcome: input.payload.outcome,
    callbackReference,
    nonce: input.payload.nonce,
    timestamp: input.payload.timestamp,
    ...(input.payload.gatewayTransactionId
      ? { gatewayTransactionId: input.payload.gatewayTransactionId }
      : {}),
  });
  const matches = expected === input.payload.signature;
  return {
    ok: matches,
    callbackReference,
    message: matches
      ? "Production payment callback signature verified."
      : "Production payment callback signature mismatch.",
    signatureDigest: expected,
  };
}

export function applyOrderCancellation(
  detail: OrderDetailResponse,
  reason?: string,
): OrderDetailResponse {
  const next = cloneOrderDetail(detail);
  const processedAt = new Date().toISOString();
  const cancellable =
    next.order.status === "created" || next.order.status === "pending_payment";
  if (cancellable) {
    next.order.status = "cancelled";
    next.order.updatedAt = processedAt;
    next.paymentIntent.status = "cancelled";
    next.paymentResult.status = "cancelled";
    next.paymentResult.paid = false;
    next.paymentResult.callbackVerified = false;
    next.paymentResult.message = reason
      ? `Order cancelled before payment completion. Reason: ${reason}.`
      : "Order cancelled before payment completion.";
    next.paymentResult.continuitySummary =
      "The order was cancelled before settlement, and shared commerce continuity now depends on reconciliation confirming the closed state.";
    next.paymentResult.duplicateProtectionSummary = next.paymentResult.duplicateProtected
      ? "Duplicate-payment protection prevented a second charge and returned the stored order state."
      : "No duplicate-payment guard was triggered for this commerce attempt.";
    next.callbackVerification = {
      status: "pending",
      message: "No callback verification is required after the cancellation.",
      diagnosticsSummary: "Callback verification is no longer required because the order closed before settlement.",
      operatorActionSummary: "Operators can inspect the order and reconciliation ledgers without reopening a second payment flow.",
    };
    next.reconciliation = {
      status: "reconciled",
      message: "Order cancellation and payment result are aligned.",
      diagnosticsSummary: "Reconciliation confirmed that the cancellation and stored payment result are aligned.",
      ledgerAuditSummary: "Operation and reconciliation ledgers keep the append-only audit trail for this cancellation.",
      checkedAt: processedAt,
    };
  }

  next.operationResult = createPaymentOperationResult({
    operation: "cancel",
    applied: cancellable,
    orderStatus: next.order.status,
    paymentStatus: next.paymentResult.status,
    message: cancellable
      ? next.paymentResult.message
      : "The current order can no longer be cancelled.",
    processedAt,
  });
  appendOperationLedger(
    next,
    createPaymentLedgerEntry({
      kind: "operation",
      order: next.order,
      status: next.order.status,
      message: next.operationResult.message,
      createdAt: processedAt,
      ...(next.paymentIntent.gatewayReference
        ? { gatewayReference: next.paymentIntent.gatewayReference }
        : {}),
    }),
  );
  appendReconciliationLedger(next, {
    reconciliationId: createLedgerId("recon"),
    orderId: next.order.orderId,
    status: next.reconciliation.status,
    ...(next.paymentIntent.gatewayReference
      ? { gatewayReference: next.paymentIntent.gatewayReference }
      : {}),
    message: next.reconciliation.message,
    checkedAt: processedAt,
  });
  return next;
}

export function applyOrderRefund(
  detail: OrderDetailResponse,
  reason?: string,
): OrderDetailResponse {
  const next = cloneOrderDetail(detail);
  const processedAt = new Date().toISOString();
  const providerMode = next.paymentIntent.gatewayReference?.providerMode ?? "sample";
  const refundable = next.order.status === "paid";
  if (refundable) {
    next.order.status = "refunded";
    next.order.updatedAt = processedAt;
    next.paymentIntent.status = "succeeded";
    next.paymentResult.status = "refunded";
    next.paymentResult.paid = false;
    next.paymentResult.callbackVerified = true;
    next.paymentResult.message =
      isSampleProviderMode(providerMode)
        ? reason
          ? `Refund completed in the sample payment domain. Reason: ${reason}.`
          : "Refund completed in the sample payment domain."
        : reason
          ? `Refund completed. Reason: ${reason}.`
          : "Refund completed.";
    next.paymentResult.continuitySummary =
      "The order moved into refund continuity, and shared after-sales plus ledger views remain the canonical follow-up surface.";
    next.paymentResult.duplicateProtectionSummary = next.paymentResult.duplicateProtected
      ? "Duplicate-payment protection prevented a second charge and returned the stored order state."
      : "No duplicate-payment guard was triggered for this commerce attempt.";
    next.callbackVerification = {
      status: "verified",
      message: "The payment callback remained verified through the refund transition.",
      diagnosticsSummary: "Callback verification stayed valid through the refund transition.",
      operatorActionSummary: "Operators can inspect refund and callback ledgers without changing the shared commerce envelope.",
      verifiedAt: processedAt,
      callbackReference: next.callbackVerification.callbackReference ?? `cb_${next.order.orderId}`,
    };
    next.reconciliation = {
      status: "reconciled",
      message: "Refund state reconciled with the stored order record.",
      diagnosticsSummary: "Reconciliation confirmed that refund state and stored order detail are aligned.",
      ledgerAuditSummary: "Refund, callback, and reconciliation ledgers keep the append-only audit trail for this order.",
      checkedAt: processedAt,
    };
    if (next.entitlement) {
      next.entitlement.active = false;
      next.entitlement.statusLabel = "Refunded";
    }
  }

  next.operationResult = createPaymentOperationResult({
    operation: "refund",
    applied: refundable,
    orderStatus: next.order.status,
    paymentStatus: next.paymentResult.status,
    message: refundable
      ? next.paymentResult.message
      : "Only paid orders can enter the refund flow.",
    processedAt,
  });
  appendOperationLedger(
    next,
    createPaymentLedgerEntry({
      kind: "refund",
      order: next.order,
      status: next.order.status,
      message: next.operationResult.message,
      createdAt: processedAt,
      ...(next.paymentIntent.gatewayReference
        ? { gatewayReference: next.paymentIntent.gatewayReference }
        : {}),
    }),
  );
  appendPaymentLedger(
    next,
    createPaymentLedgerEntry({
      kind: "refund",
      order: next.order,
      status: next.paymentResult.status,
      message: next.operationResult.message,
      createdAt: processedAt,
      ...(next.paymentIntent.gatewayReference
        ? {
            gatewayReference: {
              ...next.paymentIntent.gatewayReference,
              gatewayRefundId: `refund_${next.order.orderId}`,
            },
          }
        : {}),
    }),
  );
  appendReconciliationLedger(next, {
    reconciliationId: createLedgerId("recon"),
    orderId: next.order.orderId,
    status: next.reconciliation.status,
    ...(next.paymentIntent.gatewayReference
      ? { gatewayReference: next.paymentIntent.gatewayReference }
      : {}),
    message: next.reconciliation.message,
    checkedAt: processedAt,
  });
  return next;
}

export function applyPaymentCallback(
  detail: OrderDetailResponse,
  payload: PaymentCallbackRequest,
): OrderDetailResponse {
  const next = cloneOrderDetail(detail);
  const processedAt = new Date().toISOString();
  const verified = payload.verified !== false;
  const providerMode = next.paymentIntent.gatewayReference?.providerMode ?? "sample";
  next.paymentResult.duplicateProtectionSummary = next.paymentResult.duplicateProtected
    ? "Duplicate-payment protection prevented a second charge and returned the stored order state."
    : "No duplicate-payment guard was triggered for this commerce attempt.";
  next.order.updatedAt = processedAt;
  next.callbackVerification = {
    status: verified ? "verified" : "rejected",
    message: verified
      ? isSampleProviderMode(providerMode)
        ? "Sample callback verification succeeded."
        : "Production callback verification succeeded."
      : isSampleProviderMode(providerMode)
        ? "Sample callback verification rejected the callback payload."
        : "Production callback verification rejected the callback payload.",
    ...(verified ? { verifiedAt: processedAt } : {}),
    ...(payload.callbackReference ? { callbackReference: payload.callbackReference } : {}),
    diagnosticsSummary: verified
      ? "Callback verification completed and the shared order detail can now be trusted as the gateway source of truth."
      : "Callback verification rejected the payload, so operator follow-up should inspect signature, replay, or merchant configuration.",
    operatorActionSummary: verified
      ? isSampleProviderMode(providerMode)
        ? "Operators can still inspect callback and reconciliation evidence even while the gateway remains in explicit sample mode."
        : "Operators can inspect callback and reconciliation evidence without changing the shared commerce envelope."
      : isSampleProviderMode(providerMode)
        ? "Inspect the sample callback payload and replay posture before retrying reconciliation."
        : "Inspect webhook secret, merchant callback payload, and replay posture before retrying reconciliation.",
  };
  next.paymentIntent.status = verified ? "succeeded" : "verifying";

  if (payload.outcome === "success" && verified) {
    next.order.status = "paid";
    next.paymentIntent.status = "succeeded";
    next.paymentResult.status = "success";
    next.paymentResult.paid = true;
    next.paymentResult.callbackVerified = true;
    next.paymentResult.message =
      "Payment callback confirmed the successful payment result.";
    next.paymentResult.continuitySummary =
      "The payment result is successful, but shared commerce continuity still depends on callback verification and reconciliation staying aligned.";
    next.paymentResult.polledAt = processedAt;
    if (next.entitlement) {
      next.entitlement.active = true;
      next.entitlement.statusLabel = "Membership active";
    }
  } else if (payload.outcome === "failure") {
    next.order.status = "payment_failed";
    next.paymentIntent.status = verified ? "failed" : "verifying";
    next.paymentResult.status = "failure";
    next.paymentResult.paid = false;
    next.paymentResult.callbackVerified = verified;
    next.paymentResult.message = verified
      ? "Payment callback marked the order as failed."
      : "Payment callback could not be verified and the order remains in a failed state.";
    next.paymentResult.continuitySummary =
      "The payment result failed, so follow-up should focus on retry posture and ledger visibility instead of entitlement continuity.";
    next.paymentResult.polledAt = processedAt;
    if (next.entitlement) {
      next.entitlement.active = false;
      next.entitlement.statusLabel = "Payment failed";
    }
  } else if (payload.outcome === "cancelled") {
    next.order.status = "cancelled";
    next.paymentIntent.status = "cancelled";
    next.paymentResult.status = "cancelled";
    next.paymentResult.paid = false;
    next.paymentResult.callbackVerified = verified;
    next.paymentResult.message = "Payment callback marked the order as cancelled.";
    next.paymentResult.continuitySummary =
      "The order was cancelled before settlement, and shared commerce continuity now depends on reconciliation confirming the closed state.";
    next.paymentResult.polledAt = processedAt;
    if (next.entitlement) {
      next.entitlement.active = false;
      next.entitlement.statusLabel = "Cancelled";
    }
  }

  next.reconciliation = {
    status: "pending",
    message: "Callback applied. Reconciliation is still pending.",
    diagnosticsSummary: "Reconciliation is still pending, so callback and order state should be treated as provisional continuity checkpoints.",
    ledgerAuditSummary: "Callback and reconciliation ledgers will keep the append-only audit trail for this order.",
  };
  next.operationResult = createPaymentOperationResult({
    operation: "verify_callback",
    applied: true,
    orderStatus: next.order.status,
    paymentStatus: next.paymentResult.status,
    message: next.paymentResult.message,
    processedAt,
  });
  if (payload.gatewayTransactionId && next.paymentIntent.gatewayReference) {
    next.paymentIntent.gatewayReference = {
      ...next.paymentIntent.gatewayReference,
      gatewayTransactionId: payload.gatewayTransactionId,
    };
  }
  appendPaymentLedger(
    next,
    createPaymentLedgerEntry({
      kind: "callback",
      order: next.order,
      status: next.paymentResult.status,
      message: next.paymentResult.message,
      createdAt: processedAt,
      ...(next.paymentIntent.gatewayReference
        ? { gatewayReference: next.paymentIntent.gatewayReference }
        : {}),
    }),
  );
  appendOperationLedger(
    next,
    createPaymentLedgerEntry({
      kind: "operation",
      order: next.order,
      status: next.order.status,
      message: next.operationResult.message,
      createdAt: processedAt,
      ...(next.paymentIntent.gatewayReference
        ? { gatewayReference: next.paymentIntent.gatewayReference }
        : {}),
    }),
  );
  return next;
}

export function applyPaymentReconciliation(
  detail: OrderDetailResponse,
): OrderDetailResponse {
  const next = cloneOrderDetail(detail);
  const processedAt = new Date().toISOString();
  const matches =
    (next.order.status === "paid" &&
      next.paymentResult.status === "success" &&
      next.paymentResult.paid) ||
    (next.order.status === "cancelled" &&
      next.paymentResult.status === "cancelled" &&
      !next.paymentResult.paid) ||
    (next.order.status === "payment_failed" &&
      next.paymentResult.status === "failure" &&
      !next.paymentResult.paid) ||
    (next.order.status === "refunded" &&
      next.paymentResult.status === "refunded" &&
      !next.paymentResult.paid) ||
    (next.order.status === "pending_payment" &&
      next.paymentResult.status === "pending");
  next.reconciliation = matches
    ? {
        status: "reconciled",
        message: "The stored payment result matches the current order state.",
        diagnosticsSummary: "Reconciliation confirmed that stored order state, payment result, and callback posture are aligned.",
        ledgerAuditSummary: "Reconciliation and operation ledgers keep the append-only audit trail for this order.",
        checkedAt: processedAt,
      }
    : {
        status: "mismatch",
        message: "The stored payment result does not match the current order state.",
        diagnosticsSummary: "Reconciliation found a mismatch between stored order state and the latest payment result.",
        ledgerAuditSummary: "Use callback, payment, and reconciliation ledgers to audit the mismatch before any manual correction.",
        checkedAt: processedAt,
        mismatchReason: `${next.order.status} vs ${next.paymentResult.status}`,
      };
  next.operationResult = createPaymentOperationResult({
    operation: "reconcile",
    applied: true,
    orderStatus: next.order.status,
    paymentStatus: next.paymentResult.status,
    message: next.reconciliation.message,
    processedAt,
  });
  appendOperationLedger(
    next,
    createPaymentLedgerEntry({
      kind: "reconciliation",
      order: next.order,
      status: next.reconciliation.status,
      message: next.reconciliation.message,
      createdAt: processedAt,
      ...(next.paymentIntent.gatewayReference
        ? { gatewayReference: next.paymentIntent.gatewayReference }
        : {}),
    }),
  );
  appendReconciliationLedger(next, {
    reconciliationId: createLedgerId("recon"),
    orderId: next.order.orderId,
    status: next.reconciliation.status,
    ...(next.paymentIntent.gatewayReference
      ? { gatewayReference: next.paymentIntent.gatewayReference }
      : {}),
    message: next.reconciliation.message,
    checkedAt: processedAt,
  });
  return next;
}
