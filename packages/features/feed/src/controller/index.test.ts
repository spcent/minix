import test from "node:test";
import assert from "node:assert/strict";

import { createFeedController } from "./index";

test("feed controller marks state ready", () => {
  const controller = createFeedController();

  assert.equal(controller.store.getState().ready, false);
  controller.markReady();
  assert.equal(controller.store.getState().ready, true);
});
