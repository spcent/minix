import type { ProviderPostureMode } from "@minix/contracts";

export const SECRET_MATERIAL_NOT_TRACKED_SUMMARY = "Secret material is not tracked in source.";

export function resolveProviderPostureMode(value: string | undefined): ProviderPostureMode {
  return value === "production" ? "production" : "sample";
}

export function resolveProviderName(input: {
  configuredName?: string | undefined;
  providerMode: ProviderPostureMode;
  productionFallback: string;
  sampleFallback: string;
}): string {
  const configuredName = input.configuredName?.trim();
  if (configuredName) {
    return configuredName;
  }
  return input.providerMode === "production" ? input.productionFallback : input.sampleFallback;
}

export function resolveUrlHost(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

export function normalizeProviderBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}
