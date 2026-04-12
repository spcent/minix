import assert from "node:assert/strict";
import test from "node:test";

import type { UploadSelectionResult } from "@minix/contracts";

import { createH5CapabilityAdapter } from "./capability.adapter";

test("h5 capability adapter reports clipboard share and device support", () => {
  const adapter = createH5CapabilityAdapter({
    navigator: {
      clipboard: {
        async writeText() {},
      },
      geolocation: {
        getCurrentPosition(success) {
          success({ latitude: 1, longitude: 2 });
        },
      },
      share: async () => undefined,
      userAgent: "MiniX Test Browser",
    },
    payment: {
      async startPayment() {},
    },
    upload: {
      async selectFiles() {},
    },
  });

  assert.deepEqual(adapter.status("clipboard"), {
    ok: true,
    value: { capability: "clipboard", available: true, mode: "native", detail: "Browser clipboard API is available." },
  });
  assert.deepEqual(adapter.status("share"), {
    ok: true,
    value: { capability: "share", available: true, mode: "native", detail: "Native browser share is available." },
  });
  assert.deepEqual(adapter.status("device"), {
    ok: true,
    value: { capability: "device", available: true, mode: "native", detail: "Browser navigator metadata is available." },
  });
  assert.deepEqual(adapter.status("location"), {
    ok: true,
    value: { capability: "location", available: true, mode: "native", detail: "Browser geolocation is available." },
  });
  assert.deepEqual(adapter.status("payment"), {
    ok: true,
    value: { capability: "payment", available: true, mode: "native", detail: "Configured H5 payment runtime is available." },
  });
  assert.deepEqual(adapter.status("upload"), {
    ok: true,
    value: { capability: "upload", available: true, mode: "native", detail: "Configured H5 upload runtime is available." },
  });
});

test("h5 capability adapter can write clipboard text, read device info, resolve location, and execute payment/upload/share", async () => {
  const clipboardWrites: string[] = [];
  const adapter = createH5CapabilityAdapter({
    navigator: {
      clipboard: {
        async writeText(text) {
          clipboardWrites.push(text);
        },
      },
      geolocation: {
        getCurrentPosition(success) {
          success({ coords: { latitude: 31.2, longitude: 121.5 } });
        },
      },
      language: "en-US",
      platform: "MacIntel",
      share: async () => undefined,
      userAgent: "MiniX Test Browser",
    },
    payment: {
      async startPayment(payload) {
        return { accepted: true, orderId: payload.orderId as string };
      },
    },
    upload: {
      async selectFiles() {
        return {
          uploadTask: {
            taskId: "task_upload_1",
            scenario: "content",
            fileType: "image",
            stage: "completed",
            fileName: "cover.png",
            progress: {
              completedBytes: 1200,
              totalBytes: 1200,
              percentage: 100,
            },
            chunkingReserved: true,
            governance: {
              maxSizeBytes: 5_000_000,
              acceptedFileTypes: ["image", "attachment"],
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
          uploadAsset: {
            assetId: "asset_1",
            fileType: "image",
            fileName: "cover.png",
            url: "https://example.test/assets/cover.png",
            metadata: {
              sizeBytes: 1200,
            },
          },
        };
      },
    },
  });

  const clipboardResult = await adapter.execute({
    capability: "clipboard",
    action: "writeText",
    payload: { text: "hello" },
  });
  const deviceResult = await adapter.execute<{
    userAgent: string;
    language: string;
    platform: string;
  }>({
    capability: "device",
    action: "getInfo",
  });
  const locationResult = await adapter.execute<{ coords: { latitude: number; longitude: number } }>({
    capability: "location",
    action: "getCurrentPosition",
  });
  const paymentResult = await adapter.execute<{ accepted: boolean; orderId: string }>({
    capability: "payment",
    action: "startPayment",
    payload: { orderId: "ord_1" },
  });
  const uploadResult = await adapter.execute<{
    uploadTask: { taskId: string; stage: string };
    uploadAsset: { assetId: string; url: string };
  }>({
    capability: "upload",
    action: "selectAsset",
    payload: {
      preferredFileType: "image",
    },
  });
  const shareResult = await adapter.execute<{
    sharePayload: { title: string };
    shareChannel: { kind: string };
  }>({
    capability: "share",
    action: "dispatchShare",
    payload: {
      sharePayload: { title: "Invite a friend" },
      shareChannel: { kind: "copy_link" },
    },
  });

  assert.deepEqual(clipboardWrites, ["hello"]);
  assert.deepEqual(clipboardResult, {
    ok: true,
    value: {
      capability: "clipboard",
      action: "writeText",
    },
  });
  assert.deepEqual(deviceResult, {
    ok: true,
    value: {
      capability: "device",
      action: "getInfo",
      value: {
        userAgent: "MiniX Test Browser",
        language: "en-US",
        platform: "MacIntel",
      },
    },
  });
  assert.deepEqual(locationResult, {
    ok: true,
    value: {
      capability: "location",
      action: "getCurrentPosition",
      value: {
        coords: {
          latitude: 31.2,
          longitude: 121.5,
        },
      },
      detail: "Browser geolocation resolved successfully.",
    },
  });
  assert.deepEqual(paymentResult, {
    ok: true,
    value: {
      capability: "payment",
      action: "startPayment",
      value: {
        accepted: true,
        orderId: "ord_1",
      },
      detail: "H5 payment runtime executed with gateway client parameters.",
    },
  });
  assert.deepEqual(uploadResult, {
    ok: true,
    value: {
      capability: "upload",
      action: "selectAsset",
      value: {
        uploadTask: {
          taskId: "task_upload_1",
          scenario: "content",
          fileType: "image",
          stage: "completed",
          fileName: "cover.png",
          progress: {
            completedBytes: 1200,
            totalBytes: 1200,
            percentage: 100,
          },
          chunkingReserved: true,
          governance: {
            maxSizeBytes: 5_000_000,
            acceptedFileTypes: ["image", "attachment"],
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
        uploadAsset: {
          assetId: "asset_1",
          fileType: "image",
          fileName: "cover.png",
          url: "https://example.test/assets/cover.png",
          metadata: {
            sizeBytes: 1200,
          },
        },
      },
      detail: "Configured H5 upload runtime selected upload input.",
    },
  });
  assert.deepEqual(shareResult, {
    ok: true,
    value: {
      capability: "share",
      action: "dispatchShare",
      value: {
        sharePayload: { title: "Invite a friend" },
        shareChannel: { kind: "copy_link" },
      },
      detail: "Native browser share dispatched successfully.",
    },
  });
});

test("h5 capability adapter falls back to clipboard for poster and short-link shares when navigator.share is unavailable", async () => {
  const clipboardWrites: string[] = [];
  const adapter = createH5CapabilityAdapter({
    navigator: {
      clipboard: {
        async writeText(text) {
          clipboardWrites.push(text);
        },
      },
    },
  });

  const shareResult = await adapter.execute({
    capability: "share",
    action: "dispatchShare",
    payload: {
      sharePayload: {
        title: "Invite a friend",
        shortLink: "https://mini.x/s/share1",
        posterImageUrl: "https://example.test/posters/share1.svg",
      },
      shareChannel: {
        kind: "poster_image",
      },
    },
  });

  assert.deepEqual(adapter.status("share"), {
    ok: true,
    value: {
      capability: "share",
      available: true,
      mode: "degraded",
      detail: "Native browser share is unavailable. Falling back to clipboard copy.",
      reason: "clipboard-fallback",
      fallbackActionLabel: "Copy share link",
    },
  });
  assert.deepEqual(clipboardWrites, ["https://example.test/posters/share1.svg"]);
  assert.deepEqual(shareResult, {
    ok: true,
    value: {
      capability: "share",
      action: "dispatchShare",
      value: {
        sharePayload: {
          title: "Invite a friend",
          shortLink: "https://mini.x/s/share1",
          posterImageUrl: "https://example.test/posters/share1.svg",
        },
        shareChannel: {
          kind: "poster_image",
        },
      },
      detail: "Native browser share was unavailable. Copied the share target to clipboard instead.",
      degraded: true,
      fallbackActionLabel: "Copy share link",
    },
  });
});

test("h5 capability adapter uses document file picker fallback and reports unavailable payment when unconfigured", async () => {
  const picker = {
    files: [
      {
        name: "cover.png",
        size: 4,
        type: "image/png",
        async arrayBuffer() {
          return Uint8Array.from([1, 2, 3, 4]).buffer;
        },
      },
    ],
    click() {
      this.onchange?.();
    },
  } as {
    files: Array<{ name: string; size: number; type: string; arrayBuffer: () => Promise<ArrayBuffer> }>;
    onchange?: () => void;
    click: () => void;
  };
  const adapter = createH5CapabilityAdapter({
    document: {
      createElement() {
        return picker;
      },
    },
  });

  const uploadResult = await adapter.execute<UploadSelectionResult>({
    capability: "upload",
    action: "selectAsset",
    payload: {
      scenario: "content",
      preferredFileType: "image",
      acceptedFileTypes: ["image"],
      maxSelectCount: 1,
      governance: {
        maxSizeBytes: 10_000_000,
        acceptedFileTypes: ["image"],
        sensitiveReviewRequired: true,
      },
    },
  });

  assert.deepEqual(adapter.status("payment"), {
    ok: true,
    value: {
      capability: "payment",
      available: false,
      mode: "unavailable",
      detail: "No H5 payment runtime is configured for this host.",
      reason: "payment-runtime-missing",
    },
  });
  assert.equal(uploadResult.ok, true);
  assert.equal(uploadResult.ok && uploadResult.value.value?.uploadTask.stage, "chunking_reserved");
  assert.equal(uploadResult.ok && uploadResult.value.value?.transfer?.chunks.length, 1);
});
