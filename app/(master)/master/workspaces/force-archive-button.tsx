"use client";

import { Button } from "@/components/ui/button";
import { masterForceArchiveWorkspace } from "@/lib/actions/master";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ForceArchiveButton({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (
      !confirm(
        `Force-archive "${workspaceName}"? The owner did not request this. The action is logged in master_audit_log.`,
      )
    ) {
      return;
    }
    setPending(true);
    try {
      const r = await masterForceArchiveWorkspace({ workspaceId });
      toast.success(r.alreadyArchived ? "Already archived" : "Workspace archived");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={onClick}>
      {pending ? "Archiving…" : "Force archive"}
    </Button>
  );
}
