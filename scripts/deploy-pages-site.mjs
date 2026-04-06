import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { buildHostH5 } from "./build-host-h5.mjs";
import { buildNovelH5 } from "./build-novel-h5.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

const SITE_CONFIG = {
  "host-h5": {
    projectName: "minix-host-h5",
    productionUrl: "https://minix-host-h5.pages.dev",
    previewUrl: "https://preview.minix-host-h5.pages.dev",
    build: () => buildHostH5(repoRoot),
  },
  "novel-h5": {
    projectName: "minix-novel-h5",
    productionUrl: "https://minix-novel-h5.pages.dev",
    previewUrl: "https://preview.minix-novel-h5.pages.dev",
    build: () => buildNovelH5(repoRoot),
  },
};

function printUsageAndExit() {
  console.error("usage: node scripts/deploy-pages-site.mjs <host-h5|novel-h5> <preview|production>");
  process.exit(1);
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code ?? 1}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const siteKey = process.argv[2];
  const target = process.argv[3];
  if (!siteKey || !target) {
    printUsageAndExit();
  }

  if (!(siteKey in SITE_CONFIG) || (target !== "preview" && target !== "production")) {
    printUsageAndExit();
  }

  const config = SITE_CONFIG[siteKey];
  const apiBaseUrl = process.env.MINIX_API_BASE_URL;
  if (!apiBaseUrl) {
    console.error("MINIX_API_BASE_URL is required for Pages deployment");
    process.exit(1);
  }

  process.env.MINIX_API_BASE_URL = apiBaseUrl;
  const distDir = await config.build();

  const deployArgs = ["exec", "wrangler", "pages", "deploy", distDir, "--project-name", config.projectName];
  if (target === "preview") {
    deployArgs.push("--branch", "preview");
  }

  await run(process.platform === "win32" ? "pnpm.cmd" : "pnpm", deployArgs);

  const expectedUrl = target === "preview" ? config.previewUrl : config.productionUrl;
  console.log(`expected ${siteKey} ${target} url: ${expectedUrl}`);
  console.log(`built with MINIX_API_BASE_URL=${apiBaseUrl}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
