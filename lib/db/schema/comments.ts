import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { expenses } from "./expenses";

export const expenseComments = pgTable(
  "expense_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    expenseId: text("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("expense_comments_expense_id_idx").on(t.expenseId),
    index("expense_comments_expense_created_idx").on(t.expenseId, t.createdAt),
  ],
);

export const expenseCommentsRelations = relations(expenseComments, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseComments.expenseId],
    references: [expenses.id],
  }),
  author: one(user, { fields: [expenseComments.authorId], references: [user.id] }),
}));
