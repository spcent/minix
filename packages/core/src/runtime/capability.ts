import type { CapabilityActionInput, CapabilityHealthSnapshot, CapabilityKind, CapabilityStatus } from "@minix/contracts";

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

export function resolveCapabilityPayloadText(input: CapabilityActionInput): string | null {
  if (typeof input.payload !== "object" || input.payload === null || !("text" in input.payload)) {
    return null;
  }

  const text = (input.payload as { text?: unknown }).text;
  return typeof text === "string" ? text : null;
}

export function resolveShareTargetText(payload: Record<string, unknown>): string {
  const sharePayload =
    typeof payload.sharePayload === "object" && payload.sharePayload !== null
      ? (payload.sharePayload as Record<string, unknown>)
      : {};
  const shareChannel =
    typeof payload.shareChannel === "object" && payload.shareChannel !== null
      ? (payload.shareChannel as Record<string, unknown>)
      : {};
  const shareKind = typeof shareChannel.kind === "string" ? shareChannel.kind : "";

  if (shareKind === "poster_image" && typeof sharePayload.posterImageUrl === "string") {
    return sharePayload.posterImageUrl;
  }

  return (
    (typeof sharePayload.shortLink === "string" ? sharePayload.shortLink : undefined) ??
    (typeof sharePayload.landingUrl === "string" ? sharePayload.landingUrl : undefined) ??
    (typeof sharePayload.title === "string" ? sharePayload.title : "")
  );
}
