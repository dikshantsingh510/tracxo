import "server-only";

import { db } from "@/lib/db/client";
import { expenseComments, user } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const commentCacheTags = {
  expenseComments: (expenseId: string) => `expense:${expenseId}:comments`,
};

export type CommentRow = {
  id: string;
  body: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: Date;
};

async function listCommentsQuery(expenseId: string): Promise<CommentRow[]> {
  return db
    .select({
      id: expenseComments.id,
      body: expenseComments.body,
      authorId: expenseComments.authorId,
      authorName: user.name,
      createdAt: expenseComments.createdAt,
    })
    .from(expenseComments)
    .leftJoin(user, eq(user.id, expenseComments.authorId))
    .where(eq(expenseComments.expenseId, expenseId))
    .orderBy(asc(expenseComments.createdAt));
}

export function listComments(expenseId: string): Promise<CommentRow[]> {
  return unstable_cache(() => listCommentsQuery(expenseId), ["expense-comments", expenseId], {
    tags: [commentCacheTags.expenseComments(expenseId)],
  })();
}
