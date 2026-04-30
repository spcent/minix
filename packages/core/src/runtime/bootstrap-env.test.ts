import test from "node:test";
import assert from "node:assert/strict";

import {
  createBootstrapRuntimeEnv,
  createOfficialHostBootstrapRuntimeEnv,
  parseBootstrapBooleanFlag,
  readBootstrapLocationParam,
  readBootstrapProcessEnv,
} from "./bootstrap-env";

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

test("createBootstrapRuntimeEnv resolves host metadata and mock defaults", () => {
  const env = createBootstrapRuntimeEnv(
    {
      appId: "test-h5",
      appName: "Test H5",
      platform: "h5",
      defaultApiBaseUrl: "http://localhost:3000",
      mockApiBaseUrl: "https://mock.minix.local",
      version: "1.0.0",
      allowLocationParams: true,
    },
    {
      process: { env: { MINIX_USE_MOCK: "1" } },
    },
  );

  assert.deepEqual(env, {
    appId: "test-h5",
    appName: "Test H5",
    platform: "h5",
    apiBaseUrl: "https://mock.minix.local",
    debug: true,
    version: "1.0.0",
  });
});

test("createBootstrapRuntimeEnv keeps process env before h5 query params", () => {
  const env = createBootstrapRuntimeEnv(
    {
      appId: "test-h5",
      appName: "Test H5",
      platform: "h5",
      defaultApiBaseUrl: "http://localhost:3000",
      mockApiBaseUrl: "https://mock.minix.local",
      version: "1.0.0",
      allowLocationParams: true,
    },
    {
      process: {
        env: {
          MINIX_USE_MOCK: "0",
          MINIX_API_BASE_URL: "https://api.process.test",
        },
      },
      location: { search: "?minix_use_mock=1&minix_api_base_url=https%3A%2F%2Fapi.query.test" },
    },
  );

  assert.equal(env.apiBaseUrl, "https://api.process.test");
  assert.equal(env.debug, false);
});

test("createBootstrapRuntimeEnv lets explicit overrides win before process env", () => {
  const env = createBootstrapRuntimeEnv(
    {
      appId: "test-wechat",
      appName: "Test Wechat",
      platform: "wechat",
      defaultApiBaseUrl: "http://localhost:3000",
      mockApiBaseUrl: "https://mock.minix.local",
      version: "1.0.0",
    },
    {
      __MINIX_BOOTSTRAP_ENV__: {
        apiBaseUrl: "https://api.override.test",
        useMock: true,
      },
      process: {
        env: {
          MINIX_USE_MOCK: "0",
          MINIX_API_BASE_URL: "https://api.process.test",
        },
      },
    },
  );

  assert.equal(env.apiBaseUrl, "https://api.override.test");
  assert.equal(env.debug, true);
});

test("createOfficialHostBootstrapRuntimeEnv applies shared official host defaults", () => {
  const env = createOfficialHostBootstrapRuntimeEnv({
    appId: "test-h5",
    appName: "Test H5",
    platform: "h5",
    allowLocationParams: true,
  });

  assert.deepEqual(env, {
    appId: "test-h5",
    appName: "Test H5",
    platform: "h5",
    apiBaseUrl: "http://localhost:3000",
    debug: false,
    version: "1.0.0",
  });
});
