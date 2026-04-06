export type ReaderTheme = "paper" | "sepia" | "night";
export type ReaderMode = "scroll" | "page";
export type NightModeDefault = "manual-only" | "after-dusk" | "always-night";

export interface ReaderDisplayPreferences {
  theme: ReaderTheme;
  mode: ReaderMode;
  fontScale: number;
  nightModeDefault: NightModeDefault;
}

export interface ReadingCenterPreferences {
  resume: "latest-chapter" | "detail-first" | "toc-first";
  shelfOrder: "recent" | "updates" | "pinned";
  digest: "weekly" | "weekend" | "important" | "paused";
  sync: "cross-host" | "device-first";
  reminders: "nightly" | "chapter-moves" | "paused";
}

export type LatestMilestoneSource = "reader" | "toc" | "bookshelf";
export type LatestMilestoneType = "volume-complete" | "archive-milestone" | "chapter-recap";

export interface LatestReadingMilestoneSnapshot {
  novelId?: string;
  chapterId?: string;
  title: string;
  copy: string;
  meta?: string;
  source: LatestMilestoneSource;
  type: LatestMilestoneType;
  savedAt: string;
}

export interface LatestMilestoneHistoryEntry {
  novelId?: string;
  chapterId?: string;
  title: string;
  copy: string;
  meta?: string;
  source: LatestMilestoneSource;
  type: LatestMilestoneType;
  typeLabel: string;
  sourceLabel: string;
  recencyLabel: string | undefined;
  returnLabel: string;
  returnHint: string;
}

export interface LatestMilestoneContinuityPresentation {
  sourceLabel: string;
  recencyLabel: string | undefined;
  returnLabel: string;
  returnHint: string;
  returnTarget: LatestMilestoneSource;
}

function formatUtcTime(value: string): string | undefined {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `Saved ${month} ${day} at ${hours}:${minutes} UTC`;
}

export function deriveLatestMilestoneTypeLabel(type: LatestMilestoneType): string {
  if (type === "volume-complete") {
    return "Volume complete";
  }

  if (type === "archive-milestone") {
    return "Archive milestone";
  }

  return "Chapter recap";
}

export function deriveLatestMilestoneContinuity(
  snapshot: LatestReadingMilestoneSnapshot | null | undefined,
): LatestMilestoneContinuityPresentation | undefined {
  if (!snapshot) {
    return undefined;
  }

  if (snapshot.source === "reader") {
    return {
      sourceLabel: "Saved from reader",
      recencyLabel: formatUtcTime(snapshot.savedAt),
      returnLabel: snapshot.chapterId ? "Return to chapter" : "Return to reader",
      returnHint: "Best re-entry keeps the current chapter trail warm.",
      returnTarget: "reader",
    };
  }

  if (snapshot.source === "toc") {
    return {
      sourceLabel: "Saved from TOC",
      recencyLabel: formatUtcTime(snapshot.savedAt),
      returnLabel: "Return to directory",
      returnHint: "Best re-entry keeps the directory focus and continuation point visible.",
      returnTarget: "toc",
    };
  }

  return {
    sourceLabel: "Saved from bookshelf",
    recencyLabel: formatUtcTime(snapshot.savedAt),
    returnLabel: "Open bookshelf",
    returnHint: "Best re-entry reopens the reading console where active and archive lanes already stay organized.",
    returnTarget: "bookshelf",
  };
}

export function mergeLatestReadingMilestoneHistory(
  history: LatestReadingMilestoneSnapshot[] | null | undefined,
  snapshot: LatestReadingMilestoneSnapshot,
  limit = 3,
): LatestReadingMilestoneSnapshot[] {
  const dedupeKey = (item: LatestReadingMilestoneSnapshot) =>
    `${item.type}:${item.source}:${item.novelId ?? ""}:${item.chapterId ?? ""}:${item.title}`;

  const next = [snapshot, ...(history ?? []).filter((item) => dedupeKey(item) !== dedupeKey(snapshot))];
  return next.slice(0, limit);
}

export function deriveLatestMilestoneHistoryEntry(
  snapshot: LatestReadingMilestoneSnapshot,
): LatestMilestoneHistoryEntry {
  const continuity = deriveLatestMilestoneContinuity(snapshot);

  return {
    ...(snapshot.novelId ? { novelId: snapshot.novelId } : {}),
    ...(snapshot.chapterId ? { chapterId: snapshot.chapterId } : {}),
    title: snapshot.title,
    copy: snapshot.copy,
    ...(snapshot.meta ? { meta: snapshot.meta } : {}),
    source: snapshot.source,
    type: snapshot.type,
    typeLabel: deriveLatestMilestoneTypeLabel(snapshot.type),
    sourceLabel: continuity?.sourceLabel ?? "Saved from reading flow",
    recencyLabel: continuity?.recencyLabel,
    returnLabel: continuity?.returnLabel ?? "Resume milestone",
    returnHint: continuity?.returnHint ?? "Return to the best re-entry point for this milestone.",
  };
}

export function deriveLatestMilestoneHistory(
  history: LatestReadingMilestoneSnapshot[] | null | undefined,
): LatestMilestoneHistoryEntry[] {
  return (history ?? []).map((item) => deriveLatestMilestoneHistoryEntry(item));
}

export const READER_DISPLAY_STORAGE_KEY = "reader.display";
export const READING_CENTER_STORAGE_KEY = "novel.reading-center";
export const LATEST_READING_MILESTONE_STORAGE_KEY = "novel.latest-milestone";
export const LATEST_READING_MILESTONE_HISTORY_STORAGE_KEY = "novel.latest-milestone-history";
