#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const check = process.argv.includes("--check");
const sourcePath = resolve(root, "packages/tooling/fixtures/novel-mock-content.ts");
const targets = [
  "apps/novel-h5/src/bootstrap/mock-content.ts",
  "apps/novel-wechat/src/bootstrap/mock-content.ts",
];

const source = await readFile(sourcePath, "utf8");
const expected = [
  "// Generated from packages/tooling/fixtures/novel-mock-content.ts.",
  "// Run pnpm gen:novel-mock-content after editing the fixture.",
  source.trimEnd(),
  "",
].join("\n");

const staleTargets = [];
for (const target of targets) {
  const targetPath = resolve(root, target);
  const current = await readFile(targetPath, "utf8");
  if (current === expected) {
    continue;
  }

  if (check) {
    staleTargets.push(target);
    continue;
  }

  await writeFile(targetPath, expected, "utf8");
  console.log(`updated ${target}`);
}

if (staleTargets.length > 0) {
  console.error(`Novel mock content is stale: ${staleTargets.join(", ")}`);
  console.error("Run pnpm gen:novel-mock-content.");
  process.exit(1);
}
