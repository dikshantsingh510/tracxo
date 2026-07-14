"use client";

import { Button } from "@/components/ui/button";
import { createComment, deleteComment } from "@/lib/actions/comments";
import { formatDateTime } from "@/lib/dates";
import type { CommentRow } from "@/lib/queries/comments";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function CommentsThread({
  workspaceId,
  expenseId,
  initial,
  currentUserId,
}: {
  workspaceId: string;
  expenseId: string;
  initial: CommentRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await createComment({ workspaceId, expenseId, body: trimmed });
      setBody("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteComment({ id, expenseId, workspaceId });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <div className="space-y-3">
      {initial.length === 0 ? (
        <p className="text-neutral-500 text-sm dark:text-neutral-400">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {initial.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-neutral-200/60 p-3 dark:border-neutral-800/60"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {c.authorName ?? "Removed user"}
                </span>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {formatDateTime(c.createdAt)}
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-neutral-900 text-sm dark:text-neutral-50">
                {c.body}
              </p>
              {c.authorId === currentUserId && (
                <div className="mt-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(c.id)}
                    className="text-rose-600 text-xs underline-offset-4 hover:underline dark:text-rose-400"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Add a comment…"
          className="min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={busy || !body.trim()} size="sm">
            {busy ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </div>
  );
}
