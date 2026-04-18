import {
  beginFormSubmit,
  createFormSubmissionKey,
  createFormWorkflowState,
  createAuthRedirectParams,
  createStore,
  finalizeFormSubmit,
  ok,
  persistAuthSessionResponse,
  type AppKernel,
  type Result,
  type UserSession,
} from "@minix/core";
import type {
  AccountCancellationRequest,
  AccountOperation,
  AccountOperationResponse,
  AccountProviderRevokeRequest,
  AccountUnbindRequest,
  AppRouteId,
  ChangeBoundPhoneRequest,
  CurrentUserResponse,
  FormApprovalNode,
  FormFieldDefinition,
  FormSchema,
  FormValidationError,
  IdentityBindPhoneRequest,
  IdentityMergeRequest,
  IdentityTransitionResponse,
  IdentityUpgradeRequest,
  ListUserAssetHistoryRequest,
  ListUserRelationsRequest,
  UpdateUserProfileRequest,
  UserAssetHistoryResponse,
  UserAssetLedgerEntry,
  UserRelationList,
  UserRelationMutationRequest,
  UserRelationListResponse,
  UserRelationMutationResponse,
  UserRelationTarget,
} from "@minix/contracts";

import {
  createDefaultAccountOperationValues,
  createDefaultAccountState,
  type AccountAction,
  type AccountDraftSnapshot,
  type AccountOperationFormValues,
  type AccountSection,
  type AccountSectionItem,
  type AccountState,
  type AccountSummaryStat,
} from "../model";

export interface CreateAccountControllerOptions {
  kernel: AppKernel;
  initialState?: Partial<AccountState>;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  overviewRouteId?: AppRouteId;
  identityUpgradeRouteId?: AppRouteId;
  identityBindPhoneRouteId?: AppRouteId;
  identityMergeRouteId?: AppRouteId;
  requestPath?: string;
  authRedirectSource?: string;
}

function hasActiveSession(session: UserSession | null | undefined): session is UserSession {
  if (!session) {
    return false;
  }

  if (!session.loggedIn || !session.token?.accessToken) {
    return false;
  }

  if (session.token.expiresAt === undefined) {
    return true;
  }

  return session.token.expiresAt > Date.now();
}

function cloneState(state: AccountState): AccountState {
  return {
    ...state,
    formValues: structuredClone(state.formValues),
    initialFormValues: structuredClone(state.initialFormValues),
    validationErrors: state.validationErrors.map((error) => ({ ...error })),
    submitState: { ...state.submitState },
    schema: {
      fields: state.schema.fields.map((field) => structuredClone(field)),
      steps: state.schema.steps.map((step) => structuredClone(step)),
    },
    workflow: {
      ...state.workflow,
      stepKeys: [...state.workflow.stepKeys],
      visibleFieldKeys: [...state.workflow.visibleFieldKeys],
      dynamicFieldKeys: [...state.workflow.dynamicFieldKeys],
      conditionalFieldKeys: [...state.workflow.conditionalFieldKeys],
      ...(state.workflow.approvalNodes
        ? { approvalNodes: state.workflow.approvalNodes.map((node) => structuredClone(node)) }
        : {}),
      ...(state.workflow.draft ? { draft: structuredClone(state.workflow.draft) } : {}),
    },
    values: structuredClone(state.values),
    initialValues: structuredClone(state.initialValues),
    fieldErrors: state.fieldErrors.map((error) => ({ ...error })),
    ...(state.lastSubmission ? { lastSubmission: structuredClone(state.lastSubmission) } : {}),
    stats: state.stats.map((stat) => ({ ...stat })),
    sections: state.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
    actions: state.actions.map((action) => ({ ...action })),
    ...(state.accountOperations
      ? { accountOperations: state.accountOperations.map((operation) => ({ ...operation })) }
      : {}),
    ...(state.operationRecords
      ? { operationRecords: state.operationRecords.map((record) => ({ ...record })) }
      : {}),
    ...(state.securityCenter ? { securityCenter: structuredClone(state.securityCenter) } : {}),
    assetLedgerEntries: state.assetLedgerEntries.map((entry) => ({
      ...entry,
      ...(entry.entitlement ? { entitlement: { ...entry.entitlement } } : {}),
    })),
    ...(state.relationList ? { relationList: structuredClone(state.relationList) } : {}),
    ...(state.relationTargets
      ? {
          relationTargets: state.relationTargets.map((target) => ({
            ...target,
            actions: target.actions.map((action) => ({ ...action })),
          })),
        }
      : {}),
  };
}

const accountFormDraftStorageKey = "@minix/account/operation-form-draft/v1";

function createAccountDraftState(input: {
  savedAt: number;
  currentStepKey?: string;
  restored?: boolean;
}): AccountState["workflow"]["draft"] {
  return {
    draftId: "account-operation",
    recoveryKey: accountFormDraftStorageKey,
    lastSavedAt: input.savedAt,
    ...(input.restored ? { restoredAt: Date.now() } : {}),
  };
}

function upsertSectionItem(items: AccountSectionItem[], nextItem: AccountSectionItem): AccountSectionItem[] {
  const existingIndex = items.findIndex((item) => item.key === nextItem.key);
  if (existingIndex === -1) {
    return [...items, nextItem];
  }

  return items.map((item, index) => (index === existingIndex ? nextItem : item));
}

function upsertSection(sections: AccountSection[], nextSection: AccountSection): AccountSection[] {
  const existingIndex = sections.findIndex((section) => section.key === nextSection.key);
  if (existingIndex === -1) {
    return [...sections, nextSection];
  }

  return sections.map((section, index) =>
    index === existingIndex
      ? {
          ...nextSection,
          items: [...nextSection.items],
        }
      : section,
  );
}

function upsertStat(stats: AccountSummaryStat[], nextStat: AccountSummaryStat): AccountSummaryStat[] {
  const existingIndex = stats.findIndex((stat) => stat.key === nextStat.key);
  if (existingIndex === -1) {
    return [...stats, nextStat];
  }

  return stats.map((stat, index) => (index === existingIndex ? nextStat : stat));
}

function describeAuthStatus(session: UserSession): string {
  if (session.authStatus === "guest" || session.identity.anonymous) {
    return "Browsing as guest";
  }

  return session.platform === "wechat" ? "Signed in through WeChat" : "Signed in through H5";
}

function describeSessionState(session: UserSession): string {
  return session.token?.refreshToken
    ? "This device can refresh the session when the access token expires."
    : "This device currently relies on the active access token only.";
}

function buildStateFromSession(baseState: AccountState, session: UserSession): AccountState {
  const nickname = session.profile?.nickname ?? `User ${session.identity.userId.slice(0, 6)}`;
  const authStatusLabel = describeAuthStatus(session);
  const sessionLabel = describeSessionState(session);

  let stats = baseState.stats;
  stats = upsertStat(stats, {
    key: "session",
    label: "Session",
    value: sessionLabel,
    tone: "positive",
  });
  stats = upsertStat(stats, {
    key: "profile",
    label: "Profile",
    value: `${nickname} on ${session.platform}`,
  });

  let sections = baseState.sections;
  sections = upsertSection(sections, {
    key: "identity",
    title: "Identity",
    items: upsertSectionItem(
      upsertSectionItem(
        baseState.sections.find((section) => section.key === "identity")?.items ?? [],
        {
          key: "user-id",
          label: "User ID",
          value: session.identity.userId,
          hint: "Use this id when you need support or cross-device recovery.",
        },
      ),
      {
        key: "nickname",
        label: "Nickname",
        value: nickname,
      },
    ),
  });
  sections = upsertSection(sections, {
    key: "session",
    title: "Session",
    items: [
      {
        key: "auth-status",
        label: "Auth status",
        value: authStatusLabel,
      },
      {
        key: "device-session",
        label: "Session state",
        value: sessionLabel,
      },
    ],
  });

  return {
    ...baseState,
    authenticated: true,
    userId: session.identity.userId,
    nickname,
    avatarUrl: session.profile?.avatarUrl,
    authStatusLabel,
    sessionLabel,
    stats,
    sections,
    selectedActionKey: baseState.selectedActionKey ?? baseState.actions[0]?.key,
  };
}

function createStatusLabel(response: CurrentUserResponse): string {
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

function createRemoteStats(response: CurrentUserResponse): AccountSummaryStat[] {
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
      value: createStatusLabel(response),
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

function createRemoteSections(response: CurrentUserResponse): AccountSection[] {
  const securityCenter = response.securityCenter ?? {
    deviceIdentities: [],
    auditEvents: [],
  };
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

  return sections;
}

function createRelationListSection(relationList: UserRelationList | undefined): AccountSection | undefined {
  if (!relationList || relationList.items.length === 0) {
    return undefined;
  }

  return {
    key: `relation-list-${relationList.kind}`,
    title: `Relationship list: ${relationList.kind}`,
    items: [
      {
        key: `relation-list-${relationList.kind}-summary`,
        label: "List posture",
        value: relationList.summaryLabel ?? `${relationList.pagination.total} items`,
        ...(relationList.availableKinds && relationList.availableKinds.length > 0
          ? { hint: `Available lists: ${relationList.availableKinds.join(", ")}` }
          : {}),
      },
      ...relationList.items.map((item) => ({
        key: `${relationList.kind}-${item.targetUserId}`,
        label: item.displayName,
        value: item.relationshipSummary,
        ...(item.remarkName ? { hint: `Remark: ${item.remarkName}` } : {}),
      })),
    ],
  };
}

function createAssetLedgerSection(entries: UserAssetLedgerEntry[]): AccountSection | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  return {
    key: "asset-ledger",
    title: "Asset history",
    items: entries.map((entry) => ({
      key: entry.ledgerId,
      label: entry.title,
      value: entry.message,
      hint: [
        entry.subject,
        entry.kind,
        entry.entitlement?.label,
        entry.membershipPlanId,
        entry.pointsDelta !== undefined ? `points ${entry.pointsDelta >= 0 ? "+" : ""}${entry.pointsDelta}` : undefined,
        entry.balanceDeltaCents !== undefined
          ? `balance ${(entry.balanceDeltaCents / 100).toFixed(2)} CNY`
          : undefined,
        entry.createdAt,
      ]
        .filter(Boolean)
        .join(" · "),
    })),
  };
}

function createRemoteActions(response: CurrentUserResponse): AccountAction[] {
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

function mergeRemoteProfile(baseState: AccountState, profile: CurrentUserResponse): AccountState {
  const securityCenter = profile.securityCenter ?? {
    deviceIdentities: [],
    auditEvents: [],
  };
  const remoteSections = createRemoteSections(profile);
  const assetLedgerSection = createAssetLedgerSection(baseState.assetLedgerEntries);
  const relationListSection = createRelationListSection(baseState.relationList);
  const remoteStats = createRemoteStats(profile);
  const remoteActions = createRemoteActions(profile);
  const sessionLabel = baseState.sessionLabel ?? "Managed by the current signed-in session.";
  const authStatusLabel = `${baseState.authStatusLabel ?? "Signed in"} · ${createStatusLabel(profile)}`;
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
    accountOperations: profile.accountOperations,
    operationRecords: profile.operationRecords,
    relationTargets: profile.relationTargets,
    stats,
    sections,
    actions: remoteActions,
    transitionFeedback: profile.identityWorkflows.lastWorkflow?.message,
  };
}

function findAvailableOperation(
  operations: AccountOperation[] | undefined,
  kind: AccountOperation["kind"],
): Result<AccountOperation | undefined> {
  const operation = operations?.find((item) => item.kind === kind);
  if (operation && !operation.available) {
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: operation.blockedReason ?? `${operation.label} is unavailable.`,
        recoverable: true,
      },
    };
  }

  return ok(operation);
}

function findAvailableRelationAction(
  relationTargets: UserRelationTarget[] | undefined,
  targetUserId: string,
  kind: UserRelationMutationRequest["action"],
) {
  const target = relationTargets?.find((item) => item.targetUserId === targetUserId);
  const action = target?.actions.find((item) => item.kind === kind);
  if (action && !action.available) {
    return {
      ok: false as const,
      error: {
        code: "FORBIDDEN",
        message: action.blockedReason ?? `${action.label} is unavailable.`,
        recoverable: true,
      },
    };
  }

  return ok({ target, action });
}

function createRelationListRequestPath(input: ListUserRelationsRequest): string {
  const params = new URLSearchParams({
    kind: input.kind,
    ...(input.page ? { page: String(input.page) } : {}),
    ...(input.pageSize ? { pageSize: String(input.pageSize) } : {}),
    ...(input.keyword ? { keyword: input.keyword } : {}),
  });
  return `/account/relations/list?${params.toString()}`;
}

function createAssetHistoryRequestPath(input: ListUserAssetHistoryRequest): string {
  const params = new URLSearchParams({
    ...(input.page ? { page: String(input.page) } : {}),
    ...(input.pageSize ? { pageSize: String(input.pageSize) } : {}),
    ...(input.subject ? { subject: input.subject } : {}),
  });

  return params.size > 0 ? `/account/assets/history?${params.toString()}` : "/account/assets/history";
}

function createAccountOperationValuesFromProfile(
  profile: Pick<CurrentUserResponse, "userProfile"> | undefined,
  values: Partial<AccountOperationFormValues> = {},
): AccountOperationFormValues {
  return createDefaultAccountOperationValues({
    nickname: profile?.userProfile.nickname ?? "",
    region: profile?.userProfile.region ?? "",
    includeBio: Boolean(profile?.userProfile.bio),
    bio: profile?.userProfile.bio ?? "",
    ...values,
  });
}

function createAccountWorkflow(
  values: AccountOperationFormValues,
  currentStepKey?: string,
  operation?: AccountOperation,
  draft?: AccountState["workflow"]["draft"],
) {
  const schema = createAccountFormSchema(values, operation);
  const approvalNodes = createAccountApprovalNodes(values, operation);
  const workflowOptions: Parameters<typeof createFormWorkflowState<AccountOperationFormValues>>[0] = {
    values,
    schema,
    approvalState: values.operationKind === "request_cancellation" ? "pending" : "none",
    ...(currentStepKey ? { currentStepKey } : {}),
    ...(approvalNodes.length > 0 ? { approvalNodes } : {}),
    ...(draft ? { draft } : {}),
  };

  return createFormWorkflowState(workflowOptions);
}

function createAccountFormSchema(values: AccountOperationFormValues, operation?: AccountOperation): FormSchema {
  const fields: FormFieldDefinition[] = [];

  if (values.operationKind === "edit_profile") {
    fields.push(
      { key: "operationKind", label: "Operation", type: "single_select", dynamic: true, stepKey: "profile" },
      { key: "nickname", label: "Nickname", type: "text", required: true, stepKey: "profile" },
      { key: "region", label: "Region", type: "text", stepKey: "profile" },
      { key: "includeBio", label: "Add bio", type: "single_select", dynamic: true, stepKey: "preferences" },
      {
        key: "bio",
        label: "Bio",
        type: "text",
        dynamic: true,
        stepKey: "preferences",
        conditions: [{ field: "includeBio", operator: "truthy" }],
      },
    );
    return {
      fields,
      steps: [
        { key: "profile", label: "Profile" },
        { key: "preferences", label: "Preferences" },
        { key: "confirm", label: "Confirm" },
      ],
    };
  }

  if (values.operationKind === "change_phone") {
    fields.push(
      { key: "operationKind", label: "Operation", type: "single_select", dynamic: true, stepKey: "contact" },
      { key: "phoneNumber", label: "Phone number", type: "text", required: true, stepKey: "contact" },
      { key: "verificationCode", label: "Verification code", type: "text", required: true, stepKey: "verify" },
    );
    if (operation?.verificationRequired) {
      fields.push({
        key: "securityVerificationCode",
        label: "Security verification code",
        type: "text",
        required: true,
        dynamic: true,
        stepKey: "verify",
      });
    }
    if (operation?.riskPrompt) {
      fields.push({
        key: "riskConfirmed",
        label: "Risk confirmation",
        type: "single_select",
        dynamic: true,
        stepKey: "confirm",
      });
    }
    return {
      fields,
      steps: [
        { key: "contact", label: "Contact" },
        { key: "verify", label: "Verify" },
        { key: "confirm", label: "Confirm" },
      ],
    };
  }

  if (values.operationKind === "request_cancellation") {
    fields.push(
      { key: "operationKind", label: "Operation", type: "single_select", dynamic: true, stepKey: "review" },
      { key: "verificationCode", label: "Security verification code", type: "text", required: true, stepKey: "review" },
      { key: "riskConfirmed", label: "Risk confirmation", type: "single_select", dynamic: true, stepKey: "review" },
      { key: "cancellationReason", label: "Cancellation reason", type: "single_select", required: true, dynamic: true, stepKey: "reason" },
      {
        key: "cancellationDetails",
        label: "Cancellation details",
        type: "text",
        dynamic: true,
        stepKey: "reason",
        conditions: [{ field: "cancellationReason", operator: "eq", value: "other" }],
      },
      { key: "confirmCancellation", label: "Confirm cancellation", type: "single_select", dynamic: true, stepKey: "confirm" },
    );
    return {
      fields,
      steps: [
        { key: "review", label: "Review" },
        { key: "reason", label: "Reason" },
        { key: "confirm", label: "Confirm" },
      ],
    };
  }

  return {
    fields,
    steps: [],
  };
}

function createAccountApprovalNodes(values: AccountOperationFormValues, operation?: AccountOperation): FormApprovalNode[] {
  if (values.operationKind !== "request_cancellation") {
    return [];
  }

  return [
    {
      nodeKey: "risk_review",
      label: "Risk review",
      state: operation?.riskPrompt ? "pending" : "not_started",
      assigneeLabel: "Risk Ops",
      comment: operation?.riskPrompt?.message ?? "Cancellation requests are reviewed before the cooling-off window starts.",
    },
    {
      nodeKey: "cooling_off",
      label: "Cooling-off window",
      state: operation?.cooldown?.active ? "pending" : "not_started",
      assigneeLabel: "Account system",
    },
  ];
}

function validateOperationValues(
  values: AccountOperationFormValues,
  operation?: AccountOperation,
): FormValidationError[] {
  const errors: FormValidationError[] = [];

  if (!values.operationKind) {
    errors.push({
      field: "operationKind",
      message: "Choose an account operation before submitting.",
      rule: "required",
      fieldType: "single_select",
      blocking: true,
    });
    return errors;
  }

  if (values.operationKind === "edit_profile") {
    if (!values.nickname.trim()) {
      errors.push({
        field: "nickname",
        message: "Enter a nickname before updating the profile.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }

    if (values.includeBio && !values.bio.trim()) {
      errors.push({
        field: "bio",
        message: "Add a bio or turn off the optional bio field.",
        rule: "cross_field",
        fieldType: "text",
        blocking: true,
      });
    }
  }

  if (values.operationKind === "change_phone") {
    if (!values.phoneNumber.trim()) {
      errors.push({
        field: "phoneNumber",
        message: "Enter the replacement phone number.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }
    if (!values.verificationCode.trim()) {
      errors.push({
        field: "verificationCode",
        message: "Enter the verification code.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }
    if (operation?.verificationRequired && !values.securityVerificationCode.trim()) {
      errors.push({
        field: "securityVerificationCode",
        message: "Enter the current phone security verification code.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }
    if (operation?.riskPrompt && !values.riskConfirmed) {
      errors.push({
        field: "riskConfirmed",
        message: "Acknowledge the recovery impact before changing the bound phone.",
        rule: "cross_field",
        fieldType: "single_select",
        blocking: true,
      });
    }
  }

  if (values.operationKind === "request_cancellation") {
    if (operation?.verificationRequired && !values.verificationCode.trim()) {
      errors.push({
        field: "verificationCode",
        message: "Enter the security verification code.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }
    if (operation?.riskPrompt && !values.riskConfirmed) {
      errors.push({
        field: "riskConfirmed",
        message: "Acknowledge the cancellation risk before continuing.",
        rule: "cross_field",
        fieldType: "single_select",
        blocking: true,
      });
    }
    if (!values.cancellationReason) {
      errors.push({
        field: "cancellationReason",
        message: "Choose a cancellation reason.",
        rule: "required",
        fieldType: "single_select",
        blocking: true,
      });
    }
    if (values.cancellationReason === "other" && !values.cancellationDetails.trim()) {
      errors.push({
        field: "cancellationDetails",
        message: "Describe the cancellation reason before continuing.",
        rule: "cross_field",
        fieldType: "text",
        blocking: true,
      });
    }
    if (!values.confirmCancellation) {
      errors.push({
        field: "confirmCancellation",
        message: "Confirm the cancellation request before submitting.",
        rule: "cross_field",
        fieldType: "single_select",
        blocking: true,
      });
    }
  }

  return errors;
}

export function createAccountController(options: CreateAccountControllerOptions) {
  const {
    kernel,
    loginRouteId,
    settingsRouteId,
    overviewRouteId,
    identityUpgradeRouteId,
    identityBindPhoneRouteId,
    identityMergeRouteId,
    requestPath = "/me",
    authRedirectSource = "account",
    initialState,
  } = options;
  const store = createStore<AccountState>({
    ...cloneState(createDefaultAccountState()),
    ...initialState,
  });

  function applyOperationValues(
    values: AccountOperationFormValues,
    options: {
      dirty?: boolean;
      operationFormOpen?: boolean;
      currentStepKey?: string;
      draft?: AccountState["workflow"]["draft"];
      draftSavedAt?: number;
      phase?: AccountState["submitState"]["phase"];
      preserveResult?: boolean;
    } = {},
  ) {
    const current = store.getState();
    const operation = current.accountOperations?.find((item) => item.kind === values.operationKind);
    const workflow = createAccountWorkflow(
      values,
      options.currentStepKey ?? current.workflow.currentStepKey,
      operation,
      options.draft,
    );
    store.setState({
      dirty: options.dirty ?? current.dirty,
      operationFormOpen: options.operationFormOpen ?? current.operationFormOpen,
      values,
      formValues: structuredClone(values),
      workflow,
      fieldErrors: [],
      validationErrors: [],
      submitState: {
        ...current.submitState,
        phase: options.phase ?? current.submitState.phase,
        ...(options.draftSavedAt !== undefined ? { draftSavedAt: options.draftSavedAt } : {}),
        ...(!options.preserveResult ? { result: undefined } : {}),
      },
    });
  }

  async function routeToOptional(routeId?: AppRouteId) {
    if (!routeId) {
      return ok(undefined);
    }

    return kernel.router.toRoute(routeId);
  }

  async function routeToLogin() {
    if (!loginRouteId) {
      return ok(undefined);
    }

    const current = kernel.router.current();
    return kernel.router.replaceRoute(
      loginRouteId,
      createAuthRedirectParams({
        ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
        ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
        ...(authRedirectSource ? { source: authRedirectSource } : {}),
        reason: "auth-required",
      }),
    );
  }

  async function persistTransitionResponse(response: IdentityTransitionResponse) {
    const existing = await kernel.session.get();
    if (!existing.ok) {
      return existing;
    }

    const persisted = await persistAuthSessionResponse(
      {
        session: kernel.session,
        env: kernel.env,
      },
      response,
      existing.value,
    );
    if (!persisted.ok) {
      return persisted;
    }

    store.setState({
      transitionFeedback: response.identityWorkflow.message,
    });
    return ok(persisted.value);
  }

  async function loadOperationDraft(profile: CurrentUserResponse | undefined) {
    if (!kernel.storage) {
      const values = createAccountOperationValuesFromProfile(profile);
      applyOperationValues(values, {
        dirty: false,
        operationFormOpen: false,
        phase: "idle",
      });
      store.setState({
        initialValues: structuredClone(values),
        initialFormValues: structuredClone(values),
      });
      return;
    }

    const result = await kernel.storage.get<AccountDraftSnapshot>(accountFormDraftStorageKey);
    if (!result.ok || !result.value) {
      const values = createAccountOperationValuesFromProfile(profile);
      applyOperationValues(values, {
        dirty: false,
        operationFormOpen: false,
        phase: "idle",
      });
      store.setState({
        initialValues: structuredClone(values),
        initialFormValues: structuredClone(values),
      });
      return;
    }

    const values = createAccountOperationValuesFromProfile(profile, result.value.values);
    applyOperationValues(values, {
      dirty: true,
      operationFormOpen: Boolean(values.operationKind),
      ...(result.value.currentStepKey ? { currentStepKey: result.value.currentStepKey } : {}),
      draft: createAccountDraftState({
        savedAt: result.value.savedAt,
        ...(result.value.currentStepKey ? { currentStepKey: result.value.currentStepKey } : {}),
        restored: true,
      }),
      draftSavedAt: result.value.savedAt,
      phase: "idle",
    });
    store.setState({
      initialValues: createAccountOperationValuesFromProfile(profile),
      initialFormValues: createAccountOperationValuesFromProfile(profile),
    });
  }

  async function clearOperationDraft() {
    if (!kernel.storage) {
      return ok(undefined);
    }

    const removeResult = await kernel.storage.remove(accountFormDraftStorageKey);
    if (!removeResult.ok) {
      return removeResult;
    }

    return ok(undefined);
  }

  async function loadAssetHistoryIntoState(
    input: ListUserAssetHistoryRequest,
  ): Promise<Result<UserAssetHistoryResponse>> {
    const result = await kernel.request.get<UserAssetHistoryResponse>(createAssetHistoryRequestPath(input));
    if (!result.ok) {
      return result;
    }

    const assetLedgerSection = createAssetLedgerSection(result.value.ledgerEntries);
    store.setState({
      accountSummary: result.value.accountSummary,
      assetLedgerEntries: result.value.ledgerEntries,
      sections: assetLedgerSection ? upsertSection(store.getState().sections, assetLedgerSection) : store.getState().sections,
    });
    return result;
  }

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    async loadInitial() {
      store.setState({
        loading: true,
        errorText: undefined,
        copyFeedback: undefined,
      });

      const sessionResult = await kernel.session.get();
      if (!sessionResult.ok) {
        store.setState({
          loading: false,
          ready: true,
          errorText: sessionResult.error.message,
        });
        return sessionResult;
      }

      const session = sessionResult.value;
      if (!hasActiveSession(session)) {
        store.replaceState({
          ...cloneState(createDefaultAccountState({
            title: store.getState().title,
            ...(store.getState().subtitle ? { subtitle: store.getState().subtitle } : {}),
          })),
          loading: false,
          ready: true,
          authenticated: false,
          errorText: "Sign in is required before account details can load.",
        });
        await routeToLogin();
        return ok(undefined);
      }

      let nextState = buildStateFromSession(store.getState(), session);

      const remoteProfile = await kernel.request.get<CurrentUserResponse>(requestPath);
      if (!remoteProfile.ok) {
        if (remoteProfile.error.code === "UNAUTHORIZED") {
          store.setState({
            loading: false,
            ready: true,
            authenticated: false,
            errorText: "Your account session expired. Sign in again to continue.",
          });
          await routeToLogin();
          return remoteProfile;
        }

        store.replaceState({
          ...nextState,
          loading: false,
          ready: true,
          errorText: remoteProfile.error.message,
        });
        return remoteProfile;
      }

      nextState = mergeRemoteProfile(nextState, remoteProfile.value);
      const profileSeedValues = createAccountOperationValuesFromProfile(remoteProfile.value);
      store.replaceState({
        ...nextState,
        loading: false,
        ready: true,
        errorText: undefined,
        values: profileSeedValues,
        formValues: structuredClone(profileSeedValues),
        initialValues: structuredClone(profileSeedValues),
        initialFormValues: structuredClone(profileSeedValues),
        workflow: createAccountWorkflow(profileSeedValues),
      });
      await loadOperationDraft(remoteProfile.value);
      const assetHistoryResult = await loadAssetHistoryIntoState({ page: 1, pageSize: 5 });
      if (!assetHistoryResult.ok) {
        store.setState({
          transitionFeedback: assetHistoryResult.error.message,
        });
      }
      return ok(undefined);
    },

    async refresh() {
      return this.loadInitial();
    },

    async copyUserId() {
      const current = store.getState();
      if (!current.userId) {
        return ok(undefined);
      }

      if (!kernel.capability) {
        store.setState({
          copyFeedback: "Clipboard is unavailable on this host.",
        });
        return ok(undefined);
      }

      const clipboardStatus = kernel.capability.status("clipboard");
      if (!clipboardStatus.ok || !clipboardStatus.value.available) {
        store.setState({
          copyFeedback: clipboardStatus.ok ? clipboardStatus.value.detail ?? "Clipboard is unavailable on this host." : "Clipboard is unavailable on this host.",
        });
        return ok(undefined);
      }

      const result = await kernel.capability.execute({
        capability: "clipboard",
        action: "writeText",
        payload: { text: current.userId },
      });

      store.setState({
        copyFeedback: result.ok ? "User ID copied for support and recovery." : result.error.message,
      });
      return result as Result<unknown>;
    },

    async goToSettings() {
      return routeToOptional(settingsRouteId);
    },

    async goToOverview() {
      return routeToOptional(overviewRouteId);
    },

    async goToLogin() {
      return routeToLogin();
    },

    async goToIdentityUpgrade() {
      return routeToOptional(identityUpgradeRouteId);
    },

    async goToPhoneBinding() {
      return routeToOptional(identityBindPhoneRouteId);
    },

    async goToIdentityMerge() {
      return routeToOptional(identityMergeRouteId);
    },

    openOperationForm(operationKind: AccountOperation["kind"]) {
      const currentProfile = store.getState().userProfile;
      const nextValues = createAccountOperationValuesFromProfile(
        currentProfile ? { userProfile: currentProfile } : undefined,
        {
          ...store.getState().values,
          operationKind,
        },
      );
      applyOperationValues(nextValues, {
        dirty: false,
        operationFormOpen: true,
        phase: "idle",
      });
      return ok(undefined);
    },

    setOperationStep(stepKey: string) {
      const workflow = store.getState().workflow;
      if (!workflow.stepKeys.includes(stepKey)) {
        return ok(undefined);
      }

      store.setState({
        workflow: {
          ...workflow,
          currentStepKey: stepKey,
        },
      });
      return ok(undefined);
    },

    updateOperationValues(values: Partial<AccountOperationFormValues>) {
      const nextValues = {
        ...store.getState().values,
        ...values,
      };
      applyOperationValues(nextValues, {
        dirty: true,
        operationFormOpen: true,
        phase: store.getState().submitState.phase === "submitted" ? "idle" : store.getState().submitState.phase,
      });
      return ok(undefined);
    },

    validateOperationForm() {
      const current = store.getState();
      const operation = current.accountOperations?.find((item) => item.kind === current.values.operationKind);
      const errors = validateOperationValues(current.values, operation);
      store.setState({
        fieldErrors: errors,
        validationErrors: errors,
        errorText: errors.length > 0 ? "Please complete the required account operation fields." : undefined,
        submitState: {
          ...store.getState().submitState,
          phase: errors.length > 0 ? "failed" : "idle",
        },
      });
      return errors;
    },

    async saveOperationDraft() {
      if (!kernel.storage) {
        store.setState({
          transitionFeedback: "Account operation drafts are unavailable on this host.",
          submitState: {
            ...store.getState().submitState,
            phase: "failed",
          },
        });
        return ok(undefined);
      }

      const snapshot: AccountDraftSnapshot = {
        savedAt: Date.now(),
        values: structuredClone(store.getState().values),
        ...(store.getState().workflow.currentStepKey ? { currentStepKey: store.getState().workflow.currentStepKey } : {}),
      };
      const submissionKey = createFormSubmissionKey("account-operation", "draft", snapshot.values);
      const submissionState = beginFormSubmit(store.getState().submitState, {
        mode: "draft",
        submissionKey,
      });
      if (submissionState.blocked) {
        store.setState({
          transitionFeedback: "This draft is already saved.",
          submitState: submissionState.submitState,
        });
        return ok(undefined);
      }

      store.setState({
        submitState: submissionState.submitState,
      });
      const result = await kernel.storage.set(accountFormDraftStorageKey, snapshot);
      if (!result.ok) {
        store.setState({
          errorText: result.error.message,
          submitState: {
            ...store.getState().submitState,
            phase: "failed",
          },
        });
        return result;
      }

      const nextSubmitState = finalizeFormSubmit(store.getState().submitState, {
        mode: "draft",
        submissionKey,
        submittedAt: snapshot.savedAt,
        draftSavedAt: snapshot.savedAt,
      });
      store.setState({
        dirty: true,
        workflow: createAccountWorkflow(
          store.getState().values,
          store.getState().workflow.currentStepKey,
          store.getState().accountOperations?.find((item) => item.kind === store.getState().values.operationKind),
          createAccountDraftState({
            savedAt: snapshot.savedAt,
            ...(snapshot.currentStepKey ? { currentStepKey: snapshot.currentStepKey } : {}),
          }),
        ),
        submitState: nextSubmitState,
        transitionFeedback: "Account operation draft saved.",
      });
      return ok(undefined);
    },

    async discardOperationDraft() {
      await clearOperationDraft();
      const currentProfile = store.getState().userProfile;
      const nextValues = createAccountOperationValuesFromProfile(
        currentProfile ? { userProfile: currentProfile } : undefined,
      );
      applyOperationValues(nextValues, {
        dirty: false,
        operationFormOpen: false,
        phase: "idle",
      });
      store.setState({
        initialValues: structuredClone(nextValues),
        initialFormValues: structuredClone(nextValues),
        transitionFeedback: "Account operation draft discarded.",
      });
      return ok(undefined);
    },

    async submitOperationForm() {
      const errors = this.validateOperationForm();
      if (errors.length > 0) {
        return ok(undefined);
      }

      const values = store.getState().values;
      const submissionKey = createFormSubmissionKey("account-operation", "submit", values);
      const submissionState = beginFormSubmit(store.getState().submitState, {
        mode: "submit",
        submissionKey,
      });
      if (submissionState.blocked) {
        store.setState({
          transitionFeedback: "This account operation was already submitted.",
          submitState: submissionState.submitState,
        });
        return ok(undefined);
      }

      store.setState({
        submitState: submissionState.submitState,
      });

      let result: Result<unknown>;
      if (values.operationKind === "edit_profile") {
        result = await this.updateProfile({
          nickname: values.nickname,
          region: values.region,
          ...(values.includeBio ? { bio: values.bio } : { bio: "" }),
        });
      } else if (values.operationKind === "change_phone") {
        result = await this.changePhone({
          phoneNumber: values.phoneNumber,
          verificationCode: values.verificationCode,
          securityVerificationCode: values.securityVerificationCode,
          riskConfirmed: values.riskConfirmed,
        });
      } else if (values.operationKind === "request_cancellation") {
        result = await this.requestCancellation({
          action: "request",
          confirm: true,
          verificationCode: values.verificationCode,
          riskConfirmed: values.riskConfirmed,
          ...(values.cancellationReason ? { reason: values.cancellationReason } : {}),
          ...(values.cancellationDetails ? { details: values.cancellationDetails } : {}),
        });
      } else {
        result = ok(undefined);
      }

      if (!result.ok) {
        store.setState({
          submitState: {
            ...store.getState().submitState,
            phase: "failed",
          },
        });
        return result;
      }

      const submittedAt = Date.now();
      await clearOperationDraft();
      const currentProfile = store.getState().userProfile;
      const resetValues = createAccountOperationValuesFromProfile(
        currentProfile ? { userProfile: currentProfile } : undefined,
      );
      applyOperationValues(resetValues, {
        dirty: false,
        operationFormOpen: false,
        phase: "submitted",
      });
      store.setState({
        initialValues: structuredClone(resetValues),
        initialFormValues: structuredClone(resetValues),
        lastSubmission: {
          submittedAt,
          value: result.value,
        },
        submitState: finalizeFormSubmit(store.getState().submitState, {
          mode: "submit",
          submissionKey,
          submittedAt,
          result: result.value,
        }),
      });
      return result;
    },

    async submitGuestUpgrade(input: IdentityUpgradeRequest) {
      const result = await kernel.request.post<IdentityTransitionResponse>("/auth/identity/upgrade", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const persisted = await persistTransitionResponse(result.value);
      if (!persisted.ok) {
        store.setState({
          transitionFeedback: persisted.error.message,
        });
        return persisted;
      }

      return this.loadInitial();
    },

    async submitPhoneBinding(input: IdentityBindPhoneRequest) {
      const result = await kernel.request.post<IdentityTransitionResponse>("/auth/identity/bind-phone", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const persisted = await persistTransitionResponse(result.value);
      if (!persisted.ok) {
        store.setState({
          transitionFeedback: persisted.error.message,
        });
        return persisted;
      }

      return this.loadInitial();
    },

    async updateProfile(input: UpdateUserProfileRequest) {
      const available = findAvailableOperation(store.getState().accountOperations, "edit_profile");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/profile", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async changePhone(input: ChangeBoundPhoneRequest) {
      const available = findAvailableOperation(store.getState().accountOperations, "change_phone");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/change-phone", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async unbindWechat(input: AccountUnbindRequest = { provider: "wechat" }) {
      const available = findAvailableOperation(store.getState().accountOperations, "unbind_wechat");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/unbind", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async unlinkProvider(input: AccountUnbindRequest) {
      const providerIdentity = store
        .getState()
        .accountSummary?.providerIdentities?.find(
          (item) => item.provider === input.provider && item.providerUserId === input.providerUserId,
        );
      const unlinkAction = providerIdentity?.actions.find((action) => action.kind === "unlink");
      if (unlinkAction && !unlinkAction.available) {
        const message = unlinkAction.blockedReason ?? `${providerIdentity?.providerLabel ?? "Provider"} cannot be unlinked right now.`;
        store.setState({
          transitionFeedback: message,
        });
        return ok(undefined);
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/provider/unlink", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async revokeProvider(input: AccountProviderRevokeRequest) {
      const providerIdentity = store
        .getState()
        .accountSummary?.providerIdentities?.find(
          (item) => item.provider === input.provider && item.providerUserId === input.providerUserId,
        );
      const revokeAction = providerIdentity?.actions.find((action) => action.kind === "revoke");
      if (revokeAction && !revokeAction.available) {
        const message = revokeAction.blockedReason ?? `${providerIdentity?.providerLabel ?? "Provider"} cannot be revoked right now.`;
        store.setState({
          transitionFeedback: message,
        });
        return ok(undefined);
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/provider/revoke", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async requestCancellation(input: AccountCancellationRequest = { action: "request", confirm: true }) {
      const available = findAvailableOperation(store.getState().accountOperations, "request_cancellation");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/cancellation", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async revokeCancellation(input: AccountCancellationRequest = { action: "revoke", confirm: true }) {
      const available = findAvailableOperation(store.getState().accountOperations, "revoke_cancellation");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/cancellation", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async loadRelationList(input: ListUserRelationsRequest) {
      const result = await kernel.request.get<UserRelationListResponse>(createRelationListRequestPath(input));
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const relationListSection = createRelationListSection(result.value.relationList);
      store.setState({
        accountSummary: result.value.accountSummary,
        userStatus: result.value.userStatus,
        relationList: result.value.relationList,
        activeRelationListKind: result.value.relationList.kind,
        relationKeyword: result.value.relationList.keyword ?? "",
        sections: relationListSection
          ? upsertSection(store.getState().sections, relationListSection)
          : store.getState().sections,
      });
      return result;
    },

    async loadAssetHistory(input: ListUserAssetHistoryRequest) {
      const result = await loadAssetHistoryIntoState(input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
      }
      return result;
    },

    async applyRelationAction(input: UserRelationMutationRequest) {
      const available = findAvailableRelationAction(store.getState().relationTargets, input.targetUserId, input.action);
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const state = store.getState();
      const result = await kernel.request.post<UserRelationMutationResponse>("/account/relations", {
        ...input,
        ...(state.activeRelationListKind ? { listKind: state.activeRelationListKind } : {}),
        ...(state.relationList?.pagination.page ? { page: state.relationList.pagination.page } : {}),
        ...(state.relationList?.pagination.pageSize ? { pageSize: state.relationList.pagination.pageSize } : {}),
        ...(state.relationKeyword ? { keyword: state.relationKeyword } : {}),
      });
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const relationListSection = createRelationListSection(result.value.relationList);
      store.setState({
        accountSummary: result.value.accountSummary,
        userStatus: result.value.userStatus,
        relationTargets: result.value.relationTargets,
        ...(result.value.relationList ? { relationList: result.value.relationList } : {}),
        ...(result.value.relationList ? { activeRelationListKind: result.value.relationList.kind } : {}),
        ...(result.value.relationList
          ? {
              sections: relationListSection
                ? upsertSection(store.getState().sections, relationListSection)
                : store.getState().sections,
            }
          : {}),
        transitionFeedback: result.value.transitionMessage,
      });
      return ok(undefined);
    },

    async confirmIdentityMerge(input?: Partial<IdentityMergeRequest>) {
      const targetUserId = input?.targetUserId ?? store.getState().identityWorkflows?.pendingWorkflow?.targetUserId;
      if (!targetUserId) {
        store.setState({
          transitionFeedback: "A merge target is required before confirming the account merge.",
        });
        return ok(undefined);
      }

      const result = await kernel.request.post<IdentityTransitionResponse>("/auth/identity/merge", {
        targetUserId,
        confirm: true,
        ...(input?.workflowKind ? { workflowKind: input.workflowKind } : {}),
        ...(input?.redirectTarget ? { redirectTarget: input.redirectTarget } : {}),
      } satisfies IdentityMergeRequest);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const persisted = await persistTransitionResponse(result.value);
      if (!persisted.ok) {
        store.setState({
          transitionFeedback: persisted.error.message,
        });
        return persisted;
      }

      return this.loadInitial();
    },
  };
}
