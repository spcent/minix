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

test("state snapshot helpers fall back when structuredClone is unavailable", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "structuredClone");
  Object.defineProperty(globalThis, "structuredClone", {
    configurable: true,
    value: undefined,
  });

  try {
    const source = {
      nested: {
        value: "initial",
        optional: undefined,
      },
      items: [{ count: 1 }],
    };
    const cloned = cloneStateSnapshot(source);
    cloned.nested.value = "changed";
    const first = cloned.items[0];
    assert.ok(first);
    first.count = 2;

    assert.equal(source.nested.value, "initial");
    assert.equal(source.items[0]?.count, 1);
    assert.ok("optional" in cloned.nested);
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "structuredClone", descriptor);
    }
  }
});
