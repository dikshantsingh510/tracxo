"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MorphButton } from "@/components/ui/morph-button";
import { deleteRecurring, toggleRecurring } from "@/lib/actions/recurring";

export function RecurringActions({
  id,
  workspaceId,
  active,
}: {
  id: string;
  workspaceId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onToggle() {
    try {
      await toggleRecurring({ id, workspaceId, active: !active });
      toast.success(active ? "Paused" : "Resumed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not toggle");
      throw err;
    }
  }

  async function doDelete() {
    await deleteRecurring({ id, workspaceId });
    toast.success("Deleted");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <MorphButton
        variant="outline"
        size="sm"
        idle={active ? "Pause" : "Resume"}
        pending={active ? "Pausing…" : "Resuming…"}
        success={active ? "Paused" : "Resumed"}
        onAction={onToggle}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirmDelete(true)}
        aria-label="Delete recurring template"
      >
        <Trash2
          className="size-3.5 text-rose-700 dark:text-rose-400"
          strokeWidth={1.75}
          aria-hidden
        />
      </Button>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this template?"
        description="Past generated expenses are kept. No new expenses will be created from this schedule."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  );
}
