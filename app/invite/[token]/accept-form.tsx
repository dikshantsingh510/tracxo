"use client";

import { Button } from "@/components/ui/button";
import { redeemInvitation } from "@/lib/actions/members";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AcceptInviteForm({
  token,
  workspaceName,
}: {
  token: string;
  workspaceName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onAccept() {
    setPending(true);
    try {
      const { workspaceId, alreadyMember } = await redeemInvitation({ token });
      toast.success(
        alreadyMember ? `Already a member of ${workspaceName}` : `Joined ${workspaceName}`,
      );
      router.push(`/workspaces/${workspaceId}/settings`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept invitation");
      setPending(false);
    }
  }

  return (
    <Button type="button" className="w-full" disabled={pending} onClick={onAccept}>
      {pending ? "Joining…" : "Accept invitation"}
    </Button>
  );
}
