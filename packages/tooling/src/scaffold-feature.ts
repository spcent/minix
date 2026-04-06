import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ScaffoldFeatureOptions {
  featureName: string;
  repoRoot?: string;
}

interface FeatureNames {
  kebab: string;
  camel: string;
  pascal: string;
  packageName: string;
}

function toPascalCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join("");
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal[0]?.toLowerCase() + pascal.slice(1);
}

export function normalizeFeatureName(value: string): FeatureNames {
  const kebab = value.trim();
  if (!/^[a-z][a-z0-9-]*$/.test(kebab)) {
    throw new Error(`Invalid feature name "${value}". Use lowercase kebab-case such as "user-profile".`);
  }

  const pascal = toPascalCase(kebab);
  const camel = toCamelCase(kebab);

  return {
    kebab,
    camel,
    pascal,
    packageName: `@minix/feature-${kebab}`,
  };
}

function controllerSource(names: FeatureNames): string {
  return `import { createStore } from "@minix/core";
import { createInitial${names.pascal}State, type ${names.pascal}State } from "../model";

export interface Create${names.pascal}ControllerOptions {
  initialState?: Partial<${names.pascal}State>;
}

export function create${names.pascal}Controller(options: Create${names.pascal}ControllerOptions = {}) {
  const store = createStore<${names.pascal}State>({
    ...createInitial${names.pascal}State(),
    ...options.initialState,
  });

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },
  };
}
`;
}

function featureManifestSource(names: FeatureNames): string {
  return `import type { CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { create${names.pascal}Controller } from "./controller";
import { createInitial${names.pascal}State, type ${names.pascal}State } from "./model";

export interface ${names.pascal}FeatureControllerOptions {
  initialState?: Partial<${names.pascal}State>;
}

export const ${names.camel}CapabilityRequirements: CapabilityRequirement[] = [];
export const ${names.camel}GuardPolicy: GuardPolicy | undefined = undefined;
export const ${names.camel}FeatureConfig: FeatureConfig = {};

export const ${names.camel}FeatureManifest = defineFeatureManifest<
  ${names.pascal}FeatureControllerOptions,
  ${names.pascal}State,
  ReturnType<typeof create${names.pascal}Controller>
>()({
  featureKey: "${names.kebab}",
  pageKey: "${names.camel}",
  packageName: "${names.packageName}",
  exportName: "${names.camel}FeatureManifest",
  createController(
    _host,
    _kernel: AppKernel,
    options: ${names.pascal}FeatureControllerOptions,
    pageData: ${names.pascal}State,
  ) {
    return create${names.pascal}Controller({
      initialState: {
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "markReady",
        onTapReady: "markReady",
      },
    },
    h5: {
      entryActions: {
        onShow: "markReady",
        onTapReady: "markReady",
      },
    },
  },
});

export { createInitial${names.pascal}State };
`;
}

function controllerTestSource(names: FeatureNames): string {
  return `import test from "node:test";
import assert from "node:assert/strict";

import { create${names.pascal}Controller } from "./index";

test("${names.kebab} controller marks state ready", () => {
  const controller = create${names.pascal}Controller();

  assert.equal(controller.store.getState().ready, false);
  controller.markReady();
  assert.equal(controller.store.getState().ready, true);
});
`;
}

function modelSource(names: FeatureNames): string {
  return `export interface ${names.pascal}State {
  ready: boolean;
}

export function createInitial${names.pascal}State(): ${names.pascal}State {
  return {
    ready: false,
  };
}
`;
}

function indexSource(): string {
  return `export * from "./controller/index";
export * from "./feature.manifest";
export * from "./model/index";
`;
}

function packageJsonSource(names: FeatureNames): string {
  return `${JSON.stringify(
    {
      name: names.packageName,
      version: "0.1.0",
      private: true,
      main: "src/index.ts",
      types: "src/index.ts",
      dependencies: {
        "@minix/contracts": "workspace:*",
        "@minix/core": "workspace:*",
      },
    },
    null,
    2,
  )}
`;
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function updateTsconfigPaths(repoRoot: string, names: FeatureNames) {
  const tsconfigPath = path.join(repoRoot, "tsconfig.base.json");
  const raw = await readFile(tsconfigPath, "utf8");
  const parsed = JSON.parse(raw) as {
    compilerOptions?: {
      paths?: Record<string, string[]>;
    };
  };

  const currentPaths = parsed.compilerOptions?.paths ?? {};
  const featureEntries = Object.entries(currentPaths).filter(([key]) => key.startsWith("@minix/feature-"));
  const otherEntries = Object.entries(currentPaths).filter(([key]) => !key.startsWith("@minix/feature-"));
  const nextFeatureEntries = new Map(featureEntries);
  nextFeatureEntries.set(names.packageName, [`packages/features/${names.kebab}/src`]);

  const sortedFeatureEntries = Array.from(nextFeatureEntries.entries()).sort(([left], [right]) => left.localeCompare(right));
  const nextPaths = Object.fromEntries([...otherEntries, ...sortedFeatureEntries]);

  const nextConfig = {
    ...parsed,
    compilerOptions: {
      ...parsed.compilerOptions,
      paths: nextPaths,
    },
  };

  await writeFile(tsconfigPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");
}

export async function scaffoldFeature(options: ScaffoldFeatureOptions) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const names = normalizeFeatureName(options.featureName);
  const featureDir = path.join(repoRoot, "packages", "features", names.kebab);

  if (await exists(featureDir)) {
    throw new Error(`Feature package already exists: ${path.relative(repoRoot, featureDir)}`);
  }

  await mkdir(path.join(featureDir, "src", "controller"), { recursive: true });
  await mkdir(path.join(featureDir, "src", "model"), { recursive: true });

  await writeFile(path.join(featureDir, "package.json"), packageJsonSource(names), "utf8");
  await writeFile(path.join(featureDir, "src", "index.ts"), indexSource(), "utf8");
  await writeFile(path.join(featureDir, "src", "controller", "index.ts"), controllerSource(names), "utf8");
  await writeFile(path.join(featureDir, "src", "controller", "index.test.ts"), controllerTestSource(names), "utf8");
  await writeFile(path.join(featureDir, "src", "feature.manifest.ts"), featureManifestSource(names), "utf8");
  await writeFile(path.join(featureDir, "src", "model", "index.ts"), modelSource(names), "utf8");

  await updateTsconfigPaths(repoRoot, names);

  return {
    featureDir,
    packageName: names.packageName,
  };
}

function usage(): string {
  return "Usage: pnpm scaffold:feature <feature-name>";
}

async function main() {
  const featureName = process.argv[2];
  if (!featureName || featureName === "--help" || featureName === "-h") {
    console.log(usage());
    return;
  }

  const result = await scaffoldFeature({ featureName });
  console.log(`scaffolded ${result.packageName}`);
  console.log(path.relative(process.cwd(), result.featureDir));
}

const isEntrypoint = process.argv[1] ? /scaffold-feature\.(ts|js)$/.test(path.basename(process.argv[1])) : false;
if (isEntrypoint) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}
