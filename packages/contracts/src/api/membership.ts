import type {
  Entitlement,
  Order,
  PaymentChannel,
  PaymentCommercePosture,
  PaymentIntent,
  PaymentOperationResult,
  PaymentProviderMode,
  PaymentResult,
} from "./payment";

export interface MembershipBenefit {
  key: string;
  label: string;
  description: string;
}

export interface MembershipOverview {
  active: boolean;
  tier: "guest" | "signed-in" | "member";
  entitlementScope: "none" | "chapter" | "title" | "membership";
  statusLabel: string;
  renewalLabel: string;
  headline: string;
  subheadline: string;
  benefits: MembershipBenefit[];
}

export interface PurchaseMembershipRequest {
  planId: "monthly" | "quarterly" | "annual";
  channel?: PaymentChannel;
  providerMode?: PaymentProviderMode;
  paymentScenario?: "instant_success" | "pending";
  idempotencyKey?: string;
  source?: string;
  novelId?: string;
  chapterId?: string;
}

export interface MembershipEntitlement extends Entitlement {
  productType: "membership";
  overview: MembershipOverview;
}

export interface PurchaseMembershipResponse {
  purchased: true;
  overview: MembershipOverview;
  order: Order;
  paymentIntent: PaymentIntent;
  paymentResult: PaymentResult;
  commercePosture?: PaymentCommercePosture;
  operationResult?: PaymentOperationResult;
  entitlement: MembershipEntitlement;
  source?: string;
  novelId?: string;
  chapterId?: string;
  returnTarget: "catalog" | "detail" | "reader";
}
