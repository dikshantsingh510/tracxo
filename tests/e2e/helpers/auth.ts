import { type Page, expect } from "@playwright/test";
import { getOtpForEmail } from "./db";

export function uniqueEmail(label: string): string {
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `${label}-${stamp}@e2e.test`;
}

export async function signUpAndVerify(
  page: Page,
  user: { name: string; email: string; password: string },
): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel(/name/i).fill(user.name);
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/verify/);

  // Poll for OTP — Better Auth writes after the signup POST completes.
  let otp: string | null = null;
  for (let i = 0; i < 20 && !otp; i++) {
    otp = await getOtpForEmail(user.email);
    if (!otp) await page.waitForTimeout(250);
  }
  if (!otp) throw new Error(`No OTP found for ${user.email}`);

  // input-otp uses one hidden input bound to all slots; type the full code.
  const otpInput = page.locator('input[autocomplete="one-time-code"]').first();
  await otpInput.fill(otp);
  await page.getByRole("button", { name: /^verify$/i }).click();

  await expect(page).toHaveURL(/\/workspaces/, { timeout: 10_000 });
}

export async function signIn(
  page: Page,
  creds: { email: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(creds.email);
  await page.getByLabel(/password/i).fill(creds.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/workspaces/);
}
