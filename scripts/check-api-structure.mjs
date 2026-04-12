import { readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

const fileBudgets = [
  {
    path: "apps/api/src/app.ts",
    maxLines: 120,
    forbiddenPatterns: [
      {
        pattern: /\bapp\.(get|post|put|patch|delete)\(/,
        message: "app.ts must stay middleware-only and must not register business handlers directly.",
      },
    ],
  },
  {
    path: "apps/api/src/app-composition.ts",
    maxLines: 120,
  },
  {
    path: "apps/api/src/domains/payment/routes.ts",
    maxLines: 80,
    forbiddenPatterns: [
      {
        pattern: /\bapp\.(get|post|put|patch|delete)\(/,
        message:
          "payment/routes.ts is an assembly entry and must delegate handlers to routes.*.ts modules.",
      },
    ],
  },
  {
    path: "apps/api/src/domains/account/routes.ts",
    maxLines: 80,
    forbiddenPatterns: [
      {
        pattern: /\bapp\.(get|post|put|patch|delete)\(/,
        message:
          "account/routes.ts is an assembly entry and must delegate handlers to routes.*.ts modules.",
      },
    ],
  },
];

function countLines(source) {
  return source.split(/\r?\n/u).length;
}

async function main() {
  const violations = [];

  for (const budget of fileBudgets) {
    const absolutePath = path.join(repoRoot, budget.path);
    const source = await readFile(absolutePath, "utf8");
    const lineCount = countLines(source);

    if (lineCount > budget.maxLines) {
      violations.push({
        filePath: budget.path,
        message: `exceeds line budget (${lineCount} > ${budget.maxLines})`,
      });
    }

    for (const rule of budget.forbiddenPatterns ?? []) {
      if (rule.pattern.test(source)) {
        violations.push({
          filePath: budget.path,
          message: rule.message,
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log(`api structure check passed for ${fileBudgets.length} guarded files`);
    return;
  }

  console.error("api structure check failed:");
  for (const violation of violations) {
    console.error(`- ${violation.filePath}: ${violation.message}`);
  }
  process.exitCode = 1;
}

await main();
