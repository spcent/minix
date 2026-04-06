import test from "node:test";
import assert from "node:assert/strict";

import { createAccountController } from "./index";

test("account controller marks state ready", () => {
  const controller = createAccountController();

  assert.equal(controller.store.getState().ready, false);
  controller.markReady();
  assert.equal(controller.store.getState().ready, true);
});
