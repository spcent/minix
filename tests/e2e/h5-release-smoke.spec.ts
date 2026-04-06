import { expect, test } from "@playwright/test";

const hostBaseUrl = (process.env.MINIX_HOST_H5_BASE_URL ?? "http://127.0.0.1:4273").replace(/\/$/, "");
const novelBaseUrl = (process.env.MINIX_NOVEL_H5_BASE_URL ?? "http://127.0.0.1:4274").replace(/\/$/, "");

test("host-h5 supports login, protected plan access, settings, and logout", async ({ page }) => {
  await page.goto(`${hostBaseUrl}/`);

  await expect(page.locator("#login")).toBeVisible();
  await page.locator("#login").click();

  await expect(page).toHaveURL(`${hostBaseUrl}/`);
  await expect(page.locator("#home-open-overview")).toBeVisible();
  await page.locator("#home-open-overview").click();

  await expect(page).toHaveURL(`${hostBaseUrl}/overview`);
  await expect(page.getByRole("heading", { name: "Your Daily English Overview" })).toBeVisible();

  await page.locator("#overview-open-plan").click();
  await expect(page).toHaveURL(`${hostBaseUrl}/plan`);
  await expect(page.getByRole("heading", { name: "Today's English Practice" })).toBeVisible();

  await page.locator("#mark-all").click();
  await expect(page.getByRole("heading", { name: /Lesson complete: the full loaded queue is finished/i })).toBeVisible();

  await page.locator("#settings").click();
  await expect(page).toHaveURL("http://127.0.0.1:4273/preferences");
  await expect(page.getByRole("heading", { name: "Learning Preferences" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#logout").click();

  await expect(page).toHaveURL(`${hostBaseUrl}/`);
  await expect(page.locator("#login")).toBeVisible();
});

test("novel-h5 supports login, reader save flow, and homepage continuity cues", async ({ page }) => {
  await page.goto(`${novelBaseUrl}/login`);

  await expect(page.locator('button[data-target="entry"][data-action="onTapLogin"]')).toBeVisible();
  await page.locator('button[data-target="entry"][data-action="onTapLogin"]').click();

  await expect(page).toHaveURL(`${novelBaseUrl}/`);
  const libraryNavLink = page.getByRole("navigation").getByRole("link", { name: "Library", exact: true });
  await expect(libraryNavLink).toBeVisible();

  await libraryNavLink.click();
  await expect(page).toHaveURL(`${novelBaseUrl}/books`);

  const catalogPrimaryAction = page.locator('button[data-target="controller"][data-action="goToNovelDetail"], button[data-target="controller"][data-action="continueReading"]').first();
  await expect(catalogPrimaryAction).toBeVisible();
  await catalogPrimaryAction.click();

  await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/(novel\/detail|reader)$/);

  if (new URL(page.url()).pathname === "/novel/detail") {
    const continueButton = page.locator('button[data-target="controller"][data-action="continueReading"]').first();
    await expect(continueButton).toBeVisible();
    await continueButton.click();
    await expect(page).toHaveURL(/\/reader$/);
  }

  const saveProgressButton = page.locator('button[data-target="controller"][data-action="saveProgress"]').first();
  await expect(saveProgressButton).toBeVisible();
  await saveProgressButton.click();
  await expect(page.locator("body")).toContainText(/Saved|Saving progress/);

  await page.getByRole("button", { name: "Library" }).click();
  await expect(page).toHaveURL(/\/novel\/detail(\?|$)/);

  await page.getByRole("navigation").getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(`${novelBaseUrl}/`);
  await expect(page.locator('button[data-target="controller"][data-action="continueReading"]').first()).toBeVisible();
});
