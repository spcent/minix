import assert from "node:assert/strict";
import test from "node:test";

import { createH5ConfigAdapter } from "./config.adapter";

test("h5 config adapter returns app-level values and feature-scoped config", () => {
  const adapter = createH5ConfigAdapter({
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
