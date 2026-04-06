import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultSettingsPageModel } from "./index";

test("createDefaultSettingsPageModel provides canonical feature defaults", () => {
  const model = createDefaultSettingsPageModel();

  assert.equal(model.title, "Settings");
  assert.equal(model.sections[0]?.key, "account");
  assert.equal(model.sections[0]?.items[0]?.label, "Logout");
  assert.equal(model.sections[0]?.items[0]?.value, "Sign out");
});
