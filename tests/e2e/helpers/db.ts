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
// Identifier shape (from plugins/email-otp/utils): `${type}-otp-${email}`.
// Value is plain text (`storeOTP: "plain"` is the plugin default) with an
// optional `:<attempts>` suffix appended on failed verify attempts.
export async function getOtpForEmail(
  email: string,
  type: "email-verification" | "sign-in" | "forget-password" = "email-verification",
): Promise<string | null> {
  const identifier = `${type}-otp-${email}`;
  const rows = (await sql.query(
    `SELECT value FROM verification
     WHERE identifier = $1 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [identifier],
  )) as Array<{ value: string }>;

  const raw = rows[0]?.value;
  if (!raw) return null;
  const idx = raw.lastIndexOf(":");
  return idx === -1 ? raw : raw.slice(0, idx);
}
