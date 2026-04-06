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

export interface CapabilityRequirement {
  capability: CapabilityKind;
  required?: boolean;
}

export interface CapabilityStatus {
  capability: CapabilityKind;
  available: boolean;
  detail?: string;
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
}
