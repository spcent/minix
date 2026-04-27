import assert from "node:assert/strict";
import test from "node:test";

import {
  cloneDefinedDomainFields,
  cloneDomainSnapshot,
  cloneDomainSnapshotArray,
  cloneOptionalDomainSnapshot,
} from "./snapshot";

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

test("cloneDefinedDomainFields preserves falsy defined fields and omits undefined", () => {
  const snapshot = cloneDefinedDomainFields(
    {
      count: 0,
      label: "",
      enabled: false,
      missing: undefined as string | undefined,
    },
    ["count", "label", "enabled", "missing"] as const,
  );

  assert.deepEqual(snapshot, {
    count: 0,
    label: "",
    enabled: false,
  });
});

test("cloneDefinedDomainFields deep clones selected fields", () => {
  const source = {
    nested: { value: "original" },
    list: [{ label: "first" }],
  };
  const snapshot = cloneDefinedDomainFields(source, ["nested", "list"] as const);

  source.nested.value = "changed";
  source.list[0]!.label = "changed";

  assert.deepEqual(snapshot, {
    nested: { value: "original" },
    list: [{ label: "first" }],
  });
});
