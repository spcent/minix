import assert from "node:assert/strict";
import test from "node:test";

import { createH5StorageAdapter } from "./storage.adapter";

function createStorageStub(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

test("h5 storage adapter persists values and clears a namespace", async () => {
  const adapter = createH5StorageAdapter(createStorageStub());

  await adapter.set("session", { loggedIn: true });
  await adapter.set("reader:theme", "paper");
  await adapter.set("reader:font", 1.2);
  await adapter.clear("reader");

  const session = await adapter.get<{ loggedIn: boolean }>("session");
  const theme = await adapter.get<string>("reader:theme");

  assert.deepEqual(session, { ok: true, value: { loggedIn: true } });
  assert.deepEqual(theme, { ok: true, value: null });
});
