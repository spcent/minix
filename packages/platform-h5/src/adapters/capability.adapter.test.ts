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
  });

  assert.deepEqual(adapter.status("clipboard"), { ok: true, value: true });
  assert.deepEqual(adapter.status("share"), { ok: true, value: true });
  assert.deepEqual(adapter.status("device"), { ok: true, value: true });
  assert.deepEqual(adapter.status("payment"), { ok: true, value: false });
});

test("h5 capability adapter can write clipboard text and read device info", async () => {
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
});
