import assert from "node:assert/strict";
import test from "node:test";

import { withBootstrapEnvOverride } from "@minix/testkit";

import {
  HOST_WECHAT_DEFAULT_API_BASE_URL,
  HOST_WECHAT_MOCK_API_BASE_URL,
  loadHostWechatEnv,
} from "./env";

test("host wechat env defaults to the local hono api on port 3000", () => {
  withBootstrapEnvOverride(undefined, () => {
    const env = loadHostWechatEnv();

    assert.equal(env.apiBaseUrl, HOST_WECHAT_DEFAULT_API_BASE_URL);
    assert.equal(env.debug, false);
  });
});

test("host wechat env can opt into the mock adapter through an explicit runtime override", () => {
  withBootstrapEnvOverride(
    {
      useMock: true,
    },
    () => {
      const env = loadHostWechatEnv();

      assert.equal(env.apiBaseUrl, HOST_WECHAT_MOCK_API_BASE_URL);
      assert.equal(env.debug, true);
    },
  );
});

test("host wechat env allows an explicit runtime api base url override", () => {
  withBootstrapEnvOverride(
    {
      apiBaseUrl: "http://127.0.0.1:8787",
    },
    () => {
      const env = loadHostWechatEnv();

      assert.equal(env.apiBaseUrl, "http://127.0.0.1:8787");
      assert.equal(env.debug, false);
    },
  );
});
