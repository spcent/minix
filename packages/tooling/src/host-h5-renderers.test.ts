import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadHostH5RendererKeys } from "./host-h5-renderers";
import { writeDefaultRepoSpec, writeTempFile } from "./test-helpers";

test("host h5 renderer tooling loads exported renderer keys", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-host-h5-renderers-"));

  try {
    await writeDefaultRepoSpec(tempRoot);
    await writeTempFile(
      tempRoot,
      "apps/host-h5/src/render/page-registry.ts",
      `export const hostH5PageRenderers = {\n  login: {},\n  items: {},\n} as const;\n`,
    );

    assert.deepEqual(await loadHostH5RendererKeys(tempRoot), ["login", "items"]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
