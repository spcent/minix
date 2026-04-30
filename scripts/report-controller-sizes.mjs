#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const thresholdArg = process.argv.find((arg) => arg.startsWith("--threshold="));
const threshold = Number(thresholdArg?.split("=")[1] ?? 700);

const { stdout } = await execFileAsync("rg", ["--files", "packages/features"]);
const controllerFiles = stdout
  .split("\n")
  .filter((file) => file.endsWith("/controller/index.ts"))
  .sort();

const rows = [];
for (const file of controllerFiles) {
  const content = await readFile(resolve(root, file), "utf8");
  rows.push({
    file,
    lines: content.split("\n").length - (content.endsWith("\n") ? 1 : 0),
  });
}

const oversized = rows
  .filter((row) => row.lines >= threshold)
  .sort((left, right) => right.lines - left.lines);

console.log(`Controller size report (soft threshold: ${threshold} lines)`);
if (oversized.length === 0) {
  console.log("No controller facade currently exceeds the threshold.");
  process.exit(0);
}

for (const row of oversized) {
  console.log(`${String(row.lines).padStart(4, " ")}  ${relative(root, resolve(root, row.file))}`);
}

console.log("Report only: this script does not fail CI.");
