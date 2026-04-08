import type { AccountSummary, IdentityWorkflowSummary, UserProfile, UserStatus } from "@minix/contracts";

export interface AccountSummaryStat {
  key: string;
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "caution";
}

export interface AccountSectionItem {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

export interface AccountSection {
  key: string;
  title: string;
  items: AccountSectionItem[];
}

export interface AccountAction {
  key: string;
  label: string;
  emphasis?: "primary" | "secondary";
}

export interface AccountState {
  title: string;
  subtitle: string;
  ready: boolean;
  loading: boolean;
  authenticated: boolean;
  errorText: string | undefined;
  copyFeedback: string | undefined;
  userId: string | undefined;
  nickname: string | undefined;
  avatarUrl: string | undefined;
  userProfile?: UserProfile;
  accountSummary?: AccountSummary;
  userStatus?: UserStatus;
  identityWorkflows?: IdentityWorkflowSummary;
  sessionLabel: string | undefined;
  authStatusLabel: string | undefined;
  transitionFeedback: string | undefined;
  selectedActionKey: string | undefined;
  stats: AccountSummaryStat[];
  sections: AccountSection[];
  actions: AccountAction[];
}

export interface CreateAccountStateOptions {
  title: string;
  subtitle: string;
  stats?: AccountSummaryStat[];
  sections?: AccountSection[];
  actions?: AccountAction[];
}

export interface CreateDefaultAccountStateOptions {
  title?: string;
  subtitle?: string;
}

function cloneStats(stats: AccountSummaryStat[]): AccountSummaryStat[] {
  return stats.map((stat) => ({ ...stat }));
}

function cloneSections(sections: AccountSection[]): AccountSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item })),
  }));
}

function cloneActions(actions: AccountAction[]): AccountAction[] {
  return actions.map((action) => ({ ...action }));
}

export function createAccountState(options: CreateAccountStateOptions): AccountState {
  return {
    title: options.title,
    subtitle: options.subtitle,
    ready: false,
    loading: false,
    authenticated: false,
    errorText: undefined,
    copyFeedback: undefined,
    userId: undefined,
    nickname: undefined,
    avatarUrl: undefined,
    sessionLabel: undefined,
    authStatusLabel: undefined,
    transitionFeedback: undefined,
    selectedActionKey: undefined,
    stats: cloneStats(options.stats ?? []),
    sections: cloneSections(options.sections ?? []),
    actions: cloneActions(
      options.actions ?? [
        {
          key: "copy-user-id",
          label: "Copy user id",
          emphasis: "secondary",
        },
      ],
    ),
  };
}

export function createDefaultAccountState(options: CreateDefaultAccountStateOptions = {}): AccountState {
  return createAccountState({
    title: options.title ?? "Account",
    subtitle: options.subtitle ?? "Session, profile, and recovery controls for the current signed-in user.",
    stats: [
      {
        key: "session",
        label: "Session",
        value: "Waiting for sign-in",
      },
      {
        key: "profile",
        label: "Profile",
        value: "No profile loaded yet",
      },
    ],
    sections: [
      {
        key: "identity",
        title: "Identity",
        items: [
          {
            key: "user-id",
            label: "User ID",
            value: "Unavailable",
          },
          {
            key: "nickname",
            label: "Nickname",
            value: "Guest",
          },
        ],
      },
      {
        key: "session",
        title: "Session",
        items: [
          {
            key: "auth-status",
            label: "Auth status",
            value: "Signed out",
          },
          {
            key: "device-session",
            label: "Session state",
            value: "This device is waiting for sign-in.",
          },
        ],
      },
    ],
  });
}
