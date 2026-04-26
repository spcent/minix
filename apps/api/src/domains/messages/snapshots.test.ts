import assert from "node:assert/strict";
import test from "node:test";

import { cloneThreadMembers } from "./snapshots";

test("message thread member snapshot helper clones member arrays", () => {
  const members = [
    {
      userId: "user_1",
      label: "User One",
      role: "customer" as const,
      active: true,
      canReply: true,
      joinedAt: "2026-04-26T00:00:00.000Z",
    },
  ];

  const snapshot = cloneThreadMembers(members);

  assert.deepEqual(snapshot, members);
  assert.notEqual(snapshot, members);
  assert.notEqual(snapshot[0], members[0]);
});
