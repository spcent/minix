import { access } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadRepoSpec } from "./lib/specs.mjs";

const repoRoot = process.cwd();

function usage() {
  return "Usage: pnpm verify:host <host-name>";
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
  const hostName = process.argv[2];
  if (!hostName || hostName === "--help" || hostName === "-h") {
    console.log(usage());
    return;
  }

  const hostDir = path.join(repoRoot, "apps", hostName);
  if (!(await exists(hostDir))) {
    throw new Error(`unknown host "${hostName}"`);
  }

  const repoSpec = await loadRepoSpec();
  const hostSpec = repoSpec.host_wiring.hosts[hostName];
  if (!hostSpec) {
    throw new Error(`host "${hostName}" is not configured in specs/repo.yaml`);
  }

  await run("node", ["--import", "tsx", "scripts/check-specs.mjs"]);
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

  if (hostSpec.registry?.shell_module) {
    await run("node", ["--import", "tsx", "scripts/sync-host-wechat-shells.ts", "--check"]);
  }

  await run("node", ["--import", "tsx", "scripts/check-host-routes.mjs"]);
  await run("node", ["--import", "tsx", "scripts/check-host-wiring.mjs"]);
  await run("pnpm", ["typecheck"]);
  await run("node", ["--import", "tsx", "--test", `apps/${hostName}/**/*.test.ts`]);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
