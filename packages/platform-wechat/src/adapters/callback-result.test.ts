import assert from "node:assert/strict";
import test from "node:test";

import { createWechatCallbackResult } from "./callback-result";

test("createWechatCallbackResult resolves callback success into ok result", async () => {
  const result = await createWechatCallbackResult(
    (resolveValue) => {
      resolveValue({ confirmed: true });
    },
    {
      code: "UNKNOWN",
      message: "callback failed",
    },
  );

  assert.deepEqual(result, { ok: true, value: { confirmed: true } });
});

test("createWechatCallbackResult resolves callback failure into app error result", async () => {
  const cause = { errMsg: "showModal:fail" };
  const result = await createWechatCallbackResult(
    (_resolveValue, rejectValue) => {
      rejectValue(cause);
    },
    {
      code: "NETWORK_ERROR",
      message: "wechat request failed",
      recoverable: false,
    },
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "NETWORK_ERROR");
    assert.equal(result.error.message, "wechat request failed");
    assert.equal(result.error.recoverable, false);
    assert.equal(result.error.cause, cause);
  }
});
