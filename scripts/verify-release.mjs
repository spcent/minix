import path from "node:path";
import { spawn } from "node:child_process";

import { loadRepoSpec } from "./lib/specs.mjs";

const repoRoot = process.cwd();

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
  const repoSpec = await loadRepoSpec();
  const officialSamples = repoSpec.workspace?.official_v1_samples ?? [];
  const hostNames = officialSamples.map((samplePath) => path.basename(samplePath));

  if (hostNames.length === 0) {
    throw new Error("specs/repo.yaml does not define workspace.official_v1_samples");
  }

  console.log(`release gate: running repo verification for ${hostNames.length} official samples`);
  await run("pnpm", ["verify"]);

  for (const hostName of hostNames) {
    console.log(`release gate: verifying official sample "${hostName}"`);
    await run("pnpm", ["verify:host", hostName]);
  }

  console.log("release gate: verifying official sample integrations against the local api");
  await run("pnpm", ["verify:official-integrations"]);

  console.log("release gate: running browser smoke for official h5 samples");
  await run("pnpm", ["verify:h5:blackbox"]);

  console.log(`release gate passed for: ${hostNames.join(", ")}`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
