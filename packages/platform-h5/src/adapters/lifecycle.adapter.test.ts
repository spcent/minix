import assert from "node:assert/strict";
import test from "node:test";

import { createH5LifecycleAdapter } from "./lifecycle.adapter";

test("h5 lifecycle adapter maps visibility changes into app foreground and background events", async () => {
  const events: string[] = [];
  let visibilityListener: (() => void) | undefined;
  const document = {
    visibilityState: "visible",
    addEventListener(event: string, listener: () => void) {
      if (event === "visibilitychange") {
        visibilityListener = listener;
      }
    },
  };

  const adapter = createH5LifecycleAdapter({
    document,
  });
  const subscription = adapter.subscribe(async (event) => {
    events.push(`${event.scope}:${event.event}`);
  });

  assert.equal(subscription.ok, true);

  document.visibilityState = "hidden";
  visibilityListener?.();
  await Promise.resolve();

  document.visibilityState = "visible";
  visibilityListener?.();
  await Promise.resolve();

  assert.deepEqual(events, ["app:background", "app:foreground"]);
});
