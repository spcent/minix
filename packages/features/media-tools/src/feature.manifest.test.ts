import assert from "node:assert/strict";
import test from "node:test";

import { ok, type AppKernel } from "@minix/core";

import { mediaToolsCapabilityRequirements, mediaToolsFeatureManifest } from "./feature.manifest";
import { createDefaultMediaToolsState } from "./model";

function createKernelStub() {
  return {
    capability: {
      status(capability: "clipboard" | "device" | "location" | "payment" | "share" | "subscription" | "upload") {
        return ok({
          capability,
          available: true,
          mode: "native",
          detail: "Capability is available.",
        });
      },
      async execute() {
        return ok({
          capability: "upload",
          action: "selectAsset",
          value: {
            uploadTask: {
              taskId: "task_1",
              scenario: "content",
              fileType: "image",
              stage: "completed",
              progress: {
                completedBytes: 100,
                totalBytes: 100,
                percentage: 100,
              },
              chunkingReserved: true,
              governance: {
                maxSizeBytes: 10_000_000,
                acceptedFileTypes: ["image", "pdf", "attachment"],
                sensitiveReviewRequired: true,
              },
              reviewStatus: "pending",
              lifecycle: {
                backendBacked: false,
                retentionStatus: "active",
                retryCount: 0,
                canRetry: true,
                canCancel: false,
              },
            },
          },
        });
      },
    },
  } as unknown as AppKernel;
}

test("media-tools feature manifest exposes workspace metadata", () => {
  assert.deepEqual(mediaToolsCapabilityRequirements, [
    { capability: "upload", required: false },
    { capability: "share", required: false },
  ]);
});

test("media-tools feature manifest creates a reusable workspace controller from host page data", () => {
  const controller = mediaToolsFeatureManifest.createController(
    "h5",
    createKernelStub(),
    {},
    createDefaultMediaToolsState(),
  );

  controller.loadInitial();

  assert.equal(controller.store.getState().title, "Media Tools");
  assert.equal(controller.store.getState().uploadAvailable, true);
});
