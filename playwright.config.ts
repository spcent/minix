import { defineConfig, devices } from "@playwright/test";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    browserName: "chromium",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: [
    {
      command:
        'MINIX_CORS_ALLOWED_ORIGINS="http://127.0.0.1:4273,http://127.0.0.1:4274,http://localhost:4273,http://localhost:4274" pnpm dev:api',
      url: "http://127.0.0.1:3000/",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "pnpm preview 4273",
      url: "http://127.0.0.1:4273/",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "pnpm preview:novel-h5 4274",
      url: "http://127.0.0.1:4274/",
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
