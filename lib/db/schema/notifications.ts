import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";

// In-app notifications. Inserted server-side by the existing Server Actions
// when an event affects a user who didn't initiate it (joined a workspace,
// added to a split, received a settlement, role changed, removed).
export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 50 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    link: varchar("link", { length: 500 }),
    metadata: jsonb("metadata"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
    // Partial index for the unread badge query — most users have few unread.
    index("notifications_user_unread_idx").on(t.userId),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, { fields: [notifications.userId], references: [user.id] }),
}));
