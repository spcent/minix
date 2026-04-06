import test from "node:test";
import assert from "node:assert/strict";

import { createWechatAppBridge } from "./app.bridge";

test("app bridge resolves runtime before invoking hooks", async () => {
  const events: string[] = [];
  const runtime = { name: "runtime" };

  const app = createWechatAppBridge({
    async loadRuntime() {
      events.push("load");
      return runtime;
    },
    async onLaunch(current) {
      events.push(current.name);
    },
  });

  await app.onLaunch?.();
  assert.deepEqual(events, ["load", "runtime"]);
});
