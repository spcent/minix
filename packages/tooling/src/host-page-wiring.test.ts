import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  loadHostManifestPageKeys,
  loadHostPageRegistryKeys,
  loadHostWechatShellRegistryKeys,
} from "./host-page-wiring";
import { writeDefaultRepoSpec, writeTempFile } from "./test-helpers";

test("host page wiring tooling loads manifest and registry keys", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-host-wiring-"));

  try {
    await writeDefaultRepoSpec(tempRoot);
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/src/manifest/page-definitions.ts",
      `export const hostWechatPageDefinitions = {\n  items: {},\n  settings: {},\n} as const;\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-h5/src/manifest/page-definitions.ts",
      `export const hostH5PageDefinitions = {\n  items: {},\n} as const;\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/src/registrations/page-registry.ts",
      `export const hostWechatPageRegistryFactories = {\n  login() {},\n  items() {},\n  settings() {},\n} as const;\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-h5/src/registrations/page-registry.ts",
      `export const hostH5PageRegistryFactories = {\n  login() {},\n  items() {},\n} as const;\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/src/registrations/wechat/page-registry.ts",
      `export const hostWechatShellPageRegistry = {\n  login() {},\n  items() {},\n  settings() {},\n} as const;\n`,
    );

    assert.deepEqual(await loadHostManifestPageKeys(tempRoot, "host-wechat"), ["items", "settings"]);
    assert.deepEqual(await loadHostManifestPageKeys(tempRoot, "host-h5"), ["items"]);
    assert.deepEqual(await loadHostPageRegistryKeys(tempRoot, "host-wechat"), ["login", "items", "settings"]);
    assert.deepEqual(await loadHostPageRegistryKeys(tempRoot, "host-h5"), ["login", "items"]);
    assert.deepEqual(await loadHostWechatShellRegistryKeys(tempRoot), ["login", "items", "settings"]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
