export function formatTokenLabel(value: string | undefined, fallback = ""): string {
  const normalized = value?.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return normalized && normalized.length > 0 ? normalized.toLowerCase() : fallback;
}

export function formatTitleTokenLabel(value: string | undefined, fallback = ""): string {
  const label = formatTokenLabel(value, fallback);
  return label.replace(/\b\w/g, (token) => token.toUpperCase());
}
