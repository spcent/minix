import type {
  CurrentUserResponse,
  ListUserAssetHistoryRequest,
  UserAccountWorkspaceSummary,
  UserAssetHistoryResponse,
} from "@minix/contracts";

import { DEFAULT_MEMBERSHIP_OVERVIEW } from "../../content";
import { canExposeRemarkName } from "../content/search";
import {
  bindUploadAssetsToOwner,
  resolveUploadAssetForUser,
} from "../uploads/pipeline";
import { resolveSampleMediaUrl } from "../../sample-assets";
import type { SessionRecord, UserState } from "../../types";
import {
  deriveUserAssetSummary,
  listUserAssetLedgerEntries,
} from "./assets";
import {
  createAccountOperations,
  createProviderIdentities,
  createSecurityCenter,
  resolveAccountSecurityPhoneNumber,
  resolveMaskedPhoneNumber,
  resolveUserAvailability,
} from "./operations";
import { createPrimaryRelationTargets, ensureRelationRecords } from "./relations";

function createAccountWorkspaceSummary(input: {
  userProfile: CurrentUserResponse["userProfile"];
  accountSummary: CurrentUserResponse["accountSummary"];
  userStatus: CurrentUserResponse["userStatus"];
  identityWorkflows: CurrentUserResponse["identityWorkflows"];
  relationTargetCount: number;
  selectedAssetSubject?: ListUserAssetHistoryRequest["subject"];
}): UserAccountWorkspaceSummary {
  const profileFields = [
    input.userProfile.nickname,
    input.userProfile.avatarUrl,
    input.userProfile.region,
    input.userProfile.bio,
    input.userProfile.tags && input.userProfile.tags.length > 0 ? "tags" : undefined,
  ];
  const completedProfileFields = profileFields.filter(Boolean).length;
  const profileCompletenessPercent = Math.round((completedProfileFields / profileFields.length) * 100);
  const relationTotal =
    input.accountSummary.relations.followingCount
    + input.accountSummary.relations.followerCount
    + input.accountSummary.relations.friendCount
    + input.accountSummary.relations.blockedCount;
  const selectedAssetSubject = input.selectedAssetSubject && input.selectedAssetSubject !== "all"
    ? input.selectedAssetSubject
    : undefined;

  return {
    profileCompletenessPercent,
    profileCompletenessLabel: `${profileCompletenessPercent}% profile fields are ready for account detail projection.`,
    relationSearchSummary:
      relationTotal > 0
        ? `${relationTotal} relationship records can be searched across following, followers, friends, blocked users, and remarks.`
        : "No relationship records are available for search yet.",
    assetHistoryFilterSummary: selectedAssetSubject
      ? `Asset history is filtered to ${selectedAssetSubject}.`
      : "Asset history can be filtered by points, level, membership, entitlement, or balance.",
    cancellationReviewSummary:
      input.userStatus.cancellationSummary ??
      (input.userStatus.cancellationInProgress
        ? "Cancellation is pending review."
        : "No cancellation request is currently pending."),
    nextBestActionLabel: input.identityWorkflows.canUpgradeGuest
      ? "Upgrade guest account"
      : input.identityWorkflows.canBindPhone
        ? "Bind phone"
        : input.identityWorkflows.mergePending
          ? "Resolve account merge"
          : input.userStatus.cancellationInProgress
            ? "Review cancellation"
            : input.relationTargetCount > 0
              ? "Review relationship workspace"
              : "Review account profile",
  };
}

export function createCurrentUserResponse(
  session: SessionRecord,
  userState: UserState,
  requestUrl?: string,
): CurrentUserResponse {
  const assetState = deriveUserAssetSummary(userState);
  if (assetState.membershipPlanId) {
    userState.membershipPlanId = assetState.membershipPlanId;
  }
  const uploadedAvatarUrl = userState.profileOverrides?.avatarAssetId
    ? resolveUploadAssetForUser(userState, userState.profileOverrides.avatarAssetId)?.url
    : undefined;
  const avatarUrl =
    uploadedAvatarUrl ??
    (session.profile.avatarUrl && requestUrl
      ? resolveSampleMediaUrl(session.profile.avatarUrl, requestUrl)
      : session.profile.avatarUrl);
  const availability = resolveUserAvailability(session, userState);
  const relationTargets = createPrimaryRelationTargets(userState, availability);
  const relation = relationTargets[0];
  const relationRecords = Object.values(ensureRelationRecords(userState));
  const followingCount = relationRecords.filter(
    (record) => record.following && !record.blocked,
  ).length;
  const followerCount = relationRecords.filter(
    (record) => record.followedBy && !record.blocked,
  ).length;
  const friendCount = relationRecords.filter(
    (record) => record.friend || record.friendState === "mutual",
  ).length;
  const blockedCount = relationRecords.filter((record) => record.blocked).length;
  const displayNickname = userState.profileOverrides?.nickname ?? session.profile.nickname;
  const region =
    userState.profileOverrides?.region ??
    (session.platform === "wechat" ? "Shanghai, CN" : "Web session");
  const bio =
    userState.profileOverrides?.bio ??
    "Sample user profile for shared account-domain integration.";
  const phoneBound = Boolean(userState.boundPhoneNumber || session.identity.phoneBound);
  const wechatBound = userState.wechatBoundOverride ?? Boolean(session.identity.wechatBound);
  const providerIdentities = createProviderIdentities(session, userState);
  const recoveryCredentialCount =
    (phoneBound ? 1 : 0)
    + (wechatBound ? 1 : 0)
    + providerIdentities.filter((provider) => provider.authorizationStatus === "active").length;
  const recoverySummary =
    recoveryCredentialCount > 0
      ? `${recoveryCredentialCount} recovery credential paths remain available for account follow-up.`
      : "No durable recovery credential is configured yet.";
  const cancellationSummary = userState.pendingCancellation
    ? `Cancellation is in the cooling-off window until ${userState.pendingCancellation.effectiveAt}.`
    : "No cancellation request is currently pending.";
  const response: CurrentUserResponse = {
    userProfile: {
      nickname: displayNickname,
      ...(avatarUrl ? { avatarUrl } : {}),
      gender: "unknown",
      region,
      bio,
      tags: session.authStatus === "guest" ? ["guest", "trial"] : ["member-ready", "cross-host"],
    },
    accountSummary: {
      userId: session.userId,
      phoneBound,
      ...(phoneBound
        ? { phoneNumberMasked: resolveMaskedPhoneNumber(userState.boundPhoneNumber) ?? "138****0001" }
        : {}),
      wechatBound,
      providerIdentities,
      realNameStatus: session.identity.realNameVerified ? "verified" : "unverified",
      assets:
        session.authStatus === "guest"
          ? {
              points: 0,
              level: 1,
              membership: DEFAULT_MEMBERSHIP_OVERVIEW,
              entitlementLabels: ["basic-access"],
              balanceCents: 0,
              availableBalanceCents: 0,
              frozenBalanceCents: 0,
              activeEntitlements: [],
            }
          : assetState.summary,
      relations: {
        followingCount,
        followerCount,
        friendCount,
        blockedCount,
        ...(canExposeRemarkName(userState, relation) && relation?.remarkName
          ? { remarkName: relation.remarkName }
          : session.authStatus === "guest"
            ? { remarkName: "Guest session" }
            : {}),
      },
    },
    userStatus: {
      availability,
      enabled: availability === "enabled",
      frozen: availability === "frozen",
      cancellationInProgress: availability === "cancellation_pending",
      blacklisted: availability === "blacklisted",
      guest: session.authStatus === "guest",
      ...(userState.pendingCancellation
        ? { cancellationRequestedAt: userState.pendingCancellation.requestedAt }
        : {}),
      ...(userState.pendingCancellation
        ? { cancellationEffectiveAt: userState.pendingCancellation.effectiveAt }
        : {}),
      ...(userState.pendingCancellation
        ? { cancellationRevocableUntil: userState.pendingCancellation.revokeUntil }
        : {}),
      recoverySummary,
      cancellationSummary,
    },
    identityWorkflows: {
      canUpgradeGuest: session.authStatus === "guest" || Boolean(session.identity.anonymous),
      canBindPhone:
        session.authStatus === "authenticated" &&
        Boolean(session.identity.wechatBound || session.platform === "wechat") &&
        !phoneBound,
      mergePending: Boolean(userState.pendingIdentityWorkflow),
      ...(userState.pendingIdentityWorkflow
        ? { pendingWorkflow: userState.pendingIdentityWorkflow }
        : {}),
      ...(userState.lastIdentityWorkflow ? { lastWorkflow: userState.lastIdentityWorkflow } : {}),
    },
    securityCenter: createSecurityCenter(userState),
    accountWorkspaceSummary: {
      profileCompletenessPercent: 0,
      profileCompletenessLabel: "",
      relationSearchSummary: "",
      assetHistoryFilterSummary: "",
      cancellationReviewSummary: "",
      nextBestActionLabel: "",
    },
    accountOperations: createAccountOperations(session, userState, availability),
    operationRecords: userState.operationRecords,
    relationTargets,
  };
  response.accountWorkspaceSummary = createAccountWorkspaceSummary({
    userProfile: response.userProfile,
    accountSummary: response.accountSummary,
    userStatus: response.userStatus,
    identityWorkflows: response.identityWorkflows,
    relationTargetCount: response.relationTargets.length,
  });
  return response;
}

export function createAccountOperationResponse(
  session: SessionRecord,
  userState: UserState,
  requestUrl: string | undefined,
  transitionMessage: string,
  operationRecord?: CurrentUserResponse["operationRecords"][number],
) {
  const next = createCurrentUserResponse(session, userState, requestUrl);
  return {
    userProfile: next.userProfile,
    accountSummary: next.accountSummary,
    userStatus: next.userStatus,
    securityCenter: next.securityCenter,
    accountWorkspaceSummary: next.accountWorkspaceSummary,
    accountOperations: next.accountOperations,
    operationRecords: next.operationRecords,
    ...(operationRecord ? { operationRecord } : {}),
    transitionMessage,
  };
}

export function listUserAssetHistory(
  session: SessionRecord,
  userState: UserState,
  request: ListUserAssetHistoryRequest,
): UserAssetHistoryResponse {
  const current = createCurrentUserResponse(session, userState);
  const history = listUserAssetLedgerEntries(userState, request);
  return {
    accountSummary: current.accountSummary,
    accountWorkspaceSummary: createAccountWorkspaceSummary({
      userProfile: current.userProfile,
      accountSummary: current.accountSummary,
      userStatus: current.userStatus,
      identityWorkflows: current.identityWorkflows,
      relationTargetCount: current.relationTargets.length,
      ...(request.subject ? { selectedAssetSubject: request.subject } : {}),
    }),
    ledgerEntries: history.ledgerEntries,
    pagination: history.pagination,
  };
}

export function applyAccountAvatarBinding(
  session: SessionRecord,
  userState: UserState,
  avatarAssetId: string | undefined,
): void {
  if (!avatarAssetId) {
    return;
  }

  bindUploadAssetsToOwner(userState, {
    assetIds: [avatarAssetId],
    ownerType: "avatar",
    ownerId: session.userId,
    role: "avatar",
  });
}
