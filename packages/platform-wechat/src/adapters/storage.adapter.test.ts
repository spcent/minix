import assert from "node:assert/strict";
import test from "node:test";

import { createWechatStorageAdapter } from "./storage.adapter";

test("wechat storage adapter delegates get set remove and clear to the runtime api", async () => {
  const values = new Map<string, unknown>();
  const adapter = createWechatStorageAdapter({
    getStorage(options) {
      options.success?.({ data: values.get(options.key) });
    },
    setStorage(options) {
      values.set(options.key, options.data);
      options.success?.();
    },
    removeStorage(options) {
      values.delete(options.key);
      options.success?.();
    },
    clearStorage(options) {
      values.clear();
      options.success?.();
    },
  });

  await adapter.set("session", { loggedIn: true });
  const session = await adapter.get<{ loggedIn: boolean }>("session");
  await adapter.remove("session");
  const afterRemove = await adapter.get("session");
  await adapter.set("reader:theme", "paper");
  await adapter.clear();
  const afterClear = await adapter.get("reader:theme");

  assert.deepEqual(session, { ok: true, value: { loggedIn: true } });
  assert.deepEqual(afterRemove, { ok: true, value: null });
  assert.deepEqual(afterClear, { ok: true, value: null });
});
