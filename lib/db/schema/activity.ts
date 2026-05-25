import { uuidv7 } from "uuidv7";

import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workspaces } from "./workspaces";

export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 50 }).notNull(),
    subjectType: varchar("subject_type", { length: 30 }).notNull(),
    subjectId: text("subject_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("activity_log_workspace_created_idx").on(t.workspaceId, t.createdAt),
    index("activity_log_actor_id_idx").on(t.actorId),
    index("activity_log_action_idx").on(t.action),
    index("activity_log_subject_idx").on(t.subjectType, t.subjectId),
  ],
);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [activityLog.workspaceId],
    references: [workspaces.id],
  }),
  actor: one(user, {
    fields: [activityLog.actorId],
    references: [user.id],
  }),
}));
