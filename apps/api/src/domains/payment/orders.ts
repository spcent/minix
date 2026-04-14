import type {
  ListOrdersRequest,
  MembershipEntitlement,
  Order,
  OrderDetailResponse,
  OrderList,
  OrderListResponse,
  OrderSummary,
  PaymentIntent,
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
  const paymentIntent: PaymentIntent = {
    intentId: `pi_${orderId}`,
    orderId,
    channel,
    status: pending ? "processing" : "succeeded",
    clientAction: session.platform === "wechat" ? "wechat_sdk" : "h5_redirect",
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
    callbackVerification: createPendingCallbackVerification(providerMode),
    reconciliation: createPendingReconciliation(providerMode),
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
  const paymentIntent: PaymentIntent = {
    intentId: `pi_${orderId}`,
    orderId,
    channel,
    status: pending ? "processing" : "succeeded",
    clientAction: session.platform === "wechat" ? "wechat_sdk" : "h5_redirect",
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
    callbackVerification: createPendingCallbackVerification(providerMode),
    reconciliation: createPendingReconciliation(providerMode),
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
