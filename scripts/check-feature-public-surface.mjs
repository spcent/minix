import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { findManagedPackageDirs, loadRepoSpec, normalizePath, pathExists } from "./lib/specs.mjs";

const repoRoot = process.cwd();
const forbiddenPackageJsonFields = ["exports", "module", "browser", "bin"];

function isFeaturePackageDir(dirPath) {
  return normalizePath(path.relative(repoRoot, dirPath)).startsWith("packages/features/");
}

function collectIndexViolations(sourceFile, filePath, srcRoot) {
  const violations = [];

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile));
        violations.push({
          filePath,
          line: line + 1,
          reason: "src/index.ts must re-export explicit local modules only",
        });
        continue;
      }

      const specifier = statement.moduleSpecifier.text;
      if (!specifier.startsWith(".")) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(statement.moduleSpecifier.getStart(sourceFile));
        violations.push({
          filePath,
          line: line + 1,
          reason: `src/index.ts must not re-export non-local module "${specifier}"`,
        });
        continue;
      }

      const resolved = path.resolve(path.dirname(filePath), specifier);
      if (!(resolved === srcRoot || resolved.startsWith(`${srcRoot}${path.sep}`))) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(statement.moduleSpecifier.getStart(sourceFile));
        violations.push({
          filePath,
          line: line + 1,
          reason: `src/index.ts must not re-export outside src via "${specifier}"`,
        });
      }

      continue;
    }

    if (ts.isImportDeclaration(statement) || ts.isImportEqualsDeclaration(statement)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile));
      violations.push({
        filePath,
        line: line + 1,
        reason: "src/index.ts must stay export-only and should not add imports",
      });
      continue;
    }

    if (ts.isEmptyStatement(statement)) {
      continue;
    }

    const allowedKinds = new Set([
      ts.SyntaxKind.ExportDeclaration,
      ts.SyntaxKind.EndOfFileToken,
    ]);
    if (!allowedKinds.has(statement.kind)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile));
      violations.push({
        filePath,
        line: line + 1,
        reason: "src/index.ts must only contain re-export declarations",
      });
    }
  }

  return violations;
}

async function main() {
  const repoSpec = await loadRepoSpec();
  const packageDirs = (await findManagedPackageDirs(repoSpec)).filter(isFeaturePackageDir);
  const violations = [];

  for (const packageDir of packageDirs) {
    const packageJsonPath = path.join(packageDir, "package.json");
    const indexPath = path.join(packageDir, "src", "index.ts");
    const srcRoot = path.join(packageDir, "src");
    const relativePackageJson = normalizePath(path.relative(repoRoot, packageJsonPath));

    if (!(await pathExists(packageJsonPath)) || !(await pathExists(indexPath))) {
      continue;
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    for (const field of forbiddenPackageJsonFields) {
      if (field in packageJson) {
        violations.push({
          filePath: relativePackageJson,
          line: 1,
          reason: `feature packages must not define package.json field "${field}"`,
        });
      }
    }

    const source = await readFile(indexPath, "utf8");
    const sourceFile = ts.createSourceFile(indexPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    violations.push(...collectIndexViolations(sourceFile, indexPath, srcRoot));
  }

  if (violations.length === 0) {
    console.log(`feature public surface check passed for ${packageDirs.length} feature packages`);
    return;
  }

  console.error("feature public surface check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativePath}:${violation.line} ${violation.reason}`);
  }

  process.exitCode = 1;
}

await main();
