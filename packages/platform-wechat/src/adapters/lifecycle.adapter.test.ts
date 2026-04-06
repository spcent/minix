import assert from "node:assert/strict";
import test from "node:test";

import { createWechatLifecycleAdapter } from "./lifecycle.adapter";

test("wechat lifecycle adapter maps app show and hide callbacks into lifecycle events", async () => {
  const events: string[] = [];
  let onShow: (() => void) | undefined;
  let onHide: (() => void) | undefined;

  const adapter = createWechatLifecycleAdapter({
    onAppShow(listener) {
      onShow = listener;
    },
    onAppHide(listener) {
      onHide = listener;
    },
  });

  const subscription = adapter.subscribe(async (event) => {
    events.push(`${event.scope}:${event.event}`);
  });

  assert.equal(subscription.ok, true);

  onHide?.();
  await Promise.resolve();
  onShow?.();
  await Promise.resolve();

  assert.deepEqual(events, ["app:background", "app:foreground"]);
});
