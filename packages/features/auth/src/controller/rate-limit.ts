export function readRetryAfterSeconds(detail: unknown): number | null {
  if (typeof detail !== "object" || detail === null) {
    return null;
  }

  const value = (detail as Record<string, unknown>).retryAfterSeconds;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function deriveRateLimitMessage(retryAfterSeconds: number | null): string | null {
  if (retryAfterSeconds === null) {
    return "Too many login attempts. Retry later.";
  }

  return `Too many login attempts. Retry in ${retryAfterSeconds} seconds.`;
}
