import type { AppKernel } from "@minix/core";

import type { ReaderState } from "../model";

export const DEFAULT_READER_SESSION_STORAGE_KEY = "reader.session";

const ACTIVE_READER_SESSION_WINDOW_MS = 1000 * 60 * 90;

interface ReaderSessionSnapshot {
  novelId: string;
  chapterId: string;
  startedAt: string;
}

function clampSessionMinutes(startedAt: string | undefined, now: Date): number {
  if (!startedAt) {
    return 0;
  }

  const startMs = Date.parse(startedAt);
  if (Number.isNaN(startMs)) {
    return 0;
  }

  return Math.max(1, Math.round((now.getTime() - startMs) / (1000 * 60)));
}

export function formatSessionElapsedLabel(minutes: number): string | undefined {
  if (minutes <= 0) {
    return undefined;
  }

  if (minutes < 60) {
    return `${minutes} min active`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr active`;
  }

  return `${hours} hr ${remainingMinutes} min active`;
}

export async function restoreOrCreateReaderSession(input: {
  kernel: AppKernel;
  sessionStorageKey: string;
  now: () => Date;
  novelId: string;
  chapterId: string;
  fallbackStartedAt?: string;
}): Promise<Pick<ReaderState, "sessionStartedAt" | "sessionElapsedMinutes" | "sessionElapsedLabel">> {
  const currentTime = input.now();
  const stored = await input.kernel.storage.get<ReaderSessionSnapshot>(input.sessionStorageKey);
  const storedValue = stored.ok ? stored.value : null;
  const storedStartedAt = storedValue?.startedAt;
  const storedAgeMs = storedStartedAt ? currentTime.getTime() - Date.parse(storedStartedAt) : Number.POSITIVE_INFINITY;
  const isStoredSessionLive =
    !!storedValue &&
    storedValue.novelId === input.novelId &&
    storedAgeMs >= 0 &&
    storedAgeMs <= ACTIVE_READER_SESSION_WINDOW_MS;
  const fallbackAgeMs = input.fallbackStartedAt
    ? currentTime.getTime() - Date.parse(input.fallbackStartedAt)
    : Number.POSITIVE_INFINITY;
  const canReuseFallback = input.fallbackStartedAt && fallbackAgeMs >= 0 && fallbackAgeMs <= ACTIVE_READER_SESSION_WINDOW_MS;
  const startedAt =
    (isStoredSessionLive ? storedValue?.startedAt : undefined) ??
    (canReuseFallback ? input.fallbackStartedAt : undefined) ??
    currentTime.toISOString();
  const elapsedMinutes = clampSessionMinutes(startedAt, currentTime);

  await input.kernel.storage.set<ReaderSessionSnapshot>(input.sessionStorageKey, {
    novelId: input.novelId,
    chapterId: input.chapterId,
    startedAt,
  });

  return {
    sessionStartedAt: startedAt,
    sessionElapsedMinutes: elapsedMinutes,
    sessionElapsedLabel: formatSessionElapsedLabel(elapsedMinutes),
  };
}

export async function refreshReaderSession(input: {
  kernel: AppKernel;
  sessionStorageKey: string;
  now: () => Date;
  state: ReaderState;
  chapterIdOverride?: string;
}): Promise<Pick<ReaderState, "sessionStartedAt" | "sessionElapsedMinutes" | "sessionElapsedLabel"> | undefined> {
  if (!input.state.novelId || !input.state.chapterId) {
    return undefined;
  }

  const currentTime = input.now();
  const startedAt = input.state.sessionStartedAt ?? currentTime.toISOString();
  const elapsedMinutes = clampSessionMinutes(startedAt, currentTime);
  const chapterId = input.chapterIdOverride ?? input.state.chapterId;

  await input.kernel.storage.set<ReaderSessionSnapshot>(input.sessionStorageKey, {
    novelId: input.state.novelId,
    chapterId,
    startedAt,
  });

  return {
    sessionStartedAt: startedAt,
    sessionElapsedMinutes: elapsedMinutes,
    sessionElapsedLabel: formatSessionElapsedLabel(elapsedMinutes),
  };
}
