import { access } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const repoRoot = process.cwd();

function usage() {
  return "Usage: pnpm verify:feature <feature-name>";
}

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code ?? 1}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const featureName = process.argv[2];
  if (!featureName || featureName === "--help" || featureName === "-h") {
    console.log(usage());
    return;
  }

  const featureDir = path.join(repoRoot, "packages", "features", featureName);
  if (!(await exists(featureDir))) {
    throw new Error(`unknown feature "${featureName}"`);
  }

  await run("node", ["scripts/check-boundaries.mjs"]);
  await run("node", ["scripts/check-contract-purity.mjs"]);
  await run("node", ["scripts/check-contract-shapes.mjs"]);
  await run("node", ["scripts/check-contract-behaviors.mjs"]);
  await run("node", ["scripts/check-platform-calls.mjs"]);
  await run("node", ["scripts/check-result-discipline.mjs"]);
  await run("node", ["scripts/check-result-signatures.mjs"]);
  await run("node", ["scripts/check-package-entries.mjs"]);
  await run("node", ["scripts/check-feature-public-surface.mjs"]);
  await run("node", ["scripts/check-package-deps.mjs"]);
  await run("node", ["--import", "tsx", "scripts/sync-host-manifests.ts", "--check"]);
  await run("pnpm", ["typecheck"]);
  await run("node", ["--import", "tsx", "--test", `packages/features/${featureName}/src/**/*.test.ts`]);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
