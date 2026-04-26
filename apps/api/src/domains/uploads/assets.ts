import type { UploadAsset, UploadAssetMetadata, UploadDerivedAssetVariant } from "@minix/contracts";

export function cloneUploadAssetVariant(variant: UploadDerivedAssetVariant): UploadDerivedAssetVariant {
  return {
    kind: variant.kind,
    url: variant.url,
    label: variant.label,
    ...(variant.width !== undefined ? { width: variant.width } : {}),
    ...(variant.height !== undefined ? { height: variant.height } : {}),
    ...(variant.durationSeconds !== undefined ? { durationSeconds: variant.durationSeconds } : {}),
    ...(variant.pageCount !== undefined ? { pageCount: variant.pageCount } : {}),
  };
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
