import { timingSafeEqual } from "node:crypto";

import { runRecurringExpenses } from "@/lib/recurring/runner";
import { NextResponse } from "next/server";

// Vercel Cron POSTs with `Authorization: Bearer ${CRON_SECRET}`. We accept
// both GET and POST — the dashboard cron tab uses GET when testing.
//
// Schedule: daily at 02:00 UTC (configured in vercel.json).
//
// SAFETY: This is the trust boundary for cron; the runner has NO auth check
// of its own. Never expose runRecurringExpenses() via any other route handler
// without re-authenticating.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (!header) return false;
  // timingSafeEqual instead of === : string comparison short-circuits on the
  // first differing byte, leaking prefix length via response timing.
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(header);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

async function handle(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runRecurringExpenses();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
