"use server";

import { uuidv7 } from "uuidv7";

import { withAuth, withMasterAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { feedback, masterAuditLog } from "@/lib/db/schema";
import {
  type CreateFeedbackInput,
  type UpdateFeedbackStatusInput,
  createFeedbackSchema,
  updateFeedbackStatusSchema,
} from "@/lib/validation/feedback";
import { eq } from "drizzle-orm";

// Any signed-in user can submit. Anonymous feedback is intentionally out of
// scope for v1 — the widget is rendered only inside the (app) layout.
export const createFeedback = withAuth(async (session, raw: CreateFeedbackInput) => {
  const input = createFeedbackSchema.parse(raw);
  const userId = session.user.id;

  const id = uuidv7();
  await db.insert(feedback).values({
    id,
    userId,
    type: input.type,
    message: input.message,
    pageUrl: input.pageUrl?.trim() || null,
    userAgent: input.userAgent?.trim() || null,
  });

  return { id };
});

// Master triage. Each status change writes a master_audit_log row so the
// trail is auditable from /master/audit alongside other admin actions.
export const updateFeedbackStatus = withMasterAuth(
  async (session, raw: UpdateFeedbackStatusInput) => {
    const input = updateFeedbackStatusSchema.parse(raw);
    const actorId = session.user.id;
    const resolving = input.status === "resolved" || input.status === "wont_fix";

    await db.batch([
      db
        .update(feedback)
        .set({
          status: input.status,
          resolvedAt: resolving ? new Date() : null,
          resolvedBy: resolving ? actorId : null,
        })
        .where(eq(feedback.id, input.id)),
      db.insert(masterAuditLog).values({
        actorId,
        action: "feedback.status_changed",
        subjectType: "feedback",
        subjectId: input.id,
        metadata: { status: input.status },
      }),
    ]);
  },
);
