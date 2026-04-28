import type { ProviderPostureMode } from "@minix/contracts";

export const SECRET_MATERIAL_NOT_TRACKED_SUMMARY = "Secret material is not tracked in source.";

export function resolveProviderPostureMode(value: string | undefined): ProviderPostureMode {
  return value === "production" ? "production" : "sample";
}

export function isProductionProviderMode(providerMode: ProviderPostureMode): boolean {
  return providerMode === "production";
}

export function isSampleProviderMode(providerMode: ProviderPostureMode): boolean {
  return providerMode === "sample";
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
  return isProductionProviderMode(input.providerMode) ? input.productionFallback : input.sampleFallback;
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
  const trimmedBaseUrl = baseUrl.trim();
  return trimmedBaseUrl.endsWith("/") ? trimmedBaseUrl : `${trimmedBaseUrl}/`;
}

export function resolveConfiguredProviderBaseUrl(baseUrl: string | undefined): string | undefined {
  const trimmedBaseUrl = baseUrl?.trim();
  if (!trimmedBaseUrl) {
    return undefined;
  }

  try {
    return normalizeProviderBaseUrl(new URL(trimmedBaseUrl).toString());
  } catch {
    return undefined;
  }
}

export function buildProviderUrl(input: {
  path: string;
  requestUrl: string;
  configuredBaseUrl?: string | undefined;
  fallbackPath?: string | undefined;
}): string {
  const configuredBaseUrl = resolveConfiguredProviderBaseUrl(input.configuredBaseUrl);

  if (configuredBaseUrl) {
    return new URL(input.path, configuredBaseUrl).toString();
  }

  return new URL(input.fallbackPath ?? input.path, input.requestUrl).toString();
}
