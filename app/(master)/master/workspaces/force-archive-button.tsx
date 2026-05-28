"use client";

import { ArchiveX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { masterForceArchiveWorkspace } from "@/lib/actions/master";

export function ForceArchiveButton({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function doArchive() {
    const r = await masterForceArchiveWorkspace({ workspaceId });
    toast.success(r.alreadyArchived ? "Already archived" : "Workspace archived");
    router.refresh();
  }

  return (
    <>
      <Button type="button" size="sm" variant="destructive" onClick={() => setOpen(true)}>
        <ArchiveX className="size-3.5" strokeWidth={1.75} aria-hidden />
        Force archive
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Force-archive "${workspaceName}"?`}
        description="The owner did not request this. The action is recorded in the master audit log."
        confirmLabel="Force archive"
        destructive
        onConfirm={doArchive}
      />
    </>
  );
}
