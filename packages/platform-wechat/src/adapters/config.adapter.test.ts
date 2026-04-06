import assert from "node:assert/strict";
import test from "node:test";

import { createWechatConfigAdapter } from "./config.adapter";

test("wechat config adapter returns app-level values and feature-scoped config", () => {
  const adapter = createWechatConfigAdapter({
    values: {
      releaseChannel: "preview",
    },
    featureConfig: {
      feed: {
        pageSize: 20,
      },
    },
  });

  assert.deepEqual(adapter.get("releaseChannel"), { ok: true, value: "preview" });
  assert.deepEqual(adapter.getFeatureConfig("feed"), {
    ok: true,
    value: {
      pageSize: 20,
    },
  });
  assert.deepEqual(adapter.getFeatureConfig("missing"), { ok: true, value: null });
});
