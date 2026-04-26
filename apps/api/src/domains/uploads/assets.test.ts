import assert from "node:assert/strict";
import test from "node:test";

import type { UploadAssetMetadata, UploadDerivedAssetVariant } from "@minix/contracts";

import { cloneUploadAssetMetadata, cloneUploadAssetVariant } from "./assets";

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
