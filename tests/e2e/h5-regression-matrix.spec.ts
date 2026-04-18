import { expect, test, type Page } from "@playwright/test";

const hostBaseUrl = (process.env.MINIX_HOST_H5_BASE_URL ?? "http://127.0.0.1:4273").replace(/\/$/, "");
const novelBaseUrl = (process.env.MINIX_NOVEL_H5_BASE_URL ?? "http://127.0.0.1:4274").replace(/\/$/, "");

async function loginGuestFromHome(page: Page) {
  await page.goto(`${hostBaseUrl}/`);
  await expect(page.locator("#login")).toBeVisible();
  await page.locator("#login").click();
  await expect(page.locator("#home-open-overview")).toBeVisible();
}

function readDebugCode(text: string | null): string {
  const code = text?.match(/Debug code:\s*(\d{4,8})/)?.[1];
  if (!code) {
    throw new Error(`Could not read debug code from: ${text ?? "<empty>"}`);
  }

  return code;
}

test("host-h5 restores inbox route params and selected thread after reload", async ({ page }) => {
  await loginGuestFromHome(page);

  await page.goto(`${hostBaseUrl}/inbox?type=business&onlyUnread=true&threadId=thread_private_tutor`);
  await expect(page).toHaveURL(/\/inbox\?/);
  await expect(page.locator("#messages-toggle-unread")).toContainText("Showing unread only");
  await expect(page.getByRole("button", { name: /Tutor Mila/ })).toBeVisible();
  await expect(page.getByText("Private coaching thread", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.locator("#messages-toggle-unread")).toContainText("Showing unread only");
  await expect(page.getByRole("button", { name: /Tutor Mila/ })).toBeVisible();
  await expect(page).toHaveURL(/threadId=thread_private_tutor/);
});

test("host-h5 restores protected deep links after sign-in without losing inbox context", async ({ page }) => {
  await page.goto(`${hostBaseUrl}/inbox?type=business&onlyUnread=true&threadId=thread_private_tutor`);
  await expect(page.locator("#login")).toBeVisible();

  await page.locator("#login").click();

  await expect(page).toHaveURL(/\/inbox\?/);
  await expect(page).toHaveURL(/type=business/);
  await expect(page).toHaveURL(/onlyUnread=true/);
  await expect(page).toHaveURL(/threadId=thread_private_tutor/);
  await expect(page.locator("#messages-toggle-unread")).toContainText("Showing unread only");
  await expect(page.getByText("Private coaching thread", { exact: true })).toBeVisible();
});

test("host-h5 restores protected discover deep links after sign-in with route-bound search state", async ({ page }) => {
  await page.goto(`${hostBaseUrl}/discover?keyword=travel&domain=all&sort=updatedAt`);
  await expect(page.locator("#login")).toBeVisible();

  await page.locator("#login").click();

  await expect(page).toHaveURL(/\/discover\?/);
  await expect(page).toHaveURL(/keyword=travel/);
  await expect(page).toHaveURL(/domain=all/);
  await expect(page).toHaveURL(/sort=updatedAt/);
  await expect(page.locator("#feed-keyword")).toHaveValue("travel");
  await expect(page.locator("[data-feed-open]").first()).toBeVisible();
});

test("host-h5 covers guest upgrade, feed search, feedback, upload-share, and logout", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: hostBaseUrl });

  await loginGuestFromHome(page);

  await page.goto(`${hostBaseUrl}/account`);
  await expect(page.getByRole("heading", { name: "Account Center" })).toBeVisible();
  await expect(page.locator("#account-identity-upgrade")).toBeVisible();
  await page.locator("#account-identity-upgrade").click();

  await expect(page).toHaveURL(`${hostBaseUrl}/auth/identity/upgrade`);
  await page.locator("#identity-method-phone").click();
  await page.locator("#identity-phone").fill("13800000022");
  await page.locator("#identity-request-code").click();
  const debugCodeText = await page.getByText(/Debug code:/).textContent();
  const debugCode = readDebugCode(debugCodeText);
  await page.locator("#identity-code").fill(debugCode);
  const upgradeResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/auth/identity/upgrade") && response.request().method() === "POST",
  );
  await page.locator("#identity-submit-upgrade").click();
  const upgradeResponse = await upgradeResponsePromise;
  expect(upgradeResponse.ok()).toBeTruthy();

  await page.goto(`${hostBaseUrl}/discover`);
  await expect(page.getByRole("heading", { name: "Search Center" })).toBeVisible();
  await page.locator("#feed-keyword").fill("travel");
  await page.locator("#feed-submit").click();
  await expect(page.locator("[data-feed-open]").first()).toBeVisible();
  await page.reload();
  await expect(page.locator("#feed-keyword")).toHaveValue("travel");

  await page.goto(`${hostBaseUrl}/feedback`);
  await expect(page.locator("h1").filter({ hasText: "Feedback" })).toBeVisible();
  await page.locator('[data-feedback-category="product_issue"]').click();
  await page.locator('[data-feedback-type="issue_report"]').click();
  await page.locator('[data-feedback-score="4"]').click();
  await page.locator("#feedback-title").fill("Inbox route feels stale after refresh");
  await page.locator("#feedback-description").fill(
    "Regression matrix covers protected route recovery and should preserve the intended destination.",
  );
  await page.locator("#feedback-add-screenshot").click();
  await page.locator("#feedback-add-attachment").click();
  await page.locator("#feedback-submit").click();
  await expect(page.getByText("Inbox route feels stale after refresh")).toBeVisible();
  await expect(page.getByText(/Latest ticket saved at/i)).toBeVisible();

  await page.goto(`${hostBaseUrl}/media-tools`);
  await expect(page.getByRole("heading", { name: "Media Tools" })).toBeVisible();
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("#media-tools-upload").click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "regression-proof.png",
    mimeType: "image/png",
    buffer: Buffer.from("minix-regression-proof"),
  });
  await expect(page.getByText(/backend-backed flow|review/i)).toBeVisible();

  await page.locator("#media-tools-share").click();
  await expect(page.getByText(/share link copied|native share dispatched|fallback dispatch completed/i)).toBeVisible();

  await page.goto(`${hostBaseUrl}/preferences`);
  await expect(page.getByRole("heading", { name: "Learning Preferences" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#logout").click();
  await expect(page).toHaveURL(`${hostBaseUrl}/`);
  await expect(page.locator("#login")).toBeVisible();
});

test("novel-h5 covers membership purchase and paid return recovery", async ({ page }) => {
  await page.goto(`${novelBaseUrl}/login`);
  await expect(page.locator('button[data-target="entry"][data-action="onTapLogin"]')).toBeVisible();
  await page.locator('button[data-target="entry"][data-action="onTapLogin"]').click();
  await expect(page).toHaveURL(`${novelBaseUrl}/`);

  await page.goto(`${novelBaseUrl}/membership?source=reader&novelId=novel_lantern&chapterId=lantern_ch_04`);
  await expect(page).toHaveURL(/\/membership|\/login\?/);
  if (new URL(page.url()).pathname === "/login") {
    await page.locator('button[data-target="entry"][data-action="onTapLogin"]').click();
    await expect(page).toHaveURL(`${novelBaseUrl}/`);
    await page.goto(`${novelBaseUrl}/membership?source=reader&novelId=novel_lantern&chapterId=lantern_ch_04`);
  }
  await expect(page).toHaveURL(/\/membership/);
  await expect(page.getByRole("heading", { name: "Membership Center" })).toBeVisible();

  await page.locator('button[data-target="controller"][data-action="purchaseMembership"]').first().click();
  await expect(page.locator("h1").filter({ hasText: "Membership Active" })).toBeVisible();
  await expect(page.locator('button[data-target="controller"][data-action="continueAfterPurchase"]').first()).toBeVisible();

  await page.locator('button[data-target="controller"][data-action="continueAfterPurchase"]').first().click();
  await expect.poll(() => new URL(page.url()).pathname).not.toBe("/membership");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/reader");

  await page.goto(`${novelBaseUrl}/reader`);
  await expect(page.locator('button[data-target="controller"][data-action="saveProgress"]').first()).toBeVisible();
  await page.locator('button[data-target="controller"][data-action="saveProgress"]').first().click();
  await expect(page.locator("body")).toContainText(/Saved|Saving progress/);
});
