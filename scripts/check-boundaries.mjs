import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  buildWorkspacePackageLayerMap,
  classifyPathFromDependencySpec,
  findContainingPackageRoot,
  findManagedPackageDirs,
  findWorkspacePackages,
  formatLayerList,
  loadDependencyRulesSpec,
  loadRepoSpec,
  workspacePackageName,
} from "./lib/specs.mjs";
import { collectImports } from "./lib/imports.mjs";

const repoRoot = process.cwd();
const ignoredSuffixes = [".test.ts", ".d.ts"];

function isScopedPackageDeepImport(specifier) {
  if (!specifier.startsWith("@minix/")) {
    return false;
  }

  const parts = specifier.split("/");
  return parts.length > 2;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
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
function createBoundaryRuleTable(dependencyRulesSpec) {
  const ruleTable = new Map();

  for (const [layerName, layerSpec] of Object.entries(dependencyRulesSpec.layers)) {
    const blocked = new Set(layerSpec.may_not_depend_on ?? []);
    const allowed = new Set(layerSpec.may_depend_on ?? []);
    if (blocked.size === 0) {
      ruleTable.set(layerName, {
        blocked,
        allowed,
        blockedReason: `${layerName} must not depend on ${formatLayerList(Array.from(blocked))}`,
        allowedReason: `${layerName} may depend only on ${formatLayerList(Array.from(allowed))}`,
      });
      continue;
    }

    ruleTable.set(layerName, {
      blocked,
      allowed,
      blockedReason: `${layerName} must not depend on ${formatLayerList(Array.from(blocked))}`,
      allowedReason: `${layerName} may depend only on ${formatLayerList(Array.from(allowed))}`,
    });
  }

  return ruleTable;
}

function classifySpecifier(specifier, filePath, context) {
  if (specifier.startsWith(".")) {
    const resolved = path.resolve(path.dirname(filePath), specifier);
    return classifyPathFromDependencySpec(resolved, context.dependencyRulesSpec);
  }

  const packageName = workspacePackageName(specifier);
  if (packageName && context.workspacePackageLayerMap.has(packageName)) {
    return context.workspacePackageLayerMap.get(packageName);
  }

  return "external";
}

async function main() {
  const [repoSpec, dependencyRulesSpec] = await Promise.all([
    loadRepoSpec(),
    loadDependencyRulesSpec(),
  ]);
  const packageDirs = await findManagedPackageDirs(repoSpec);
  const workspacePackages = await findWorkspacePackages(packageDirs);
  const workspacePackageLayerMap = buildWorkspacePackageLayerMap(workspacePackages, dependencyRulesSpec);
  const sourceRoots = packageDirs;
  const ruleTable = createBoundaryRuleTable(dependencyRulesSpec);
  const sourceFiles = [];
  for (const root of sourceRoots) {
    sourceFiles.push(...(await walk(root)));
  }

  const violations = [];

  for (const filePath of sourceFiles) {
    const ownerLayer = classifyPathFromDependencySpec(filePath, dependencyRulesSpec);
    const ownerPackageRoot = findContainingPackageRoot(filePath, packageDirs);
    const rules = ruleTable.get(ownerLayer);
    if (!rules && !ownerPackageRoot) {
      continue;
    }

    const source = await readFile(filePath, "utf8");
    const imports = collectImports(source, filePath);

    for (const imported of imports) {
      if (isScopedPackageDeepImport(imported.specifier)) {
        violations.push({
          filePath,
          line: imported.line,
          specifier: imported.specifier,
          ownerLayer,
          targetLayer: "deep-import",
          reason: dependencyRulesSpec.cross_cutting_rules.no_deep_imports.description,
        });
        continue;
      }

      if (imported.specifier.startsWith(".")) {
        const resolved = path.resolve(path.dirname(filePath), imported.specifier);
        const targetPackageRoot = findContainingPackageRoot(resolved, packageDirs);

        if (ownerPackageRoot && targetPackageRoot && ownerPackageRoot !== targetPackageRoot) {
          violations.push({
            filePath,
            line: imported.line,
            specifier: imported.specifier,
            ownerLayer,
            targetLayer: "cross-package-relative",
            reason: dependencyRulesSpec.cross_cutting_rules.no_cross_package_relative_imports.description,
          });
          continue;
        }
      }

      if (!rules) {
        continue;
      }

      const targetLayer = classifySpecifier(imported.specifier, filePath, {
        dependencyRulesSpec,
        workspacePackageLayerMap,
      });
      if (targetLayer !== "external" && targetLayer !== "unknown" && targetLayer !== ownerLayer) {
        if (rules.blocked.has(targetLayer)) {
          violations.push({
            filePath,
            line: imported.line,
            specifier: imported.specifier,
            ownerLayer,
            targetLayer,
            reason: rules.blockedReason,
          });
          continue;
        }

        if (!rules.allowed.has(targetLayer)) {
          violations.push({
            filePath,
            line: imported.line,
            specifier: imported.specifier,
            ownerLayer,
            targetLayer,
            reason: rules.allowedReason,
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log(`boundary and public API check passed for ${sourceFiles.length} source files`);
    return;
  }

  console.error("boundary check failed:");
  for (const violation of violations) {
    const relativePath = path.relative(repoRoot, violation.filePath);
    console.error(
      `- ${relativePath}:${violation.line} imports "${violation.specifier}" (${violation.ownerLayer} -> ${violation.targetLayer})`,
    );
    console.error(`  ${violation.reason}`);
  }

  process.exitCode = 1;
}

await main();
