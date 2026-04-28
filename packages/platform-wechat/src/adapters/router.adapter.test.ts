import assert from "node:assert/strict";
import test from "node:test";

import { createWechatRouterAdapter } from "./router.adapter";

test("wechat router adapter routes and tracks the current location", async () => {
  const calls: string[] = [];
  const adapter = createWechatRouterAdapter({
    navigateTo(options) {
      calls.push(`push:${options.url}`);
      options.success?.();
    },
    redirectTo(options) {
      calls.push(`replace:${options.url}`);
      options.success?.();
    },
    navigateBack(options) {
      calls.push(`back:${options.delta ?? 1}`);
      options.success?.();
    },
  });

  await adapter.push({ path: "/pages/items/index", params: { from: "plan" } });
  await adapter.replace({ path: "/pages/settings/index", params: { source: "items" } });
  await adapter.back(2);

  assert.deepEqual(calls, [
    "push:/pages/items/index?from=plan",
    "replace:/pages/settings/index?source=items",
    "back:2",
  ]);
  assert.deepEqual(adapter.current(), {
    ok: true,
    value: {
      path: "/pages/settings/index",
      params: { source: "items" },
    },
  });
});

test("wechat router adapter maps runtime failures to route errors", async () => {
  const adapter = createWechatRouterAdapter({
    navigateTo(options) {
      options.fail?.({ errMsg: "navigateTo:fail" });
    },
  });

  const result = await adapter.push({ path: "/pages/items/index" });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "ROUTE_ERROR");
    assert.equal(result.error.message, "wechat navigateTo failed");
    assert.equal(result.error.recoverable, true);
  }
  assert.deepEqual(adapter.current(), { ok: true, value: null });
});
