import { MailCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/lib/auth/server";
import { daysUntil } from "@/lib/dates";
import { getPendingInvitations, getWorkspaceMembers } from "@/lib/queries/members";
import { getWorkspaceById } from "@/lib/queries/workspaces";
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

  const [members, pendingRaw] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    canManage ? getPendingInvitations(workspace.id) : Promise.resolve([]),
  ]);
  // Expiry is computed here (server) so the client list renders a serialized
  // value instead of calling Date.now() mid-render (hydration mismatch).
  const now = Date.now();
  const pending = pendingRaw.map((inv) => ({ ...inv, daysLeft: daysUntil(inv.expiresAt, now) }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">Members</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {members.length} member{members.length === 1 ? "" : "s"}
          {pending.length > 0
            ? ` · ${pending.length} pending invite${pending.length === 1 ? "" : "s"}`
            : ""}
          {" in "}
          {workspace.name}
        </p>
      </header>

      {/* Members section */}
      <section className="space-y-3">
        <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Members
        </h2>
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            heading="No members yet"
            body="Invite someone using the form below."
          />
        ) : (
          <MembersList
            workspaceId={workspace.id}
            members={members}
            actorUserId={session.user.id}
            actorRole={workspace.role}
          />
        )}
      </section>

      {canManage ? (
        <>
          {/* Invite */}
          <section className="space-y-3">
            <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Invite someone
            </h2>
            <div className="surface-acrylic-light rounded-2xl p-5">
              <InviteForm workspaceId={workspace.id} />
            </div>
          </section>

          {/* Pending */}
          <section className="space-y-3">
            <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Pending invitations
            </h2>
            {pending.length === 0 ? (
              <EmptyState
                icon={MailCheck}
                heading="No pending invitations"
                body="All invitations have been accepted or revoked."
              />
            ) : (
              <PendingInvitesList workspaceId={workspace.id} invitations={pending} />
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
