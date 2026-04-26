import type { UploadAsset, UploadAssetMetadata, UploadDerivedAssetVariant } from "@minix/contracts";

type UploadAssetVariantInput = {
  kind: UploadDerivedAssetVariant["kind"];
  url: string;
  label: string;
  width?: number | undefined;
  height?: number | undefined;
  durationSeconds?: number | undefined;
  pageCount?: number | undefined;
};

export function createUploadAssetVariant(input: UploadAssetVariantInput): UploadDerivedAssetVariant {
  return {
    kind: input.kind,
    url: input.url,
    label: input.label,
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.durationSeconds !== undefined ? { durationSeconds: input.durationSeconds } : {}),
    ...(input.pageCount !== undefined ? { pageCount: input.pageCount } : {}),
  };
}

export function cloneUploadAssetVariant(variant: UploadDerivedAssetVariant): UploadDerivedAssetVariant {
  return createUploadAssetVariant(variant);
}

export function cloneUploadAssetMetadata(metadata: UploadAssetMetadata): UploadAssetMetadata {
  return {
    sizeBytes: metadata.sizeBytes,
    ...(metadata.mimeType !== undefined ? { mimeType: metadata.mimeType } : {}),
    ...(metadata.checksum !== undefined ? { checksum: metadata.checksum } : {}),
    ...(metadata.checksumAlgorithm !== undefined ? { checksumAlgorithm: metadata.checksumAlgorithm } : {}),
    ...(metadata.width !== undefined ? { width: metadata.width } : {}),
    ...(metadata.height !== undefined ? { height: metadata.height } : {}),
    ...(metadata.durationSeconds !== undefined ? { durationSeconds: metadata.durationSeconds } : {}),
    ...(metadata.pageCount !== undefined ? { pageCount: metadata.pageCount } : {}),
    ...(metadata.variants !== undefined ? { variants: metadata.variants.map(cloneUploadAssetVariant) } : {}),
    ...(metadata.reviewAnnotations !== undefined ? { reviewAnnotations: [...metadata.reviewAnnotations] } : {}),
  };
}

export function cloneUploadAsset(asset: UploadAsset): UploadAsset {
  return {
    assetId: asset.assetId,
    fileType: asset.fileType,
    fileName: asset.fileName,
    url: asset.url,
    ...(asset.thumbnailUrl !== undefined ? { thumbnailUrl: asset.thumbnailUrl } : {}),
    ...(asset.coverImageUrl !== undefined ? { coverImageUrl: asset.coverImageUrl } : {}),
    metadata: cloneUploadAssetMetadata(asset.metadata),
    ...(asset.derivedAssetSummary !== undefined ? { derivedAssetSummary: asset.derivedAssetSummary } : {}),
    ...(asset.ownershipSummary !== undefined ? { ownershipSummary: asset.ownershipSummary } : {}),
  };
}
