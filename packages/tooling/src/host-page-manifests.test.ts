import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { listHostApps, loadAppRouteEntries, loadHostPageManifestEntries } from "./host-page-manifests";
import { writeDefaultRepoSpec, writeTempFile } from "./test-helpers";

test("host page manifest tooling loads route and host metadata", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-host-manifests-"));

  try {
    await writeDefaultRepoSpec(tempRoot);
    await writeTempFile(
      tempRoot,
      "packages/contracts/src/routes/app.ts",
      `export const APP_ROUTE_IDS = {\n  login: "auth.login",\n  profile: "user-profile.index",\n} as const;\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/src/manifest/page-manifest.ts",
      `export const hostWechatPageManifest = {\n  login: {\n    routeId: "auth.login",\n    routePath: "/pages/login/index",\n    miniprogramPage: "pages/login/index",\n    registrationModule: "../../../src/registrations/wechat/pages/login",\n    navigationBarTitleText: "Login",\n    shellTemplate: "login",\n    shellStyle: "login",\n  },\n} as const;\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-h5/src/manifest/page-manifest.ts",
      `export const hostH5PageManifest = {\n  profile: {\n    routeId: "user-profile.index",\n    routePath: "/profile",\n  },\n} as const;\n`,
    );

    const hostApps = await listHostApps(tempRoot);
    assert.deepEqual(
      hostApps.map((app) => app.name).sort(),
      ["host-h5", "host-wechat"],
    );

    const routes = await loadAppRouteEntries(tempRoot);
    assert.deepEqual(routes, [
      { routeKey: "login", routeId: "auth.login" },
      { routeKey: "profile", routeId: "user-profile.index" },
    ]);

    const wechatEntries = await loadHostPageManifestEntries(tempRoot, "host-wechat");
    assert.equal(wechatEntries[0]?.pageKey, "login");
    assert.equal(wechatEntries[0]?.miniprogramPage, "pages/login/index");

    const h5Entries = await loadHostPageManifestEntries(tempRoot, "host-h5");
    assert.deepEqual(h5Entries, [
      {
        pageKey: "profile",
        routeId: "user-profile.index",
        routePath: "/profile",
      },
    ]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
