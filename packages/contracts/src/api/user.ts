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

export const ACCOUNT_OPERATION_KINDS = [
  "edit_profile",
  "change_phone",
  "unbind_wechat",
  "request_cancellation",
] as const;
export type AccountOperationKind = (typeof ACCOUNT_OPERATION_KINDS)[number];

export interface AccountOperation {
  kind: AccountOperationKind;
  label: string;
  available: boolean;
  statusLabel: string;
  blockedReason?: string;
}

export const USER_RELATION_ACTION_KINDS = [
  "follow",
  "unfollow",
  "block",
  "unblock",
  "set_remark",
  "clear_remark",
] as const;
export type UserRelationActionKind = (typeof USER_RELATION_ACTION_KINDS)[number];

export interface UserRelationAction {
  kind: UserRelationActionKind;
  label: string;
  available: boolean;
  active?: boolean;
  requiresInput?: boolean;
  blockedReason?: string;
}

export interface UserRelationTarget {
  targetUserId: string;
  displayName: string;
  relationshipSummary: string;
  following: boolean;
  followedBy: boolean;
  friend: boolean;
  blocked: boolean;
  remarkName?: string;
  actions: UserRelationAction[];
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
  accountOperations: AccountOperation[];
  relationTargets: UserRelationTarget[];
}

export interface UpdateUserProfileRequest {
  nickname?: string;
  region?: string;
  bio?: string;
}

export interface ChangeBoundPhoneRequest {
  phoneNumber: string;
  verificationCode: string;
}

export interface AccountUnbindRequest {
  provider: "wechat";
}

export interface AccountCancellationRequest {
  confirm: true;
}

export interface AccountOperationResponse {
  userProfile: UserProfile;
  accountSummary: AccountSummary;
  userStatus: UserStatus;
  accountOperations: AccountOperation[];
  transitionMessage: string;
}

export interface UserRelationMutationRequest {
  targetUserId: string;
  action: UserRelationActionKind;
  remarkName?: string;
}

export interface UserRelationMutationResponse {
  accountSummary: AccountSummary;
  userStatus: UserStatus;
  relationTargets: UserRelationTarget[];
  transitionMessage: string;
}
