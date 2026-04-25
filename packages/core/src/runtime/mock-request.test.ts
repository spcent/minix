import test from "node:test";
import assert from "node:assert/strict";

import {
  coerceMockQueryNumber,
  coerceMockQueryString,
  createJsonMockResponse,
  resolveMockRequestPath,
} from "./mock-request";

test("createJsonMockResponse returns the canonical mock response envelope", () => {
  assert.deepEqual(createJsonMockResponse(200, { ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "x-minix-mock": "true",
    },
    data: { ok: true },
  });
});

test("resolveMockRequestPath keeps absolute and relative mock paths stable", () => {
  assert.equal(resolveMockRequestPath("https://mock.minix.local/items?page=1"), "/items");
  assert.equal(resolveMockRequestPath("/items"), "/items");
});

test("mock query coercion helpers normalize query values", () => {
  assert.equal(coerceMockQueryNumber(3, 1), 3);
  assert.equal(coerceMockQueryNumber("4", 1), 4);
  assert.equal(coerceMockQueryNumber("bad", 1), 1);
  assert.equal(coerceMockQueryNumber(true, 1), 1);
  assert.equal(coerceMockQueryString("novel"), "novel");
  assert.equal(coerceMockQueryString(""), undefined);
});
