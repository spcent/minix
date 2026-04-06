import type { CapabilityKind } from "./capability";

export const GUARD_EFFECTS = ["allow", "redirect", "deny"] as const;

export type GuardEffect = (typeof GUARD_EFFECTS)[number];

export interface GuardRequirement {
  authenticated?: boolean;
  roles?: string[];
  permissions?: string[];
  capabilities?: CapabilityKind[];
}

export interface GuardDecision {
  effect: GuardEffect;
  reason?: string;
  redirectTo?: string;
}

export interface GuardPolicy {
  name?: string;
  requirements?: GuardRequirement;
  onFail?: {
    effect?: Exclude<GuardEffect, "allow">;
    reason?: string;
    redirectTo?: string;
  };
}
