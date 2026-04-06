import type { Result } from "../error/index";

export interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;
}

export interface ResponseData<T = unknown> {
  status: number;
  headers: Record<string, string>;
  data: T;
  raw?: unknown;
}

export interface RequestAdapter {
  request<T = unknown>(options: RequestOptions): Promise<Result<ResponseData<T>>>;
}
