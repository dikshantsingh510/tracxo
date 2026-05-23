import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load .env.local so DATABASE_URL_TEST + NEXT_PUBLIC_APP_URL are available
// inside the dev server we boot below.
loadEnv({ path: ".env.local", quiet: true });

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "list" : "html",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Boot a Next.js dev server bound to the test DB. We use a non-default port
  // so this never collides with the user's `pnpm dev`.
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "",
      NEXT_PUBLIC_APP_URL: BASE_URL,
    },
  },
});
