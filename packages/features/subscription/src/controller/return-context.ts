import type { AppKernel, Store } from "@minix/core";
import type { MembershipOverview } from "@minix/contracts";

import type { SubscriptionState } from "../model";

export function resolveSubscriptionRouteParam(
  kernel: AppKernel,
  store: Store<SubscriptionState>,
  key: "source" | "novelId" | "chapterId",
): string | undefined {
  const current = kernel.router.current();
  const value = current.ok ? current.value?.params?.[key] : undefined;
  return typeof value === "string" ? value : store.getState()[key];
}

export function deriveReturnTarget(source?: string) {
  if (source === "reader") {
    return "reader" as const;
  }

  if (source === "toc") {
    return "toc" as const;
  }

  if (source === "detail") {
    return "detail" as const;
  }

  return "catalog" as const;
}

export function deriveReturnActionLabel(source?: string) {
  if (source === "reader") {
    return "Return to chapter";
  }

  if (source === "toc") {
    return "Return to directory";
  }

  if (source === "detail") {
    return "Return to title";
  }

  return "Back to library";
}

export function deriveRecommendedPlanId(source?: string, overview?: MembershipOverview) {
  if (overview?.active) {
    return "quarterly" as const;
  }

  if (source === "reader") {
    return "monthly" as const;
  }

  if (source === "toc" || source === "detail") {
    return "quarterly" as const;
  }

  return "annual" as const;
}

export function deriveUnlockOutcomeLabel(source?: string, planId?: string) {
  const cadence =
    planId === "monthly"
      ? "monthly"
      : planId === "annual"
        ? "annual"
        : "quarterly";

  if (source === "reader") {
    return `Unlock happens immediately on the ${cadence} plan, then the blocked chapter can reopen without losing reading position.`;
  }

  if (source === "toc") {
    return `Unlock happens immediately on the ${cadence} plan, then the selected chapter can reopen from the directory with access already resolved.`;
  }

  if (source === "detail") {
    return `Unlock happens immediately on the ${cadence} plan, then the title dossier can continue without another paywall branch.`;
  }

  return `Unlock happens immediately on the ${cadence} plan, then premium discovery and continuation stay available across the catalog surfaces.`;
}

export function deriveReturnContextLabel(source?: string, novelId?: string, chapterId?: string) {
  if (source === "reader") {
    return chapterId
      ? `Return path will reopen chapter ${chapterId} inside the reader flow.`
      : "Return path will reopen the blocked reader location.";
  }

  if (source === "toc") {
    return chapterId
      ? `Return path will reopen the directory with ${chapterId} still in focus.`
      : "Return path will reopen the directory with the selected chapter still focused.";
  }

  if (source === "detail") {
    return novelId
      ? `Return path will reopen the title dossier for ${novelId}.`
      : "Return path will reopen the blocked title dossier.";
  }

  return "Return path will land back in the library with premium continuity already active.";
}
