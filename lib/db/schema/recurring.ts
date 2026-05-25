import { uuidv7 } from "uuidv7";

import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { expenseCategories } from "./categories";
import { expenses, splitModeEnum } from "./expenses";
import { workspaces } from "./workspaces";

export const recurringRunStatusEnum = pgEnum("recurring_run_status", ["success", "failed"]);

export const recurringExpenses = pgTable(
  "recurring_expenses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    payerId: text("payer_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    description: varchar("description", { length: 200 }).notNull(),
    categoryId: text("category_id").references(() => expenseCategories.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    splitMode: splitModeEnum("split_mode").notNull(),
    splitDetails: jsonb("split_details").notNull(),
    rrule: text("rrule").notNull(),
    dtstart: date("dtstart").notNull(),
    nextRunAt: timestamp("next_run_at").notNull(),
    lastRunAt: timestamp("last_run_at"),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("recurring_expenses_workspace_id_idx").on(t.workspaceId),
    index("recurring_expenses_next_run_at_idx").on(t.nextRunAt),
    index("recurring_expenses_active_next_idx").on(t.active, t.nextRunAt),
  ],
);

export const recurringExpenseRuns = pgTable(
  "recurring_expense_runs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    recurringId: text("recurring_id")
      .notNull()
      .references(() => recurringExpenses.id, { onDelete: "cascade" }),
    expenseId: text("expense_id").references(() => expenses.id, { onDelete: "set null" }),
    ranAt: timestamp("ran_at").defaultNow().notNull(),
    status: recurringRunStatusEnum("status").notNull(),
    errorMessage: text("error_message"),
  },
  (t) => [
    index("recurring_expense_runs_recurring_id_idx").on(t.recurringId),
    index("recurring_expense_runs_ran_at_idx").on(t.ranAt),
  ],
);

export const recurringExpensesRelations = relations(recurringExpenses, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [recurringExpenses.workspaceId],
    references: [workspaces.id],
  }),
  payer: one(user, { fields: [recurringExpenses.payerId], references: [user.id] }),
  category: one(expenseCategories, {
    fields: [recurringExpenses.categoryId],
    references: [expenseCategories.id],
  }),
  runs: many(recurringExpenseRuns),
}));

export const recurringExpenseRunsRelations = relations(recurringExpenseRuns, ({ one }) => ({
  template: one(recurringExpenses, {
    fields: [recurringExpenseRuns.recurringId],
    references: [recurringExpenses.id],
  }),
  expense: one(expenses, {
    fields: [recurringExpenseRuns.expenseId],
    references: [expenses.id],
  }),
}));
