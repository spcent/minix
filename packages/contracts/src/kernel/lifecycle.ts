export const APP_LIFECYCLE_EVENTS = [
  "bootstrap",
  "ready",
  "foreground",
  "background",
  "teardown",
] as const;

export const PAGE_LIFECYCLE_EVENTS = [
  "load",
  "show",
  "hide",
  "unload",
  "pullDownRefresh",
  "reachBottom",
] as const;

export type AppLifecycleEvent = (typeof APP_LIFECYCLE_EVENTS)[number];
export type PageLifecycleEvent = (typeof PAGE_LIFECYCLE_EVENTS)[number];

export interface LifecycleEventContext {
  routeId?: string;
  path?: string;
  params?: Record<string, string | number | boolean>;
  detail?: Record<string, unknown>;
}

export interface LifecycleEventEnvelope {
  scope: "app" | "page";
  event: AppLifecycleEvent | PageLifecycleEvent;
  context?: LifecycleEventContext;
  occurredAt?: number;
}
