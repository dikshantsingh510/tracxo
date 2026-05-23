import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Append-only log of every action a master user takes through the admin
// panel. Read-only from the app; rows are inserted by the actions in
// lib/actions/master.ts.
export const masterAuditLog = pgTable(
  "master_audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 64 }).notNull(),
    subjectType: varchar("subject_type", { length: 32 }).notNull(),
    subjectId: text("subject_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("master_audit_log_actor_id_idx").on(t.actorId),
    index("master_audit_log_created_at_idx").on(t.createdAt),
    index("master_audit_log_subject_idx").on(t.subjectType, t.subjectId),
  ],
);

export const masterAuditLogRelations = relations(masterAuditLog, ({ one }) => ({
  actor: one(user, {
    fields: [masterAuditLog.actorId],
    references: [user.id],
  }),
}));
