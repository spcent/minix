import type {
  AuthDeviceIdentity,
  AuthIdentityWorkflow,
  AuthProviderIdentity,
  AuthRateLimitState,
  AuthSecurityAuditEvent,
  AuthSecurityPrompt,
  AuthVerificationPurpose,
} from "./auth";
import type { MembershipOverview } from "./membership";
import type { ListPagination } from "../kernel/common-page";

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
  availableBalanceCents: number;
  frozenBalanceCents: number;
  activeEntitlements: UserEntitlement[];
  historySummary?: string;
  latestLedgerTitle?: string;
}

export const USER_ASSET_LEDGER_SUBJECTS = ["points", "level", "balance", "membership", "entitlement"] as const;
export type UserAssetLedgerSubject = (typeof USER_ASSET_LEDGER_SUBJECTS)[number];

export const USER_ASSET_LEDGER_KINDS = [
  "grant",
  "consume",
  "freeze",
  "unfreeze",
  "refund",
  "revoke",
  "expire",
  "level_up",
] as const;
export type UserAssetLedgerKind = (typeof USER_ASSET_LEDGER_KINDS)[number];

export const USER_ENTITLEMENT_STATUSES = ["active", "frozen", "consumed", "refunded", "revoked", "expired"] as const;
export type UserEntitlementStatus = (typeof USER_ENTITLEMENT_STATUSES)[number];

export interface UserEntitlement {
  entitlementId: string;
  key: string;
  label: string;
  status: UserEntitlementStatus;
  active: boolean;
  productType: "membership" | "subscription" | "one_time" | "value_added" | "chapter" | "title" | "benefit";
  planId?: "monthly" | "quarterly" | "annual";
  sourceOrderId?: string;
  remainingUses?: number;
  expiresAt?: string;
}

export interface UserAssetLedgerEntry {
  ledgerId: string;
  subject: UserAssetLedgerSubject;
  kind: UserAssetLedgerKind;
  title: string;
  message: string;
  createdAt: string;
  sourceType: "payment" | "refund" | "system" | "manual" | "consumption";
  sourceId?: string;
  pointsDelta?: number;
  levelDelta?: number;
  balanceDeltaCents?: number;
  frozenBalanceDeltaCents?: number;
  membershipPlanId?: "monthly" | "quarterly" | "annual";
  entitlement?: UserEntitlement;
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
  "unlink_provider",
  "revoke_provider",
  "request_cancellation",
  "revoke_cancellation",
] as const;
export type AccountOperationKind = (typeof ACCOUNT_OPERATION_KINDS)[number];

export const ACCOUNT_OPERATION_RECORD_STATUSES = ["completed", "blocked", "pending", "revoked"] as const;
export type AccountOperationRecordStatus = (typeof ACCOUNT_OPERATION_RECORD_STATUSES)[number];

export interface AccountOperationRiskPrompt extends AuthSecurityPrompt {}

export interface AccountOperationCooldown {
  active: boolean;
  label: string;
  secondsRemaining: number;
  expiresAt?: string;
}

export interface AccountOperationRecord {
  recordId: string;
  kind: AccountOperationKind;
  status: AccountOperationRecordStatus;
  actorLabel: string;
  createdAt: string;
  message: string;
  verificationPurpose?: AuthVerificationPurpose;
  notificationHookLabel?: string;
}

export interface AccountOperation {
  kind: AccountOperationKind;
  label: string;
  available: boolean;
  statusLabel: string;
  blockedReason?: string;
  verificationRequired?: boolean;
  destructive?: boolean;
  reversible?: boolean;
  riskPrompt?: AccountOperationRiskPrompt;
  cooldown?: AccountOperationCooldown;
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

export const USER_RELATION_LIST_KINDS = ["following", "followers", "friends", "blocked", "remarks"] as const;
export type UserRelationListKind = (typeof USER_RELATION_LIST_KINDS)[number];

export const USER_FRIEND_STATES = ["none", "mutual", "outgoing_request", "incoming_request"] as const;
export type UserFriendState = (typeof USER_FRIEND_STATES)[number];

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
  friendState?: UserFriendState;
  blocked: boolean;
  remarkName?: string;
  actions: UserRelationAction[];
}

export interface UserRelationListItem extends UserRelationTarget {
  listKind: UserRelationListKind;
  lastInteractionAt?: string;
}

export interface UserRelationList {
  kind: UserRelationListKind;
  items: UserRelationListItem[];
  pagination: ListPagination;
  keyword?: string;
  summaryLabel?: string;
  availableKinds?: UserRelationListKind[];
}

export interface AccountSummary {
  userId: string;
  phoneBound: boolean;
  phoneNumberMasked?: string;
  wechatBound: boolean;
  providerIdentities?: AuthProviderIdentity[];
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
  cancellationRequestedAt?: string;
  cancellationEffectiveAt?: string;
  cancellationRevocableUntil?: string;
  recoverySummary?: string;
  cancellationSummary?: string;
}

export interface IdentityWorkflowSummary {
  canUpgradeGuest: boolean;
  canBindPhone: boolean;
  mergePending: boolean;
  pendingWorkflow?: AuthIdentityWorkflow;
  lastWorkflow?: AuthIdentityWorkflow;
}

export interface SecurityCenter {
  deviceIdentities: AuthDeviceIdentity[];
  auditEvents: AuthSecurityAuditEvent[];
  latestRateLimit?: AuthRateLimitState;
  latestPrompt?: AuthSecurityPrompt;
  deviceSummary?: {
    totalDevices: number;
    trustedDevices: number;
    provisionalDevices: number;
    reviewRequiredDevices: number;
    latestSeenAt?: string;
  };
}

export interface CurrentUserResponse {
  userProfile: UserProfile;
  accountSummary: AccountSummary;
  userStatus: UserStatus;
  identityWorkflows: IdentityWorkflowSummary;
  securityCenter: SecurityCenter;
  accountOperations: AccountOperation[];
  operationRecords: AccountOperationRecord[];
  relationTargets: UserRelationTarget[];
}

export interface ListUserAssetHistoryRequest {
  page?: number;
  pageSize?: number;
  subject?: UserAssetLedgerSubject | "all";
}

export interface UserAssetHistoryResponse {
  accountSummary: AccountSummary;
  ledgerEntries: UserAssetLedgerEntry[];
  pagination: ListPagination;
}

export interface UpdateUserProfileRequest {
  nickname?: string;
  region?: string;
  bio?: string;
}

export interface ChangeBoundPhoneRequest {
  phoneNumber: string;
  verificationCode: string;
  securityVerificationCode?: string;
  riskConfirmed?: boolean;
}

export interface AccountUnbindRequest {
  provider: string;
  providerUserId?: string;
  verificationCode?: string;
  riskConfirmed?: boolean;
}

export interface AccountProviderRevokeRequest {
  provider: string;
  providerUserId: string;
  verificationCode?: string;
  riskConfirmed?: boolean;
  reason?: string;
}

export interface AccountCancellationRequest {
  action?: "request" | "revoke";
  confirm: true;
  verificationCode?: string;
  riskConfirmed?: boolean;
  reason?: "privacy" | "switching" | "other";
  details?: string;
}

export interface AccountOperationResponse {
  userProfile: UserProfile;
  accountSummary: AccountSummary;
  userStatus: UserStatus;
  securityCenter: SecurityCenter;
  accountOperations: AccountOperation[];
  operationRecords: AccountOperationRecord[];
  operationRecord?: AccountOperationRecord;
  transitionMessage: string;
}

export interface UserRelationMutationRequest {
  targetUserId: string;
  action: UserRelationActionKind;
  remarkName?: string;
  listKind?: UserRelationListKind;
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface UserRelationMutationResponse {
  accountSummary: AccountSummary;
  userStatus: UserStatus;
  relationTargets: UserRelationTarget[];
  relationList?: UserRelationList;
  transitionMessage: string;
}

export interface ListUserRelationsRequest {
  kind: UserRelationListKind;
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface UserRelationListResponse {
  accountSummary: AccountSummary;
  userStatus: UserStatus;
  relationList: UserRelationList;
}
