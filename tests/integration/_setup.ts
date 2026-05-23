import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { beforeAll, beforeEach } from "vitest";

// Load .env.local so DATABASE_URL_TEST is available. If unset, every
// integration test file will skip itself via `describe.skipIf(!hasTestDb)`.
loadEnv({ path: ".env.local", quiet: true });

export const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);

if (hasTestDb) {
  // Re-point the singleton DB client in lib/db/client at the test branch
  // BEFORE any test file imports it.
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST as string;
}

const sql = hasTestDb ? neon(process.env.DATABASE_URL as string) : null;
export const rawSql = sql;

const testDb = sql ? drizzle({ client: sql, casing: "snake_case" }) : null;

const TABLES_TO_TRUNCATE = [
  "activity_log",
  "invitations",
  "workspace_members",
  "workspaces",
  "account",
  "session",
  "verification",
  '"user"',
];

beforeAll(async () => {
  if (!testDb || !sql) return;
  await migrate(testDb, { migrationsFolder: "lib/db/migrations" });
}, 60_000);

beforeEach(async () => {
  if (!sql) return;
  // Single TRUNCATE keeps DDL out of the test path and respects FK order.
  const cmd = `TRUNCATE TABLE ${TABLES_TO_TRUNCATE.join(", ")} RESTART IDENTITY CASCADE`;
  await sql.query(cmd);
});
