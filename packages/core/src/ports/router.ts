import type { Result } from "../error/index";

export interface RouteLocation {
  path: string;
  params?: Record<string, string | number | boolean>;
  replace?: boolean;
}

export interface RouterAdapter {
  push(location: RouteLocation): Promise<Result<void>>;
  replace(location: RouteLocation): Promise<Result<void>>;
  back(delta?: number): Promise<Result<void>>;
  current(): Result<RouteLocation | null>;
}
