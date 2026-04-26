import type { ResponseData } from "../ports/request";

export type MockQueryValue = string | number | boolean | undefined;

export interface PaginatedMockList<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface MockSvgCoverOptions {
  title: string;
  accent: string;
  backgroundStart: string;
  backgroundEnd: string;
}

export function createJsonMockResponse<T>(status: number, data: T): ResponseData<T> {
  return {
    status,
    headers: {
      "content-type": "application/json",
      "x-minix-mock": "true",
    },
    data,
  };
}

export function createMockBearerAuthorizationHeader(accessToken: string): string {
  return `Bearer ${accessToken}`;
}

export function matchesMockBearerAuthorizationHeader(authHeader: string | undefined, accessToken: string): boolean {
  return authHeader === createMockBearerAuthorizationHeader(accessToken);
}

export function resolveMockRequestPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function coerceMockQueryNumber(value: MockQueryValue, fallback: number): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function coerceMockQueryString(value: MockQueryValue): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function paginateMockItems<TItem>(
  items: readonly TItem[],
  query: Record<string, MockQueryValue> | undefined,
  options: { defaultPage?: number; defaultPageSize?: number } = {},
): PaginatedMockList<TItem> {
  const page = coerceMockQueryNumber(query?.page, options.defaultPage ?? 1);
  const pageSize = coerceMockQueryNumber(query?.pageSize, options.defaultPageSize ?? 20);
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    items: pageItems,
    page,
    pageSize,
    hasMore: start + pageSize < items.length,
  };
}

export function createMockSvgCoverDataUrl(options: MockSvgCoverOptions): string {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080" role="img" aria-label="${options.title} cover">`,
    "<defs>",
    `  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `    <stop offset="0%" stop-color="${options.backgroundStart}"/>`,
    `    <stop offset="100%" stop-color="${options.backgroundEnd}"/>`,
    "  </linearGradient>",
    "</defs>",
    `  <rect width="720" height="1080" fill="url(#bg)"/>`,
    `  <circle cx="560" cy="220" r="130" fill="${options.accent}" fill-opacity="0.15"/>`,
    `  <rect x="84" y="84" width="552" height="912" rx="28" fill="none" stroke="${options.accent}" stroke-opacity="0.45"/>`,
    `  <text x="112" y="320" font-size="82" font-weight="700" font-family="Georgia, 'Times New Roman', serif" fill="#f8f3ea">${options.title}</text>`,
    `  <text x="112" y="930" font-size="28" font-family="'Helvetica Neue', Arial, sans-serif" fill="${options.accent}" letter-spacing="6">MINIX MOCK SAMPLE</text>`,
    "</svg>",
  ].join("");

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
