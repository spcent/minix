import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkHostManifestGeneratedFiles,
  syncHostManifestGeneratedFiles,
} from "./host-manifest-compiler";
import { writeDefaultRepoSpec } from "./test-helpers";

test("host manifest compiler syncs generated registry files", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-host-manifest-compiler-"));

  try {
    await writeDefaultRepoSpec(tempRoot);
    await syncHostManifestGeneratedFiles(tempRoot);

    const violations = await checkHostManifestGeneratedFiles(tempRoot);
    assert.deepEqual(violations, []);

    const h5Manifest = await readFile(
      path.join(tempRoot, "apps/host-h5/src/manifest/app.manifest.ts"),
      "utf8",
    );
    const wechatRegistry = await readFile(
      path.join(tempRoot, "apps/host-wechat/src/registrations/page-registry.ts"),
      "utf8",
    );
    const wechatShellRegistry = await readFile(
      path.join(tempRoot, "apps/host-wechat/src/registrations/wechat/page-registry.ts"),
      "utf8",
    );
    const h5Registry = await readFile(
      path.join(tempRoot, "apps/host-h5/src/registrations/page-registry.ts"),
      "utf8",
    );

    assert.match(h5Manifest, /GENERATED FILE/);
    assert.match(h5Manifest, /hostH5PageDefinitions/);
    assert.match(wechatRegistry, /GENERATED FILE/);
    assert.match(wechatShellRegistry, /datasetValue/);
    assert.match(h5Registry, /createManifestPageRegistry/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
