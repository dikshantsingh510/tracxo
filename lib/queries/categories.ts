import "server-only";

import { db } from "@/lib/db/client";
import { expenseCategories } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const categoryCacheTags = {
  workspaceCategories: (workspaceId: string) => `workspace:${workspaceId}:categories`,
};

export type CategoryRow = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  createdAt: Date;
};

async function listCategoriesQuery(workspaceId: string): Promise<CategoryRow[]> {
  return db
    .select({
      id: expenseCategories.id,
      name: expenseCategories.name,
      icon: expenseCategories.icon,
      color: expenseCategories.color,
      createdAt: expenseCategories.createdAt,
    })
    .from(expenseCategories)
    .where(eq(expenseCategories.workspaceId, workspaceId))
    .orderBy(asc(expenseCategories.name));
}

export function listCategories(workspaceId: string): Promise<CategoryRow[]> {
  return unstable_cache(
    () => listCategoriesQuery(workspaceId),
    ["workspace-categories", workspaceId],
    { tags: [categoryCacheTags.workspaceCategories(workspaceId)] },
  )();
}
