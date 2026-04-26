import assert from "node:assert/strict";
import test from "node:test";

import { cloneUploadChunkReceipt, cloneUploadSession } from "./records";

test("upload chunk receipt helper preserves receipt fields", () => {
  assert.deepEqual(
    cloneUploadChunkReceipt({
      chunkIndex: 1,
      byteOffset: 512,
      byteLength: 512,
      checksum: "sha256:chunk-1",
      checksumAlgorithm: "sha256",
      receivedAt: "2026-04-26T00:00:00.000Z",
    }),
    {
      chunkIndex: 1,
      byteOffset: 512,
      byteLength: 512,
      checksum: "sha256:chunk-1",
      checksumAlgorithm: "sha256",
      receivedAt: "2026-04-26T00:00:00.000Z",
    },
  );
});

test("upload session helper preserves session fields", () => {
  assert.deepEqual(
    cloneUploadSession({
      sessionId: "session_1",
      uploadToken: "token_1",
      objectKey: "object/asset_1",
      mode: "chunked",
      checksumAlgorithm: "sha256",
      chunkSizeBytes: 512,
      chunkCount: 2,
      receivedChunkCount: 1,
      nextChunkIndex: 1,
      resumeSupported: true,
      createdAt: "2026-04-26T00:00:00.000Z",
      expiresAt: "2026-04-27T00:00:00.000Z",
    }),
    {
      sessionId: "session_1",
      uploadToken: "token_1",
      objectKey: "object/asset_1",
      mode: "chunked",
      checksumAlgorithm: "sha256",
      chunkSizeBytes: 512,
      chunkCount: 2,
      receivedChunkCount: 1,
      nextChunkIndex: 1,
      resumeSupported: true,
      createdAt: "2026-04-26T00:00:00.000Z",
      expiresAt: "2026-04-27T00:00:00.000Z",
    },
  );
});
