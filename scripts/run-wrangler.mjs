import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const apiDir = resolve(repoRoot, "apps/api");

const privateConfigPath = resolve(apiDir, "wrangler.private.jsonc");
const defaultConfigPath = resolve(apiDir, "wrangler.jsonc");
const configPath = existsSync(privateConfigPath) ? privateConfigPath : defaultConfigPath;

const wranglerArgs = [...process.argv.slice(2), "--config", configPath];
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const child = spawn(command, ["exec", "wrangler", ...wranglerArgs], {
  cwd: apiDir,
  stdio: "inherit",
  env: {
    ...process.env,
    HOME: resolve(apiDir, ".wrangler-home"),
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
