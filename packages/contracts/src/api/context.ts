export interface SourceContextSnapshot {
  pagePath?: string;
  routeId?: string;
  label?: string;
  params?: Record<string, string | number | boolean>;
}

export interface ActorContextSnapshot {
  userId?: string;
  platform?: string;
  appVersion?: string;
  deviceSummary?: string;
}
