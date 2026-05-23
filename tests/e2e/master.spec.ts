import { expect, test } from "@playwright/test";
import { signIn, signUpAndVerify, uniqueEmail } from "./helpers/auth";
import { sql, truncateAll } from "./helpers/db";

test.beforeEach(async () => {
  await truncateAll();
});

test("non-master sees 404 for /master", async ({ page }) => {
  await signUpAndVerify(page, {
    name: "Regular",
    email: uniqueEmail("reg"),
    password: "hunter22",
  });
  const res = await page.goto("/master");
  expect(res?.status()).toBe(404);
});

test("master role unlocks the admin panel", async ({ page, context }) => {
  const email = uniqueEmail("master");
  const password = "hunter22";
  await signUpAndVerify(page, { name: "Boss", email, password });
  // Promote via raw SQL — matches docs/PROMPT.md ("Master role is set
  // manually via SQL") and exactly the production workflow.
  await sql.query(`UPDATE "user" SET role = 'master' WHERE email = $1`, [email]);

  // session.user.role is denormalized; cookie cache holds the old "user"
  // value until re-login. Clearing cookies + signing back in is the real
  // promotion workflow.
  await context.clearCookies();
  await signIn(page, { email, password });

  await page.goto("/master");
  await expect(page.getByRole("heading", { name: /platform stats/i })).toBeVisible();
});
