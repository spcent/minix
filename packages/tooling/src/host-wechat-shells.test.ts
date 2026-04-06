import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkHostWechatShellFiles, syncHostWechatShellFiles } from "./host-wechat-shells";
import { writeDefaultRepoSpec, writeTempFile } from "./test-helpers";

test("host wechat shell tooling syncs and validates generated shell files", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-host-wechat-shells-"));

  try {
    await writeDefaultRepoSpec(tempRoot);
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/src/manifest/page-manifest.ts",
      `export const hostWechatPageManifest = {\n  login: {\n    routeId: "auth.login",\n    routePath: "/pages/login/index",\n    miniprogramPage: "pages/login/index",\n    registrationModule: "../../../src/registrations/wechat/pages/login",\n    navigationBarTitleText: "Login",\n    shellTemplate: "login",\n    shellStyle: "login",\n  },\n  profile: {\n    routeId: "user-profile.index",\n    routePath: "/pages/profile/index",\n    miniprogramPage: "pages/profile/index",\n    registrationModule: "../../../src/registrations/wechat/pages/profile",\n    navigationBarTitleText: "Profile",\n    shellTemplate: "generic",\n    shellStyle: "generic",\n  },\n} as const;\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/miniprogram/app.json",
      `${JSON.stringify({ pages: ["pages/legacy/index"] }, null, 2)}\n`,
    );
    await writeTempFile(tempRoot, "apps/host-wechat/miniprogram/pages/legacy/index.ts", `import "../../../src/legacy";\n`);

    const initialViolations = await checkHostWechatShellFiles(tempRoot);
    assert.match(initialViolations.join("\n"), /apps\/host-wechat\/miniprogram\/app\.json/);
    assert.match(initialViolations.join("\n"), /apps\/host-wechat\/miniprogram\/pages\/legacy/);

    await syncHostWechatShellFiles(tempRoot);

    const appJson = await readFile(path.join(tempRoot, "apps/host-wechat/miniprogram/app.json"), "utf8");
    const loginWxml = await readFile(path.join(tempRoot, "apps/host-wechat/miniprogram/pages/login/index.wxml"), "utf8");
    const profileJson = await readFile(path.join(tempRoot, "apps/host-wechat/miniprogram/pages/profile/index.json"), "utf8");
    const profileWxss = await readFile(path.join(tempRoot, "apps/host-wechat/miniprogram/pages/profile/index.wxss"), "utf8");

    assert.match(appJson, /pages\/login\/index/);
    assert.match(appJson, /pages\/profile\/index/);
    assert.match(loginWxml, /Build Everyday English in 10 Minutes/);
    assert.match(profileJson, /"navigationBarTitleText": "Profile"/);
    assert.match(profileWxss, /status-chip/);
    assert.deepEqual(await checkHostWechatShellFiles(tempRoot), []);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
