import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Two projects:
//   - `unit`        : zero-IO tests on validation + pure logic (always runs)
//   - `integration` : real Postgres via DATABASE_URL_TEST (skips itself if unset)
//
// Run all:   pnpm test
// Run one:   pnpm test:unit | pnpm test:integration
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/validation/**", "lib/actions/**", "lib/queries/**", "lib/workspace/**"],
      exclude: ["**/*.d.ts", "**/index.ts"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          setupFiles: ["tests/integration/_setup.ts"],
          // Integration tests touch the DB sequentially per file to avoid
          // truncation races. Within a file they share a fresh DB state.
          fileParallelism: false,
          testTimeout: 20000,
          hookTimeout: 30000,
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      // `server-only` throws at import time in client bundles. In Vitest there
      // is no Next pipeline to strip it, so alias to a no-op.
      "server-only": resolve(__dirname, "tests/utils/server-only-stub.ts"),
    },
  },
});
