import {
  MEMBERSHIP_PLAN_IDS,
  PAYMENT_CALLBACK_OUTCOMES,
  ORDER_STATUSES,
  PAYMENT_CHANNELS,
  PAYMENT_GATEWAY_PROVIDERS,
  PAYMENT_PROVIDER_MODES,
  PAYMENT_SCENARIOS,
  PRODUCT_TYPES,
} from "@minix/contracts";
import { z } from "zod";

import { apiPaginationQueryShape } from "../schema-helpers";

export const purchaseMembershipSchema = z.object({
  planId: z.enum(MEMBERSHIP_PLAN_IDS),
  channel: z.enum(PAYMENT_CHANNELS).optional(),
  providerMode: z.enum(PAYMENT_PROVIDER_MODES).optional(),
  paymentScenario: z.enum(PAYMENT_SCENARIOS).optional(),
  idempotencyKey: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  novelId: z.string().min(1).optional(),
  chapterId: z.string().min(1).optional(),
});

export const orderOperationSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(1).optional(),
});

export const paymentCallbackSchema = z.object({
  orderId: z.string().min(1),
  outcome: z.enum(PAYMENT_CALLBACK_OUTCOMES),
  verified: z.boolean().optional(),
  callbackReference: z.string().min(1).optional(),
  provider: z.enum(PAYMENT_GATEWAY_PROVIDERS).optional(),
  gatewayTransactionId: z.string().min(1).optional(),
  nonce: z.string().min(1).optional(),
  timestamp: z.number().int().positive().optional(),
  signature: z.string().min(1).optional(),
});

export const orderIdQuerySchema = z.object({
  orderId: z.string().min(1),
});

export const listOrdersQuerySchema = z.object({
  ...apiPaginationQueryShape,
  status: z.enum(ORDER_STATUSES).optional(),
  productType: z.enum(PRODUCT_TYPES).optional(),
});

export const purchaseOrderSchema = z.object({
  skuId: z.string().min(1),
  channel: z.enum(PAYMENT_CHANNELS).optional(),
  providerMode: z.enum(PAYMENT_PROVIDER_MODES).optional(),
  paymentScenario: z.enum(PAYMENT_SCENARIOS).optional(),
  idempotencyKey: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  novelId: z.string().min(1).optional(),
  chapterId: z.string().min(1).optional(),
  subscriptionId: z.string().min(1).optional(),
});

export const subscriptionOperationSchema = z.object({
  subscriptionId: z.string().min(1),
  skuId: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
});

export const afterSalesDetailQuerySchema = z.object({
  caseId: z.string().min(1),
});
