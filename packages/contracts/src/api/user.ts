import type { AuthIdentityWorkflow } from "./auth";
import type { MembershipOverview } from "./membership";

export const USER_GENDERS = ["unknown", "female", "male", "nonbinary"] as const;
export type UserGender = (typeof USER_GENDERS)[number];

export const REAL_NAME_STATUSES = ["unverified", "pending", "verified"] as const;
export type RealNameStatus = (typeof REAL_NAME_STATUSES)[number];

export const USER_AVAILABILITY_STATUSES = [
  "enabled",
  "frozen",
  "cancellation_pending",
  "blacklisted",
  "guest",
] as const;
export type UserAvailabilityStatus = (typeof USER_AVAILABILITY_STATUSES)[number];

export interface UserProfile {
  nickname?: string;
  avatarUrl?: string;
  gender?: UserGender;
  region?: string;
  bio?: string;
  tags?: string[];
}

export interface UserAssetSummary {
  points: number;
  level: number;
  membership?: MembershipOverview;
  entitlementLabels: string[];
  balanceCents: number;
}

export interface UserRelationSummary {
  followingCount: number;
  followerCount: number;
  friendCount: number;
  blockedCount: number;
  remarkName?: string;
}

export interface AccountSummary {
  userId: string;
  phoneBound: boolean;
  phoneNumberMasked?: string;
  wechatBound: boolean;
  realNameStatus: RealNameStatus;
  assets: UserAssetSummary;
  relations: UserRelationSummary;
}

export interface UserStatus {
  availability: UserAvailabilityStatus;
  enabled: boolean;
  frozen: boolean;
  cancellationInProgress: boolean;
  blacklisted: boolean;
  guest: boolean;
}

export interface IdentityWorkflowSummary {
  canUpgradeGuest: boolean;
  canBindPhone: boolean;
  mergePending: boolean;
  pendingWorkflow?: AuthIdentityWorkflow;
  lastWorkflow?: AuthIdentityWorkflow;
}

export interface CurrentUserResponse {
  userProfile: UserProfile;
  accountSummary: AccountSummary;
  userStatus: UserStatus;
  identityWorkflows: IdentityWorkflowSummary;
}
