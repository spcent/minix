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
  source?: string;
  novelId?: string;
  chapterId?: string;
}

export interface PurchaseMembershipResponse {
  purchased: true;
  overview: MembershipOverview;
  source?: string;
  novelId?: string;
  chapterId?: string;
  returnTarget: "catalog" | "detail" | "reader";
}
