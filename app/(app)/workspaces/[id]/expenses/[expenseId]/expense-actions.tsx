"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { softDeleteExpense } from "@/lib/actions/expenses";

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
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onConfirmDelete() {
    try {
      await softDeleteExpense({ id: expenseId, workspaceId });
      toast.success("Expense deleted");
      router.push(`/workspaces/${workspaceId}/expenses`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
      throw err; // keep dialog open on error
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href={editHref}>
              <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
              Edit
            </Link>
          }
        />
        <Button type="button" size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
          Delete
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this expense?"
        description="This cannot be undone. Settlements that reference this expense will still keep their history."
        confirmLabel="Delete"
        destructive
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
