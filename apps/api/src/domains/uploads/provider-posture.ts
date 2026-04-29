import type {
  ProviderPostureMode,
  UploadProviderPosture,
} from "@minix/contracts";

import type { ApiBindings, StoredUploadRecord } from "../../types";
import {
  buildProviderUrl,
  isProductionProviderMode,
  resolveProviderName,
  resolveProviderPostureMode,
  resolveUrlHost,
  SECRET_MATERIAL_NOT_TRACKED_SUMMARY,
} from "../provider-posture";

export type UploadProviderRuntimeEnv = Pick<
  ApiBindings,
  | "MINIX_UPLOAD_PROVIDER_MODE"
  | "MINIX_UPLOAD_STORAGE_PROVIDER"
  | "MINIX_UPLOAD_REVIEW_PROVIDER"
  | "MINIX_UPLOAD_ASSET_BASE_URL"
>;

export function resolveUploadProviderMode(runtimeEnv?: UploadProviderRuntimeEnv): ProviderPostureMode {
  return resolveProviderPostureMode(runtimeEnv?.MINIX_UPLOAD_PROVIDER_MODE);
}

export function resolveUploadStorageProvider(runtimeEnv?: UploadProviderRuntimeEnv): string {
  const providerMode = resolveUploadProviderMode(runtimeEnv);
  return resolveProviderName({
    configuredName: runtimeEnv?.MINIX_UPLOAD_STORAGE_PROVIDER,
    providerMode,
    productionFallback: "object-storage-provider",
    sampleFallback: "sample-object-storage",
  });
}

export function resolveUploadReviewProvider(runtimeEnv?: UploadProviderRuntimeEnv): string {
  const providerMode = resolveUploadProviderMode(runtimeEnv);
  return resolveProviderName({
    configuredName: runtimeEnv?.MINIX_UPLOAD_REVIEW_PROVIDER,
    providerMode,
    productionFallback: "content-review-provider",
    sampleFallback: "sample-upload-policy",
  });
}

export function createUploadProviderPosture(record: StoredUploadRecord): UploadProviderPosture {
  const providerMode = record.reviewRecord?.providerMode ?? "sample";
  const storageProvider = record.reviewRecord?.storageProvider ?? (isProductionProviderMode(providerMode) ? "configured object storage" : "sample-object-storage");
  const reviewProvider = record.reviewRecord?.provider ?? (isProductionProviderMode(providerMode) ? "configured review provider" : "sample-upload-policy");
  const assetHost = resolveUrlHost(record.uploadAsset?.url);
  const postureSummary =
    isProductionProviderMode(providerMode)
      ? `Upload storage resolves through ${storageProvider} and review resolves through ${reviewProvider}. ${SECRET_MATERIAL_NOT_TRACKED_SUMMARY}`
      : `Upload storage and review remain sample-backed through ${storageProvider} and ${reviewProvider}. ${SECRET_MATERIAL_NOT_TRACKED_SUMMARY}`;
  return {
    providerMode,
    storageProvider,
    reviewProvider,
    ...(assetHost ? { assetHost } : {}),
    secretMaterialTracked: false,
    postureSummary,
  };
}

export function buildUploadedAssetUrl(assetId: string, requestUrl: string, runtimeEnv?: UploadProviderRuntimeEnv): string {
  return buildProviderUrl({
    path: `/uploads/assets/${assetId}`,
    requestUrl,
    configuredBaseUrl: runtimeEnv?.MINIX_UPLOAD_ASSET_BASE_URL,
  });
}

export function buildUploadedThumbnailUrl(assetId: string, requestUrl: string, runtimeEnv?: UploadProviderRuntimeEnv): string {
  return buildProviderUrl({
    path: `/uploads/assets/${assetId}/thumb`,
    requestUrl,
    configuredBaseUrl: runtimeEnv?.MINIX_UPLOAD_ASSET_BASE_URL,
  });
}
