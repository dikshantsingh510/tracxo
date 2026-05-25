import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { expenses } from "./expenses";

export const expenseAttachments = pgTable(
  "expense_attachments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    expenseId: text("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    blobUrl: text("blob_url").notNull(),
    blobPathname: text("blob_pathname").notNull(),
    contentType: varchar("content_type", { length: 100 }).notNull(),
    byteSize: bigint("byte_size", { mode: "bigint" }).notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("expense_attachments_expense_id_idx").on(t.expenseId),
    index("expense_attachments_created_at_idx").on(t.createdAt),
  ],
);

export const expenseAttachmentsRelations = relations(expenseAttachments, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseAttachments.expenseId],
    references: [expenses.id],
  }),
  uploader: one(user, { fields: [expenseAttachments.uploadedBy], references: [user.id] }),
}));
