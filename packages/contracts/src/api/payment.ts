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

export const PRODUCT_BILLING_CYCLES = ["one_time", "monthly", "quarterly", "annual"] as const;
export type ProductBillingCycle = (typeof PRODUCT_BILLING_CYCLES)[number];

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

export const PAYMENT_PROVIDER_MODES = ["sample", "production"] as const;
export type PaymentProviderMode = (typeof PAYMENT_PROVIDER_MODES)[number];

export const PAYMENT_GATEWAY_PROVIDERS = ["sample", "wechat_pay", "h5_gateway"] as const;
export type PaymentGatewayProvider = (typeof PAYMENT_GATEWAY_PROVIDERS)[number];

export const PAYMENT_LEDGER_ENTRY_KINDS = ["payment", "refund", "callback", "operation", "reconciliation"] as const;
export type PaymentLedgerEntryKind = (typeof PAYMENT_LEDGER_ENTRY_KINDS)[number];

export const SUBSCRIPTION_STATUSES = ["pending_activation", "active", "renewal_due", "cancelled", "grace", "expired"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const AFTER_SALES_KINDS = ["cancel", "refund"] as const;
export type AfterSalesKind = (typeof AFTER_SALES_KINDS)[number];

export const AFTER_SALES_STATUSES = ["processing", "completed", "rejected"] as const;
export type AfterSalesStatus = (typeof AFTER_SALES_STATUSES)[number];

export interface PaymentProduct {
  productId: string;
  productType: ProductType;
  title: string;
  summary: string;
  active: boolean;
  defaultSkuId?: string;
  fulfillmentLabel?: string;
  tagLabels: string[];
}

export interface PaymentSku {
  skuId: string;
  productId: string;
  productType: ProductType;
  title: string;
  summary?: string;
  billingCycle: ProductBillingCycle;
  autoRenew: boolean;
  amountCents: number;
  currency: string;
  active: boolean;
  channelOptions: PaymentChannel[];
  entitlementKey: string;
  statusLabel: string;
}

export interface PaymentGatewayReference {
  provider: PaymentGatewayProvider;
  providerMode: PaymentProviderMode;
  gatewayOrderId: string;
  gatewayTransactionId?: string;
  gatewayRefundId?: string;
  merchantId?: string;
}

export interface PaymentGatewayExecutionRequest {
  provider: PaymentGatewayProvider;
  providerMode: PaymentProviderMode;
  orderId: string;
  amountCents: number;
  currency: string;
  notifyUrl: string;
  returnUrl?: string;
}

export interface PaymentGatewayExecutionResponse {
  provider: PaymentGatewayProvider;
  providerMode: PaymentProviderMode;
  gatewayOrderId: string;
  prepayId?: string;
  paymentUrl?: string;
  nonce: string;
  timestamp: number;
  signature: string;
  expiresAt: string;
}

export interface PaymentLedgerEntry {
  ledgerId: string;
  kind: PaymentLedgerEntryKind;
  orderId: string;
  amountCents: number;
  currency: string;
  status: string;
  gatewayReference?: PaymentGatewayReference;
  message: string;
  createdAt: string;
}

export interface PaymentCallbackLedgerEntry {
  callbackReference: string;
  orderId: string;
  outcome: Extract<PaymentResultStatus, "success" | "failure" | "cancelled">;
  verificationStatus: PaymentCallbackVerificationStatus;
  nonce?: string;
  timestamp?: number;
  signatureDigest?: string;
  replayProtected: boolean;
  message: string;
  receivedAt: string;
}

export interface PaymentReconciliationLedgerEntry {
  reconciliationId: string;
  orderId: string;
  status: PaymentReconciliationStatus;
  gatewayReference?: PaymentGatewayReference;
  message: string;
  checkedAt: string;
}

export interface OrderLineItem {
  productId: string;
  skuId?: string;
  productType: ProductType;
  title: string;
  quantity: number;
  unitAmountCents: number;
  totalAmountCents: number;
}

export interface OrderSummary {
  orderId: string;
  title: string;
  status: OrderStatus;
  productType: ProductType;
  skuId?: string;
  currency: string;
  totalAmountCents: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
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
  gatewayReference?: PaymentGatewayReference;
  gatewayRequest?: PaymentGatewayExecutionRequest;
  gatewayResponse?: PaymentGatewayExecutionResponse;
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
  assetLedgerIds?: string[];
}

export interface Entitlement {
  entitlementId: string;
  productType: ProductType;
  active: boolean;
  statusLabel: string;
  sourceOrderId: string;
}

export interface SubscriptionRecord {
  subscriptionId: string;
  productId: string;
  skuId: string;
  title: string;
  productType: Extract<ProductType, "subscription" | "membership">;
  status: SubscriptionStatus;
  statusLabel: string;
  autoRenew: boolean;
  startedAt?: string;
  renewsAt?: string;
  graceEndsAt?: string;
  cancelledAt?: string;
  expiresAt?: string;
  latestOrderId: string;
  entitlementId?: string;
}

export interface AfterSalesCase {
  caseId: string;
  orderId: string;
  kind: AfterSalesKind;
  status: AfterSalesStatus;
  title: string;
  resultLabel: string;
  reason?: string;
  refundAmountCents?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface OrderDetailResponse {
  order: Order;
  product?: PaymentProduct;
  sku?: PaymentSku;
  paymentIntent: PaymentIntent;
  paymentResult: PaymentResult;
  callbackVerification: PaymentCallbackVerification;
  reconciliation: PaymentReconciliation;
  paymentLedger?: PaymentLedgerEntry[];
  operationLedger?: PaymentLedgerEntry[];
  callbackLedger?: PaymentCallbackLedgerEntry[];
  reconciliationLedger?: PaymentReconciliationLedgerEntry[];
  operationResult?: PaymentOperationResult;
  entitlement?: Entitlement;
  subscription?: SubscriptionRecord;
  afterSalesCases?: AfterSalesCase[];
}

export interface ListOrdersRequest {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  productType?: ProductType;
}

export interface OrderList {
  items: OrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  selectedOrderId?: string;
}

export interface OrderListResponse {
  orderList: OrderList;
}

export interface PaymentCatalogResponse {
  products: PaymentProduct[];
  skus: PaymentSku[];
}

export interface PurchaseOrderRequest {
  skuId: string;
  channel?: PaymentChannel;
  providerMode?: PaymentProviderMode;
  paymentScenario?: "instant_success" | "pending";
  idempotencyKey?: string;
  source?: string;
  novelId?: string;
  chapterId?: string;
  subscriptionId?: string;
}

export interface PurchaseOrderResponse {
  order: Order;
  product: PaymentProduct;
  sku: PaymentSku;
  paymentIntent: PaymentIntent;
  paymentResult: PaymentResult;
  callbackVerification: PaymentCallbackVerification;
  reconciliation: PaymentReconciliation;
  operationResult?: PaymentOperationResult;
  entitlement?: Entitlement;
  subscription?: SubscriptionRecord;
}

export interface SubscriptionListResponse {
  subscriptions: SubscriptionRecord[];
  selectedSubscriptionId?: string;
}

export interface SubscriptionOperationRequest {
  subscriptionId: string;
  skuId?: string;
  reason?: string;
}

export interface AfterSalesListResponse {
  cases: AfterSalesCase[];
  selectedCaseId?: string;
}

export interface AfterSalesDetailResponse {
  caseItem: AfterSalesCase;
  order: Order;
  operationResult?: PaymentOperationResult;
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
  provider?: PaymentGatewayProvider;
  gatewayTransactionId?: string;
  nonce?: string;
  timestamp?: number;
  signature?: string;
}
