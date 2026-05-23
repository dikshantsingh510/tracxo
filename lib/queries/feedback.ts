import "server-only";

import { db } from "@/lib/db/client";
import { feedback, user } from "@/lib/db/schema";
import { count, desc, eq } from "drizzle-orm";

// Master-only reads. Caller MUST go through requireMaster() in the page —
// these helpers don't double-check. Uncached: master volume is low and a
// few-seconds delay on triage status is poor UX.

export type FeedbackStatus = "new" | "triaged" | "resolved" | "wont_fix";
export type FeedbackType = "bug" | "idea" | "general" | "praise";

export type FeedbackRow = {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  message: string;
  pageUrl: string | null;
  userAgent: string | null;
  submitterId: string | null;
  submitterEmail: string | null;
  submitterName: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
};

export async function listFeedback(opts: { status?: FeedbackStatus } = {}): Promise<FeedbackRow[]> {
  const rows = await db
    .select({
      id: feedback.id,
      type: feedback.type,
      status: feedback.status,
      message: feedback.message,
      pageUrl: feedback.pageUrl,
      userAgent: feedback.userAgent,
      submitterId: feedback.userId,
      submitterEmail: user.email,
      submitterName: user.name,
      createdAt: feedback.createdAt,
      resolvedAt: feedback.resolvedAt,
    })
    .from(feedback)
    .leftJoin(user, eq(user.id, feedback.userId))
    .where(opts.status ? eq(feedback.status, opts.status) : undefined)
    .orderBy(desc(feedback.createdAt))
    .limit(200);
  return rows;
}

export async function countNewFeedback(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(feedback).where(eq(feedback.status, "new"));
  return row?.n ?? 0;
}
