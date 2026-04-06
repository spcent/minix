import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { collectImports } from "./lib/imports.mjs";
import { normalizePath } from "./lib/specs.mjs";

const repoRoot = process.cwd();
const contractsRoot = path.join(repoRoot, "packages", "contracts");
const coreRoot = path.join(repoRoot, "packages", "core");
const ignoredDirs = new Set(["node_modules", "dist", ".next", "out"]);
const ignoredSuffixes = [".test.ts", ".d.ts"];

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

function resolvesIntoCore(specifier, filePath) {
  if (!specifier.startsWith(".")) {
    return false;
  }

  const resolved = path.resolve(path.dirname(filePath), specifier);
  return resolved === coreRoot || resolved.startsWith(`${coreRoot}${path.sep}`);
}

async function main() {
  const files = await walk(path.join(contractsRoot, "src"));
  const violations = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const imports = collectImports(source, filePath);

    for (const imported of imports) {
      if (imported.specifier === "@minix/core" || imported.specifier.startsWith("@minix/core/")) {
        violations.push({
          filePath,
          line: imported.line,
          specifier: imported.specifier,
          reason: "contracts must not import runtime or shared types from @minix/core",
        });
        continue;
      }

      if (resolvesIntoCore(imported.specifier, filePath)) {
        violations.push({
          filePath,
          line: imported.line,
          specifier: imported.specifier,
          reason: "contracts must not reach into packages/core through relative imports",
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log(`contract purity check passed for ${files.length} contract source files`);
    return;
  }

  console.error("contract purity check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativePath}:${violation.line} imports "${violation.specifier}"`);
    console.error(`  ${violation.reason}`);
  }

  process.exitCode = 1;
}

await main();
