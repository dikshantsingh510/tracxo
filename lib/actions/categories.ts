"use server";

import { uuidv7 } from "uuidv7";

import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { expenseCategories, workspaceMembers } from "@/lib/db/schema";
import { categoryCacheTags } from "@/lib/queries/categories";
import { expenseCacheTags } from "@/lib/queries/expenses";
import {
  type CreateCategoryInput,
  type DeleteCategoryInput,
  type UpdateCategoryInput,
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from "@/lib/validation/category";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";

// Membership check — categories are workspace-scoped; any member can manage.
async function assertMember(workspaceId: string, userId: string): Promise<void> {
  const [m] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  if (!m) throw new Error("You are not a member of this workspace");
}

// Tags invalidated: workspace:<id>:categories + workspace:<id>:expenses
//   (expense reads now LEFT JOIN expense_categories, so a rename or delete
//   must bust the expense cache to re-fetch the denormalized name/color).

export const createCategory = withAuth(async (session, raw: CreateCategoryInput) => {
  const input = createCategorySchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);

  const id = uuidv7();
  await db.insert(expenseCategories).values({
    id,
    workspaceId: input.workspaceId,
    name: input.name,
    icon: input.icon?.trim() || null,
    color: input.color?.trim() || null,
    createdBy: session.user.id,
  });

  updateTag(categoryCacheTags.workspaceCategories(input.workspaceId));
  return { id };
});

export const updateCategory = withAuth(async (session, raw: UpdateCategoryInput) => {
  const input = updateCategorySchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);

  await db
    .update(expenseCategories)
    .set({
      name: input.name,
      icon: input.icon?.trim() || null,
      color: input.color?.trim() || null,
    })
    .where(
      and(eq(expenseCategories.id, input.id), eq(expenseCategories.workspaceId, input.workspaceId)),
    );

  updateTag(categoryCacheTags.workspaceCategories(input.workspaceId));
  updateTag(expenseCacheTags.workspaceExpenses(input.workspaceId));
});

export const deleteCategory = withAuth(async (session, raw: DeleteCategoryInput) => {
  const input = deleteCategorySchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);

  // ON DELETE SET NULL on expenses.category_id — existing expenses lose the
  // category reference but stay intact. Same for recurring templates.
  await db
    .delete(expenseCategories)
    .where(
      and(eq(expenseCategories.id, input.id), eq(expenseCategories.workspaceId, input.workspaceId)),
    );

  updateTag(categoryCacheTags.workspaceCategories(input.workspaceId));
  updateTag(expenseCacheTags.workspaceExpenses(input.workspaceId));
});
