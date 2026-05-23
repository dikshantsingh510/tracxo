import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const feedbackTypeEnum = pgEnum("feedback_type", ["bug", "idea", "general", "praise"]);

export const feedbackStatusEnum = pgEnum("feedback_status", [
  "new",
  "triaged",
  "resolved",
  "wont_fix",
]);

export const feedback = pgTable(
  "feedback",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    type: feedbackTypeEnum("type").notNull().default("general"),
    message: text("message").notNull(),
    pageUrl: varchar("page_url", { length: 500 }),
    userAgent: varchar("user_agent", { length: 500 }),
    status: feedbackStatusEnum("status").notNull().default("new"),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("feedback_status_idx").on(t.status),
    index("feedback_created_at_idx").on(t.createdAt),
    index("feedback_user_id_idx").on(t.userId),
  ],
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(user, { fields: [feedback.userId], references: [user.id], relationName: "submitter" }),
  resolver: one(user, {
    fields: [feedback.resolvedBy],
    references: [user.id],
    relationName: "resolver",
  }),
}));
