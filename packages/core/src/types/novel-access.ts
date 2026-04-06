export interface NovelAccessSignals {
  isFree: boolean;
  isTrial: boolean;
  requiresMembership: boolean;
  isPurchased?: boolean;
}

export interface NovelAccessPresentation {
  accessState: "open" | "trial" | "locked";
  accessBadgeLabel: string;
  accessSummary: string;
  primaryActionLabel: string;
  startActionLabel: string;
  membershipActionLabel: string;
}

export function deriveNovelAccessPresentation(signals: NovelAccessSignals): NovelAccessPresentation {
  const isUnlocked = signals.isFree || signals.isPurchased || !signals.requiresMembership;

  if (!isUnlocked && signals.isTrial) {
    return {
      accessState: "trial",
      accessBadgeLabel: "Trial preview",
      accessSummary: "Trial reading is available before the full membership boundary takes over.",
      primaryActionLabel: "Continue trial reading",
      startActionLabel: "Start trial from first chapter",
      membershipActionLabel: "Unlock after trial",
    };
  }

  if (!isUnlocked) {
    return {
      accessState: "locked",
      accessBadgeLabel: "Membership locked",
      accessSummary: "Membership is required before this title or chapter can continue.",
      primaryActionLabel: "Open membership path",
      startActionLabel: "Inspect first chapter route",
      membershipActionLabel: "Unlock full title",
    };
  }

  if (signals.requiresMembership && signals.isPurchased) {
    return {
      accessState: "open",
      accessBadgeLabel: "Membership unlocked",
      accessSummary: "Premium access is already resolved, so the next action should return directly into reading.",
      primaryActionLabel: "Continue reading",
      startActionLabel: "Restart from first chapter",
      membershipActionLabel: "Membership active",
    };
  }

  return {
    accessState: "open",
    accessBadgeLabel: signals.isFree ? "Open reading" : "Available now",
    accessSummary: "This title is open to read without an additional membership step.",
    primaryActionLabel: "Continue reading",
    startActionLabel: "Start from first chapter",
    membershipActionLabel: "Access available",
  };
}
