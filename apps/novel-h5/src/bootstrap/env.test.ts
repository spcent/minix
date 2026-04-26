import assert from "node:assert/strict";
import test from "node:test";

import { withBootstrapEnvOverride, withBootstrapLocationSearch } from "@minix/testkit";

import {
  NOVEL_H5_DEFAULT_API_BASE_URL,
  NOVEL_H5_MOCK_API_BASE_URL,
  loadNovelH5Env,
} from "./env";

test("novel h5 env defaults to the local hono api on port 3000", () => {
  withBootstrapEnvOverride(undefined, () => {
    withBootstrapLocationSearch(undefined, () => {
      const env = loadNovelH5Env();

      assert.equal(env.apiBaseUrl, NOVEL_H5_DEFAULT_API_BASE_URL);
      assert.equal(env.debug, false);
    });
  });
});

test("novel h5 env can opt into the mock adapter from the browser query string", () => {
  withBootstrapEnvOverride(undefined, () => {
    withBootstrapLocationSearch("?minix_use_mock=1", () => {
      const env = loadNovelH5Env();

      assert.equal(env.apiBaseUrl, NOVEL_H5_MOCK_API_BASE_URL);
      assert.equal(env.debug, true);
    });
  });
});

test("novel h5 env allows an explicit runtime override for api base url and mock mode", () => {
  withBootstrapEnvOverride(
    {
      apiBaseUrl: "http://127.0.0.1:8787",
      useMock: true,
    },
    () => {
      const env = loadNovelH5Env();

      assert.equal(env.apiBaseUrl, "http://127.0.0.1:8787");
      assert.equal(env.debug, true);
    },
  );
});
