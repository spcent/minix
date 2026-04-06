import test from "node:test";
import assert from "node:assert/strict";

import { createH5AuthAdapter } from "./auth.adapter";

test("h5 auth adapter returns a default anonymous credential", async () => {
  const adapter = createH5AuthAdapter();
  const result = await adapter.login();

  assert.deepEqual(result, {
    ok: true,
    value: {
      platform: "h5",
      credential: {
        anonymousId: "host-h5-anonymous",
      },
    },
  });
});

test("h5 auth adapter can resolve credentials from an explicit provider", async () => {
  const adapter = createH5AuthAdapter({
    async credentialProvider() {
      return {
        authCode: "browser-auth-code",
      };
    },
  });

  const result = await adapter.login();

  assert.deepEqual(result, {
    ok: true,
    value: {
      platform: "h5",
      credential: {
        authCode: "browser-auth-code",
      },
    },
  });
});
