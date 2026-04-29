import type { SettingsPageModel } from "@minix/core";

export interface CreateSettingsPageModelOptions {
  title: string;
  sectionKey: string;
  logoutLabel: string;
  logoutValue: string;
}

export interface CreateDefaultSettingsPageModelOptions {
  title?: string;
  sectionKey?: string;
  logoutLabel?: string;
  logoutValue?: string;
}

export type NovelReadingSettingsSurface = "h5" | "wechat";

export function createSettingsPageModel(options: CreateSettingsPageModelOptions): SettingsPageModel {
  return {
    title: options.title,
    sections: [
      {
        key: options.sectionKey,
        items: [
          {
            key: "logout",
            label: options.logoutLabel,
            type: "text",
            value: options.logoutValue,
          },
        ],
      },
    ],
  };
}

export function createDefaultSettingsPageModel(
  options: CreateDefaultSettingsPageModelOptions = {},
): SettingsPageModel {
  return createSettingsPageModel({
    title: options.title ?? "Settings",
    sectionKey: options.sectionKey ?? "account",
    logoutLabel: options.logoutLabel ?? "Logout",
    logoutValue: options.logoutValue ?? "Sign out",
  });
}

export function createMinuteEnglishSettingsPageModel(): SettingsPageModel {
  return {
    title: "Learning Preferences",
    sections: [
      {
        key: "study-profile",
        title: "Study Profile",
        items: [
          { key: "level", label: "Level", type: "text", value: "A2 to B1" },
          { key: "goal", label: "Goal", type: "text", value: "Speak confidently in daily situations" },
          { key: "plan", label: "Plan", type: "text", value: "10 minutes every weekday" },
          { key: "focus", label: "Focus", type: "text", value: "Vocabulary, listening, and speaking" },
        ],
      },
      {
        key: "account",
        title: "Account",
        items: [
          {
            key: "session",
            label: "Session",
            type: "text",
            value: "Protected pages unlock after sign-in on this device",
          },
          { key: "progress", label: "Progress", type: "text", value: "Saved on this device and restored when you return" },
        ],
      },
    ],
  };
}

export function createNovelReadingSettingsPageModel(surface: NovelReadingSettingsSurface): SettingsPageModel {
  const isWechat = surface === "wechat";

  return {
    title: "Reading Center",
    sections: [
      {
        key: "reading-profile",
        title: "Reading Profile",
        items: [
          {
            key: "membership",
            label: "Membership Rhythm",
            type: "text",
            value: isWechat ? "Quarterly cadence for following premium serials" : "Quarterly cadence for premium serial continuity",
          },
          {
            key: "focus",
            label: "Current Focus",
            type: "text",
            value: isWechat ? "Mystery, court drama, and one active frontlist title" : "Mystery, court drama, and slow-burn frontlist titles",
          },
          {
            key: "session-goal",
            label: "Session Goal",
            type: "text",
            value: isWechat ? "One short evening session with resume-first navigation" : "25 minutes each evening with one active title in focus",
          },
        ],
      },
      {
        key: "display-defaults",
        title: "Display Defaults",
        items: [
          {
            key: "theme",
            label: "Reader Theme",
            type: "text",
            value: isWechat ? "Paper contrast for calmer long reading" : "Paper with warm contrast",
          },
          {
            key: "mode",
            label: "Reading Mode",
            type: "text",
            value: isWechat ? "Scroll for browsing, page mode for focused chapters" : "Scroll for archive browsing, page mode for focused sessions",
          },
          {
            key: "font-scale",
            label: "Font Scale",
            type: "text",
            value: isWechat ? "Comfort size at 110%" : "Comfort reading at 110%",
          },
          {
            key: "night-mode-default",
            label: "Night Mode Default",
            type: "text",
            value: "Keep night mode manual so the stored reader theme stays in charge",
          },
        ],
      },
      {
        key: "continuity",
        title: "Reading Continuity",
        items: [
          {
            key: "resume",
            label: "Resume Point",
            type: "text",
            value: isWechat
              ? "Return to the last saved chapter before reopening the catalog trail"
              : "Always reopen the latest saved chapter before showing the title page",
          },
          {
            key: "shelf-order",
            label: "Shelf Priority",
            type: "text",
            value: isWechat ? "Recent reading first, then update queue, then completed runs" : "Recent reading first, then active updates, then completed titles",
          },
          {
            key: "digest",
            label: "Release Digest",
            type: "text",
            value: isWechat ? "Quiet weekly recap for followed stories" : "Quiet weekly roundup for followed serials",
          },
          {
            key: "reminders",
            label: "Reading Reminders",
            type: "text",
            value: "Send a quiet nightly reminder when an active reading session is still open",
          },
        ],
      },
      {
        key: "account",
        title: "Account & Sync",
        items: [
          { key: "session", label: "Session", type: "text", value: isWechat ? "Signed in on this device" : "Signed in on this browser" },
          {
            key: "sync",
            label: "Sync",
            type: "text",
            value: "Reading progress and shelf state stay aligned across novel hosts",
          },
          { key: "signout", label: "Sign-Out Action", type: "text", value: "Clear the local session and return to home" },
        ],
      },
    ],
  };
}
