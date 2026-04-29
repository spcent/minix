import { createHash } from "node:crypto";

import type {
  UploadAsset,
  UploadSelectionResult,
  UploadTask,
  UploadTransferPayload,
} from "@minix/contracts";

import type { UserState } from "../../types";
import { cloneUploadTransferPayload } from "./tasks";

const DEFAULT_UPLOAD_CHUNK_SIZE_BYTES = 64 * 1024;
const REDUCED_UPLOAD_CHUNK_SIZE_BYTES = 16 * 1024;
const WEAK_NETWORK_UPLOAD_CHUNK_SIZE_BYTES = 8 * 1024;

export function createUploadHash(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function decodeBase64ToBuffer(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

function resolveUploadChunkSizeBytes(userState?: UserState): number {
  const networkStrategy = userState?.settingsState?.preferences?.device?.networkStrategy ?? "balanced";
  const weakNetworkMode = userState?.settingsState?.preferences?.device?.weakNetworkMode ?? false;
  if (weakNetworkMode) {
    return WEAK_NETWORK_UPLOAD_CHUNK_SIZE_BYTES;
  }
  if (networkStrategy === "data-saver") {
    return REDUCED_UPLOAD_CHUNK_SIZE_BYTES;
  }
  return DEFAULT_UPLOAD_CHUNK_SIZE_BYTES;
}

function createSyntheticTransferPayload(
  task: UploadTask,
  selectedAsset: UploadAsset,
  userState?: UserState,
): UploadTransferPayload {
  const totalBytes = selectedAsset.metadata.sizeBytes;
  const seed = `${task.scenario}:${task.fileType}:${task.fileName ?? selectedAsset.fileName}:`;
  const repeated = seed.repeat(Math.ceil(totalBytes / Math.max(seed.length, 1))).slice(0, totalBytes);
  const configuredChunkSize = resolveUploadChunkSizeBytes(userState);
  const chunkSizeBytes = Math.min(configuredChunkSize, Math.max(totalBytes, 1));
  const chunks: UploadTransferPayload["chunks"] = [];
  let byteOffset = 0;
  while (byteOffset < totalBytes) {
    const nextLength = Math.min(chunkSizeBytes, totalBytes - byteOffset);
    const chunkBytes = Buffer.from(repeated.slice(byteOffset, byteOffset + nextLength), "utf8");
    chunks.push({
      chunkIndex: chunks.length,
      byteOffset,
      byteLength: nextLength,
      checksum: createUploadHash(chunkBytes),
      checksumAlgorithm: "sha256",
      dataBase64: chunkBytes.toString("base64"),
    });
    byteOffset += nextLength;
  }

  return {
    mode: chunks.length > 1 ? "chunked" : "single_part",
    checksumAlgorithm: "sha256",
    fileChecksum: createUploadHash(Buffer.from(repeated, "utf8")),
    totalBytes,
    chunkSizeBytes,
    chunks,
  };
}

export function resolveSelectionTransfer(selection: UploadSelectionResult, userState?: UserState): UploadTransferPayload | undefined {
  if (selection.transfer) {
    return cloneUploadTransferPayload(selection.transfer);
  }
  if (!selection.uploadAsset) {
    return undefined;
  }
  return createSyntheticTransferPayload(selection.uploadTask, selection.uploadAsset, userState);
}
