import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { beforeAll, beforeEach } from "vitest";

// Load .env.local so DATABASE_URL_TEST is available. If unset, every
// integration test file will skip itself via `describe.skipIf(!hasTestDb)`.
loadEnv({ path: ".env.local", quiet: true });

const TEST_URL = process.env.DATABASE_URL_TEST;
const DEV_URL = process.env.DATABASE_URL;

// Hard safety: refuse to run against the dev DB. Tests TRUNCATE every table
// before each test — pointing them at a shared database would nuke real data.
if (TEST_URL && DEV_URL && TEST_URL === DEV_URL) {
  throw new Error(
    "DATABASE_URL_TEST must point at a different database than DATABASE_URL " +
      "(tests TRUNCATE all tables before every test). Create a Neon branch first.",
  );
}

export const hasTestDb = Boolean(TEST_URL);

if (hasTestDb) {
  // Re-point the singleton DB client in lib/db/client at the test branch
  // BEFORE any test file imports it.
  process.env.DATABASE_URL = TEST_URL as string;
}

const sql = hasTestDb ? neon(process.env.DATABASE_URL as string) : null;
export const rawSql = sql;

const testDb = sql ? drizzle({ client: sql, casing: "snake_case" }) : null;

const TABLES_TO_TRUNCATE = [
  "activity_log",
  "invitations",
  "expense_splits",
  "expenses",
  "settlements",
  "workspace_members",
  "workspaces",
  "account",
  "session",
  "verification",
  '"user"',
];

beforeAll(async () => {
  if (!testDb || !sql) return;

  // Neon branches inherit the schema from their parent. If the branch was
  // forked from a DB that already has our tables but no `__drizzle_migrations`
  // tracking row (e.g. migrations were applied piecemeal via raw SQL), running
  // `migrate()` would error with "type ... already exists". Detect either
  // condition and skip the migrator when the schema is already present.
  const r = (await sql.query(
    `SELECT
       to_regclass('__drizzle_migrations') AS migrations,
       to_regclass('"user"')               AS user_tbl,
       to_regclass('workspaces')           AS workspaces_tbl`,
  )) as Array<{
    migrations: string | null;
    user_tbl: string | null;
    workspaces_tbl: string | null;
  }>;

  const hasSchema = Boolean(r[0]?.user_tbl && r[0]?.workspaces_tbl);
  const hasTracking = Boolean(r[0]?.migrations);

  if (!hasSchema) {
    await migrate(testDb, { migrationsFolder: "lib/db/migrations" });
  } else if (!hasTracking) {
    // Schema is in place from a branch fork; no migrations table to update.
    // This is fine — tests use the schema as-is. If a future migration adds
    // a new table/column, recreate the test branch from current main.
  }
}, 60_000);

beforeEach(async () => {
  if (!sql) return;
  // Single TRUNCATE keeps DDL out of the test path and respects FK order.
  const cmd = `TRUNCATE TABLE ${TABLES_TO_TRUNCATE.join(", ")} RESTART IDENTITY CASCADE`;
  await sql.query(cmd);
});
