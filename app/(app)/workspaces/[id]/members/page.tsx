import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { getPendingInvitations, getWorkspaceMembers } from "@/lib/queries/members";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteForm } from "./invite-form";
import { MembersList } from "./members-list";
import { PendingInvitesList } from "./pending-invites-list";

export const metadata = { title: "Members · Tracxo" };

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/members`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const canManage = workspace.role === "owner" || workspace.role === "admin";

  const [members, pending] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    canManage ? getPendingInvitations(workspace.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/settings`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Workspace settings
      </Link>

      <AuthCard
        title={`${workspace.name} · members`}
        description={`${members.length} member${members.length === 1 ? "" : "s"}${pending.length > 0 ? ` · ${pending.length} pending invite${pending.length === 1 ? "" : "s"}` : ""}`}
      >
        <MembersList
          workspaceId={workspace.id}
          members={members}
          actorUserId={session.user.id}
          actorRole={workspace.role}
        />
      </AuthCard>

      {canManage && (
        <>
          <AuthCard title="Invite someone" description="Share a link or send an email invitation.">
            <InviteForm workspaceId={workspace.id} />
          </AuthCard>

          {pending.length > 0 && (
            <AuthCard
              title="Pending invitations"
              description="Unredeemed invitations awaiting acceptance."
            >
              <PendingInvitesList workspaceId={workspace.id} invitations={pending} />
            </AuthCard>
          )}
        </>
      )}
    </div>
  );
}
