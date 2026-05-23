import { expect, test } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers/auth";
import { truncateAll } from "./helpers/db";

test.beforeEach(async () => {
  await truncateAll();
});

test("create a team workspace and rename it", async ({ page }) => {
  await signUpAndVerify(page, {
    name: "Owner",
    email: uniqueEmail("ws"),
    password: "hunter22",
  });

  await page.getByRole("link", { name: /new workspace/i }).click();
  await expect(page).toHaveURL(/\/workspaces\/new/);

  await page.getByLabel(/^name$/i).fill("Goa Trip");
  await page.getByLabel(/icon/i).fill("🏖️");
  await page.getByRole("button", { name: /create workspace/i }).click();

  // Redirects to settings on success.
  await expect(page).toHaveURL(/\/workspaces\/[a-f0-9-]+\/settings/);
  await expect(page.getByText(/goa trip/i)).toBeVisible();

  // Rename
  const nameField = page.getByLabel(/^name$/i);
  await nameField.fill("Goa 2026");
  await page.getByRole("button", { name: /save name/i }).click();
  await expect(page.getByText(/renamed/i)).toBeVisible();

  // Back to list — both personal + Goa show.
  await page.getByRole("link", { name: /all workspaces/i }).click();
  await expect(page.getByText(/goa 2026/i)).toBeVisible();
});

test("archive a workspace then restore it", async ({ page }) => {
  await signUpAndVerify(page, {
    name: "Arch",
    email: uniqueEmail("ws"),
    password: "hunter22",
  });
  await page.getByRole("link", { name: /new workspace/i }).click();
  await page.getByLabel(/^name$/i).fill("Throwaway");
  await page.getByRole("button", { name: /create workspace/i }).click();

  // Archive
  await page.getByRole("button", { name: /^archive$/i }).click();
  await expect(page.getByText(/archive done/i)).toBeVisible();

  // Should now show Restore button.
  await expect(page.getByRole("button", { name: /^restore$/i })).toBeVisible();

  // Restore
  await page.getByRole("button", { name: /^restore$/i }).click();
  await expect(page.getByText(/restore done/i)).toBeVisible();
});
