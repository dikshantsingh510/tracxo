"use client";

import { Button } from "@/components/ui/button";
import { deleteRecurring, toggleRecurring } from "@/lib/actions/recurring";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    setBusy(true);
    try {
      await toggleRecurring({ id, workspaceId, active: !active });
      toast.success(active ? "Paused" : "Resumed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not toggle");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this template? Past generated expenses are kept.")) return;
    setBusy(true);
    try {
      await deleteRecurring({ id, workspaceId });
      toast.success("Deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={onToggle} disabled={busy}>
        {active ? "Pause" : "Resume"}
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete} disabled={busy}>
        Delete
      </Button>
    </div>
  );
}
