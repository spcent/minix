import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { normalizePath } from "./lib/specs.mjs";

const repoRoot = process.cwd();
const contractsRoot = path.join(repoRoot, "packages", "contracts", "src");
const ignoredDirs = new Set(["node_modules", "dist", ".next", "out"]);
const ignoredSuffixes = [".test.ts", ".d.ts"];

const forbiddenFields = new Map([
  ["appId", "runtime env field"],
  ["appName", "runtime env field"],
  ["apiBaseUrl", "runtime env field"],
  ["debug", "runtime env field"],
  ["version", "runtime env field"],
  ["env", "runtime env field"],
  ["features", "runtime feature-flag field"],
  ["adapters", "runtime app-kernel field"],
  ["routeMapper", "runtime app-kernel field"],
  ["enableAutoLogin", "runtime feature-flag field"],
  ["enableRouteGuard", "runtime feature-flag field"],
  ["controller", "host page-definition field"],
  ["pageData", "host page-definition field"],
  ["renderMode", "host page-definition field"],
  ["routePath", "host page-definition field"],
  ["miniprogramPage", "host page-definition field"],
  ["registrationModule", "host page-definition field"],
  ["navigationBarTitleText", "host page-definition field"],
  ["enablePullDownRefresh", "host page-definition field"],
  ["shellTemplate", "host page-definition field"],
  ["shellStyle", "host page-definition field"],
  ["featureKey", "feature-manifest field"],
  ["pageKey", "feature-manifest field"],
  ["packageName", "feature-manifest field"],
  ["exportName", "feature-manifest field"],
  ["hosts", "feature-manifest field"],
]);

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

function propertyNameText(name, sourceFile) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return name.getText(sourceFile);
}

function collectForbiddenShapeViolations(sourceFile) {
  const violations = [];

  function record(nameNode, fieldName) {
    const reason = forbiddenFields.get(fieldName);
    if (!reason) {
      return;
    }

    const { line } = sourceFile.getLineAndCharacterOfPosition(nameNode.getStart(sourceFile));
    violations.push({
      filePath: sourceFile.fileName,
      line: line + 1,
      fieldName,
      reason,
    });
  }

  function visit(node) {
    if ((ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) && node.name) {
      record(node.name, propertyNameText(node.name, sourceFile));
    }

    if (ts.isPropertyAssignment(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))) {
      record(node.name, propertyNameText(node.name, sourceFile));
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

async function main() {
  const files = await walk(contractsRoot);
  const violations = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    violations.push(...collectForbiddenShapeViolations(sourceFile));
  }

  if (violations.length === 0) {
    console.log(`contract shape check passed for ${files.length} contract source files`);
    return;
  }

  console.error("contract shape check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativePath}:${violation.line} declares "${violation.fieldName}"`);
    console.error(`  contracts must not expose ${violation.reason}.`);
  }

  process.exitCode = 1;
}

await main();
