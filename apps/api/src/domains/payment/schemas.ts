import { z } from "zod";

export const purchaseMembershipSchema = z.object({
  planId: z.enum(["monthly", "quarterly", "annual"]),
  channel: z
    .enum(["wechat_pay", "h5_pay", "membership_purchase", "virtual_entitlement"])
    .optional(),
  providerMode: z.enum(["sample", "production"]).optional(),
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
  provider: z.enum(["sample", "wechat_pay", "h5_gateway"]).optional(),
  gatewayTransactionId: z.string().min(1).optional(),
  nonce: z.string().min(1).optional(),
  timestamp: z.number().int().positive().optional(),
  signature: z.string().min(1).optional(),
});

export const orderIdQuerySchema = z.object({
  orderId: z.string().min(1),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  status: z
    .enum([
      "created",
      "pending_payment",
      "paid",
      "payment_failed",
      "closed",
      "cancelled",
      "refund_pending",
      "refunded",
    ])
    .optional(),
  productType: z
    .enum(["one_time", "subscription", "membership", "value_added"])
    .optional(),
});

export const purchaseOrderSchema = z.object({
  skuId: z.string().min(1),
  channel: z
    .enum(["wechat_pay", "h5_pay", "membership_purchase", "virtual_entitlement"])
    .optional(),
  providerMode: z.enum(["sample", "production"]).optional(),
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
