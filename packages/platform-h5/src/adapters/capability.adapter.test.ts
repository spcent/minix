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
  });

  assert.deepEqual(adapter.status("clipboard"), { ok: true, value: true });
  assert.deepEqual(adapter.status("share"), { ok: true, value: true });
  assert.deepEqual(adapter.status("device"), { ok: true, value: true });
  assert.deepEqual(adapter.status("payment"), { ok: true, value: true });
});

test("h5 capability adapter can write clipboard text, read device info, and reserve payment execution", async () => {
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
      userAgent: "MiniX Test Browser",
    },
    payment: {
      async startPayment(payload) {
        return { accepted: true, orderId: payload.orderId as string };
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
});
