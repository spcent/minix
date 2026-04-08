import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultDetailPageState,
  createDefaultFormPageState,
  createDefaultListPageState,
  createDefaultProfilePageState,
  createListPageState,
} from "./index";

test("createListPageState normalizes pagination and selection defaults", () => {
  const state = createListPageState({
    title: "Feed",
    pageSize: 12,
    emptyText: "Nothing to show",
    items: [
      { id: "story-1", title: "Story 1" },
      { id: "story-2", title: "Story 2" },
    ],
    query: {
      keyword: "advisory",
    },
  });

  assert.equal(state.query.page, 1);
  assert.equal(state.query.pageSize, 12);
  assert.equal(state.query.keyword, "advisory");
  assert.equal(state.selectedItemId, "story-1");
  assert.equal(state.items.length, 2);
  assert.equal(state.pagination.page, 1);
  assert.equal(state.pagination.pageSize, 12);
  assert.equal(state.selection.selectedItemIds[0], "story-1");
  assert.equal(state.status.loadState, "idle");
});

test("default page protocol factories provide stable baseline state", () => {
  const list = createDefaultListPageState<{ id: string }>({});
  const detail = createDefaultDetailPageState();
  const form = createDefaultFormPageState({
    values: {
      email: "",
    },
  });
  const profile = createDefaultProfilePageState();

  assert.equal(list.title, "List");
  assert.equal(list.query.page, 1);
  assert.equal(list.pagination.hasMore, false);
  assert.equal(list.filters.length, 0);
  assert.equal(list.selection.selectedItemIds.length, 0);
  assert.equal(list.status.loadState, "idle");
  assert.equal(detail.title, "Detail");
  assert.equal(detail.loading, false);
  assert.equal(detail.detailStatus.entryContext, "unknown");
  assert.equal(detail.detailActions.length, 0);
  assert.equal(form.title, "Form");
  assert.deepEqual(form.values, { email: "" });
  assert.deepEqual(form.formValues, { email: "" });
  assert.equal(form.validationErrors.length, 0);
  assert.equal(form.submitState.phase, "idle");
  assert.equal(profile.title, "Profile");
  assert.equal(profile.selectedActionKey, "open-settings");
  assert.equal(profile.sections[0]?.key, "session");
});
