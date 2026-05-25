import { z } from "zod";

export const createCommentSchema = z.object({
  expenseId: z.string().min(1),
  workspaceId: z.string().min(1),
  body: z.string().trim().min(1, "Comment can't be empty").max(2000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const deleteCommentSchema = z.object({
  id: z.string().min(1),
  expenseId: z.string().min(1),
  workspaceId: z.string().min(1),
});
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
