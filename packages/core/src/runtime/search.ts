import type { SearchDomain, SearchMode } from "@minix/contracts";

export function normalizeSearchKeyword(keyword: string): string {
  return keyword.trim();
}

export function pushRecentSearchKeyword(current: string[], keyword: string, limit = 5): string[] {
  const normalized = normalizeSearchKeyword(keyword);
  if (!normalized) {
    return current;
  }

  return [normalized, ...current.filter((item) => item !== normalized)].slice(0, limit);
}

export function resolveSearchModeParam(value: unknown, fallback: SearchMode): SearchMode {
  return value === "global" || value === "content" || value === "user" || value === "domain" ? value : fallback;
}

export function resolveSearchDomainParam(value: unknown, fallback: SearchDomain): SearchDomain {
  return value === "all" || value === "content" || value === "user" || value === "novel" || value === "feed"
    ? value
    : fallback;
}
