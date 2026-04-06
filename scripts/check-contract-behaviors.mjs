import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { normalizePath } from "./lib/specs.mjs";

const repoRoot = process.cwd();
const contractsRoot = path.join(repoRoot, "packages", "contracts", "src");
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

function collectBehaviorViolations(sourceFile) {
  const violations = [];

  function lineOf(node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }

  function push(node, shape, owner) {
    violations.push({
      filePath: sourceFile.fileName,
      line: lineOf(node),
      shape,
      owner,
    });
  }

  function visit(node) {
    if (ts.isInterfaceDeclaration(node)) {
      for (const member of node.members) {
        if (ts.isMethodSignature(member)) {
          push(member.name, "method signature", `interface "${node.name.text}"`);
          continue;
        }

        if (ts.isPropertySignature(member) && member.type && ts.isFunctionTypeNode(member.type)) {
          push(member.name, "function-typed property", `interface "${node.name.text}"`);
        }
      }
    }

    if (ts.isTypeAliasDeclaration(node)) {
      if (ts.isFunctionTypeNode(node.type)) {
        push(node.name, "function type alias", `type "${node.name.text}"`);
      }

      if (ts.isTypeLiteralNode(node.type)) {
        for (const member of node.type.members) {
          if (ts.isMethodSignature(member)) {
            push(member.name, "method signature", `type "${node.name.text}"`);
            continue;
          }

          if (ts.isPropertySignature(member) && member.type && ts.isFunctionTypeNode(member.type)) {
            push(member.name, "function-typed property", `type "${node.name.text}"`);
          }
        }
      }
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
    violations.push(...collectBehaviorViolations(sourceFile));
  }

  if (violations.length === 0) {
    console.log(`contract behavior check passed for ${files.length} contract source files`);
    return;
  }

  console.error("contract behavior check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativePath}:${violation.line} declares a ${violation.shape} in ${violation.owner}`);
    console.error("  contracts must stay data-only and must not define behavior-shaped types.");
  }

  process.exitCode = 1;
}

await main();
