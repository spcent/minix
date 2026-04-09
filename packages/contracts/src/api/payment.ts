export const ORDER_STATUSES = [
  "created",
  "pending_payment",
  "paid",
  "payment_failed",
  "closed",
  "cancelled",
  "refund_pending",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PRODUCT_TYPES = ["one_time", "subscription", "membership", "value_added"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PAYMENT_CHANNELS = ["wechat_pay", "h5_pay", "membership_purchase", "virtual_entitlement"] as const;
export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number];

export const PAYMENT_INTENT_STATUSES = ["created", "processing", "verifying", "succeeded", "failed", "cancelled"] as const;
export type PaymentIntentStatus = (typeof PAYMENT_INTENT_STATUSES)[number];

export const PAYMENT_RESULT_STATUSES = ["pending", "success", "failure", "cancelled", "refunded"] as const;
export type PaymentResultStatus = (typeof PAYMENT_RESULT_STATUSES)[number];

export const PAYMENT_CLIENT_ACTIONS = ["none", "h5_redirect", "wechat_sdk"] as const;
export type PaymentClientAction = (typeof PAYMENT_CLIENT_ACTIONS)[number];

export const PAYMENT_CALLBACK_VERIFICATION_STATUSES = ["pending", "verified", "rejected"] as const;
export type PaymentCallbackVerificationStatus = (typeof PAYMENT_CALLBACK_VERIFICATION_STATUSES)[number];

export const PAYMENT_RECONCILIATION_STATUSES = ["not_required", "pending", "reconciled", "mismatch"] as const;
export type PaymentReconciliationStatus = (typeof PAYMENT_RECONCILIATION_STATUSES)[number];

export const PAYMENT_OPERATION_KINDS = ["cancel", "refund", "verify_callback", "reconcile"] as const;
export type PaymentOperationKind = (typeof PAYMENT_OPERATION_KINDS)[number];

export interface OrderLineItem {
  productId: string;
  productType: ProductType;
  title: string;
  quantity: number;
  unitAmountCents: number;
  totalAmountCents: number;
}

export interface Order {
  orderId: string;
  title: string;
  status: OrderStatus;
  productType: ProductType;
  channel: PaymentChannel;
  currency: string;
  totalAmountCents: number;
  idempotencyKey?: string;
  duplicateProtected: boolean;
  source?: string;
  novelId?: string;
  chapterId?: string;
  createdAt: string;
  updatedAt: string;
  lineItems: OrderLineItem[];
}

export interface PaymentIntent {
  intentId: string;
  orderId: string;
  channel: PaymentChannel;
  status: PaymentIntentStatus;
  clientAction: PaymentClientAction;
  clientPayload?: Record<string, string | number | boolean>;
  expiresAt?: string;
}

export interface PaymentResult {
  orderId: string;
  status: PaymentResultStatus;
  paid: boolean;
  duplicateProtected: boolean;
  callbackVerified: boolean;
  message: string;
  polledAt?: string;
}

export interface PaymentCallbackVerification {
  status: PaymentCallbackVerificationStatus;
  message: string;
  verifiedAt?: string;
  callbackReference?: string;
}

export interface PaymentReconciliation {
  status: PaymentReconciliationStatus;
  message: string;
  checkedAt?: string;
  mismatchReason?: string;
}

export interface PaymentOperationResult {
  operation: PaymentOperationKind;
  applied: boolean;
  orderStatus: OrderStatus;
  paymentStatus: PaymentResultStatus;
  message: string;
  processedAt: string;
}

export interface Entitlement {
  entitlementId: string;
  productType: ProductType;
  active: boolean;
  statusLabel: string;
  sourceOrderId: string;
}

export interface OrderDetailResponse {
  order: Order;
  paymentIntent: PaymentIntent;
  paymentResult: PaymentResult;
  callbackVerification: PaymentCallbackVerification;
  reconciliation: PaymentReconciliation;
  operationResult?: PaymentOperationResult;
  entitlement?: Entitlement;
}

export interface OrderOperationRequest {
  orderId: string;
  reason?: string;
}

export interface PaymentCallbackRequest {
  orderId: string;
  outcome: Extract<PaymentResultStatus, "success" | "failure" | "cancelled">;
  verified?: boolean;
  callbackReference?: string;
}
