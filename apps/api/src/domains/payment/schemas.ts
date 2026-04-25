import {
  ORDER_STATUSES,
  PAYMENT_CHANNELS,
  PAYMENT_GATEWAY_PROVIDERS,
  PAYMENT_PROVIDER_MODES,
  PRODUCT_TYPES,
} from "@minix/contracts";
import { z } from "zod";

import { apiPaginationQueryShape } from "../schema-helpers";

export const purchaseMembershipSchema = z.object({
  planId: z.enum(["monthly", "quarterly", "annual"]),
  channel: z.enum(PAYMENT_CHANNELS).optional(),
  providerMode: z.enum(PAYMENT_PROVIDER_MODES).optional(),
  paymentScenario: z.enum(["instant_success", "pending"]).optional(),
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
  outcome: z.enum(["success", "failure", "cancelled"]),
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
  paymentScenario: z.enum(["instant_success", "pending"]).optional(),
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
