export function formatDisplayDate(
  value: string | undefined,
  options: { fallback?: string; locale?: string } = {},
): string {
  const fallback = options.fallback ?? "Recently";
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(options.locale ?? "en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatCompactDisplayNumber(
  value: number | undefined,
  options: { fallback?: string; locale?: string } = {},
): string {
  const fallback = options.fallback ?? "0";
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return new Intl.NumberFormat(options.locale ?? "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
