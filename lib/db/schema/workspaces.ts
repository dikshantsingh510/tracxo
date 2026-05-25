import { uuidv7 } from "uuidv7";

import { relations, sql } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const workspaceTypeEnum = pgEnum("workspace_type", ["personal", "team"]);
export const workspaceRoleEnum = pgEnum("workspace_role", ["owner", "admin", "member"]);
export const workspaceStatusEnum = pgEnum("workspace_status", ["active", "archived"]);

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: varchar("name", { length: 100 }).notNull(),
    icon: varchar("icon", { length: 64 }),
    defaultCurrency: varchar("default_currency", { length: 3 }).notNull().default("INR"),
    type: workspaceTypeEnum("type").notNull().default("team"),
    status: workspaceStatusEnum("status").notNull().default("active"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    archivedAt: timestamp("archived_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("workspaces_owner_id_idx").on(t.ownerId),
    index("workspaces_status_idx").on(t.status),
    index("workspaces_deleted_at_idx").on(t.deletedAt),
  ],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("workspace_members_workspace_user_unique").on(t.workspaceId, t.userId),
    index("workspace_members_workspace_id_idx").on(t.workspaceId),
    index("workspace_members_user_id_idx").on(t.userId),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    email: varchar("email", { length: 254 }),
    role: workspaceRoleEnum("role").notNull().default("member"),
    expiresAt: timestamp("expires_at").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    redeemedAt: timestamp("redeemed_at"),
    redeemedBy: text("redeemed_by").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("invitations_workspace_id_idx").on(t.workspaceId),
    index("invitations_expires_at_idx").on(t.expiresAt),
    index("invitations_active_idx")
      .on(t.workspaceId, t.expiresAt)
      .where(sql`${t.revokedAt} IS NULL AND ${t.redeemedAt} IS NULL`),
  ],
);

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(user, { fields: [workspaces.ownerId], references: [user.id] }),
  members: many(workspaceMembers),
  invitations: many(invitations),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(user, {
    fields: [workspaceMembers.userId],
    references: [user.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [invitations.workspaceId],
    references: [workspaces.id],
  }),
  createdByUser: one(user, {
    fields: [invitations.createdBy],
    references: [user.id],
  }),
}));
