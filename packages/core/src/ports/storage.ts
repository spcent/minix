import type { Result } from "../error/index";

export interface StorageAdapter {
  get<T = unknown>(key: string): Promise<Result<T | null>>;
  set<T = unknown>(key: string, value: T): Promise<Result<void>>;
  remove(key: string): Promise<Result<void>>;
  clear(namespace?: string): Promise<Result<void>>;
}
