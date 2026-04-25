import type { ResponseData } from "../ports/request";

export type MockQueryValue = string | number | boolean | undefined;

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
