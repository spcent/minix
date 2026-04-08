import assert from "node:assert/strict";
import test from "node:test";

import { createWechatCapabilityAdapter } from "./capability.adapter";

test("wechat capability adapter reports clipboard share and device support", () => {
  const adapter = createWechatCapabilityAdapter({
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
});

test("wechat capability adapter delegates clipboard writes, device info lookup, and payment execution", async () => {
  const calls: string[] = [];
  const adapter = createWechatCapabilityAdapter({
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

  assert.deepEqual(calls, ["clipboard:hello", "device", "payment:ord_1"]);
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
      detail: "payment execution reserved through wechat capability adapter",
    },
  });
});
