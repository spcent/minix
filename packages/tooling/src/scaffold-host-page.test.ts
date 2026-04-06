import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { scaffoldFeature } from "./scaffold-feature";
import { scaffoldHostPage } from "./scaffold-host-page";
import { writeDefaultRepoSpec, writeTempFile } from "./test-helpers";

test("scaffoldHostPage updates route contract and host manifests without scaffold markers", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-host-page-scaffold-"));

  try {
    await writeDefaultRepoSpec(tempRoot);
    await writeTempFile(
      tempRoot,
      "packages/contracts/src/routes/app.ts",
      `export const APP_ROUTE_IDS = {\n  login: "auth.login",\n  items: "items.list",\n  settings: "settings.index",\n} as const;\n`,
    );
    await writeTempFile(tempRoot, "packages/features/user-profile/package.json", `{"name":"@minix/feature-user-profile"}`);
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/src/manifest/page-definitions.ts",
      `import { APP_ROUTE_IDS } from "@minix/contracts";\nimport { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags, type AppKernel } from "@minix/core";\nimport {\n  authFeatureManifest,\n  createInitialAuthPageState,\n} from "@minix/feature-auth";\nimport {\n  createDefaultItemsPageModel,\n  itemsFeatureManifest,\n} from "@minix/feature-items";\nimport {\n  createDefaultSettingsPageModel,\n  settingsFeatureManifest,\n} from "@minix/feature-settings";\n\nasync function reportWechatAuthError(kernel: AppKernel, message: string) {\n  await kernel.ui.toast({\n    title: message,\n    icon: "error",\n  });\n}\n\nexport const hostWechatFeatureFlags = defineHostFeatureFlags({\n  ...loadFeatureFlags(),\n  enableAutoLogin: false,\n});\n\nexport const hostWechatPageDefinitions = defineHostPageDefinitions({\n  login: {\n    feature: authFeatureManifest,\n    routeId: APP_ROUTE_IDS.login,\n    routePath: "/pages/login/index",\n    pageData: createInitialAuthPageState(),\n    controller: {\n      successRouteId: APP_ROUTE_IDS.items,\n      reportError: reportWechatAuthError,\n    },\n    miniprogramPage: "pages/login/index",\n    registrationModule: "../../../src/registrations/wechat/pages/login",\n    navigationBarTitleText: "Login",\n    shellTemplate: "login",\n    shellStyle: "login",\n  },\n  items: {\n    feature: itemsFeatureManifest,\n    routeId: APP_ROUTE_IDS.items,\n    routePath: "/pages/items/index",\n    pageData: createDefaultItemsPageModel(),\n    controller: {\n      loginRouteId: APP_ROUTE_IDS.login,\n      settingsRouteId: APP_ROUTE_IDS.settings,\n    },\n    miniprogramPage: "pages/items/index",\n    registrationModule: "../../../src/registrations/wechat/pages/items",\n    navigationBarTitleText: "Items",\n    enablePullDownRefresh: true,\n    shellTemplate: "items",\n    shellStyle: "items",\n  },\n  settings: {\n    feature: settingsFeatureManifest,\n    routeId: APP_ROUTE_IDS.settings,\n    routePath: "/pages/settings/index",\n    pageData: createDefaultSettingsPageModel(),\n    controller: {\n      loginRouteId: APP_ROUTE_IDS.login,\n      showErrorToast: true,\n    },\n    miniprogramPage: "pages/settings/index",\n    registrationModule: "../../../src/registrations/wechat/pages/settings",\n    navigationBarTitleText: "Settings",\n    shellTemplate: "settings",\n    shellStyle: "settings",\n  },\n});\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-h5/src/manifest/page-definitions.ts",
      `import { APP_ROUTE_IDS } from "@minix/contracts";\nimport { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags } from "@minix/core";\nimport {\n  authFeatureManifest,\n  createInitialAuthPageState,\n} from "@minix/feature-auth";\nimport {\n  createDefaultItemsPageModel,\n  itemsFeatureManifest,\n} from "@minix/feature-items";\nimport {\n  createDefaultSettingsPageModel,\n  settingsFeatureManifest,\n} from "@minix/feature-settings";\n\nexport const hostH5FeatureFlags = defineHostFeatureFlags({\n  ...loadFeatureFlags(),\n  enableAutoLogin: false,\n});\n\nexport const hostH5PageDefinitions = defineHostPageDefinitions({\n  login: {\n    feature: authFeatureManifest,\n    routeId: APP_ROUTE_IDS.login,\n    routePath: "/login",\n    pageData: createInitialAuthPageState(),\n    controller: {\n      successRouteId: APP_ROUTE_IDS.items,\n    },\n    renderMode: "custom",\n  },\n  items: {\n    feature: itemsFeatureManifest,\n    routeId: APP_ROUTE_IDS.items,\n    routePath: "/items",\n    pageData: createDefaultItemsPageModel(),\n    controller: {\n      loginRouteId: APP_ROUTE_IDS.login,\n      settingsRouteId: APP_ROUTE_IDS.settings,\n    },\n    renderMode: "custom",\n  },\n  settings: {\n    feature: settingsFeatureManifest,\n    routeId: APP_ROUTE_IDS.settings,\n    routePath: "/settings",\n    pageData: createDefaultSettingsPageModel(),\n    controller: {\n      loginRouteId: APP_ROUTE_IDS.login,\n      showErrorToast: false,\n    },\n    renderMode: "custom",\n  },\n});\n`,
    );

    const result = await scaffoldHostPage({
      featureName: "user-profile",
      pageKey: "profile",
      repoRoot: tempRoot,
      skipSync: true,
    });

    assert.equal(result.routeId, "user-profile.index");
    assert.match(await readFile(path.join(tempRoot, "packages/contracts/src/routes/app.ts"), "utf8"), /profile: "user-profile.index"/);

    const wechatSource = await readFile(path.join(tempRoot, "apps/host-wechat/src/manifest/page-definitions.ts"), "utf8");
    assert.match(wechatSource, /userProfileFeatureManifest/);
    assert.match(wechatSource, /createInitialUserProfileState/);
    assert.match(wechatSource, /profile: \{/);
    assert.match(wechatSource, /routePath: "\/pages\/profile\/index"/);
    assert.match(wechatSource, /miniprogramPage: "pages\/profile\/index"/);
    assert.match(wechatSource, /shellTemplate: "generic"/);

    const h5Source = await readFile(path.join(tempRoot, "apps/host-h5/src/manifest/page-definitions.ts"), "utf8");
    assert.match(h5Source, /userProfileFeatureManifest/);
    assert.match(h5Source, /routePath: "\/profile"/);
    assert.match(h5Source, /renderMode: "generic"/);

    assert.match(await readFile(path.join(tempRoot, "apps/host-wechat/src/registrations/wechat/pages/profile.ts"), "utf8"), /registerHostWechatPage/);
    await assert.rejects(() => readFile(path.join(tempRoot, "apps/host-wechat/miniprogram/pages/profile/index.ts"), "utf8"));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("scaffoldHostPage reuses an existing feature import without duplicating it", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-host-page-scaffold-import-"));

  try {
    await writeDefaultRepoSpec(tempRoot);
    await writeTempFile(
      tempRoot,
      "packages/contracts/src/routes/app.ts",
      `export const APP_ROUTE_IDS = {\n  login: "auth.login",\n} as const;\n`,
    );
    await writeTempFile(tempRoot, "packages/features/auth/package.json", `{"name":"@minix/feature-auth"}`);
    await writeTempFile(
      tempRoot,
      "apps/host-h5/src/manifest/page-definitions.ts",
      `import { APP_ROUTE_IDS } from "@minix/contracts";\nimport { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags } from "@minix/core";\nimport { authFeatureManifest, createInitialAuthPageState } from "@minix/feature-auth";\n\nexport const hostH5FeatureFlags = defineHostFeatureFlags({\n  ...loadFeatureFlags(),\n  enableAutoLogin: false,\n});\n\nexport const hostH5PageDefinitions = defineHostPageDefinitions({\n  login: {\n    feature: authFeatureManifest,\n    routeId: APP_ROUTE_IDS.login,\n    routePath: "/login",\n    pageData: createInitialAuthPageState(),\n    controller: {\n      successRouteId: APP_ROUTE_IDS.login,\n    },\n    renderMode: "custom",\n  },\n});\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/src/manifest/page-definitions.ts",
      `import { APP_ROUTE_IDS } from "@minix/contracts";\nimport { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags, type AppKernel } from "@minix/core";\nimport { authFeatureManifest, createInitialAuthPageState } from "@minix/feature-auth";\n\nasync function reportWechatAuthError(kernel: AppKernel, message: string) {\n  await kernel.ui.toast({\n    title: message,\n    icon: "error",\n  });\n}\n\nexport const hostWechatFeatureFlags = defineHostFeatureFlags({\n  ...loadFeatureFlags(),\n  enableAutoLogin: false,\n});\n\nexport const hostWechatPageDefinitions = defineHostPageDefinitions({\n  login: {\n    feature: authFeatureManifest,\n    routeId: APP_ROUTE_IDS.login,\n    routePath: "/pages/login/index",\n    pageData: createInitialAuthPageState(),\n    controller: {\n      successRouteId: APP_ROUTE_IDS.login,\n      reportError: reportWechatAuthError,\n    },\n    miniprogramPage: "pages/login/index",\n    registrationModule: "../../../src/registrations/wechat/pages/login",\n    navigationBarTitleText: "Login",\n    shellTemplate: "login",\n    shellStyle: "login",\n  },\n});\n`,
    );

    await scaffoldHostPage({
      featureName: "auth",
      pageKey: "relogin",
      repoRoot: tempRoot,
      skipSync: true,
    });

    const h5Source = await readFile(path.join(tempRoot, "apps/host-h5/src/manifest/page-definitions.ts"), "utf8");
    const wechatSource = await readFile(path.join(tempRoot, "apps/host-wechat/src/manifest/page-definitions.ts"), "utf8");

    assert.equal(h5Source.match(/@minix\/feature-auth/g)?.length, 1);
    assert.equal(wechatSource.match(/@minix\/feature-auth/g)?.length, 1);
    assert.match(h5Source, /relogin: \{/);
    assert.match(wechatSource, /relogin: \{/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("scaffoldHostPage uses detected feature template metadata for list-shaped pages", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-host-page-scaffold-template-list-"));

  try {
    await writeDefaultRepoSpec(tempRoot);
    await writeTempFile(
      tempRoot,
      "tsconfig.base.json",
      `${JSON.stringify(
        {
          compilerOptions: {
            paths: {
              "@minix/contracts": ["packages/contracts/src"],
              "@minix/core": ["packages/core/src"],
            },
          },
        },
        null,
        2,
      )}\n`,
    );
    await writeTempFile(
      tempRoot,
      "packages/contracts/src/routes/app.ts",
      `export const APP_ROUTE_IDS = {\n  login: "auth.login",\n} as const;\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-h5/src/manifest/page-definitions.ts",
      `import { APP_ROUTE_IDS } from "@minix/contracts";\nimport { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags } from "@minix/core";\n\nexport const hostH5FeatureFlags = defineHostFeatureFlags({\n  ...loadFeatureFlags(),\n  enableAutoLogin: false,\n});\n\nexport const hostH5PageDefinitions = defineHostPageDefinitions({\n});\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/src/manifest/page-definitions.ts",
      `import { APP_ROUTE_IDS } from "@minix/contracts";\nimport { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags } from "@minix/core";\n\nexport const hostWechatFeatureFlags = defineHostFeatureFlags({\n  ...loadFeatureFlags(),\n  enableAutoLogin: false,\n});\n\nexport const hostWechatPageDefinitions = defineHostPageDefinitions({\n});\n`,
    );

    await scaffoldFeature({
      featureName: "article-feed",
      template: "list",
      repoRoot: tempRoot,
    });

    await scaffoldHostPage({
      featureName: "article-feed",
      pageKey: "articles",
      repoRoot: tempRoot,
      skipSync: true,
    });

    const h5Source = await readFile(path.join(tempRoot, "apps/host-h5/src/manifest/page-definitions.ts"), "utf8");
    const wechatSource = await readFile(path.join(tempRoot, "apps/host-wechat/src/manifest/page-definitions.ts"), "utf8");

    assert.match(h5Source, /createDefaultArticleFeedState/);
    assert.match(h5Source, /pageData: createDefaultArticleFeedState\(\{/);
    assert.match(h5Source, /emptyText: "No articles items are available yet."/);
    assert.match(wechatSource, /enablePullDownRefresh: true/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("scaffoldHostPage uses detail route shape for detail templates", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-host-page-scaffold-template-detail-"));

  try {
    await writeDefaultRepoSpec(tempRoot);
    await writeTempFile(
      tempRoot,
      "tsconfig.base.json",
      `${JSON.stringify(
        {
          compilerOptions: {
            paths: {
              "@minix/contracts": ["packages/contracts/src"],
              "@minix/core": ["packages/core/src"],
            },
          },
        },
        null,
        2,
      )}\n`,
    );
    await writeTempFile(
      tempRoot,
      "packages/contracts/src/routes/app.ts",
      `export const APP_ROUTE_IDS = {\n  login: "auth.login",\n} as const;\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-h5/src/manifest/page-definitions.ts",
      `import { APP_ROUTE_IDS } from "@minix/contracts";\nimport { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags } from "@minix/core";\n\nexport const hostH5FeatureFlags = defineHostFeatureFlags({\n  ...loadFeatureFlags(),\n  enableAutoLogin: false,\n});\n\nexport const hostH5PageDefinitions = defineHostPageDefinitions({\n});\n`,
    );
    await writeTempFile(
      tempRoot,
      "apps/host-wechat/src/manifest/page-definitions.ts",
      `import { APP_ROUTE_IDS } from "@minix/contracts";\nimport { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags } from "@minix/core";\n\nexport const hostWechatFeatureFlags = defineHostFeatureFlags({\n  ...loadFeatureFlags(),\n  enableAutoLogin: false,\n});\n\nexport const hostWechatPageDefinitions = defineHostPageDefinitions({\n});\n`,
    );

    await scaffoldFeature({
      featureName: "article-detail",
      template: "detail",
      repoRoot: tempRoot,
    });

    const result = await scaffoldHostPage({
      featureName: "article-detail",
      pageKey: "articleDetail",
      repoRoot: tempRoot,
      skipSync: true,
    });

    assert.equal(result.routeId, "article-detail.detail");
    const h5Source = await readFile(path.join(tempRoot, "apps/host-h5/src/manifest/page-definitions.ts"), "utf8");
    assert.match(h5Source, /routePath: "\/articleDetail\/:id"/);
    assert.match(h5Source, /createDefaultArticleDetailState/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
