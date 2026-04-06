import { readFile } from "node:fs/promises";
import path from "node:path";
import { findManagedPackageDirs, loadRepoSpec, normalizePath, pathExists } from "./lib/specs.mjs";

const repoRoot = process.cwd();
const expectedEntry = "src/index.ts";

async function main() {
  const repoSpec = await loadRepoSpec();
  const packageDirs = await findManagedPackageDirs(repoSpec);
  const violations = [];

  for (const packageDir of packageDirs) {
    const packageJsonPath = path.join(packageDir, "package.json");
    if (!(await pathExists(packageJsonPath))) {
      continue;
    }

    const raw = await readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(raw);
    const relativePackageJson = normalizePath(path.relative(repoRoot, packageJsonPath));

    if (packageJson.main !== expectedEntry) {
      violations.push({
        filePath: relativePackageJson,
        reason: `main must be "${expectedEntry}"`,
      });
    }

    if (packageJson.types !== expectedEntry) {
      violations.push({
        filePath: relativePackageJson,
        reason: `types must be "${expectedEntry}"`,
      });
    }
  }

  if (violations.length === 0) {
    console.log(`package entry check passed for ${packageDirs.length} managed package directories`);
    return;
  }

  console.error("package entry check failed:");
  for (const violation of violations) {
    console.error(`- ${violation.filePath}: ${violation.reason}`);
  }

  process.exitCode = 1;
}

await main();
