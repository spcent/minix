import {
  createAuthRedirectParams,
  createStore,
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
  AccountUnbindRequest,
  AppRouteId,
  ChangeBoundPhoneRequest,
  CurrentUserResponse,
  IdentityBindPhoneRequest,
  IdentityMergeRequest,
  IdentityTransitionResponse,
  IdentityUpgradeRequest,
  UpdateUserProfileRequest,
  UserRelationMutationRequest,
  UserRelationMutationResponse,
  UserRelationTarget,
} from "@minix/contracts";

import {
  createDefaultAccountState,
  type AccountAction,
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
    stats: state.stats.map((stat) => ({ ...stat })),
    sections: state.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
    actions: state.actions.map((action) => ({ ...action })),
    ...(state.accountOperations
      ? { accountOperations: state.accountOperations.map((operation) => ({ ...operation })) }
      : {}),
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
  ];
}

function createRemoteSections(response: CurrentUserResponse): AccountSection[] {
  const sections: AccountSection[] = [
    {
      key: "identity",
      title: "Identity",
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
          key: "bio",
          label: "Bio",
          value: response.userProfile.bio ?? "Not set",
        },
      ],
    },
    {
      key: "account",
      title: "Account",
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
      ],
    },
    {
      key: "assets",
      title: "Assets",
      items: [
        {
          key: "level",
          label: "Level",
          value: String(response.accountSummary.assets.level),
        },
        {
          key: "entitlements",
          label: "Entitlements",
          value: response.accountSummary.assets.entitlementLabels.join(", ") || "None",
        },
        {
          key: "balance",
          label: "Balance placeholder",
          value: `${(response.accountSummary.assets.balanceCents / 100).toFixed(2)} CNY`,
        },
      ],
    },
    {
      key: "relations",
      title: "Relations",
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

  if (response.relationTargets.length > 0) {
    sections.push({
      key: "relation-targets",
      title: "Relation actions",
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
    response.identityWorkflows.mergePending
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
      ],
    });
  }

  return sections;
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
  const remoteSections = createRemoteSections(profile);
  const remoteStats = createRemoteStats(profile);
  const remoteActions = createRemoteActions(profile);
  const sessionLabel = baseState.sessionLabel ?? "Managed by the current signed-in session.";
  const authStatusLabel = `${baseState.authStatusLabel ?? "Signed in"} · ${createStatusLabel(profile)}`;

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
    accountOperations: profile.accountOperations,
    relationTargets: profile.relationTargets,
    stats: remoteStats,
    sections: remoteSections,
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

export function createAccountController(options: CreateAccountControllerOptions) {
  const {
    kernel,
    loginRouteId,
    settingsRouteId,
    overviewRouteId,
    requestPath = "/me",
    authRedirectSource = "account",
    initialState,
  } = options;
  const store = createStore<AccountState>({
    ...cloneState(createDefaultAccountState()),
    ...initialState,
  });

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
            subtitle: store.getState().subtitle,
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
      store.replaceState({
        ...nextState,
        loading: false,
        ready: true,
        errorText: undefined,
      });
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
      if (!clipboardStatus.ok || !clipboardStatus.value) {
        store.setState({
          copyFeedback: "Clipboard is unavailable on this host.",
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

    async requestCancellation(input: AccountCancellationRequest = { confirm: true }) {
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

    async applyRelationAction(input: UserRelationMutationRequest) {
      const available = findAvailableRelationAction(store.getState().relationTargets, input.targetUserId, input.action);
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<UserRelationMutationResponse>("/account/relations", input);
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
