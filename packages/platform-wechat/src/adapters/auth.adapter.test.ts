import test from "node:test";
import assert from "node:assert/strict";

import { createWechatAuthAdapter } from "./auth.adapter";

test("wechat auth adapter reads code from wx.login", async () => {
  const adapter = createWechatAuthAdapter({
    login(options) {
      options.success?.({ code: "wx-code" });
    },
  });

  const result = await adapter.login();
  assert.deepEqual(result, {
    ok: true,
    value: {
      platform: "wechat",
      credential: { code: "wx-code" },
    },
  });
});

test("wechat auth adapter maps missing code to login failure", async () => {
  const adapter = createWechatAuthAdapter({
    login(options) {
      options.success?.({});
    },
  });

  const result = await adapter.login();
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "LOGIN_FAILED");
  }
});
