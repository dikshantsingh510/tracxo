import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSession } from "@/lib/auth/server";
import { listCategories } from "@/lib/queries/categories";
import { getWorkspaceMembers } from "@/lib/queries/members";
import { getWorkspaceById } from "@/lib/queries/workspaces";
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
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <Link
          href={`/workspaces/${workspace.id}/recurring`}
          className="inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} aria-hidden />
          Recurring
        </Link>
        <h1 className="mt-2 font-semibold text-3xl text-foreground tracking-[-0.02em]">
          New recurring expense
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Generates an expense automatically on the schedule you set.
        </p>
      </div>

      <div className="surface-acrylic-light rounded-2xl p-5 sm:p-6">
        <RecurringForm
          workspaceId={workspace.id}
          workspaceCurrency={workspace.defaultCurrency}
          actorUserId={session.user.id}
          members={members.map((m) => ({ userId: m.userId, name: m.name, email: m.email }))}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}
