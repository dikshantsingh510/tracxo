import { uuidv7 } from "uuidv7";

import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workspaces } from "./workspaces";

export const expenseCategories = pgTable(
  "expense_categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    icon: varchar("icon", { length: 50 }),
    color: varchar("color", { length: 7 }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("expense_categories_workspace_name_unique").on(t.workspaceId, t.name),
    index("expense_categories_workspace_id_idx").on(t.workspaceId),
  ],
);

export const expenseCategoriesRelations = relations(expenseCategories, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [expenseCategories.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(user, { fields: [expenseCategories.createdBy], references: [user.id] }),
}));
