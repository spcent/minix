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

function createFailingStorageStub(method: "getItem" | "setItem" | "removeItem" | "clear"): Storage {
  const storage = createStorageStub();
  return {
    ...storage,
    getItem(key) {
      if (method === "getItem") {
        throw new Error("read denied");
      }

      return storage.getItem(key);
    },
    setItem(key, value) {
      if (method === "setItem") {
        throw new Error("quota exceeded");
      }

      storage.setItem(key, value);
    },
    removeItem(key) {
      if (method === "removeItem") {
        throw new Error("remove denied");
      }

      storage.removeItem(key);
    },
    clear() {
      if (method === "clear") {
        throw new Error("clear denied");
      }

      storage.clear();
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

test("h5 storage adapter maps malformed stored values to storage errors", async () => {
  const storage = createStorageStub();
  storage.setItem("session", "{not-json");
  const adapter = createH5StorageAdapter(storage);

  const result = await adapter.get("session");

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "STORAGE_ERROR");
    assert.equal(result.error.message, "localStorage read failed");
    assert.equal(result.error.recoverable, true);
  }
});

test("h5 storage adapter maps storage operation exceptions to storage errors", async () => {
  const setResult = await createH5StorageAdapter(createFailingStorageStub("setItem")).set("session", { loggedIn: true });
  const removeResult = await createH5StorageAdapter(createFailingStorageStub("removeItem")).remove("session");
  const clearResult = await createH5StorageAdapter(createFailingStorageStub("clear")).clear();

  for (const result of [setResult, removeResult, clearResult]) {
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "STORAGE_ERROR");
      assert.equal(result.error.recoverable, true);
    }
  }
});
