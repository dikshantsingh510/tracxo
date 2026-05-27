import { History } from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/lib/auth/server";
import { listActivity } from "@/lib/queries/activity";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import { ActivityFeed } from "./activity-feed";

export const metadata = { title: "Activity · Tracxo" };

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/activity`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const rows = await listActivity(workspace.id, 50);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">Activity</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Live feed of every action in {workspace.name}.
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={History}
          heading="No activity yet"
          body="Actions will appear here in real time as you and your members use the workspace."
        />
      ) : (
        <section className="surface-acrylic-light overflow-hidden rounded-2xl">
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
        </section>
      )}
    </div>
  );
}
