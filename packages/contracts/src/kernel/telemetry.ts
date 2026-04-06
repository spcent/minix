export const TELEMETRY_LEVELS = ["debug", "info", "warn", "error"] as const;

export type TelemetryLevel = (typeof TELEMETRY_LEVELS)[number];

export interface TelemetryAttributeMap {
  [key: string]: string | number | boolean | null | undefined;
}

export interface TelemetryEvent {
  name: string;
  traceId?: string;
  attributes?: TelemetryAttributeMap;
}

export interface TelemetryErrorEvent extends TelemetryEvent {
  message: string;
  stack?: string;
  level?: TelemetryLevel;
}

export interface TelemetrySpan {
  name: string;
  traceId?: string;
  startedAt?: number;
  endedAt?: number;
  status?: "ok" | "error";
  attributes?: TelemetryAttributeMap;
}
