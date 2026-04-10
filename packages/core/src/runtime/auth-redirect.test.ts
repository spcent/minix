import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthRedirectParams,
  deriveAuthRedirectLabel,
  readAuthRedirectTarget,
} from "./auth-redirect";

test("auth redirect params round-trip route ids, path params, source, and force reauth", () => {
  const params = createAuthRedirectParams({
    routeId: "reader.chapter",
    path: "/reader",
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_04",
      fromPayment: true,
    },
    source: "membership",
    label: "Premium Chapter",
    reason: "force-relogin",
    forceReauth: true,
  });
  assert.ok(params);

  assert.deepEqual(readAuthRedirectTarget({ path: "/", params }), {
    routeId: "reader.chapter",
    path: "/reader",
    params: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_04",
      fromPayment: true,
    },
    source: "membership",
    label: "Premium Chapter",
    reason: "force-relogin",
    forceReauth: true,
  });
});

test("auth redirect target remains compatible with legacy from and reason params", () => {
  const target = readAuthRedirectTarget({
    path: "/",
    params: {
      from: "overview",
      reason: "auth-required",
    },
  });

  assert.deepEqual(target, {
    source: "overview",
    reason: "auth-required",
  });
  assert.equal(deriveAuthRedirectLabel(target), "Overview");
});
