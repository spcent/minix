import { deriveNovelAccessPresentation } from "@minix/core";
import type { ChapterContent } from "@minix/contracts";

import type { ReaderState } from "../model";

export function resolveAccessState(
  chapter: ChapterContent,
): Pick<ReaderState, "accessState" | "accessBadgeLabel" | "accessMessage" | "membershipActionLabel" | "previewContent"> {
  const access = deriveNovelAccessPresentation(chapter);

  if (access.accessState === "trial" && typeof chapter.trialEndOffset === "number") {
    return {
      accessState: access.accessState,
      accessBadgeLabel: access.accessBadgeLabel,
      accessMessage: "Trial preview ends here. Unlock membership to keep reading.",
      membershipActionLabel: access.membershipActionLabel,
      previewContent: chapter.content.slice(0, chapter.trialEndOffset).trimEnd(),
    };
  }

  if (access.accessState === "locked") {
    return {
      accessState: access.accessState,
      accessBadgeLabel: access.accessBadgeLabel,
      accessMessage: access.accessSummary,
      membershipActionLabel: access.membershipActionLabel,
      previewContent: chapter.content.slice(0, 220).trimEnd(),
    };
  }

  return {
    accessState: access.accessState,
    accessBadgeLabel: access.accessBadgeLabel,
    accessMessage: undefined,
    membershipActionLabel: access.membershipActionLabel,
    previewContent: undefined,
  };
}
