import test from "node:test";
import assert from "node:assert/strict";

import { parseBootstrapBooleanFlag, readBootstrapLocationParam, readBootstrapProcessEnv } from "./bootstrap-env";

test("parseBootstrapBooleanFlag normalizes common truthy and falsy values", () => {
  assert.equal(parseBootstrapBooleanFlag(true), true);
  assert.equal(parseBootstrapBooleanFlag("yes"), true);
  assert.equal(parseBootstrapBooleanFlag("on"), true);
  assert.equal(parseBootstrapBooleanFlag(false), false);
  assert.equal(parseBootstrapBooleanFlag("0"), false);
  assert.equal(parseBootstrapBooleanFlag("off"), false);
  assert.equal(parseBootstrapBooleanFlag("maybe"), undefined);
  assert.equal(parseBootstrapBooleanFlag(undefined), undefined);
});

test("bootstrap env readers support explicit globals for host env tests", () => {
  const globals = {
    process: { env: { MINIX_USE_MOCK: "1" } },
    location: { search: "?minix_use_mock=0&minix_api_base_url=https%3A%2F%2Fapi.example.test" },
  };

  assert.equal(readBootstrapProcessEnv("MINIX_USE_MOCK", globals), "1");
  assert.equal(readBootstrapLocationParam("minix_use_mock", globals), "0");
  assert.equal(readBootstrapLocationParam("minix_api_base_url", globals), "https://api.example.test");
  assert.equal(readBootstrapLocationParam("missing", globals), undefined);
});
