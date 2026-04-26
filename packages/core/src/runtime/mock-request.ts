import type { ResponseData } from "../ports/request";

export type MockQueryValue = string | number | boolean | undefined;

export interface PaginatedMockList<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
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
