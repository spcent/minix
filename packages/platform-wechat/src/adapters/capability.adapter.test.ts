import assert from "node:assert/strict";
import test from "node:test";

import { createWechatCapabilityAdapter } from "./capability.adapter";

test("wechat capability adapter reports clipboard share and device support", () => {
  const adapter = createWechatCapabilityAdapter({
    chooseMedia() {},
    chooseMessageFile() {},
    getLocation() {},
    getSystemInfo() {},
    requestPayment() {},
    setClipboardData() {},
    showShareMenu() {},
  });

  assert.deepEqual(adapter.status("clipboard"), {
    ok: true,
    value: { capability: "clipboard", available: true, mode: "native", detail: "WeChat clipboard API is available." },
  });
  assert.deepEqual(adapter.status("device"), {
    ok: true,
    value: { capability: "device", available: true, mode: "native", detail: "WeChat device info API is available." },
  });
  assert.deepEqual(adapter.status("location"), {
    ok: true,
    value: { capability: "location", available: true, mode: "native", detail: "WeChat location API is available." },
  });
  assert.deepEqual(adapter.status("share"), {
    ok: true,
    value: { capability: "share", available: true, mode: "native", detail: "WeChat share menu is available." },
  });
  assert.deepEqual(adapter.status("payment"), {
    ok: true,
    value: { capability: "payment", available: true, mode: "native", detail: "WeChat payment API is available." },
  });
  assert.deepEqual(adapter.status("upload"), {
    ok: true,
    value: { capability: "upload", available: true, mode: "native", detail: "WeChat media or file picker is available." },
  });
});

test("wechat capability adapter delegates clipboard writes, device info lookup, location, and payment/upload/share execution", async () => {
  const calls: string[] = [];
  const adapter = createWechatCapabilityAdapter({
    chooseMedia(options) {
      calls.push("upload:media");
      options.success?.({
        uploadTask: {
          taskId: "wechat_media_1",
          lifecycle: {
            backendBacked: false,
            retentionStatus: "active",
            retryCount: 0,
            canRetry: true,
            canCancel: false,
          },
        },
      });
    },
    chooseMessageFile(options) {
      calls.push("upload:file");
      options.success?.({
        uploadTask: {
          taskId: "wechat_file_1",
          lifecycle: {
            backendBacked: false,
            retentionStatus: "active",
            retryCount: 0,
            canRetry: true,
            canCancel: false,
          },
        },
      });
    },
    getSystemInfo(options) {
      calls.push("device");
      options.success?.({ model: "wechat-test-device" });
    },
    getLocation(options) {
      calls.push("location");
      options.success?.({ latitude: 31.2, longitude: 121.5 });
    },
    requestPayment(options) {
      calls.push(`payment:${String(options.orderId)}`);
      options.success?.({ accepted: true });
    },
    setClipboardData(options) {
      calls.push(`clipboard:${options.data}`);
      options.success?.();
    },
    showShareMenu(options) {
      calls.push("share");
      options.success?.();
    },
  });

  const clipboardResult = await adapter.execute({
    capability: "clipboard",
    action: "writeText",
    payload: { text: "hello" },
  });
  const deviceResult = await adapter.execute<{ model: string }>({
    capability: "device",
    action: "getInfo",
  });
  const locationResult = await adapter.execute<{ latitude: number; longitude: number }>({
    capability: "location",
    action: "getCurrentPosition",
  });
  const paymentResult = await adapter.execute<{ accepted: boolean }>({
    capability: "payment",
    action: "startPayment",
    payload: { orderId: "ord_1" },
  });
  const uploadMediaResult = await adapter.execute<{ uploadTask: { taskId: string } }>({
    capability: "upload",
    action: "selectAsset",
    payload: { preferredFileType: "image", maxSelectCount: 1 },
  });
  const uploadFileResult = await adapter.execute<{ uploadTask: { taskId: string } }>({
    capability: "upload",
    action: "selectAsset",
    payload: { preferredFileType: "pdf", maxSelectCount: 1 },
  });
  const shareResult = await adapter.execute<{ sharePayload: { title: string } }>({
    capability: "share",
    action: "dispatchShare",
    payload: { sharePayload: { title: "Invite" } },
  });

  assert.deepEqual(calls, ["clipboard:hello", "device", "location", "payment:ord_1", "upload:media", "upload:file", "share"]);
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
        model: "wechat-test-device",
      },
    },
  });
  assert.deepEqual(locationResult, {
    ok: true,
    value: {
      capability: "location",
      action: "getCurrentPosition",
      value: {
        latitude: 31.2,
        longitude: 121.5,
      },
      detail: "WeChat location resolved successfully.",
    },
  });
  assert.deepEqual(paymentResult, {
    ok: true,
    value: {
      capability: "payment",
      action: "startPayment",
      value: {
        accepted: true,
      },
      detail: "WeChat payment executed with gateway client parameters.",
    },
  });
  assert.deepEqual(uploadMediaResult, {
    ok: true,
    value: {
      capability: "upload",
      action: "selectAsset",
      value: {
        uploadTask: {
          taskId: "wechat_media_1",
          lifecycle: {
            backendBacked: false,
            retentionStatus: "active",
            retryCount: 0,
            canRetry: true,
            canCancel: false,
          },
        },
      },
      detail: "WeChat chooseMedia selected upload input.",
    },
  });
  assert.deepEqual(uploadFileResult, {
    ok: true,
    value: {
      capability: "upload",
      action: "selectAsset",
      value: {
        uploadTask: {
          taskId: "wechat_file_1",
          lifecycle: {
            backendBacked: false,
            retentionStatus: "active",
            retryCount: 0,
            canRetry: true,
            canCancel: false,
          },
        },
      },
      detail: "WeChat chooseMessageFile selected upload input.",
    },
  });
  assert.deepEqual(shareResult, {
    ok: true,
    value: {
      capability: "share",
      action: "dispatchShare",
      value: {
        sharePayload: { title: "Invite" },
      },
      detail: "WeChat share menu dispatched successfully.",
    },
  });
});

test("wechat capability adapter falls back to clipboard for poster shares when share menu is unavailable", async () => {
  const calls: string[] = [];
  const adapter = createWechatCapabilityAdapter({
    setClipboardData(options) {
      calls.push(`clipboard:${options.data}`);
      options.success?.();
    },
  });

  const shareResult = await adapter.execute({
    capability: "share",
    action: "dispatchShare",
    payload: {
      sharePayload: {
        title: "Invite",
        posterImageUrl: "https://example.test/posters/share1.svg",
        shortLink: "https://mini.x/s/share1",
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
      detail: "WeChat share menu is unavailable. Falling back to clipboard copy.",
      reason: "clipboard-fallback",
      fallbackActionLabel: "Copy share link",
    },
  });
  assert.deepEqual(calls, ["clipboard:https://example.test/posters/share1.svg"]);
  assert.deepEqual(shareResult, {
    ok: true,
    value: {
      capability: "share",
      action: "dispatchShare",
      value: {
        sharePayload: {
          title: "Invite",
          posterImageUrl: "https://example.test/posters/share1.svg",
          shortLink: "https://mini.x/s/share1",
        },
        shareChannel: {
          kind: "poster_image",
        },
      },
      detail: "WeChat share menu was unavailable. Copied the share target to clipboard instead.",
      degraded: true,
      fallbackActionLabel: "Copy share link",
    },
  });
});

test("wechat capability adapter reports unavailable states when runtime apis are missing", async () => {
  const adapter = createWechatCapabilityAdapter({});

  assert.deepEqual(adapter.status("payment"), {
    ok: true,
    value: {
      capability: "payment",
      available: false,
      mode: "unavailable",
      detail: "WeChat payment API is unavailable.",
      reason: "payment-api-missing",
    },
  });

  const locationResult = await adapter.execute({
    capability: "location",
    action: "getCurrentPosition",
  });
  assert.equal(locationResult.ok, false);
  if (!locationResult.ok) {
    assert.equal(locationResult.error.code, "CAPABILITY_UNAVAILABLE");
  }
});
