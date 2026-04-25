import assert from "node:assert/strict";
import test from "node:test";

import { cloneOptionalStateSnapshot, cloneStateSnapshot, cloneStateSnapshotArray } from "./snapshot";

test("state snapshot helpers deep clone values", () => {
  const source = {
    nested: {
      count: 1,
    },
  };

  const cloned = cloneStateSnapshot(source);
  cloned.nested.count = 2;

  assert.equal(source.nested.count, 1);
});

test("state snapshot helpers preserve undefined optional values", () => {
  assert.equal(cloneOptionalStateSnapshot(undefined), undefined);
});

test("state snapshot helpers deep clone arrays", () => {
  const source = [{ nested: { value: "initial" } }];
  const cloned = cloneStateSnapshotArray(source);
  const first = cloned[0];
  assert.ok(first);
  first.nested.value = "changed";

  assert.equal(source[0]?.nested.value, "initial");
});
