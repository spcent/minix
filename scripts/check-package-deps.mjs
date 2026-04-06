import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  buildWorkspacePackageLayerMap,
  classifyPathFromDependencySpec,
  findManagedPackageDirs,
  findWorkspacePackages,
  loadDependencyRulesSpec,
  loadRepoSpec,
  pathExists,
  workspacePackageName,
} from "./lib/specs.mjs";
import { collectImports } from "./lib/imports.mjs";

const repoRoot = process.cwd();

const ignoredDirs = new Set(["node_modules", "dist", ".next", "out"]);
const ignoredSuffixes = [".test.ts", ".d.ts"];

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (!entry.isFile() || !fullPath.endsWith(".ts")) {
      continue;
    }

    if (ignoredSuffixes.some((suffix) => fullPath.endsWith(suffix))) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

async function findNestedFeatureSourceIslands(repoSpec) {
  const featureRoot = path.join(repoRoot, repoSpec.package_shapes.feature_workspace.root);
  const allowedParents = new Set((await findManagedPackageDirs(repoSpec)).map((dir) => normalizePath(dir)));
  const violations = [];

  async function visit(dir) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || ignoredDirs.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const normalized = normalizePath(fullPath);
      const isManagedPackageDir = allowedParents.has(normalized);
      const packageJsonPath = path.join(fullPath, "package.json");
      const publicIndexPath = path.join(fullPath, "src", "index.ts");

      if (!isManagedPackageDir && ((await pathExists(packageJsonPath)) || (await pathExists(publicIndexPath)))) {
        violations.push({
          kind: "nested-source-island",
          packageDir: fullPath,
          parentDir: path.dirname(fullPath),
        });
      }

      await visit(fullPath);
    }
  }

  await visit(featureRoot);
  return violations;
}

async function main() {
  const repoSpec = await loadRepoSpec();
  const dependencyRulesSpec = await loadDependencyRulesSpec();
  const packageDirs = await findManagedPackageDirs(repoSpec);
  const packages = await findWorkspacePackages(packageDirs);
  const workspacePackageLayerMap = buildWorkspacePackageLayerMap(packages, dependencyRulesSpec);
  const workspaceNames = new Set(packages.map((pkg) => pkg.name).filter(Boolean));
  const violations = [];

  for (const packageDir of packageDirs) {
    const packageJsonPath = path.join(packageDir, "package.json");
    const publicIndexPath = path.join(packageDir, "src", "index.ts");
    const hasPackageJson = await pathExists(packageJsonPath);
    const hasPublicIndex = await pathExists(publicIndexPath);
    const sourceFiles = await walk(packageDir);

    if (!hasPackageJson && sourceFiles.length > 0) {
      violations.push({
        kind: "missing-package-json",
        packageDir,
      });
      continue;
    }

    if (!hasPackageJson) {
      continue;
    }

    if (!hasPublicIndex) {
      violations.push({
        kind: "missing-public-index",
        packageDir,
        packageJsonPath,
      });
    }
  }

  violations.push(...(await findNestedFeatureSourceIslands(repoSpec)));

  for (const pkg of packages) {
    if (!pkg.name) {
      continue;
    }

    const ownerLayer = classifyPathFromDependencySpec(pkg.dir, dependencyRulesSpec);
    const ownerRule = dependencyRulesSpec.layers[ownerLayer];

    const sourceFiles = await walk(pkg.dir);
    const usedWorkspaceDeps = new Set();
    const usageLines = new Map();

    for (const filePath of sourceFiles) {
      const source = await readFile(filePath, "utf8");
      const imports = collectImports(source, filePath);

      for (const imported of imports) {
        const packageName = workspacePackageName(imported.specifier);
        if (!packageName || !workspaceNames.has(packageName) || packageName === pkg.name) {
          continue;
        }

        usedWorkspaceDeps.add(packageName);

        if (!usageLines.has(packageName)) {
          usageLines.set(packageName, {
            filePath,
            line: imported.line,
            specifier: imported.specifier,
          });
        }
      }
    }

    for (const dependency of usedWorkspaceDeps) {
      const declared =
        pkg.dependencies.has(dependency) ||
        pkg.devDependencies.has(dependency) ||
        pkg.peerDependencies.has(dependency) ||
        pkg.optionalDependencies.has(dependency);

      if (declared) {
        continue;
      }

      const usage = usageLines.get(dependency);
      violations.push({
        kind: "missing",
        packageName: pkg.name,
        packageJsonPath: pkg.packageJsonPath,
        dependency,
        usage,
      });
    }

    for (const dependency of pkg.dependencies) {
      if (!dependency.startsWith("@minix/")) {
        continue;
      }
      if (!workspaceNames.has(dependency) || dependency === pkg.name) {
        continue;
      }

      const targetLayer = workspacePackageLayerMap.get(dependency);
      if (
        targetLayer &&
        targetLayer !== "unknown" &&
        ownerLayer !== "unknown" &&
        targetLayer !== ownerLayer &&
        !new Set(ownerRule?.may_depend_on ?? []).has(targetLayer)
      ) {
        violations.push({
          kind: "forbidden-direction",
          packageName: pkg.name,
          packageJsonPath: pkg.packageJsonPath,
          dependency,
          ownerLayer,
          targetLayer,
        });
      }

      if (usedWorkspaceDeps.has(dependency)) {
        continue;
      }

      violations.push({
        kind: "unused",
        packageName: pkg.name,
        packageJsonPath: pkg.packageJsonPath,
        dependency,
      });
    }
  }

  if (violations.length === 0) {
    console.log(`workspace dependency check passed for ${packages.length} packages`);
    return;
  }

  console.error("workspace dependency check failed:");
  for (const violation of violations) {
    if (violation.kind === "missing-package-json") {
      const relativeDir = path.relative(repoRoot, violation.packageDir);
      console.error(`- ${relativeDir} contains source files but has no package.json`);
      continue;
    }

    if (violation.kind === "missing-public-index") {
      const relativePackageJson = path.relative(repoRoot, violation.packageJsonPath);
      console.error(`- ${relativePackageJson} is missing required public entry src/index.ts`);
      continue;
    }

    if (violation.kind === "nested-source-island") {
      const relativeDir = path.relative(repoRoot, violation.packageDir);
      const relativeParent = path.relative(repoRoot, violation.parentDir);
      console.error(`- ${relativeDir} is nested under non-package directory ${relativeParent}`);
      console.error("  workspace source packages must live directly under apps/*, packages/*, or packages/features/*");
      continue;
    }

    const relativePackageJson = path.relative(repoRoot, violation.packageJsonPath);

    if (violation.kind === "missing") {
      const usagePath = path.relative(repoRoot, violation.usage.filePath);
      console.error(`- ${relativePackageJson} is missing dependency "${violation.dependency}"`);
      console.error(`  used at ${usagePath}:${violation.usage.line} via "${violation.usage.specifier}"`);
      continue;
    }

    if (violation.kind === "forbidden-direction") {
      console.error(`- ${relativePackageJson} declares workspace dependency "${violation.dependency}" in a forbidden layer direction`);
      console.error(`  ${violation.ownerLayer} may not declare dependency on ${violation.targetLayer}`);
      continue;
    }

    console.error(`- ${relativePackageJson} declares unused workspace dependency "${violation.dependency}"`);
  }

  process.exitCode = 1;
}

await main();
