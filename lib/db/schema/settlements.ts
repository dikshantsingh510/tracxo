import { uuidv7 } from "uuidv7";

import { relations, sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workspaces } from "./workspaces";

export const settlementMethodEnum = pgEnum("settlement_method", [
  "upi",
  "cash",
  "bank_transfer",
  "other",
]);

export const settlements = pgTable(
  "settlements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    toUserId: text("to_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    method: settlementMethodEnum("method").notNull().default("upi"),
    note: text("note"),
    settledAt: timestamp("settled_at").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("settlements_workspace_id_idx").on(t.workspaceId),
    index("settlements_from_user_id_idx").on(t.fromUserId),
    index("settlements_to_user_id_idx").on(t.toUserId),
    index("settlements_settled_at_idx").on(t.settledAt),
    index("settlements_workspace_settled_idx").on(t.workspaceId, t.settledAt),
    check("settlements_amount_positive", sql`${t.amount} > 0`),
    check("settlements_no_self_pay", sql`${t.fromUserId} <> ${t.toUserId}`),
  ],
);

export const settlementsRelations = relations(settlements, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [settlements.workspaceId],
    references: [workspaces.id],
  }),
  fromUser: one(user, {
    fields: [settlements.fromUserId],
    references: [user.id],
  }),
  toUser: one(user, {
    fields: [settlements.toUserId],
    references: [user.id],
  }),
}));
