import assert from "node:assert/strict";
import test from "node:test";

import { createWechatRequestAdapter } from "./request.adapter";

test("wechat request adapter forwards body headers and timeout to the runtime api", async () => {
  let receivedOptions: Record<string, unknown> | undefined;
  const adapter = createWechatRequestAdapter({
    request(options) {
      receivedOptions = options as unknown as Record<string, unknown>;
      options.success?.({
        statusCode: 200,
        header: { "x-test": "1" },
        data: { ok: true },
      });
    },
  });

  const result = await adapter.request<{ ok: boolean }>({
    url: "https://api.example.com/items",
    method: "POST",
    headers: { Authorization: "Bearer token" },
    body: { title: "First" },
    timeoutMs: 1500,
  });

  assert.equal(receivedOptions?.timeout, 1500);
  assert.deepEqual(receivedOptions?.header, { Authorization: "Bearer token" });
  assert.deepEqual(receivedOptions?.data, { title: "First" });
  assert.deepEqual(result, {
    ok: true,
    value: {
      status: 200,
      headers: { "x-test": "1" },
      data: { ok: true },
      raw: result.ok ? result.value.raw : undefined,
    },
  });
});
