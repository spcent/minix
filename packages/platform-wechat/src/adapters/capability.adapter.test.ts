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

  assert.deepEqual(adapter.status("clipboard"), { ok: true, value: true });
  assert.deepEqual(adapter.status("device"), { ok: true, value: true });
  assert.deepEqual(adapter.status("location"), { ok: true, value: true });
  assert.deepEqual(adapter.status("share"), { ok: true, value: true });
  assert.deepEqual(adapter.status("payment"), { ok: true, value: true });
  assert.deepEqual(adapter.status("upload"), { ok: true, value: true });
});

test("wechat capability adapter delegates clipboard writes, device info lookup, and payment/upload/share execution", async () => {
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

  assert.deepEqual(calls, ["clipboard:hello", "device", "payment:ord_1", "upload:media", "upload:file", "share"]);
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
  assert.deepEqual(paymentResult, {
    ok: true,
    value: {
      capability: "payment",
      action: "startPayment",
      value: {
        accepted: true,
      },
      detail: "wechat payment execution dispatched with gateway client parameters",
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
      detail: "upload reservation selected through wechat chooseMedia",
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
      detail: "upload reservation selected through wechat chooseMessageFile",
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
      detail: "share dispatch reserved through wechat capability adapter",
    },
  });
});
