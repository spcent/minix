import type { CurrentUserResponse } from "@minix/contracts";

import type {
  AccountAction,
  AccountSection,
  AccountSectionItem,
  AccountState,
  AccountSummaryStat,
} from "../model";
import { createAssetLedgerSection } from "./asset-history";
import { createRelationListSection } from "./relation-actions";
import { upsertStat } from "./section-utils";

export function createAccountStatusLabel(response: CurrentUserResponse): string {
  if (response.userStatus.blacklisted) {
    return "Blacklisted";
  }

  if (response.userStatus.cancellationInProgress) {
    return "Cancellation in progress";
  }

  if (response.userStatus.frozen) {
    return "Frozen";
  }

  if (response.userStatus.guest) {
    return "Guest";
  }

  return "Enabled";
}

function formatDelimitedList(values: string[] | undefined, fallback = "None"): string {
  if (!values || values.length === 0) {
    return fallback;
  }

  return values.join(", ");
}

function createFallbackWorkspaceSummary(response: CurrentUserResponse): CurrentUserResponse["accountWorkspaceSummary"] {
  const profileFields = [
    response.userProfile.nickname,
    response.userProfile.avatarUrl,
    response.userProfile.region,
    response.userProfile.bio,
    response.userProfile.tags && response.userProfile.tags.length > 0 ? "tags" : undefined,
  ];
  const completedProfileFields = profileFields.filter(Boolean).length;
  const profileCompletenessPercent = Math.round((completedProfileFields / profileFields.length) * 100);
  const relationTotal =
    response.accountSummary.relations.followingCount
    + response.accountSummary.relations.followerCount
    + response.accountSummary.relations.friendCount
    + response.accountSummary.relations.blockedCount;

  return {
    profileCompletenessPercent,
    profileCompletenessLabel: `${profileCompletenessPercent}% profile fields are ready for account detail projection.`,
    relationSearchSummary:
      relationTotal > 0
        ? `${relationTotal} relationship records can be searched across following, followers, friends, blocked users, and remarks.`
        : "No relationship records are available for search yet.",
    assetHistoryFilterSummary: "Asset history can be filtered by points, level, membership, entitlement, or balance.",
    cancellationReviewSummary: response.userStatus.cancellationSummary ?? "No cancellation request is currently pending.",
    nextBestActionLabel: response.identityWorkflows.canUpgradeGuest
      ? "Upgrade guest account"
      : response.identityWorkflows.canBindPhone
        ? "Bind phone"
        : response.identityWorkflows.mergePending
          ? "Resolve account merge"
          : "Review account profile",
  };
}

export function createRemoteStats(response: CurrentUserResponse): AccountSummaryStat[] {
  return [
    {
      key: "membership",
      label: "Membership",
      value: response.accountSummary.assets.membership?.headline ?? "No active membership",
      tone: response.accountSummary.assets.membership?.active ? "positive" : "neutral",
    },
    {
      key: "account-status",
      label: "Account status",
      value: createAccountStatusLabel(response),
      tone: response.userStatus.enabled ? "positive" : "caution",
    },
    {
      key: "points",
      label: "Points",
      value: String(response.accountSummary.assets.points),
    },
    {
      key: "level",
      label: "Level",
      value: String(response.accountSummary.assets.level),
    },
    {
      key: "wallet-balance",
      label: "Wallet",
      value: `${(response.accountSummary.assets.availableBalanceCents / 100).toFixed(2)} CNY`,
    },
  ];
}

export function createRemoteSections(response: CurrentUserResponse): AccountSection[] {
  const securityCenter = response.securityCenter ?? {
    deviceIdentities: [],
    auditEvents: [],
  };
  const accountWorkspaceSummary = response.accountWorkspaceSummary ?? createFallbackWorkspaceSummary(response);
  const sections: AccountSection[] = [
    {
      key: "identity",
      title: "Profile and identity",
      items: [
        {
          key: "user-id",
          label: "User ID",
          value: response.accountSummary.userId,
          hint: "Use this id when you need support or cross-device recovery.",
        },
        {
          key: "nickname",
          label: "Nickname",
          value: response.userProfile.nickname ?? "Guest",
        },
        {
          key: "region",
          label: "Region",
          value: response.userProfile.region ?? "Not set",
        },
        {
          key: "gender",
          label: "Gender",
          value: response.userProfile.gender ?? "unknown",
        },
        {
          key: "bio",
          label: "Bio",
          value: response.userProfile.bio ?? "Not set",
        },
        {
          key: "tags",
          label: "Tags",
          value: formatDelimitedList(response.userProfile.tags),
        },
      ],
    },
    {
      key: "account",
      title: "Account bindings",
      items: [
        {
          key: "phone-bound",
          label: "Phone",
          value: response.accountSummary.phoneBound
            ? response.accountSummary.phoneNumberMasked ?? "Bound"
            : "Not bound",
        },
        {
          key: "wechat-bound",
          label: "WeChat",
          value: response.accountSummary.wechatBound ? "Bound" : "Not bound",
        },
        {
          key: "real-name",
          label: "Real-name status",
          value: response.accountSummary.realNameStatus,
        },
        {
          key: "provider-count",
          label: "Linked providers",
          value: String(response.accountSummary.providerIdentities?.length ?? 0),
        },
      ],
    },
    {
      key: "assets",
      title: "Wallet and entitlements",
      items: [
        {
          key: "level",
          label: "Level",
          value: String(response.accountSummary.assets.level),
        },
        {
          key: "membership-headline",
          label: "Membership status",
          value: response.accountSummary.assets.membership?.headline ?? "No active membership",
        },
        {
          key: "entitlements",
          label: "Entitlements",
          value: formatDelimitedList(response.accountSummary.assets.entitlementLabels),
        },
        {
          key: "balance",
          label: "Wallet balance",
          value: `${(response.accountSummary.assets.balanceCents / 100).toFixed(2)} CNY`,
        },
        {
          key: "available-balance",
          label: "Available balance",
          value: `${(response.accountSummary.assets.availableBalanceCents / 100).toFixed(2)} CNY`,
        },
        {
          key: "frozen-balance",
          label: "Frozen balance",
          value: `${(response.accountSummary.assets.frozenBalanceCents / 100).toFixed(2)} CNY`,
        },
        {
          key: "active-entitlements",
          label: "Active entitlements",
          value:
            response.accountSummary.assets.activeEntitlements.map((entitlement) => entitlement.label).join(", ") || "None",
        },
        {
          key: "asset-history-summary",
          label: "Asset history",
          value: response.accountSummary.assets.historySummary ?? "No asset history summary",
        },
        {
          key: "latest-ledger-title",
          label: "Latest ledger entry",
          value: response.accountSummary.assets.latestLedgerTitle ?? "No recent ledger entry",
        },
      ],
    },
    {
      key: "relations",
      title: "Relationship summary",
      items: [
        {
          key: "following",
          label: "Following",
          value: String(response.accountSummary.relations.followingCount),
        },
        {
          key: "followers",
          label: "Followers",
          value: String(response.accountSummary.relations.followerCount),
        },
        {
          key: "friends",
          label: "Friends",
          value: String(response.accountSummary.relations.friendCount),
        },
        {
          key: "blocked",
          label: "Blocked",
          value: String(response.accountSummary.relations.blockedCount),
        },
        {
          key: "remark-name",
          label: "Remark name",
          value: response.accountSummary.relations.remarkName ?? "None",
        },
      ],
    },
  ];

  if ((response.accountSummary.providerIdentities ?? []).length > 0) {
    sections.push({
      key: "providers",
      title: "Linked providers",
      items: response.accountSummary.providerIdentities!.flatMap((provider) => [
        {
          key: `provider-${provider.provider}-${provider.providerUserId}`,
          label: provider.providerLabel,
          value: provider.authorizationStatus === "active" ? "Authorized" : provider.authorizationStatus,
          hint: [provider.providerUserId, provider.lastAuthorizedAt].filter(Boolean).join(" · "),
        },
        ...provider.actions.map((action) => ({
          key: `provider-${provider.provider}-${provider.providerUserId}-${action.kind}`,
          label: action.label,
          value: action.available ? "Available" : "Unavailable",
          ...(action.blockedReason ? { hint: action.blockedReason } : {}),
        })),
      ]),
    });
  }

  if (response.accountOperations.length > 0) {
    sections.push({
      key: "account-operations",
      title: "Account operations",
      items: response.accountOperations.map((operation) => ({
        key: `operation-${operation.kind}`,
        label: operation.label,
        value: operation.statusLabel,
        ...(operation.blockedReason ? { hint: operation.blockedReason } : {}),
      })),
    });
  }

  if ((response.operationRecords ?? []).length > 0) {
    sections.push({
      key: "operation-records",
      title: "Recent security operations",
      items: (response.operationRecords ?? []).map((record) => {
        const hint = [record.status, record.notificationHookLabel].filter(Boolean).join(" · ");
        return {
          key: `operation-record-${record.recordId}`,
          label: record.kind,
          value: record.message,
          ...(hint ? { hint } : {}),
        };
      }),
    });
  }

  if (
    securityCenter.deviceIdentities.length > 0 ||
    securityCenter.auditEvents.length > 0 ||
    securityCenter.latestPrompt ||
    securityCenter.latestRateLimit
  ) {
    const securityItems: AccountSectionItem[] = [];
    securityItems.push(
      {
        key: "security-device-summary",
        label: "Devices",
        value:
          securityCenter.deviceIdentities.length > 0
            ? `${securityCenter.deviceIdentities.filter((device) => device.trusted).length}/${securityCenter.deviceIdentities.length} trusted`
            : "No devices recorded",
      },
      {
        key: "security-audit-summary",
        label: "Audit events",
        value:
          securityCenter.auditEvents.length > 0
            ? `${securityCenter.auditEvents.length} recent events`
            : "No recent audit events",
      },
    );
    if (securityCenter.latestPrompt) {
      securityItems.push({
        key: "security-latest-prompt",
        label: securityCenter.latestPrompt.title,
        value: securityCenter.latestPrompt.message,
        hint: [securityCenter.latestPrompt.scope, securityCenter.latestPrompt.severity]
          .filter(Boolean)
          .join(" · "),
      });
    }
    if (securityCenter.deviceSummary) {
      securityItems.push({
        key: "security-device-readiness",
        label: "Device posture",
        value: `${securityCenter.deviceSummary.trustedDevices} trusted · ${securityCenter.deviceSummary.provisionalDevices} provisional · ${securityCenter.deviceSummary.reviewRequiredDevices} review`,
        ...(securityCenter.deviceSummary.latestSeenAt ? { hint: securityCenter.deviceSummary.latestSeenAt } : {}),
      });
    }
    if (securityCenter.latestRateLimit) {
      securityItems.push({
        key: "security-latest-rate-limit",
        label: `Rate limit: ${securityCenter.latestRateLimit.scope}`,
        value: securityCenter.latestRateLimit.limited
          ? `Limited, retry in ${securityCenter.latestRateLimit.retryAfterSeconds}s`
          : `${securityCenter.latestRateLimit.remaining} attempts remaining`,
        hint: securityCenter.latestRateLimit.updatedAt,
      });
    }
    securityItems.push(
      ...securityCenter.deviceIdentities.slice(0, 3).map((device) => ({
        key: `security-device-${device.deviceId}`,
        label: device.deviceId,
        value: device.trusted ? "Trusted device" : "Review required",
        hint: [device.platform, device.lastIpRegion, device.lastSeenAt].filter(Boolean).join(" · "),
      })),
    );
    securityItems.push(
      ...securityCenter.auditEvents.slice(0, 3).map((event) => ({
        key: `security-audit-${event.eventId}`,
        label: `${event.scope}:${event.action}`,
        value: event.message,
        hint: [event.result, event.createdAt].filter(Boolean).join(" · "),
      })),
    );
    sections.push({
      key: "security-center",
      title: "Security center",
      items: securityItems,
    });
  }

  if (response.relationTargets.length > 0) {
    sections.push({
      key: "relation-targets",
      title: "Relationship actions",
      items: response.relationTargets.flatMap((target) => [
        {
          key: `relation-${target.targetUserId}`,
          label: target.displayName,
          value: target.relationshipSummary,
          ...(target.remarkName ? { hint: `Remark: ${target.remarkName}` } : {}),
        },
        ...target.actions.map((action) => ({
          key: `relation-${target.targetUserId}-${action.kind}`,
          label: action.label,
          value: action.available ? "Available" : "Unavailable",
          ...(action.blockedReason ? { hint: action.blockedReason } : {}),
        })),
      ]),
    });
  }

  if (
    response.identityWorkflows.canUpgradeGuest ||
    response.identityWorkflows.canBindPhone ||
    response.identityWorkflows.mergePending ||
    response.identityWorkflows.lastWorkflow
  ) {
    sections.push({
      key: "identity-workflows",
      title: "Identity workflows",
      items: [
        {
          key: "guest-upgrade",
          label: "Guest upgrade",
          value: response.identityWorkflows.canUpgradeGuest ? "Available" : "Not needed",
        },
        {
          key: "phone-binding",
          label: "Phone binding",
          value: response.identityWorkflows.canBindPhone ? "Available" : "Not required",
        },
        {
          key: "merge-pending",
          label: "Merge status",
          value: response.identityWorkflows.mergePending
            ? response.identityWorkflows.pendingWorkflow?.message ?? "Pending merge confirmation"
            : "No pending merge",
          ...(response.identityWorkflows.pendingWorkflow?.targetUserId
            ? { hint: `Target account: ${response.identityWorkflows.pendingWorkflow.targetUserId}` }
            : {}),
        },
        {
          key: "last-workflow",
          label: "Last workflow",
          value: response.identityWorkflows.lastWorkflow?.message ?? "No recent workflow",
          ...(response.identityWorkflows.lastWorkflow
            ? {
                hint: [response.identityWorkflows.lastWorkflow.kind, response.identityWorkflows.lastWorkflow.status]
                  .filter(Boolean)
                  .join(" · "),
              }
            : {}),
        },
      ],
    });
  }

  if (response.userStatus.recoverySummary || response.userStatus.cancellationSummary) {
    sections.push({
      key: "account-follow-up",
      title: "Recovery and cancellation",
      items: [
        {
          key: "recovery-summary",
          label: "Recovery posture",
          value: response.userStatus.recoverySummary ?? "No recovery summary",
        },
        {
          key: "cancellation-summary",
          label: "Cancellation posture",
          value: response.userStatus.cancellationSummary ?? "No cancellation summary",
          ...(response.userStatus.cancellationRevocableUntil
            ? { hint: `Revocable until ${response.userStatus.cancellationRevocableUntil}` }
            : {}),
        },
      ],
    });
  }

  sections.push({
    key: "account-workspace-summary",
    title: "Account workspace summary",
    items: [
      {
        key: "profile-completeness",
        label: "Profile completeness",
        value: accountWorkspaceSummary.profileCompletenessLabel,
      },
      {
        key: "relation-search",
        label: "Relation search",
        value: accountWorkspaceSummary.relationSearchSummary,
      },
      {
        key: "asset-history-filters",
        label: "Asset history filters",
        value: accountWorkspaceSummary.assetHistoryFilterSummary,
      },
      {
        key: "cancellation-review",
        label: "Cancellation review",
        value: accountWorkspaceSummary.cancellationReviewSummary,
      },
      {
        key: "next-best-action",
        label: "Next action",
        value: accountWorkspaceSummary.nextBestActionLabel,
      },
    ],
  });

  return sections;
}

export function createRemoteActions(response: CurrentUserResponse): AccountAction[] {
  const actions: AccountAction[] = [
    {
      key: "copy-user-id",
      label: "Copy user id",
      emphasis: "secondary",
    },
  ];

  for (const operation of response.accountOperations) {
    if (!operation.available) {
      continue;
    }

    actions.push({
      key: operation.kind,
      label: operation.label,
      emphasis: operation.kind === "request_cancellation" ? "secondary" : "primary",
    });
  }

  if (response.identityWorkflows.canUpgradeGuest) {
    actions.push({
      key: "upgrade-guest",
      label: "Upgrade guest",
      emphasis: "primary",
    });
  }

  if (response.identityWorkflows.canBindPhone) {
    actions.push({
      key: "bind-phone",
      label: "Bind phone",
      emphasis: "primary",
    });
  }

  if (response.identityWorkflows.mergePending) {
    actions.push({
      key: "confirm-merge",
      label: "Confirm merge",
      emphasis: "primary",
    });
  }

  for (const target of response.relationTargets) {
    for (const action of target.actions) {
      if (!action.available) {
        continue;
      }

      actions.push({
        key: `${action.kind}:${target.targetUserId}`,
        label: `${action.label} ${target.displayName}`,
        emphasis: action.kind === "block" ? "secondary" : "primary",
      });
    }
  }

  return actions;
}

export function mergeRemoteProfile(baseState: AccountState, profile: CurrentUserResponse): AccountState {
  const securityCenter = profile.securityCenter ?? {
    deviceIdentities: [],
    auditEvents: [],
  };
  const accountWorkspaceSummary = profile.accountWorkspaceSummary ?? createFallbackWorkspaceSummary(profile);
  const remoteSections = createRemoteSections(profile);
  const assetLedgerSection = createAssetLedgerSection(baseState.assetLedgerEntries);
  const relationListSection = createRelationListSection(baseState.relationList);
  const remoteStats = createRemoteStats(profile);
  const remoteActions = createRemoteActions(profile);
  const sessionLabel = baseState.sessionLabel ?? "Managed by the current signed-in session.";
  const authStatusLabel = `${baseState.authStatusLabel ?? "Signed in"} · ${createAccountStatusLabel(profile)}`;
  const sections = [...remoteSections];
  let stats = baseState.stats;
  for (const stat of remoteStats) {
    stats = upsertStat(stats, stat);
  }
  if (assetLedgerSection) {
    sections.push(assetLedgerSection);
  }
  if (relationListSection) {
    sections.push(relationListSection);
  }

  return {
    ...baseState,
    ...(profile.userProfile.nickname ? { nickname: profile.userProfile.nickname } : {}),
    ...(profile.userProfile.avatarUrl ? { avatarUrl: profile.userProfile.avatarUrl } : {}),
    subtitle:
      profile.userProfile.tags && profile.userProfile.tags.length > 0
        ? `Tags: ${profile.userProfile.tags.join(", ")}`
        : baseState.subtitle,
    sessionLabel,
    authStatusLabel,
    userProfile: profile.userProfile,
    accountSummary: profile.accountSummary,
    userStatus: profile.userStatus,
    identityWorkflows: profile.identityWorkflows,
    securityCenter,
    accountWorkspaceSummary,
    accountOperations: profile.accountOperations,
    operationRecords: profile.operationRecords,
    relationTargets: profile.relationTargets,
    stats,
    sections,
    actions: remoteActions,
    transitionFeedback: profile.identityWorkflows.lastWorkflow?.message,
  };
}

