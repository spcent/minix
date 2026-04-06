import assert from "node:assert/strict";
import test from "node:test";

import {
  HOST_H5_DEFAULT_API_BASE_URL,
  HOST_H5_MOCK_API_BASE_URL,
  loadHostH5Env,
  type HostH5BootstrapEnvOverride,
} from "./env";

function withBootstrapEnvOverride(override: HostH5BootstrapEnvOverride | undefined, run: () => void) {
  const globals = globalThis as typeof globalThis & {
    __MINIX_BOOTSTRAP_ENV__: HostH5BootstrapEnvOverride | undefined;
  };
  const previous = globals.__MINIX_BOOTSTRAP_ENV__;

  try {
    globals.__MINIX_BOOTSTRAP_ENV__ = override;
    run();
  } finally {
    globals.__MINIX_BOOTSTRAP_ENV__ = previous;
  }
}

function withLocationSearch(search: string | undefined, run: () => void) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "location");

  try {
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: search === undefined ? undefined : { search },
    });
    run();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "location", descriptor);
    } else {
      delete (globalThis as typeof globalThis & { location?: unknown }).location;
    }
  }
}

test("host h5 env defaults to the local hono api on port 3000", () => {
  withBootstrapEnvOverride(undefined, () => {
    withLocationSearch(undefined, () => {
      const env = loadHostH5Env();

      assert.equal(env.apiBaseUrl, HOST_H5_DEFAULT_API_BASE_URL);
      assert.equal(env.debug, false);
    });
  });
});

test("host h5 env can opt into the mock adapter from the browser query string", () => {
  withBootstrapEnvOverride(undefined, () => {
    withLocationSearch("?minix_use_mock=1", () => {
      const env = loadHostH5Env();

      assert.equal(env.apiBaseUrl, HOST_H5_MOCK_API_BASE_URL);
      assert.equal(env.debug, true);
    });
  });
});

test("host h5 env allows an explicit runtime override for api base url and mock mode", () => {
  withBootstrapEnvOverride(
    {
      apiBaseUrl: "http://127.0.0.1:8787",
      useMock: true,
    },
    () => {
      const env = loadHostH5Env();

      assert.equal(env.apiBaseUrl, "http://127.0.0.1:8787");
      assert.equal(env.debug, true);
    },
  );
});
