"use client";

import { Button } from "@/components/ui/button";
import { softDeleteExpense } from "@/lib/actions/expenses";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ExpenseActions({
  workspaceId,
  expenseId,
  editHref,
}: {
  workspaceId: string;
  expenseId: string;
  editHref: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    setPending(true);
    try {
      await softDeleteExpense({ id: expenseId, workspaceId });
      toast.success("Expense deleted");
      router.push(`/workspaces/${workspaceId}/expenses`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <Link
        href={editHref}
        className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
      >
        Edit
      </Link>
      <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={onDelete}>
        {pending ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}
