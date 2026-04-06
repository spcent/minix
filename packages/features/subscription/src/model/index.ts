import type { MembershipBenefit, MembershipOverview } from "@minix/contracts";
import type { LatestMilestoneHistoryEntry } from "@minix/core";

export interface SubscriptionState {
  ready: boolean;
  title: string;
  loading: boolean;
  purchasing: boolean;
  errorText: string | undefined;
  overview: MembershipOverview | undefined;
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
    overview: undefined,
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
