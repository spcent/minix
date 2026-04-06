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

    const manifestFile = await readFile(path.join(result.featureDir, "src", "feature.manifest.ts"), "utf8");
    assert.match(manifestFile, /template: "list"/);
    assert.match(manifestFile, /onPullDownRefresh: "refresh"/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("normalizeFeatureName rejects invalid names", () => {
  assert.throws(() => normalizeFeatureName("UserProfile"), /kebab-case/);
});

test("normalizeFeatureTemplate rejects invalid templates", () => {
  assert.equal(normalizeFeatureTemplate(undefined), "generic");
  assert.equal(normalizeFeatureTemplate("profile"), "profile");
  assert.throws(() => normalizeFeatureTemplate("chat"), /Invalid feature template/);
});
