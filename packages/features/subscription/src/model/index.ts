import type {
  AfterSalesCase,
  CapabilityStatus,
  DetailStatus,
  ListStatus,
  MembershipBenefit,
  MembershipEntitlement,
  MembershipOverview,
  OrderList,
  Order,
  PaymentProduct,
  PaymentSku,
  PaymentCallbackVerification,
  PaymentIntent,
  PaymentReconciliation,
  PaymentResult,
  SubscriptionRecord,
} from "@minix/contracts";
import type { LatestMilestoneHistoryEntry } from "@minix/core";

export interface SubscriptionState {
  ready: boolean;
  title: string;
  loading: boolean;
  purchasing: boolean;
  errorText: string | undefined;
  paymentExecutionDetail: string | undefined;
  paymentCapabilityStatus: CapabilityStatus | undefined;
  paymentCapabilitySummary: string;
  overview: MembershipOverview | undefined;
  catalogProducts: PaymentProduct[];
  catalogSkus: PaymentSku[];
  selectedSkuId: string | undefined;
  orderList: OrderList | undefined;
  orderListStatus: ListStatus;
  selectedOrderId: string | undefined;
  subscriptions: SubscriptionRecord[];
  afterSalesCases: AfterSalesCase[];
  selectedAfterSalesCase: AfterSalesCase | undefined;
  order: Order | undefined;
  paymentIntent: PaymentIntent | undefined;
  paymentResult: PaymentResult | undefined;
  callbackVerification: PaymentCallbackVerification | undefined;
  reconciliation: PaymentReconciliation | undefined;
  entitlement: MembershipEntitlement | undefined;
  commerceDetailStatus: DetailStatus;
  transactionMessage: string | undefined;
  canCancelOrder: boolean;
  canRefundOrder: boolean;
  canCancelSubscription: boolean;
  canRenewSubscription: boolean;
  source: string | undefined;
  novelId: string | undefined;
  chapterId: string | undefined;
  lockedMessage: string | undefined;
  purchaseSuccessMessage: string | undefined;
  lastPurchasedPlanId: string | undefined;
  returnActionLabel: string | undefined;
  entitlementSummary: string | undefined;
  recommendedPlanId: "monthly" | "quarterly" | "annual" | undefined;
  unlockOutcomeLabel: string | undefined;
  returnContextLabel: string | undefined;
  latestMilestoneTitle: string | undefined;
  latestMilestoneCopy: string | undefined;
  latestMilestoneMeta: string | undefined;
  latestMilestoneNovelId: string | undefined;
  latestMilestoneChapterId: string | undefined;
  latestMilestoneSource: "reader" | "toc" | "bookshelf" | undefined;
  latestMilestoneSourceLabel: string | undefined;
  latestMilestoneRecencyLabel: string | undefined;
  latestMilestoneReturnLabel: string | undefined;
  latestMilestoneReturnHint: string | undefined;
  milestoneHistory: LatestMilestoneHistoryEntry[];
  benefits: MembershipBenefit[];
}

export interface CreateSubscriptionStateOptions {
  title?: string;
  source?: string;
  novelId?: string;
  chapterId?: string;
}

export function createInitialSubscriptionState(options: CreateSubscriptionStateOptions = {}): SubscriptionState {
  return {
    ready: false,
    title: options.title ?? "Membership",
    loading: false,
    purchasing: false,
    errorText: undefined,
    paymentExecutionDetail: undefined,
    paymentCapabilityStatus: undefined,
    paymentCapabilitySummary: "Payment capability status is unavailable until the host runtime reports it.",
    overview: undefined,
    catalogProducts: [],
    catalogSkus: [],
    selectedSkuId: undefined,
    orderList: undefined,
    orderListStatus: {
      loadState: "idle",
      firstLoaded: false,
      retryable: true,
      partialData: false,
      stickyHeaderEnabled: false,
      empty: false,
      skeleton: false,
      staleData: false,
      restoredFromRoute: false,
    },
    selectedOrderId: undefined,
    subscriptions: [],
    afterSalesCases: [],
    selectedAfterSalesCase: undefined,
    order: undefined,
    paymentIntent: undefined,
    paymentResult: undefined,
    callbackVerification: undefined,
    reconciliation: undefined,
    entitlement: undefined,
    commerceDetailStatus: {
      loadState: "idle",
      entryContext: "unknown",
      refreshable: true,
      invalidated: false,
      deleted: false,
      permissionDenied: false,
      offline: false,
      stale: false,
      unavailable: false,
      unpublished: false,
      recoveredFromLink: false,
    },
    transactionMessage: undefined,
    canCancelOrder: false,
    canRefundOrder: false,
    canCancelSubscription: false,
    canRenewSubscription: false,
    source: options.source,
    novelId: options.novelId,
    chapterId: options.chapterId,
    lockedMessage: undefined,
    purchaseSuccessMessage: undefined,
    lastPurchasedPlanId: undefined,
    returnActionLabel: undefined,
    entitlementSummary: undefined,
    recommendedPlanId: undefined,
    unlockOutcomeLabel: undefined,
    returnContextLabel: undefined,
    latestMilestoneTitle: undefined,
    latestMilestoneCopy: undefined,
    latestMilestoneMeta: undefined,
    latestMilestoneNovelId: undefined,
    latestMilestoneChapterId: undefined,
    latestMilestoneSource: undefined,
    latestMilestoneSourceLabel: undefined,
    latestMilestoneRecencyLabel: undefined,
    latestMilestoneReturnLabel: undefined,
    latestMilestoneReturnHint: undefined,
    milestoneHistory: [],
    benefits: [],
  };
}
