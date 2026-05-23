import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { listActivity } from "@/lib/queries/activity";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityFeed } from "./activity-feed";

export const metadata = { title: "Activity · Tracxo" };

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/activity`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const rows = await listActivity(workspace.id, 50);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/settings`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Workspace settings
      </Link>

      <AuthCard
        title={`${workspace.name} · activity`}
        description="Live feed of every action in this workspace."
      >
        {/* Server-render the initial snapshot, then the client wrapper opens
            an EventSource and prepends new events as they arrive. */}
        <ActivityFeed
          workspaceId={workspace.id}
          initial={rows.map((r) => ({
            id: r.id,
            actorId: r.actorId,
            actorName: r.actorName,
            action: r.action,
            subjectType: r.subjectType,
            subjectId: r.subjectId,
            metadata: r.metadata,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </AuthCard>
    </div>
  );
}
