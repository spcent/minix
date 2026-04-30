// Generated from packages/tooling/fixtures/novel-mock-content.ts.
// Run pnpm gen:novel-mock-content after editing the fixture.
import type {
  ContentAccess,
  ContentCard,
  ContentDetail,
  ContentDisplay,
  ContentLifecycle,
  NovelDetail,
} from "@minix/contracts";

export type RawNovelDetail = Omit<NovelDetail, "contentDetail" | "contentAccess">;

function createNovelContentLifecycle(detail: RawNovelDetail | NovelDetail): ContentLifecycle {
  const updatedAt = detail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z";
  return {
    state: "published",
    availableActions: ["update", "archive", "delete"],
    publishedAt: updatedAt,
    updatedAt,
  };
}

function createNovelContentDisplay(
  detail: RawNovelDetail | NovelDetail,
  slot: ContentDisplay["recommendationSlot"],
  slotLabel: string,
): ContentDisplay {
  return {
    category: { key: detail.categoryKey, label: detail.categoryLabel },
    tags: detail.tags.map((tag) => ({ key: tag.key, label: tag.label })),
    topics: detail.tags.slice(0, 2).map((tag) => ({ key: tag.key, label: tag.label })),
    ...(slot ? { recommendationSlot: slot } : {}),
    recommendationSlotLabel: slotLabel,
    pinned: detail.status === "serializing",
    featured: detail.requiresMembership || detail.status === "serializing",
  };
}

export function createNovelContentAccess(detail: RawNovelDetail | NovelDetail): ContentAccess {
  const purchased = Boolean(detail.isPurchased);
  return {
    visibility: detail.requiresMembership ? "member_only" : "public",
    accessible: !detail.requiresMembership || purchased || detail.isFree,
    previewAvailable: Boolean(detail.isFree || detail.isTrial),
    requiresLogin: false,
    requiresMembership: detail.requiresMembership,
    requiresPurchase: false,
    purchased,
    summaryLabel:
      detail.accessRuleSummaryLabel ??
      (detail.requiresMembership
        ? "This title stays in the premium lane until membership unlocks the complete reading route after the visible preview boundary."
        : "Open-access reading continues without a paywall in the current sample surface."),
    ...(detail.requiresMembership ? { gateLabel: "Membership required for full reading" } : {}),
    ...(detail.requiresMembership ? { entitlementLabel: "Membership unlock" } : {}),
  };
}

export function createNovelContentDetail(detail: RawNovelDetail | NovelDetail): ContentDetail {
  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(
      detail,
      detail.requiresMembership ? "premium" : detail.status === "serializing" ? "frontlist" : "ranking",
      detail.requiresMembership ? "Premium Spotlight" : detail.status === "serializing" ? "Frontlist Serial" : "Completed Archive",
    ),
    lifecycle: createNovelContentLifecycle(detail),
    ...(detail.relatedLaneLabel ? { recommendationReason: detail.relatedLaneLabel } : {}),
  };
}

export function createNovelContentCard(
  detail: NovelDetail,
  continueChapterId?: string,
  continueChapterTitle?: string,
): ContentCard {
  const slot = continueChapterId
    ? "continue_reading"
    : detail.requiresMembership
      ? "premium"
      : detail.status === "serializing"
        ? "frontlist"
        : "ranking";
  const slotLabel = continueChapterId
    ? continueChapterTitle
      ? `Continue · ${continueChapterTitle}`
      : "Continue Reading"
    : detail.requiresMembership
      ? "Premium Spotlight"
      : detail.status === "serializing"
        ? "Frontlist Serial"
        : "Completed Archive";

  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(detail, slot, slotLabel),
    lifecycle: createNovelContentLifecycle(detail),
  };
}

export function enrichNovelDetail(detail: RawNovelDetail): NovelDetail {
  return {
    ...detail,
    contentDetail: createNovelContentDetail(detail),
    contentAccess: createNovelContentAccess(detail),
  };
}
