export interface ProfileSummaryStat {
  key: string;
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "caution";
}

export interface ProfileAction {
  key: string;
  label: string;
  emphasis?: "primary" | "secondary";
}

export interface ProfileSectionItem {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

export interface ProfileSection {
  key: string;
  title: string;
  items: ProfileSectionItem[];
}

export interface ProfilePageState {
  title: string;
  subtitle: string | undefined;
  ready: boolean;
  loading: boolean;
  authenticated: boolean;
  errorCode: string | undefined;
  errorText: string | undefined;
  userId: string | undefined;
  displayName: string | undefined;
  avatarUrl: string | undefined;
  selectedActionKey: string | undefined;
  stats: ProfileSummaryStat[];
  sections: ProfileSection[];
  actions: ProfileAction[];
}

export interface CreateProfilePageStateOptions {
  title: string;
  subtitle?: string;
  stats?: ProfileSummaryStat[];
  sections?: ProfileSection[];
  actions?: ProfileAction[];
}

export interface CreateDefaultProfilePageStateOptions {
  title?: string;
  subtitle?: string;
}

export function createProfilePageState(options: CreateProfilePageStateOptions): ProfilePageState {
  const actions = cloneStateSnapshotArray(
    options.actions ?? [
      {
        key: "open-settings",
        label: "Open settings",
        emphasis: "secondary",
      },
    ],
  );

  return {
    title: options.title,
    subtitle: options.subtitle,
    ready: false,
    loading: false,
    authenticated: false,
    errorCode: undefined,
    errorText: undefined,
    userId: undefined,
    displayName: undefined,
    avatarUrl: undefined,
    selectedActionKey: actions[0]?.key,
    stats: cloneStateSnapshotArray(options.stats ?? []),
    sections: cloneStateSnapshotArray(options.sections ?? []),
    actions,
  };
}

export function createDefaultProfilePageState(
  options: CreateDefaultProfilePageStateOptions = {},
): ProfilePageState {
  return createProfilePageState({
    title: options.title ?? "Profile",
    subtitle: options.subtitle ?? "Identity, session status, and recovery actions for the current user.",
    stats: [
      {
        key: "identity",
        label: "Identity",
        value: "Waiting for sign-in",
      },
    ],
    sections: [
      {
        key: "session",
        title: "Session",
        items: [
          {
            key: "status",
            label: "Status",
            value: "Signed out",
          },
        ],
      },
    ],
  });
}
import { cloneStateSnapshotArray } from "../store/snapshot";
