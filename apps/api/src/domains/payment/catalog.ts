import type {
  MembershipEntitlement,
  MembershipOverview,
  Order,
  PaymentCallbackVerification,
  PaymentCatalogResponse,
  PaymentChannel,
  PaymentGatewayExecutionRequest,
  PaymentGatewayExecutionResponse,
  PaymentGatewayProvider,
  PaymentLedgerEntry,
  PaymentProduct,
  PaymentProviderMode,
  PaymentReconciliation,
  PaymentSku,
  ProductBillingCycle,
  PurchaseMembershipRequest,
  PurchaseOrderResponse,
} from "@minix/contracts";

import {
  DEFAULT_MEMBERSHIP_OVERVIEW,
  MEMBER_RENEWAL_LABELS,
} from "../../content";
import type { SessionRecord } from "../../types";
import { isSampleProviderMode } from "../provider-posture";
import { cloneDomainSnapshot } from "../snapshot";

export function createMembershipOverview(
  planId?: PurchaseMembershipRequest["planId"],
): MembershipOverview {
  if (!planId) {
    return DEFAULT_MEMBERSHIP_OVERVIEW;
  }

  return {
    active: true,
    tier: "member",
    entitlementScope: "membership",
    statusLabel: "Membership active with premium reading unlocked",
    renewalLabel: MEMBER_RENEWAL_LABELS[planId],
    headline: "Membership Active",
    subheadline:
      "Premium reading is now unlocked. You can return to the blocked title and keep going without losing context.",
    benefits: DEFAULT_MEMBERSHIP_OVERVIEW.benefits,
  };
}

const PAYMENT_PRODUCTS: PaymentProduct[] = [
  {
    productId: "membership_access",
    productType: "membership",
    title: "Membership Access",
    summary: "Recurring membership packages that unlock premium reading and bundled benefits.",
    active: true,
    defaultSkuId: "membership_quarterly",
    fulfillmentLabel: "Membership entitlement",
    tagLabels: ["membership", "premium"],
  },
  {
    productId: "chapter_unlock_pack",
    productType: "one_time",
    title: "Chapter Unlock Pack",
    summary: "One-time virtual unlock for a premium chapter or title-bound entitlement.",
    active: true,
    defaultSkuId: "chapter_unlock_single",
    fulfillmentLabel: "Single-use chapter entitlement",
    tagLabels: ["virtual", "chapter"],
  },
  {
    productId: "study_club_plus",
    productType: "subscription",
    title: "Study Club Plus",
    summary: "Auto-renewing subscription for premium consultation slots and discussion archives.",
    active: true,
    defaultSkuId: "study_club_plus_monthly",
    fulfillmentLabel: "Recurring subscription entitlement",
    tagLabels: ["subscription", "consultation"],
  },
  {
    productId: "priority_service_pack",
    productType: "value_added",
    title: "Priority Service Pack",
    summary: "Value-added service pack for expedited review and support handling.",
    active: true,
    defaultSkuId: "priority_service_once",
    fulfillmentLabel: "Service entitlement",
    tagLabels: ["service", "priority"],
  },
];

const PAYMENT_SKUS: PaymentSku[] = [
  {
    skuId: "membership_monthly",
    productId: "membership_access",
    productType: "membership",
    title: "Monthly Membership",
    summary: "Monthly recurring membership access.",
    billingCycle: "monthly",
    autoRenew: true,
    amountCents: 1900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay", "membership_purchase"],
    entitlementKey: "membership:monthly",
    statusLabel: "Renews monthly",
  },
  {
    skuId: "membership_quarterly",
    productId: "membership_access",
    productType: "membership",
    title: "Quarterly Membership",
    summary: "Quarterly recurring membership access.",
    billingCycle: "quarterly",
    autoRenew: true,
    amountCents: 4900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay", "membership_purchase"],
    entitlementKey: "membership:quarterly",
    statusLabel: "Renews quarterly",
  },
  {
    skuId: "membership_annual",
    productId: "membership_access",
    productType: "membership",
    title: "Annual Membership",
    summary: "Annual recurring membership access.",
    billingCycle: "annual",
    autoRenew: true,
    amountCents: 15900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay", "membership_purchase"],
    entitlementKey: "membership:annual",
    statusLabel: "Renews annually",
  },
  {
    skuId: "chapter_unlock_single",
    productId: "chapter_unlock_pack",
    productType: "one_time",
    title: "Single Chapter Unlock",
    summary: "One-time unlock for a premium chapter.",
    billingCycle: "one_time",
    autoRenew: false,
    amountCents: 900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay", "virtual_entitlement"],
    entitlementKey: "chapter:single_unlock",
    statusLabel: "One-time fulfillment",
  },
  {
    skuId: "study_club_plus_monthly",
    productId: "study_club_plus",
    productType: "subscription",
    title: "Study Club Plus Monthly",
    summary: "Monthly recurring subscription for premium study club access.",
    billingCycle: "monthly",
    autoRenew: true,
    amountCents: 2900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay"],
    entitlementKey: "subscription:study_club_plus",
    statusLabel: "Auto-renews monthly",
  },
  {
    skuId: "priority_service_once",
    productId: "priority_service_pack",
    productType: "value_added",
    title: "Priority Service Pack",
    summary: "One-time value-added service for priority support and review.",
    billingCycle: "one_time",
    autoRenew: false,
    amountCents: 5900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay"],
    entitlementKey: "service:priority_pack",
    statusLabel: "One-time service fulfillment",
  },
];

const PAYMENT_PRODUCT_BY_ID = new Map(PAYMENT_PRODUCTS.map((product) => [product.productId, product] as const));
const PAYMENT_SKU_BY_ID = new Map(PAYMENT_SKUS.map((sku) => [sku.skuId, sku] as const));
const MEMBERSHIP_PLAN_SKU_IDS: Record<PurchaseMembershipRequest["planId"], string> = {
  monthly: "membership_monthly",
  quarterly: "membership_quarterly",
  annual: "membership_annual",
};

function clonePaymentProduct(product: PaymentProduct): PaymentProduct {
  return cloneDomainSnapshot(product);
}

function clonePaymentSku(sku: PaymentSku): PaymentSku {
  return cloneDomainSnapshot(sku);
}

export function createPaymentCatalogResponse(): PaymentCatalogResponse {
  return {
    products: PAYMENT_PRODUCTS.map((product) => clonePaymentProduct(product)),
    skus: PAYMENT_SKUS.map((sku) => clonePaymentSku(sku)),
  };
}

export function getPaymentSku(skuId: string): PaymentSku | undefined {
  const sku = PAYMENT_SKU_BY_ID.get(skuId);
  return sku ? clonePaymentSku(sku) : undefined;
}

export function getPaymentProduct(productId: string): PaymentProduct | undefined {
  const product = PAYMENT_PRODUCT_BY_ID.get(productId);
  return product ? clonePaymentProduct(product) : undefined;
}

export function resolveMembershipSku(planId: PurchaseMembershipRequest["planId"]): PaymentSku {
  return clonePaymentSku(PAYMENT_SKU_BY_ID.get(MEMBERSHIP_PLAN_SKU_IDS[planId])!);
}

export function createPaymentChannel(
  channel: PaymentChannel | undefined,
  platform: SessionRecord["platform"],
): PaymentChannel {
  if (channel) {
    return channel;
  }

  return platform === "wechat" ? "wechat_pay" : "h5_pay";
}

export function createGenericEntitlement(
  sku: PaymentSku,
  orderId: string,
  active: boolean,
  statusLabel: string,
): PurchaseOrderResponse["entitlement"] {
  return {
    entitlementId: `ent_${sku.skuId}_${orderId}`,
    productType: sku.productType,
    active,
    statusLabel,
    sourceOrderId: orderId,
  };
}

export function createMembershipEntitlement(
  planId: PurchaseMembershipRequest["planId"],
  orderId: string,
): MembershipEntitlement {
  const overview = createMembershipOverview(planId);
  return {
    entitlementId: `ent_membership_${orderId}`,
    productType: "membership",
    active: true,
    statusLabel: overview.statusLabel,
    sourceOrderId: orderId,
    overview,
  };
}

function createRenewalDate(now: string, billingCycle: ProductBillingCycle): string | undefined {
  const timestamp = Date.parse(now);
  if (billingCycle === "monthly") {
    return new Date(timestamp + 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (billingCycle === "quarterly") {
    return new Date(timestamp + 90 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (billingCycle === "annual") {
    return new Date(timestamp + 365 * 24 * 60 * 60 * 1000).toISOString();
  }
  return undefined;
}

export function createSubscriptionRenewalDate(now: string, billingCycle: ProductBillingCycle) {
  return createRenewalDate(now, billingCycle);
}

export function createPendingCallbackVerification(providerMode: PaymentProviderMode = "sample"): PaymentCallbackVerification {
  return {
    status: "pending",
    message:
      isSampleProviderMode(providerMode)
        ? "The sample gateway callback has not been verified yet."
        : "The gateway callback has not been verified yet.",
  };
}

export function createPendingReconciliation(providerMode: PaymentProviderMode = "sample"): PaymentReconciliation {
  return {
    status: "pending",
    message:
      isSampleProviderMode(providerMode)
        ? "The sample order has not been reconciled yet."
        : "The order has not been reconciled yet.",
  };
}

export function createPaymentProviderMode(payload: {
  providerMode?: PaymentProviderMode | undefined;
}): PaymentProviderMode {
  return payload.providerMode ?? "sample";
}

export function createPaymentGatewayProvider(
  channel: PaymentChannel,
  providerMode: PaymentProviderMode,
): PaymentGatewayProvider {
  if (isSampleProviderMode(providerMode)) {
    return "sample";
  }

  return channel === "wechat_pay" ? "wechat_pay" : "h5_gateway";
}

export function createGatewayExecution(input: {
  order: Order;
  providerMode: PaymentProviderMode;
  now: string;
}): {
  request: PaymentGatewayExecutionRequest;
  response: PaymentGatewayExecutionResponse;
} {
  const provider = createPaymentGatewayProvider(input.order.channel, input.providerMode);
  const timestamp = Date.parse(input.now);
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const gatewayOrderId = `${provider}_${input.order.orderId}`;
  const request: PaymentGatewayExecutionRequest = {
    provider,
    providerMode: input.providerMode,
    orderId: input.order.orderId,
    amountCents: input.order.totalAmountCents,
    currency: input.order.currency,
    notifyUrl: "/payments/callback",
    ...(input.order.source ? { returnUrl: `/${input.order.source}` } : {}),
  };
  const response: PaymentGatewayExecutionResponse = {
    provider,
    providerMode: input.providerMode,
    gatewayOrderId,
    ...(provider === "wechat_pay" ? { prepayId: `prepay_${input.order.orderId}` } : {}),
    ...(provider === "h5_gateway" ? { paymentUrl: `https://pay.minix.local/orders/${input.order.orderId}` } : {}),
    nonce,
    timestamp,
    signature: `sig_${provider}_${input.order.orderId}_${nonce.slice(0, 8)}`,
    expiresAt: new Date(timestamp + 15 * 60_000).toISOString(),
  };

  return { request, response };
}

export function createLedgerId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createPaymentLedgerEntry(input: {
  kind: PaymentLedgerEntry["kind"];
  order: Order;
  status: string;
  message: string;
  createdAt: string;
  gatewayReference?: PaymentLedgerEntry["gatewayReference"];
}): PaymentLedgerEntry {
  return {
    ledgerId: `ledger_${crypto.randomUUID()}`,
    kind: input.kind,
    orderId: input.order.orderId,
    amountCents: input.order.totalAmountCents,
    currency: input.order.currency,
    status: input.status,
    ...(input.gatewayReference ? { gatewayReference: input.gatewayReference } : {}),
    message: input.message,
    createdAt: input.createdAt,
  };
}
