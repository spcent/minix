import test from "node:test";
import assert from "node:assert/strict";

import { createError, mapUnknownError, ok } from "./index";

test("createError preserves explicit metadata", () => {
  const error = createError("NETWORK_ERROR", "request failed", {
    recoverable: true,
    traceId: "trace-1",
  });

  assert.equal(error.code, "NETWORK_ERROR");
  assert.equal(error.recoverable, true);
  assert.equal(error.traceId, "trace-1");
});

test("mapUnknownError maps Error instances", () => {
  const error = mapUnknownError(new Error("boom"));

  assert.equal(error.code, "UNKNOWN");
  assert.equal(error.message, "boom");
});

test("ok creates a success result", () => {
  const result = ok(123);

  assert.deepEqual(result, { ok: true, value: 123 });
});
