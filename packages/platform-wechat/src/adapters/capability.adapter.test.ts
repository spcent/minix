import assert from "node:assert/strict";
import test from "node:test";

import { createWechatCapabilityAdapter } from "./capability.adapter";

test("wechat capability adapter reports clipboard share and device support", () => {
  const adapter = createWechatCapabilityAdapter({
    getLocation() {},
    getSystemInfo() {},
    setClipboardData() {},
    showShareMenu() {},
  });

  assert.deepEqual(adapter.status("clipboard"), { ok: true, value: true });
  assert.deepEqual(adapter.status("device"), { ok: true, value: true });
  assert.deepEqual(adapter.status("location"), { ok: true, value: true });
  assert.deepEqual(adapter.status("share"), { ok: true, value: true });
  assert.deepEqual(adapter.status("payment"), { ok: true, value: false });
});

test("wechat capability adapter delegates clipboard writes and device info lookup", async () => {
  const calls: string[] = [];
  const adapter = createWechatCapabilityAdapter({
    getSystemInfo(options) {
      calls.push("device");
      options.success?.({ model: "wechat-test-device" });
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

  assert.deepEqual(calls, ["clipboard:hello", "device"]);
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
});
