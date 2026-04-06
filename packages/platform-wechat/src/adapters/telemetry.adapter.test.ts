import assert from "node:assert/strict";
import test from "node:test";

import { createWechatTelemetryAdapter } from "./telemetry.adapter";

test("wechat telemetry adapter uses reportAnalytics when available and logger fallbacks for errors and spans", async () => {
  const calls: string[] = [];
  const adapter = createWechatTelemetryAdapter(
    {
      reportAnalytics(name, payload) {
        calls.push(`analytics:${name}:${payload.route}`);
      },
    },
    {
      debug(prefix, payload) {
        calls.push(`${String(prefix)}:${(payload as { name: string }).name}`);
      },
      error(prefix, payload) {
        calls.push(`${String(prefix)}:${(payload as { name: string }).name}`);
      },
    },
  );

  await adapter.event({
    name: "page_view",
    attributes: {
      route: "/items",
    },
  });
  await adapter.error({ name: "page_error", message: "boom" });
  await adapter.span({ name: "bootstrap" });

  assert.deepEqual(calls, [
    "analytics:page_view:/items",
    "[minix:wechat:error]:page_error",
    "[minix:wechat:span]:bootstrap",
  ]);
});
