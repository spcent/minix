import assert from "node:assert/strict";
import test from "node:test";

import { ensureSampleApiUserState, SAMPLE_API_SEED_USER_ID, createSampleApiSeedSummary } from "./seed";
import { createMemoryApiStore } from "./store";

test("sample api seed summary documents the default local seed strategy", () => {
  assert.deepEqual(createSampleApiSeedSummary(), {
    contentSource: "code-backed",
    mutableState: "lazy-user-state",
    defaultUserId: SAMPLE_API_SEED_USER_ID,
  });
});

test("sample api seed initializes the default user state when it is missing", async () => {
  const store = createMemoryApiStore();

  const state = await ensureSampleApiUserState(store);

  assert.deepEqual([...state.bookshelfNovelIds], ["novel_lantern", "novel_brocade"]);
  assert.equal(state.progressByNovelId.novel_lantern?.chapterId, "lantern_ch_03");
  assert.equal(state.membershipPlanId, undefined);
});

test("sample api seed preserves an existing persisted user state", async () => {
  const store = createMemoryApiStore();
  const existing = await store.getUserState(SAMPLE_API_SEED_USER_ID);
  existing.membershipPlanId = "monthly";
  existing.bookshelfNovelIds.add("novel_glass");
  await store.saveUserState(SAMPLE_API_SEED_USER_ID, existing);

  const seeded = await ensureSampleApiUserState(store);

  assert.equal(seeded.membershipPlanId, "monthly");
  assert.ok(seeded.bookshelfNovelIds.has("novel_glass"));
});
