import assert from "node:assert/strict";
import test from "node:test";

import { cloneDomainSnapshot, cloneDomainSnapshotArray, cloneOptionalDomainSnapshot } from "./snapshot";

test("domain snapshot helpers deep clone values", () => {
  const source = { nested: { value: "original" } };
  const snapshot = cloneDomainSnapshot(source);

  source.nested.value = "changed";

  assert.deepEqual(snapshot, { nested: { value: "original" } });
});

test("domain snapshot helpers preserve undefined optional values", () => {
  assert.equal(cloneOptionalDomainSnapshot(undefined), undefined);
});

test("domain optional snapshot helper deep clones defined values", () => {
  const source = { nested: { value: "original" } };
  const snapshot = cloneOptionalDomainSnapshot(source);

  source.nested.value = "changed";

  assert.deepEqual(snapshot, { nested: { value: "original" } });
});

test("domain snapshot helpers deep clone arrays", () => {
  const source = [{ nested: { value: "original" } }];
  const snapshot = cloneDomainSnapshotArray(source);

  source[0]!.nested.value = "changed";

  assert.deepEqual(snapshot, [{ nested: { value: "original" } }]);
});
