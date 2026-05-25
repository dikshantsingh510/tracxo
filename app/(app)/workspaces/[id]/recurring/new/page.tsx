import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { listCategories } from "@/lib/queries/categories";
import { getWorkspaceMembers } from "@/lib/queries/members";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecurringForm } from "../recurring-form";

export const metadata = { title: "New recurring expense · Tracxo" };

export default async function NewRecurringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/recurring/new`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();
  const members = await getWorkspaceMembers(workspace.id);
  const categories = await listCategories(workspace.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/recurring`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Recurring
      </Link>
      <AuthCard
        title="New recurring expense"
        description="Generates an expense on the schedule you set."
      >
        <RecurringForm
          workspaceId={workspace.id}
          workspaceCurrency={workspace.defaultCurrency}
          actorUserId={session.user.id}
          members={members.map((m) => ({ userId: m.userId, name: m.name, email: m.email }))}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </AuthCard>
    </div>
  );
}
