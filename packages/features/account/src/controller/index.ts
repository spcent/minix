import { createStore, ok, type AppKernel, type Result, type UserSession } from "@minix/core";
import { type AppRouteId } from "@minix/contracts";

import {
  createDefaultAccountState,
  type AccountAction,
  type AccountSection,
  type AccountSectionItem,
  type AccountState,
  type AccountSummaryStat,
} from "../model";

export interface AccountProfileResponse {
  nickname?: string;
  avatarUrl?: string;
  subtitle?: string;
  sessionLabel?: string;
  authStatusLabel?: string;
  stats?: AccountSummaryStat[];
  sections?: AccountSection[];
  actions?: AccountAction[];
}

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

function mergeRemoteProfile(baseState: AccountState, profile: AccountProfileResponse): AccountState {
  return {
    ...baseState,
    ...(profile.nickname ? { nickname: profile.nickname } : {}),
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    ...(profile.subtitle ? { subtitle: profile.subtitle } : {}),
    ...(profile.sessionLabel ? { sessionLabel: profile.sessionLabel } : {}),
    ...(profile.authStatusLabel ? { authStatusLabel: profile.authStatusLabel } : {}),
    ...(profile.stats ? { stats: profile.stats.map((stat) => ({ ...stat })) } : {}),
    ...(profile.sections ? { sections: profile.sections.map((section) => ({ ...section, items: section.items.map((item) => ({ ...item })) })) } : {}),
    ...(profile.actions ? { actions: profile.actions.map((action) => ({ ...action })) } : {}),
  };
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

    return kernel.router.replaceRoute(loginRouteId, {
      from: authRedirectSource,
      reason: "auth-required",
    });
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

      const remoteProfile = await kernel.request.get<AccountProfileResponse>(requestPath);
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
  };
}
