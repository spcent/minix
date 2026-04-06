import assert from "node:assert/strict";
import test from "node:test";

import { createH5TelemetryAdapter } from "./telemetry.adapter";

test("h5 telemetry adapter writes event error and span payloads to the logger", async () => {
  const calls: string[] = [];
  const adapter = createH5TelemetryAdapter({
    logger: {
      debug(prefix, payload) {
        calls.push(`${String(prefix)}:${(payload as { name: string }).name}`);
      },
      info(prefix, payload) {
        calls.push(`${String(prefix)}:${(payload as { name: string }).name}`);
      },
      error(prefix, payload) {
        calls.push(`${String(prefix)}:${(payload as { name: string }).name}`);
      },
    },
  });

  await adapter.event({ name: "page_view" });
  await adapter.error({ name: "page_error", message: "boom" });
  await adapter.span({ name: "bootstrap" });

  assert.deepEqual(calls, [
    "[minix:h5:event]:page_view",
    "[minix:h5:error]:page_error",
    "[minix:h5:span]:bootstrap",
  ]);
});
