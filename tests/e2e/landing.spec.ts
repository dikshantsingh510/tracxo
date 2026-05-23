import { expect, test } from "@playwright/test";
import { truncateAll } from "./helpers/db";

test.beforeEach(async () => {
  await truncateAll();
});

test("signed-out visit to / shows landing and CTAs link to signup/login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/settle themselves/i);

  // Primary CTA goes to signup.
  await page
    .getByRole("link", { name: /get started/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/signup/);

  // Back home, secondary path: "Sign in" link reaches /login.
  await page.goto("/");
  await page.getByRole("link", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("privacy + terms pages render and link back", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /^privacy$/i })).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: /^terms/i })).toBeVisible();
});
