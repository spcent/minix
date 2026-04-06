import type { NovelDetail } from "@minix/contracts";

export interface NovelDetailState {
  ready: boolean;
  title: string;
  novelId: string | undefined;
  detail: NovelDetail | undefined;
  loading: boolean;
  errorText: string | undefined;
  summaryExpanded: boolean;
  membershipLocked: boolean;
  membershipMessage: string | undefined;
  accessBadgeLabel: string | undefined;
  accessSummary: string | undefined;
  reputationSummary: string | undefined;
  cadenceSummary: string | undefined;
  trialSummary: string | undefined;
  bookshelfSummary: string | undefined;
  latestMilestoneTitle: string | undefined;
  latestMilestoneCopy: string | undefined;
  latestMilestoneMeta: string | undefined;
  latestMilestoneNovelId: string | undefined;
  latestMilestoneChapterId: string | undefined;
  latestMilestoneSource: "reader" | "toc" | "bookshelf" | undefined;
  latestMilestoneSourceLabel: string | undefined;
  latestMilestoneRecencyLabel: string | undefined;
  latestMilestoneReturnLabel: string | undefined;
  latestMilestoneReturnHint: string | undefined;
  primaryActionLabel: string | undefined;
  startActionLabel: string | undefined;
  membershipActionLabel: string | undefined;
  bookshelfBusy: boolean;
  bookshelfNotice: string | undefined;
}

export interface CreateNovelDetailStateOptions {
  title?: string;
  novelId?: string;
}

export function createInitialNovelDetailState(options: CreateNovelDetailStateOptions = {}): NovelDetailState {
  return {
    ready: false,
    title: options.title ?? "Novel Detail",
    novelId: options.novelId,
    detail: undefined,
    loading: false,
    errorText: undefined,
    summaryExpanded: false,
    membershipLocked: false,
    membershipMessage: undefined,
    accessBadgeLabel: undefined,
    accessSummary: undefined,
    reputationSummary: undefined,
    cadenceSummary: undefined,
    trialSummary: undefined,
    bookshelfSummary: undefined,
    latestMilestoneTitle: undefined,
    latestMilestoneCopy: undefined,
    latestMilestoneMeta: undefined,
    latestMilestoneNovelId: undefined,
    latestMilestoneChapterId: undefined,
    latestMilestoneSource: undefined,
    latestMilestoneSourceLabel: undefined,
    latestMilestoneRecencyLabel: undefined,
    latestMilestoneReturnLabel: undefined,
    latestMilestoneReturnHint: undefined,
    primaryActionLabel: undefined,
    startActionLabel: undefined,
    membershipActionLabel: undefined,
    bookshelfBusy: false,
    bookshelfNotice: undefined,
  };
}
