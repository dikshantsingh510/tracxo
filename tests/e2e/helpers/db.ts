import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });

const url = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL_TEST (or DATABASE_URL) is required for e2e tests");
}

export const sql = neon(url);

const TABLES = [
  "activity_log",
  "invitations",
  "workspace_members",
  "workspaces",
  "account",
  "session",
  "verification",
  '"user"',
];

export async function truncateAll(): Promise<void> {
  await sql.query(`TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
}

// Better Auth's emailOTP plugin stores codes in the verification table.
// `identifier` is the recipient email, `value` holds the OTP string.
// Most-recent unredeemed record wins.
export async function getOtpForEmail(email: string): Promise<string | null> {
  const rows = (await sql.query(
    `SELECT value FROM verification
     WHERE identifier = $1 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email],
  )) as Array<{ value: string }>;

  return rows[0]?.value ?? null;
}
