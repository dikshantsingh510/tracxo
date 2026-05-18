import { relations } from "drizzle-orm";
import {
  bigint,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workspaces } from "./workspaces";

export const splitModeEnum = pgEnum("split_mode", [
  "equal",
  "unequal",
  "percentage",
  "share",
  "itemized",
]);

export const expenses = pgTable(
  "expenses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    paidBy: text("paid_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    description: varchar("description", { length: 200 }).notNull(),
    category: varchar("category", { length: 50 }),
    notes: text("notes"),
    expenseDate: date("expense_date").notNull(),
    splitMode: splitModeEnum("split_mode").notNull().default("equal"),
    version: integer("version").notNull().default(1),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("expenses_workspace_id_idx").on(t.workspaceId),
    index("expenses_paid_by_idx").on(t.paidBy),
    index("expenses_expense_date_idx").on(t.expenseDate),
    index("expenses_deleted_at_idx").on(t.deletedAt),
    index("expenses_workspace_date_idx").on(t.workspaceId, t.expenseDate),
  ],
);

export const expenseSplits = pgTable(
  "expense_splits",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    expenseId: text("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    shareAmount: bigint("share_amount", { mode: "bigint" }).notNull(),
    rawInput: jsonb("raw_input"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("expense_splits_expense_user_unique").on(t.expenseId, t.userId),
    index("expense_splits_expense_id_idx").on(t.expenseId),
    index("expense_splits_user_id_idx").on(t.userId),
  ],
);

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [expenses.workspaceId],
    references: [workspaces.id],
  }),
  payer: one(user, { fields: [expenses.paidBy], references: [user.id] }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  user: one(user, {
    fields: [expenseSplits.userId],
    references: [user.id],
  }),
}));
