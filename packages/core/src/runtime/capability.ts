import type { CapabilityHealthSnapshot, CapabilityKind, CapabilityStatus } from "@minix/contracts";

function capitalizeCapability(capability: string): string {
  return capability.length > 0 ? capability[0]!.toUpperCase() + capability.slice(1) : capability;
}

function createDefaultCapabilityDetail(status: CapabilityStatus): string {
  const label = capitalizeCapability(status.capability);
  if (status.mode === "native") {
    return `${label} capability is available.`;
  }

  if (status.mode === "degraded") {
    return `${label} capability is available in degraded mode.`;
  }

  return `${label} capability is unavailable on this host.`;
}

export function describeCapabilityStatus(
  status: CapabilityStatus | undefined,
  missingSummary = "Capability status is unavailable until the host runtime reports it.",
): string {
  if (!status) {
    return missingSummary;
  }

  const detail = status.detail?.trim() || createDefaultCapabilityDetail(status);
  if (!status.fallbackActionLabel || detail.includes(status.fallbackActionLabel)) {
    return detail;
  }

  return `${detail} Recommended fallback: ${status.fallbackActionLabel}.`;
}

export function createCapabilityHealthSnapshot(
  capability: CapabilityKind,
  status: CapabilityStatus | undefined,
  missingSummary = "Capability status is unavailable until the host runtime reports it.",
): CapabilityHealthSnapshot {
  const summary = describeCapabilityStatus(status, missingSummary);
  return {
    capability,
    available: status?.available ?? false,
    mode: status?.mode ?? "unknown",
    summary,
    ...(status?.detail ? { detail: status.detail } : {}),
    ...(status?.reason ? { reason: status.reason } : {}),
    ...(status?.fallbackActionLabel ? { fallbackActionLabel: status.fallbackActionLabel } : {}),
    ...(status?.fallbackActionLabel ? { fallbackSummary: `Fallback action: ${status.fallbackActionLabel}.` } : {}),
  };
}
