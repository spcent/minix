import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { normalizePath } from "./lib/specs.mjs";

const repoRoot = process.cwd();

const signatureRules = {
  "packages/core/src/ports/auth.ts": {
    AuthAdapter: {
      defaultMode: "async-result",
    },
  },
  "packages/core/src/ports/request.ts": {
    RequestAdapter: {
      defaultMode: "async-result",
    },
  },
  "packages/core/src/ports/router.ts": {
    RouterAdapter: {
      defaultMode: "async-result",
      methods: {
        current: "sync-result",
      },
    },
  },
  "packages/core/src/ports/storage.ts": {
    StorageAdapter: {
      defaultMode: "async-result",
    },
  },
  "packages/core/src/ports/ui.ts": {
    UIAdapter: {
      defaultMode: "async-result",
    },
  },
  "packages/core/src/runtime/auth.ts": {
    AuthService: {
      defaultMode: "async-result",
    },
  },
  "packages/core/src/runtime/request.ts": {
    RequestClient: {
      defaultMode: "async-result",
    },
  },
  "packages/core/src/runtime/router.ts": {
    RouterService: {
      defaultMode: "async-result",
      methods: {
        current: "sync-result",
        resolve: "sync-result",
      },
    },
  },
  "packages/core/src/runtime/session.ts": {
    SessionService: {
      defaultMode: "async-result",
    },
  },
  "packages/core/src/store/cache.ts": {
    CacheService: {
      defaultMode: "async-result",
    },
  },
};

function isTypeReferenceNamed(node, expectedName) {
  if (!node || !ts.isTypeReferenceNode(node)) {
    return false;
  }

  return ts.isIdentifier(node.typeName) && node.typeName.text === expectedName;
}

function isResultType(node) {
  return isTypeReferenceNamed(node, "Result") && Boolean(node.typeArguments?.length);
}

function isPromiseOfResult(node) {
  return (
    isTypeReferenceNamed(node, "Promise") &&
    Boolean(node.typeArguments?.length === 1) &&
    isResultType(node.typeArguments[0])
  );
}

function collectInterfaceMethods(interfaceNode) {
  return interfaceNode.members
    .filter((member) => ts.isMethodSignature(member))
    .map((member) => member);
}

async function loadSourceFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const source = await readFile(absolutePath, "utf8");
  return ts.createSourceFile(absolutePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function findExportedInterface(sourceFile, name) {
  return sourceFile.statements.find(
    (statement) =>
      ts.isInterfaceDeclaration(statement) &&
      statement.name.text === name &&
      statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
  );
}

function checkMethodSignature(returnType, expectedMode) {
  if (!returnType) {
    return false;
  }

  if (expectedMode === "async-result") {
    return isPromiseOfResult(returnType);
  }

  if (expectedMode === "sync-result") {
    return isResultType(returnType);
  }

  return false;
}

async function main() {
  const violations = [];

  for (const [relativePath, interfaces] of Object.entries(signatureRules)) {
    const sourceFile = await loadSourceFile(relativePath);

    for (const [interfaceName, rule] of Object.entries(interfaces)) {
      const interfaceNode = findExportedInterface(sourceFile, interfaceName);
      if (!interfaceNode) {
        violations.push({
          filePath: sourceFile.fileName,
          line: 1,
          message: `expected exported interface "${interfaceName}"`,
        });
        continue;
      }

      const methods = collectInterfaceMethods(interfaceNode);
      for (const method of methods) {
        const methodName = method.name.getText(sourceFile);
        const expectedMode = rule.methods?.[methodName] ?? rule.defaultMode;
        if (checkMethodSignature(method.type, expectedMode)) {
          continue;
        }

        const { line } = sourceFile.getLineAndCharacterOfPosition(method.getStart(sourceFile));
        const expectedText = expectedMode === "async-result" ? "Promise<Result<...>>" : "Result<...>";
        violations.push({
          filePath: sourceFile.fileName,
          line: line + 1,
          message: `"${interfaceName}.${methodName}" must return ${expectedText}`,
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log(`result signature check passed for ${Object.keys(signatureRules).length} core interface files`);
    return;
  }

  console.error("result signature check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativePath}:${violation.line} ${violation.message}`);
  }

  process.exitCode = 1;
}

await main();
