import assert from "node:assert/strict";
import test from "node:test";

import { createH5CapabilityAdapter } from "./capability.adapter";

test("h5 capability adapter reports clipboard share and device support", () => {
  const adapter = createH5CapabilityAdapter({
    navigator: {
      clipboard: {
        async writeText() {},
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

  assert.deepEqual(adapter.status("clipboard"), { ok: true, value: true });
  assert.deepEqual(adapter.status("share"), { ok: true, value: true });
  assert.deepEqual(adapter.status("device"), { ok: true, value: true });
  assert.deepEqual(adapter.status("payment"), { ok: true, value: true });
  assert.deepEqual(adapter.status("upload"), { ok: true, value: true });
});

test("h5 capability adapter can write clipboard text, read device info, and reserve payment/upload/share execution", async () => {
  const clipboardWrites: string[] = [];
  const adapter = createH5CapabilityAdapter({
    navigator: {
      clipboard: {
        async writeText(text) {
          clipboardWrites.push(text);
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
  assert.deepEqual(paymentResult, {
    ok: true,
    value: {
      capability: "payment",
      action: "startPayment",
      value: {
        accepted: true,
        orderId: "ord_1",
      },
      detail: "payment execution reserved through h5 capability adapter",
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
      detail: "upload reservation selected through h5 capability adapter",
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
      detail: "share dispatch reserved through h5 capability adapter",
    },
  });
});
