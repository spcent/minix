import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { classifyPathFromDependencySpec, loadDependencyRulesSpec, loadRepoSpec, normalizePath } from "./lib/specs.mjs";

const repoRoot = process.cwd();
const ignoredDirs = new Set(["node_modules", "dist", ".next", "out"]);
const ignoredSuffixes = [".test.ts", ".d.ts"];
const sharedLayers = new Set(["contracts", "core", "features"]);

function isSharedSourceFile(filePath, dependencyRulesSpec) {
  return sharedLayers.has(classifyPathFromDependencySpec(filePath, dependencyRulesSpec));
}

function isPlatformGlobalIdentifier(node) {
  return ts.isIdentifier(node) && (node.text === "wx" || node.text === "window");
}

function isGlobalThisPlatformAccess(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "globalThis" &&
    (node.name.text === "wx" || node.name.text === "window")
  );
}

function collectPlatformCallViolations(sourceFile) {
  const violations = [];

  function visit(node) {
    if (ts.isPropertyAccessExpression(node)) {
      if (isPlatformGlobalIdentifier(node.expression)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.expression.getStart(sourceFile));
        violations.push({
          filePath: sourceFile.fileName,
          line: line + 1,
          expression: `${node.expression.getText(sourceFile)}.${node.name.getText(sourceFile)}`,
        });
      } else if (isGlobalThisPlatformAccess(node.expression)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.expression.getStart(sourceFile));
        violations.push({
          filePath: sourceFile.fileName,
          line: line + 1,
          expression: `${node.expression.getText(sourceFile)}.${node.name.getText(sourceFile)}`,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
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

async function main() {
  const [repoSpec, dependencyRulesSpec] = await Promise.all([
    loadRepoSpec(),
    loadDependencyRulesSpec(),
  ]);
  const sourceRoots = [
    path.join(repoRoot, "packages", "contracts"),
    path.join(repoRoot, "packages", "core"),
    path.join(repoRoot, repoSpec.package_shapes.feature_workspace.root),
  ];
  const violations = [];
  let sharedFileCount = 0;

  for (const root of sourceRoots) {
    const files = await walk(root);

    for (const filePath of files) {
      if (!isSharedSourceFile(filePath, dependencyRulesSpec)) {
        continue;
      }

      sharedFileCount += 1;
      const source = await readFile(filePath, "utf8");
      const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      violations.push(...collectPlatformCallViolations(sourceFile));
    }
  }

  if (violations.length === 0) {
    console.log(`platform call check passed for ${sharedFileCount} shared source files`);
    return;
  }

  console.error("platform call check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativePath}:${violation.line} directly references "${violation.expression}"`);
    console.error("  Shared code must not call wx.* or window.* directly.");
  }

  process.exitCode = 1;
}

await main();
