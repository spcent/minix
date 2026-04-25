import type {
  AccountOperation,
  AccountOperationKind,
  AccountOperationRecord,
  AccountSummary,
  IdentityWorkflowSummary,
  SecurityCenter,
  UserAccountWorkspaceSummary,
  UserAssetLedgerEntry,
  UserRelationList,
  UserRelationListKind,
  UserProfile,
  UserRelationTarget,
  UserStatus,
} from "@minix/contracts";
import { cloneStateSnapshotArray, createDefaultFormPageState, type FormPageState } from "@minix/core";

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

export interface AccountOperationFormValues extends Record<string, unknown> {
  operationKind: AccountOperationKind | "";
  nickname: string;
  region: string;
  includeBio: boolean;
  bio: string;
  phoneNumber: string;
  verificationCode: string;
  securityVerificationCode: string;
  riskConfirmed: boolean;
  cancellationReason: "privacy" | "switching" | "other" | "";
  cancellationDetails: string;
  confirmCancellation: boolean;
}

export interface AccountDraftSnapshot {
  savedAt: number;
  values: AccountOperationFormValues;
  currentStepKey?: string;
}

export type AccountState = FormPageState<AccountOperationFormValues, unknown> & {
  title: string;
  subtitle: string;
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
  securityCenter?: SecurityCenter;
  accountWorkspaceSummary?: UserAccountWorkspaceSummary;
  accountOperations?: AccountOperation[];
  operationRecords?: AccountOperationRecord[];
  assetLedgerEntries: UserAssetLedgerEntry[];
  relationTargets?: UserRelationTarget[];
  activeRelationListKind: UserRelationListKind | undefined;
  relationList?: UserRelationList;
  relationKeyword: string;
  sessionLabel: string | undefined;
  authStatusLabel: string | undefined;
  transitionFeedback: string | undefined;
  selectedActionKey: string | undefined;
  operationFormOpen: boolean;
  stats: AccountSummaryStat[];
  sections: AccountSection[];
  actions: AccountAction[];
};

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

export function createDefaultAccountOperationValues(
  values: Partial<AccountOperationFormValues> = {},
): AccountOperationFormValues {
  return {
    operationKind: values.operationKind ?? "",
    nickname: values.nickname ?? "",
    region: values.region ?? "",
    includeBio: values.includeBio ?? false,
    bio: values.bio ?? "",
    phoneNumber: values.phoneNumber ?? "",
    verificationCode: values.verificationCode ?? "",
    securityVerificationCode: values.securityVerificationCode ?? "",
    riskConfirmed: values.riskConfirmed ?? false,
    cancellationReason: values.cancellationReason ?? "",
    cancellationDetails: values.cancellationDetails ?? "",
    confirmCancellation: values.confirmCancellation ?? false,
  };
}

export function createAccountState(options: CreateAccountStateOptions): AccountState {
  return {
    ...createDefaultFormPageState<AccountOperationFormValues>({
      title: options.title,
      subtitle: options.subtitle,
      values: createDefaultAccountOperationValues(),
      submitState: {
        draftCapable: true,
      },
    }),
    title: options.title,
    subtitle: options.subtitle,
    authenticated: false,
    copyFeedback: undefined,
    userId: undefined,
    nickname: undefined,
    avatarUrl: undefined,
    sessionLabel: undefined,
    authStatusLabel: undefined,
    transitionFeedback: undefined,
    selectedActionKey: undefined,
    operationFormOpen: false,
    activeRelationListKind: undefined,
    relationKeyword: "",
    assetLedgerEntries: [],
    stats: cloneStateSnapshotArray(options.stats ?? []),
    sections: cloneStateSnapshotArray(options.sections ?? []),
    actions: cloneStateSnapshotArray(
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
    subtitle:
      options.subtitle ?? "Profile, bindings, assets, and relationship controls for the current signed-in user.",
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
