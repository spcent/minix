import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultItemsPageModel } from "./index";

test("createDefaultItemsPageModel provides canonical feature defaults", () => {
  const model = createDefaultItemsPageModel();

  assert.equal(model.title, "Items");
  assert.equal(model.query.pageSize, 20);
  assert.equal(model.emptyText, "No items yet");
  assert.equal(model.activeFilter, "all");
  assert.deepEqual(model.completedItemIds, []);
  assert.equal(model.selectedItemId, undefined);
  assert.equal(model.pagination.pageSize, 20);
  assert.deepEqual(model.selection.selectedItemIds, []);
  assert.equal(model.status.loadState, "idle");
  assert.equal(model.progressHydrated, false);
});
