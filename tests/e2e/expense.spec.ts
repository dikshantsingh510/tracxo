import { expect, test } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers/auth";
import { truncateAll } from "./helpers/db";

test.beforeEach(async () => {
  await truncateAll();
});

test("equal split: create → view → delete an expense in a personal workspace", async ({ page }) => {
  await signUpAndVerify(page, {
    name: "Solo",
    email: uniqueEmail("exp"),
    password: "hunter22",
  });

  // Open the personal workspace just bootstrapped on signup.
  await page.getByRole("link", { name: /solo'?s space/i }).click();
  await page.waitForURL(/\/workspaces\/[a-f0-9-]+\/settings/);

  // Settings → Expenses link
  await page.getByRole("link", { name: /expenses →/i }).click();
  await expect(page).toHaveURL(/\/workspaces\/[a-f0-9-]+\/expenses$/);

  // Empty list message
  await expect(page.getByText(/no expenses yet/i)).toBeVisible();

  // New expense
  await page.getByRole("link", { name: /new expense/i }).click();
  await page.waitForURL(/\/expenses\/new$/);

  await page.getByPlaceholder(/dinner at bombil/i).fill("Lunch");
  await page.getByPlaceholder(/^0\.00$/).first().fill("12.50");
  // Default currency from workspace; split defaults to equal with all members.
  await page.getByRole("button", { name: /create expense/i }).click();

  // Lands on detail page
  await page.waitForURL(/\/expenses\/[a-f0-9-]+$/);
  await expect(page.getByText(/lunch/i).first()).toBeVisible();
  // Amount formatted with currency.
  await expect(page.locator("text=/₹\\s*12\\.50|INR\\s*12\\.50/").first()).toBeVisible();

  // Back to list shows the expense
  await page.getByRole("link", { name: /^← expenses$/i }).click();
  await expect(page.getByText("Lunch")).toBeVisible();

  // Re-open and delete
  await page.getByText("Lunch").click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /^delete$/i }).click();
  await page.waitForURL(/\/expenses$/);
  await expect(page.getByText(/no expenses yet/i)).toBeVisible();
});
