import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { normalizeFeatureName, normalizeFeatureTemplate, scaffoldFeature } from "./scaffold-feature";

test("scaffoldFeature creates a feature package and tsconfig alias", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-feature-scaffold-"));

  try {
    await mkdir(path.join(tempRoot, "packages", "features"), { recursive: true });
    await writeFile(
      path.join(tempRoot, "tsconfig.base.json"),
      `${JSON.stringify(
        {
          compilerOptions: {
            paths: {
              "@minix/contracts": ["packages/contracts/src"],
              "@minix/core": ["packages/core/src"],
              "@minix/feature-auth": ["packages/features/auth/src"],
            },
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const result = await scaffoldFeature({
      featureName: "user-profile",
      repoRoot: tempRoot,
    });

    const packageJson = JSON.parse(await readFile(path.join(result.featureDir, "package.json"), "utf8")) as {
      name: string;
      dependencies: Record<string, string>;
    };
    assert.equal(packageJson.name, "@minix/feature-user-profile");
    assert.equal(packageJson.dependencies["@minix/contracts"], "workspace:*");
    assert.equal(packageJson.dependencies["@minix/core"], "workspace:*");

    const controllerFile = await readFile(path.join(result.featureDir, "src", "controller", "index.ts"), "utf8");
    assert.match(controllerFile, /createUserProfileController/);
    assert.match(controllerFile, /kernel: AppKernel/);
    assert.match(controllerFile, /createDefaultUserProfileState/);
    const manifestFile = await readFile(path.join(result.featureDir, "src", "feature.manifest.ts"), "utf8");
    assert.match(manifestFile, /userProfileFeatureManifest/);
    assert.match(manifestFile, /createDefaultUserProfileState/);
    assert.match(manifestFile, /userProfileCapabilityRequirements/);
    assert.match(manifestFile, /userProfileGuardPolicy/);
    assert.match(manifestFile, /userProfileFeatureConfig/);
    assert.match(manifestFile, /surface: "user-profile"/);
    const manifestTestFile = await readFile(path.join(result.featureDir, "src", "feature.manifest.test.ts"), "utf8");
    assert.match(manifestTestFile, /user-profile feature manifest creates a controller from host page data/);
    assert.match(manifestTestFile, /userProfileFeatureManifest.createController/);

    const modelFile = await readFile(path.join(result.featureDir, "src", "model", "index.ts"), "utf8");
    assert.match(modelFile, /title: string;/);
    assert.match(modelFile, /subtitle: string;/);
    assert.match(modelFile, /createDefaultUserProfileState/);

    const tsconfig = JSON.parse(await readFile(path.join(tempRoot, "tsconfig.base.json"), "utf8")) as {
      compilerOptions: {
        paths: Record<string, string[]>;
      };
    };
    assert.deepEqual(tsconfig.compilerOptions.paths["@minix/feature-user-profile"], ["packages/features/user-profile/src"]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("scaffoldFeature supports list templates with page protocol defaults", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-feature-scaffold-list-"));

  try {
    await mkdir(path.join(tempRoot, "packages", "features"), { recursive: true });
    await writeFile(
      path.join(tempRoot, "tsconfig.base.json"),
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
      "utf8",
    );

    const result = await scaffoldFeature({
      featureName: "article-feed",
      template: "list",
      repoRoot: tempRoot,
    });

    const modelFile = await readFile(path.join(result.featureDir, "src", "model", "index.ts"), "utf8");
    assert.match(modelFile, /createDefaultListPageState/);
    assert.match(modelFile, /type ArticleFeedState = ListPageState<ArticleFeedItem>/);

    const controllerFile = await readFile(path.join(result.featureDir, "src", "controller", "index.ts"), "utf8");
    assert.match(controllerFile, /loadInitial\(\)/);
    assert.match(controllerFile, /selectItem\(itemId: string\)/);
    assert.match(controllerFile, /detailRouteId\?: AppRouteId/);
    assert.match(controllerFile, /goToSettings\(\)/);
    assert.match(controllerFile, /goToLogin\(\)/);

    const manifestFile = await readFile(path.join(result.featureDir, "src", "feature.manifest.ts"), "utf8");
    assert.match(manifestFile, /template: "list"/);
    assert.match(manifestFile, /onPullDownRefresh: "refresh"/);
    assert.match(manifestFile, /onReachBottom: "loadMore"/);
    assert.match(manifestFile, /detailRouteId\?: AppRouteId/);
    assert.match(manifestFile, /loginRouteId: options\.loginRouteId/);
    assert.match(manifestFile, /settingsRouteId: options\.settingsRouteId/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("scaffoldFeature supports auth templates with login-oriented defaults", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-feature-scaffold-auth-"));

  try {
    await mkdir(path.join(tempRoot, "packages", "features"), { recursive: true });
    await writeFile(
      path.join(tempRoot, "tsconfig.base.json"),
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
      "utf8",
    );

    const result = await scaffoldFeature({
      featureName: "account-login",
      template: "auth",
      repoRoot: tempRoot,
    });

    const modelFile = await readFile(path.join(result.featureDir, "src", "model", "index.ts"), "utf8");
    assert.match(modelFile, /type AccountLoginMode = "wechat" \| "sms" \| "password" \| "guest"/);
    assert.match(modelFile, /authenticated: boolean;/);

    const controllerFile = await readFile(path.join(result.featureDir, "src", "controller", "index.ts"), "utf8");
    assert.match(controllerFile, /submitLogin\(mode: AccountLoginMode = "wechat"\)/);
    assert.match(controllerFile, /redirectAfterLogin\(\)/);
    assert.match(controllerFile, /successRouteId\?: AppRouteId/);

    const manifestFile = await readFile(path.join(result.featureDir, "src", "feature.manifest.ts"), "utf8");
    assert.match(manifestFile, /template: "auth"/);
    assert.match(manifestFile, /successRouteId\?: AppRouteId/);
    assert.match(manifestFile, /onTapSubmit: "submitLogin"/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("scaffoldFeature supports workspace templates with capability-workspace defaults", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-feature-scaffold-workspace-"));

  try {
    await mkdir(path.join(tempRoot, "packages", "features"), { recursive: true });
    await writeFile(
      path.join(tempRoot, "tsconfig.base.json"),
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
      "utf8",
    );

    const result = await scaffoldFeature({
      featureName: "media-workspace",
      template: "workspace",
      repoRoot: tempRoot,
    });

    const modelFile = await readFile(path.join(result.featureDir, "src", "model", "index.ts"), "utf8");
    assert.match(modelFile, /interface MediaWorkspaceResult/);
    assert.match(modelFile, /primaryActionLabel: string;/);

    const controllerFile = await readFile(path.join(result.featureDir, "src", "controller", "index.ts"), "utf8");
    assert.match(controllerFile, /startPrimaryAction\(\)/);
    assert.match(controllerFile, /retryPrimaryAction\(\)/);
    assert.match(controllerFile, /clearLastResult\(\)/);

    const manifestFile = await readFile(path.join(result.featureDir, "src", "feature.manifest.ts"), "utf8");
    assert.match(manifestFile, /template: "workspace"/);
    assert.match(manifestFile, /successRouteId\?: AppRouteId/);
    assert.match(manifestFile, /onShow: "loadInitial"/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("scaffoldFeature keeps profile and detail templates on the normalized route option surface", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-feature-scaffold-option-surface-"));

  try {
    await mkdir(path.join(tempRoot, "packages", "features"), { recursive: true });
    await writeFile(
      path.join(tempRoot, "tsconfig.base.json"),
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
      "utf8",
    );

    const profileResult = await scaffoldFeature({
      featureName: "user-hub",
      template: "profile",
      repoRoot: tempRoot,
    });
    const profileControllerFile = await readFile(
      path.join(profileResult.featureDir, "src", "controller", "index.ts"),
      "utf8",
    );
    const profileManifestFile = await readFile(
      path.join(profileResult.featureDir, "src", "feature.manifest.ts"),
      "utf8",
    );
    assert.match(profileControllerFile, /editRouteId\?: AppRouteId/);
    assert.match(profileManifestFile, /editRouteId\?: AppRouteId/);
    assert.match(profileManifestFile, /editRouteId: options\.editRouteId/);
    assert.match(profileManifestFile, /onPullDownRefresh: "refresh"/);

    const detailResult = await scaffoldFeature({
      featureName: "order-detail",
      template: "detail",
      repoRoot: tempRoot,
    });
    const detailControllerFile = await readFile(
      path.join(detailResult.featureDir, "src", "controller", "index.ts"),
      "utf8",
    );
    const detailManifestFile = await readFile(
      path.join(detailResult.featureDir, "src", "feature.manifest.ts"),
      "utf8",
    );
    assert.match(detailControllerFile, /shareRouteId\?: AppRouteId/);
    assert.match(detailManifestFile, /shareRouteId\?: AppRouteId/);
    assert.match(detailManifestFile, /shareRouteId: options\.shareRouteId/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("scaffoldFeature exposes the template controller vocabulary expected by host wiring", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-feature-scaffold-method-vocab-"));

  try {
    await mkdir(path.join(tempRoot, "packages", "features"), { recursive: true });
    await writeFile(
      path.join(tempRoot, "tsconfig.base.json"),
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
      "utf8",
    );

    const listResult = await scaffoldFeature({
      featureName: "activity-feed",
      template: "list",
      repoRoot: tempRoot,
    });
    const listControllerFile = await readFile(path.join(listResult.featureDir, "src", "controller", "index.ts"), "utf8");
    assert.match(listControllerFile, /loadMore\(\)/);

    const detailResult = await scaffoldFeature({
      featureName: "invoice-detail",
      template: "detail",
      repoRoot: tempRoot,
    });
    const detailControllerFile = await readFile(path.join(detailResult.featureDir, "src", "controller", "index.ts"), "utf8");
    assert.match(detailControllerFile, /refresh\(\)/);
    assert.match(detailControllerFile, /shareCurrent\(\)/);

    const formResult = await scaffoldFeature({
      featureName: "contact-form",
      template: "form",
      repoRoot: tempRoot,
    });
    const formControllerFile = await readFile(path.join(formResult.featureDir, "src", "controller", "index.ts"), "utf8");
    const formManifestFile = await readFile(path.join(formResult.featureDir, "src", "feature.manifest.ts"), "utf8");
    assert.match(formControllerFile, /loadInitial\(\)/);
    assert.match(formControllerFile, /updateField\(values: Partial<ContactFormValues>\)/);
    assert.match(formControllerFile, /validateForm\(\)/);
    assert.match(formManifestFile, /onShow: "loadInitial"/);

    const profileResult = await scaffoldFeature({
      featureName: "member-profile",
      template: "profile",
      repoRoot: tempRoot,
    });
    const profileControllerFile = await readFile(path.join(profileResult.featureDir, "src", "controller", "index.ts"), "utf8");
    assert.match(profileControllerFile, /refresh\(\)/);
    assert.match(profileControllerFile, /goToEdit\(\)/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("normalizeFeatureName rejects invalid names", () => {
  assert.throws(() => normalizeFeatureName("UserProfile"), /kebab-case/);
});

test("normalizeFeatureTemplate rejects invalid templates", () => {
  assert.equal(normalizeFeatureTemplate(undefined), "generic");
  assert.equal(normalizeFeatureTemplate("auth"), "auth");
  assert.equal(normalizeFeatureTemplate("profile"), "profile");
  assert.equal(normalizeFeatureTemplate("workspace"), "workspace");
  assert.throws(() => normalizeFeatureTemplate("chat"), /Invalid feature template/);
});
