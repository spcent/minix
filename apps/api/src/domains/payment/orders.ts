import type {
  ListOrdersRequest,
  MembershipEntitlement,
  Order,
  OrderDetailResponse,
  OrderList,
  OrderListResponse,
  OrderSummary,
  PaymentCallbackVerification,
  PaymentIntent,
  PaymentReconciliation,
  PaymentReconciliationLedgerEntry,
  PaymentResult,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  PurchaseOrderRequest,
} from "@minix/contracts";

import { deriveReturnTarget } from "../content/novels";
import type { SessionRecord, UserState } from "../../types";
import {
  createGatewayExecution,
  createGenericEntitlement,
  createLedgerId,
  createMembershipEntitlement,
  createMembershipOverview,
  createPaymentChannel,
  createPaymentLedgerEntry,
  createPaymentProviderMode,
  createPendingCallbackVerification,
  createPendingReconciliation,
  getPaymentProduct,
  getPaymentSku,
  resolveMembershipSku,
} from "./catalog";
import { createSubscriptionRecord } from "./subscriptions";

function createOrderIdempotencySummary(input: {
  duplicateProtected: boolean;
  idempotencyKey?: string;
}) {
  if (input.duplicateProtected) {
    return "Duplicate-payment protection reused the existing order outcome instead of creating a second charge.";
  }
  if (input.idempotencyKey) {
    return "This order carries an idempotency key so repeated submits can be folded into the same commerce flow.";
  }
  return "This order does not carry an idempotency key, so repeated submits may create independent commerce attempts.";
}

function createPaymentIntentCapabilitySummary(input: {
  platform: SessionRecord["platform"];
  channel: Order["channel"];
}) {
  if (input.channel === "wechat_pay") {
    return input.platform === "wechat"
      ? "Native WeChat payment can continue through the shared payment bridge when the host capability is available."
      : "WeChat payment was selected outside the WeChat runtime, so a host-native payment bridge is still required before execution can continue.";
  }
  if (input.channel === "h5_pay") {
    return "H5 payment can continue through redirect-based execution and resume through the shared order detail surface.";
  }
  if (input.channel === "membership_purchase") {
    return "Membership purchase resolves inside the shared commerce flow without a separate host-local payment wrapper.";
  }
  return "Virtual entitlement purchase resolves inside the shared commerce flow without a separate host-local payment wrapper.";
}

function createPaymentIntentExecutionSummary(input: {
  providerMode: "sample" | "production";
  pending: boolean;
  channel: Order["channel"];
}) {
  const channelLabel = input.channel.replace("_", " ");
  if (input.pending) {
    return input.providerMode === "sample"
      ? `The sample ${channelLabel} execution is waiting for callback confirmation and later reconciliation.`
      : `${channelLabel} execution is waiting for verified callback confirmation and later reconciliation.`;
  }
  return input.providerMode === "sample"
    ? `The sample ${channelLabel} execution completed, but callback verification and reconciliation still provide the continuity checkpoints.`
    : `${channelLabel} execution completed, and callback verification plus reconciliation remain the continuity checkpoints.`;
}

function createPaymentResultContinuitySummary(input: {
  status: PaymentResult["status"];
  providerMode: "sample" | "production";
}) {
  switch (input.status) {
    case "pending":
      return input.providerMode === "sample"
        ? "The order is held in pending continuity until the sample callback and reconciliation steps finish."
        : "The order is held in pending continuity until verified callback and reconciliation steps finish.";
    case "success":
      return "The payment result is successful, but shared commerce continuity still depends on callback verification and reconciliation staying aligned.";
    case "failure":
      return "The payment result failed, so follow-up should focus on retry posture and ledger visibility instead of entitlement continuity.";
    case "cancelled":
      return "The order was cancelled before settlement, and shared commerce continuity now depends on reconciliation confirming the closed state.";
    case "refunded":
      return "The order moved into refund continuity, and shared after-sales plus ledger views remain the canonical follow-up surface.";
    default:
      return undefined;
  }
}

function createDuplicateProtectionSummary(duplicateProtected: boolean) {
  return duplicateProtected
    ? "Duplicate-payment protection prevented a second charge and returned the stored order state."
    : "No duplicate-payment guard was triggered for this commerce attempt.";
}

function createCallbackDiagnosticsSummary(input: {
  status: PaymentCallbackVerification["status"];
  providerMode: "sample" | "production";
}) {
  switch (input.status) {
    case "pending":
      return input.providerMode === "sample"
        ? "Callback verification is still waiting on the sample gateway payload."
        : "Callback verification is still waiting on the production gateway payload.";
    case "verified":
      return "Callback verification completed and the shared order detail can now be trusted as the gateway source of truth.";
    case "rejected":
      return "Callback verification rejected the payload, so operator follow-up should inspect signature, replay, or merchant configuration.";
    default:
      return undefined;
  }
}

function createCallbackOperatorActionSummary(input: {
  status: PaymentCallbackVerification["status"];
  providerMode: "sample" | "production";
}) {
  if (input.status === "rejected") {
    return input.providerMode === "sample"
      ? "Inspect the sample callback payload and replay posture before retrying reconciliation."
      : "Inspect webhook secret, merchant callback payload, and replay posture before retrying reconciliation.";
  }
  return input.providerMode === "sample"
    ? "Operators can still inspect callback and reconciliation evidence even while the gateway remains in explicit sample mode."
    : "Operators can inspect callback and reconciliation evidence without changing the shared commerce envelope.";
}

function createReconciliationDiagnosticsSummary(input: {
  status: PaymentReconciliation["status"];
}) {
  switch (input.status) {
    case "pending":
      return "Reconciliation is still pending, so callback and order state should be treated as provisional continuity checkpoints.";
    case "reconciled":
      return "Reconciliation confirmed that stored order state, payment result, and callback posture are aligned.";
    case "mismatch":
      return "Reconciliation found a mismatch between stored order state and the latest payment result.";
    case "not_required":
      return "Reconciliation is not required for the current payment posture.";
    default:
      return undefined;
  }
}

function createInitialPaymentMessage(input: {
  providerMode: "sample" | "production";
  pending: boolean;
  duplicateProtected: boolean;
  title?: string;
}): string {
  if (input.pending) {
    if (input.title) {
      return input.providerMode === "sample"
        ? `${input.title} is pending gateway confirmation in the sample payment domain.`
        : `${input.title} is pending gateway confirmation.`;
    }
    return input.providerMode === "sample"
      ? "Payment is pending gateway confirmation in the sample payment domain."
      : "Payment is pending gateway confirmation.";
  }

  if (input.duplicateProtected) {
    return input.title
      ? `Duplicate payment protection returned the existing ${input.title} outcome.`
      : "Duplicate payment protection kept the active entitlement and returned the existing paid outcome.";
  }

  if (input.title) {
    return input.providerMode === "sample"
      ? `${input.title} completed in the sample payment domain.`
      : `${input.title} completed and is awaiting callback verification.`;
  }

  return input.providerMode === "sample"
    ? "Payment completed in the sample payment domain."
    : "Payment completed and is awaiting callback verification.";
}

export function createMembershipOrderDetail(
  session: SessionRecord,
  payload: PurchaseMembershipRequest,
  duplicateProtected = false,
  now = new Date().toISOString(),
): OrderDetailResponse & { entitlement: MembershipEntitlement } {
  const orderId = `ord_${crypto.randomUUID()}`;
  const sku = resolveMembershipSku(payload.planId);
  const product = getPaymentProduct(sku.productId)!;
  const amountCents = sku.amountCents;
  const title = sku.title;
  const channel = createPaymentChannel(payload.channel, session.platform);
  const providerMode = createPaymentProviderMode(payload);
  const pending = payload.paymentScenario === "pending";
  const order: Order = {
    orderId,
    title,
    status: pending ? "pending_payment" : "paid",
    productType: "membership",
    channel,
    currency: "CNY",
    totalAmountCents: amountCents,
    ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    duplicateProtected,
    idempotencySummary: createOrderIdempotencySummary({
      duplicateProtected,
      ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    }),
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    createdAt: now,
    updatedAt: now,
    lineItems: [
      {
        productId: sku.productId,
        skuId: sku.skuId,
        productType: "membership",
        title,
        quantity: 1,
        unitAmountCents: amountCents,
        totalAmountCents: amountCents,
      },
    ],
  };
  const gatewayExecution = createGatewayExecution({ order, providerMode, now });
  const gatewayReference = {
    provider: gatewayExecution.response.provider,
    providerMode,
    gatewayOrderId: gatewayExecution.response.gatewayOrderId,
  };
  const paymentContinuitySummary = createPaymentResultContinuitySummary({
    status: pending ? "pending" : "success",
    providerMode,
  });
  const callbackDiagnosticsSummary = createCallbackDiagnosticsSummary({
    status: "pending",
    providerMode,
  });
  const reconciliationDiagnosticsSummary = createReconciliationDiagnosticsSummary({
    status: "pending",
  });
  const paymentIntent: PaymentIntent = {
    intentId: `pi_${orderId}`,
    orderId,
    channel,
    status: pending ? "processing" : "succeeded",
    clientAction: session.platform === "wechat" ? "wechat_sdk" : "h5_redirect",
    capabilitySummary: createPaymentIntentCapabilitySummary({
      platform: session.platform,
      channel,
    }),
    executionSummary: createPaymentIntentExecutionSummary({
      providerMode,
      pending,
      channel,
    }),
    clientPayload: {
      orderId,
      channel,
      provider: gatewayExecution.response.provider,
      providerMode,
      gatewayOrderId: gatewayExecution.response.gatewayOrderId,
      nonce: gatewayExecution.response.nonce,
      timestamp: gatewayExecution.response.timestamp,
      signature: gatewayExecution.response.signature,
      ...(gatewayExecution.response.prepayId
        ? { prepayId: gatewayExecution.response.prepayId }
        : {}),
      ...(gatewayExecution.response.paymentUrl
        ? { paymentUrl: gatewayExecution.response.paymentUrl }
        : {}),
    },
    gatewayReference,
    gatewayRequest: gatewayExecution.request,
    gatewayResponse: gatewayExecution.response,
    expiresAt: now,
  };
  const paymentResult: PaymentResult = {
    orderId,
    status: pending ? "pending" : "success",
    paid: !pending,
    duplicateProtected,
    callbackVerified: false,
    message: createInitialPaymentMessage({
      providerMode,
      pending,
      duplicateProtected,
    }),
    duplicateProtectionSummary: createDuplicateProtectionSummary(duplicateProtected),
    ...(paymentContinuitySummary ? { continuitySummary: paymentContinuitySummary } : {}),
    ...(pending ? {} : { polledAt: now }),
  };
  const entitlement = createMembershipEntitlement(payload.planId, orderId);
  const subscription = createSubscriptionRecord({
    sku,
    orderId,
    entitlementId: entitlement.entitlementId,
    now,
    status: pending ? "pending_activation" : "active",
  });
  if (pending) {
    entitlement.active = false;
    entitlement.statusLabel = "Pending payment confirmation";
    entitlement.overview = {
      ...createMembershipOverview(payload.planId),
      active: false,
      tier: "signed-in",
      entitlementScope: "none",
      statusLabel: "Payment pending",
      headline: "Awaiting Payment",
      subheadline:
        "The order is created but membership is not active until the callback is verified.",
    };
  }

  return {
    order,
    product,
    sku,
    paymentIntent,
    paymentResult,
    callbackVerification: {
      ...createPendingCallbackVerification(providerMode),
      ...(callbackDiagnosticsSummary ? { diagnosticsSummary: callbackDiagnosticsSummary } : {}),
      operatorActionSummary: createCallbackOperatorActionSummary({
        status: "pending",
        providerMode,
      }),
    },
    reconciliation: {
      ...createPendingReconciliation(providerMode),
      ...(reconciliationDiagnosticsSummary ? { diagnosticsSummary: reconciliationDiagnosticsSummary } : {}),
      ledgerAuditSummary: "Callback and reconciliation ledgers will keep the append-only audit trail for this order.",
    },
    paymentLedger: [
      createPaymentLedgerEntry({
        kind: "payment",
        order,
        status: paymentResult.status,
        message: paymentResult.message,
        createdAt: now,
        gatewayReference,
      }),
    ],
    operationLedger: [],
    callbackLedger: [],
    reconciliationLedger: [
      {
        reconciliationId: `recon_${crypto.randomUUID()}`,
        orderId,
        status: "pending",
        gatewayReference,
        message: "Initial reconciliation is pending gateway callback or explicit reconciliation.",
        checkedAt: now,
      } satisfies PaymentReconciliationLedgerEntry,
    ],
    entitlement,
    subscription,
    afterSalesCases: [],
  };
}

export function createProductOrderDetail(
  session: SessionRecord,
  payload: PurchaseOrderRequest,
  duplicateProtected = false,
  now = new Date().toISOString(),
): OrderDetailResponse | null {
  const sku = getPaymentSku(payload.skuId);
  if (!sku) {
    return null;
  }
  const product = getPaymentProduct(sku.productId);
  if (!product) {
    return null;
  }

  const orderId = `ord_${crypto.randomUUID()}`;
  const channel = createPaymentChannel(payload.channel, session.platform);
  const providerMode = payload.providerMode ?? "sample";
  const pending = payload.paymentScenario === "pending";
  const order: Order = {
    orderId,
    title: sku.title,
    status: pending ? "pending_payment" : "paid",
    productType: sku.productType,
    channel,
    currency: sku.currency,
    totalAmountCents: sku.amountCents,
    ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    duplicateProtected,
    idempotencySummary: createOrderIdempotencySummary({
      duplicateProtected,
      ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    }),
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    createdAt: now,
    updatedAt: now,
    lineItems: [
      {
        productId: sku.productId,
        skuId: sku.skuId,
        productType: sku.productType,
        title: sku.title,
        quantity: 1,
        unitAmountCents: sku.amountCents,
        totalAmountCents: sku.amountCents,
      },
    ],
  };
  const gatewayExecution = createGatewayExecution({ order, providerMode, now });
  const gatewayReference = {
    provider: gatewayExecution.response.provider,
    providerMode,
    gatewayOrderId: gatewayExecution.response.gatewayOrderId,
  };
  const productPaymentContinuitySummary = createPaymentResultContinuitySummary({
    status: pending ? "pending" : "success",
    providerMode,
  });
  const productCallbackDiagnosticsSummary = createCallbackDiagnosticsSummary({
    status: "pending",
    providerMode,
  });
  const productReconciliationDiagnosticsSummary = createReconciliationDiagnosticsSummary({
    status: "pending",
  });
  const paymentIntent: PaymentIntent = {
    intentId: `pi_${orderId}`,
    orderId,
    channel,
    status: pending ? "processing" : "succeeded",
    clientAction: session.platform === "wechat" ? "wechat_sdk" : "h5_redirect",
    capabilitySummary: createPaymentIntentCapabilitySummary({
      platform: session.platform,
      channel,
    }),
    executionSummary: createPaymentIntentExecutionSummary({
      providerMode,
      pending,
      channel,
    }),
    clientPayload: {
      orderId,
      channel,
      provider: gatewayExecution.response.provider,
      providerMode,
      gatewayOrderId: gatewayExecution.response.gatewayOrderId,
      nonce: gatewayExecution.response.nonce,
      timestamp: gatewayExecution.response.timestamp,
      signature: gatewayExecution.response.signature,
      ...(gatewayExecution.response.prepayId
        ? { prepayId: gatewayExecution.response.prepayId }
        : {}),
      ...(gatewayExecution.response.paymentUrl
        ? { paymentUrl: gatewayExecution.response.paymentUrl }
        : {}),
    },
    gatewayReference,
    gatewayRequest: gatewayExecution.request,
    gatewayResponse: gatewayExecution.response,
    expiresAt: now,
  };
  const paymentResult: PaymentResult = {
    orderId,
    status: pending ? "pending" : "success",
    paid: !pending,
    duplicateProtected,
    callbackVerified: false,
    message: createInitialPaymentMessage({
      providerMode,
      pending,
      duplicateProtected,
      title: sku.title,
    }),
    duplicateProtectionSummary: createDuplicateProtectionSummary(duplicateProtected),
    ...(productPaymentContinuitySummary ? { continuitySummary: productPaymentContinuitySummary } : {}),
    ...(pending ? {} : { polledAt: now }),
  };
  const entitlement =
    sku.productType === "membership"
      ? undefined
      : createGenericEntitlement(
          sku,
          orderId,
          !pending,
          pending ? "Pending payment confirmation" : `${sku.title} fulfilled`,
        );
  const subscription =
    sku.productType === "subscription"
      ? createSubscriptionRecord({
          sku,
          orderId,
          now,
          status: pending ? "pending_activation" : "active",
          ...(entitlement?.entitlementId
            ? { entitlementId: entitlement.entitlementId }
            : {}),
        })
      : undefined;

  return {
    order,
    product,
    sku,
    paymentIntent,
    paymentResult,
    callbackVerification: {
      ...createPendingCallbackVerification(providerMode),
      ...(productCallbackDiagnosticsSummary ? { diagnosticsSummary: productCallbackDiagnosticsSummary } : {}),
      operatorActionSummary: createCallbackOperatorActionSummary({
        status: "pending",
        providerMode,
      }),
    },
    reconciliation: {
      ...createPendingReconciliation(providerMode),
      ...(productReconciliationDiagnosticsSummary
        ? { diagnosticsSummary: productReconciliationDiagnosticsSummary }
        : {}),
      ledgerAuditSummary: "Callback and reconciliation ledgers will keep the append-only audit trail for this order.",
    },
    paymentLedger: [
      createPaymentLedgerEntry({
        kind: "payment",
        order,
        status: paymentResult.status,
        message: paymentResult.message,
        createdAt: now,
        gatewayReference,
      }),
    ],
    operationLedger: [],
    callbackLedger: [],
    reconciliationLedger: [
      {
        reconciliationId: `recon_${crypto.randomUUID()}`,
        orderId,
        status: "pending",
        gatewayReference,
        message: "Initial reconciliation is pending gateway callback or explicit reconciliation.",
        checkedAt: now,
      } satisfies PaymentReconciliationLedgerEntry,
    ],
    ...(entitlement ? { entitlement } : {}),
    ...(subscription ? { subscription } : {}),
    afterSalesCases: [],
  };
}

export function createMembershipPurchaseResponse(
  detail: OrderDetailResponse & { entitlement: MembershipEntitlement },
  payload: PurchaseMembershipRequest,
): PurchaseMembershipResponse {
  return {
    purchased: true,
    overview: detail.entitlement.overview,
    order: detail.order,
    paymentIntent: detail.paymentIntent,
    paymentResult: detail.paymentResult,
    ...(detail.operationResult ? { operationResult: detail.operationResult } : {}),
    entitlement: detail.entitlement,
    returnTarget: deriveReturnTarget(payload.source),
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
  };
}

function createOrderSummary(detail: OrderDetailResponse): OrderSummary {
  return {
    orderId: detail.order.orderId,
    title: detail.order.title,
    status: detail.order.status,
    productType: detail.order.productType,
    ...(detail.sku?.skuId ? { skuId: detail.sku.skuId } : {}),
    currency: detail.order.currency,
    totalAmountCents: detail.order.totalAmountCents,
    ...(detail.order.source ? { source: detail.order.source } : {}),
    createdAt: detail.order.createdAt,
    updatedAt: detail.order.updatedAt,
  };
}

export function listOrders(
  userState: UserState,
  request: ListOrdersRequest = {},
): OrderListResponse {
  const page = Math.max(1, request.page ?? 1);
  const pageSize = Math.max(1, Math.min(request.pageSize ?? 20, 100));
  const filtered = Object.values(userState.ordersById)
    .filter((detail) => !request.status || detail.order.status === request.status)
    .filter(
      (detail) => !request.productType || detail.order.productType === request.productType,
    )
    .sort((left, right) => right.order.updatedAt.localeCompare(left.order.updatedAt));
  const start = (page - 1) * pageSize;
  const items = filtered
    .slice(start, start + pageSize)
    .map((detail) => createOrderSummary(detail));
  const orderList: OrderList = {
    items,
    total: filtered.length,
    page,
    pageSize,
    hasMore: start + pageSize < filtered.length,
    ...(items[0]?.orderId ? { selectedOrderId: items[0].orderId } : {}),
  };
  return { orderList };
}
