export const CAPABILITY_KINDS = [
  "clipboard",
  "device",
  "location",
  "payment",
  "share",
  "subscription",
  "upload",
] as const;

export type CapabilityKind = (typeof CAPABILITY_KINDS)[number];

export const CAPABILITY_SUPPORT_MODES = ["native", "degraded", "unavailable"] as const;
export type CapabilitySupportMode = (typeof CAPABILITY_SUPPORT_MODES)[number];

export interface CapabilityRequirement {
  capability: CapabilityKind;
  required?: boolean;
}

export interface CapabilityStatus {
  capability: CapabilityKind;
  available: boolean;
  mode: CapabilitySupportMode;
  detail?: string;
  reason?: string;
  fallbackActionLabel?: string;
}

export interface CapabilityHealthSnapshot {
  capability: CapabilityKind;
  available: boolean;
  mode: CapabilitySupportMode | "unknown";
  summary: string;
  detail?: string;
  reason?: string;
  fallbackActionLabel?: string;
  fallbackSummary?: string;
}

export interface CapabilityActionInput<TPayload = unknown> {
  capability: CapabilityKind;
  action: string;
  payload?: TPayload;
}

export interface CapabilityActionResult<TResult = unknown> {
  capability: CapabilityKind;
  action: string;
  value?: TResult;
  detail?: string;
  degraded?: boolean;
  fallbackActionLabel?: string;
}
