import assert from "node:assert/strict";
import test from "node:test";

import type { UploadAsset, UploadAssetMetadata, UploadDerivedAssetVariant } from "@minix/contracts";

import { cloneUploadAsset, cloneUploadAssetMetadata, cloneUploadAssetVariant } from "./assets";

test("upload asset variant helper preserves optional dimensions", () => {
  const variant: UploadDerivedAssetVariant = {
    kind: "thumbnail",
    url: "https://assets.example.test/thumb.png",
    label: "Thumbnail",
    width: 120,
    height: 80,
    durationSeconds: 0,
    pageCount: 1,
  };

  assert.deepEqual(cloneUploadAssetVariant(variant), variant);
});

test("upload asset metadata helper clones variants and review annotations", () => {
  const metadata: UploadAssetMetadata = {
    sizeBytes: 2048,
    mimeType: "image/png",
    checksum: "sha256:demo",
    checksumAlgorithm: "sha256",
    width: 640,
    height: 360,
    durationSeconds: 0,
    pageCount: 1,
    variants: [
      {
        kind: "original",
        url: "https://assets.example.test/original.png",
        label: "Original",
        width: 640,
        height: 360,
      },
    ],
    reviewAnnotations: ["Review status: pending."],
  };

  const snapshot = cloneUploadAssetMetadata(metadata);

  assert.deepEqual(snapshot, metadata);
  assert.notEqual(snapshot.variants, metadata.variants);
  assert.notEqual(snapshot.variants?.[0], metadata.variants?.[0]);
  assert.notEqual(snapshot.reviewAnnotations, metadata.reviewAnnotations);
});

test("upload asset clone helper clones top-level and nested fields", () => {
  const asset: UploadAsset = {
    assetId: "asset_1",
    fileType: "image",
    fileName: "demo.png",
    url: "https://assets.example.test/demo.png",
    thumbnailUrl: "https://assets.example.test/demo-thumb.png",
    coverImageUrl: "https://assets.example.test/demo-cover.png",
    metadata: {
      sizeBytes: 2048,
      mimeType: "image/png",
      variants: [
        {
          kind: "thumbnail",
          url: "https://assets.example.test/demo-thumb.png",
          label: "Thumbnail",
          width: 120,
          height: 80,
        },
      ],
      reviewAnnotations: ["Provider: sample-review."],
    },
    derivedAssetSummary: "1 derived asset variant is available.",
    ownershipSummary: "Attached to feedback ticket ticket_1.",
  };

  const snapshot = cloneUploadAsset(asset);

  assert.deepEqual(snapshot, asset);
  assert.notEqual(snapshot.metadata, asset.metadata);
  assert.notEqual(snapshot.metadata.variants, asset.metadata.variants);
  assert.notEqual(snapshot.metadata.reviewAnnotations, asset.metadata.reviewAnnotations);
});
