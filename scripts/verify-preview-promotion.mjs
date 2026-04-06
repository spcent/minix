import { execFileSync } from "node:child_process";

const apiBaseUrl = process.env.MINIX_API_BASE_URL;
const hostH5BaseUrl = process.env.MINIX_HOST_H5_BASE_URL;
const novelH5BaseUrl = process.env.MINIX_NOVEL_H5_BASE_URL;

if (!apiBaseUrl) {
  console.error("MINIX_API_BASE_URL is required for preview promotion verification");
  process.exit(1);
}

if (!hostH5BaseUrl) {
  console.error("MINIX_HOST_H5_BASE_URL is required for preview promotion verification");
  process.exit(1);
}

if (!novelH5BaseUrl) {
  console.error("MINIX_NOVEL_H5_BASE_URL is required for preview promotion verification");
  process.exit(1);
}

const sharedEnv = {
  ...process.env,
  MINIX_API_BASE_URL: apiBaseUrl,
  MINIX_HOST_H5_BASE_URL: hostH5BaseUrl,
  MINIX_NOVEL_H5_BASE_URL: novelH5BaseUrl,
};

function runStep(label, command, args) {
  console.log(`\n== ${label} ==`);
  execFileSync(command, args, {
    stdio: "inherit",
    env: sharedEnv,
  });
}

runStep("Verify preview API", "pnpm", ["verify:api:remote"]);
runStep("Verify preview H5 hosts", "pnpm", [
  "exec",
  "playwright",
  "test",
  "tests/e2e/h5-release-smoke.spec.ts",
  "--config=playwright.preview.config.ts",
]);

console.log("\npreview promotion verification passed");
console.log(`api: ${apiBaseUrl}`);
console.log(`host-h5: ${hostH5BaseUrl}`);
console.log(`novel-h5: ${novelH5BaseUrl}`);
