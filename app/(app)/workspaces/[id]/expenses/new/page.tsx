import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { getWorkspaceMembers } from "@/lib/queries/members";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseForm } from "../expense-form";

export const metadata = { title: "New expense · Tracxo" };

export default async function NewExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/expenses/new`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();
  const members = await getWorkspaceMembers(workspace.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/expenses`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Expenses
      </Link>
      <AuthCard title="New expense" description={`Split with members of ${workspace.name}`}>
        <ExpenseForm
          mode="create"
          workspaceId={workspace.id}
          workspaceCurrency={workspace.defaultCurrency}
          actorUserId={session.user.id}
          members={members.map((m) => ({ userId: m.userId, name: m.name, email: m.email }))}
        />
      </AuthCard>
    </div>
  );
}
