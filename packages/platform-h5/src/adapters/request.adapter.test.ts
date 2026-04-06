import assert from "node:assert/strict";
import test from "node:test";

import { createH5RequestAdapter } from "./request.adapter";

test("h5 request adapter forwards method headers body and query parameters", async () => {
  let receivedUrl = "";
  let receivedInit: RequestInit | undefined;
  const adapter = createH5RequestAdapter({
    fetcher: async (url, init) => {
      receivedUrl = String(url);
      receivedInit = init;

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "x-test": "1" },
      });
    },
  });

  const result = await adapter.request<{ ok: boolean }>({
    url: "https://api.example.com/items",
    method: "POST",
    headers: { Authorization: "Bearer token" },
    query: { page: 2, active: true },
    body: { title: "First" },
  });

  assert.equal(receivedUrl, "https://api.example.com/items?page=2&active=true");
  assert.equal(receivedInit?.method, "POST");
  assert.deepEqual(receivedInit?.headers, { Authorization: "Bearer token" });
  assert.equal(receivedInit?.body, JSON.stringify({ title: "First" }));
  assert.deepEqual(result, {
    ok: true,
    value: {
      status: 200,
      headers: { "content-type": "text/plain;charset=UTF-8", "x-test": "1" },
      data: { ok: true },
      raw: result.ok ? result.value.raw : undefined,
    },
  });
});

test("h5 request adapter aborts timed out requests", async () => {
  const adapter = createH5RequestAdapter({
    fetcher: (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new Error("aborted"));
        });
      }) as Promise<Response>,
  });

  const result = await adapter.request({
    url: "https://api.example.com/items",
    timeoutMs: 1,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "NETWORK_ERROR");
    assert.equal(result.error.message, "fetch request timed out");
  }
});
