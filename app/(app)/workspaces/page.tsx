import { requireSession } from "@/lib/auth/server";
import { getUserWorkspaces } from "@/lib/queries/workspaces";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export const metadata = { title: "Workspaces · Tracxo" };

export default async function WorkspacesPage() {
  const session = await requireSession("/workspaces");
  const workspaces = await getUserWorkspaces(session.user.id);

  const active = workspaces.filter((w) => w.status === "active");
  const archived = workspaces.filter((w) => w.status === "archived");

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 tracking-tight dark:text-slate-50">
            Workspaces
          </h1>
          <p className="mt-1 text-slate-600 text-sm dark:text-slate-400">
            Signed in as {session.user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/workspaces/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-4 font-medium text-sm text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            New workspace
          </Link>
          <SignOutButton />
        </div>
      </header>

      <section>
        <h2 className="mb-3 font-medium text-slate-500 text-xs uppercase tracking-wider dark:text-slate-400">
          Active
        </h2>
        {active.length === 0 ? (
          <EmptyCard>
            No active workspaces. Personal workspace should bootstrap on signup — if missing, try
            creating one.
          </EmptyCard>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {active.map((w) => (
              <WorkspaceRow key={w.id} workspace={w} />
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 && (
        <section>
          <h2 className="mb-3 font-medium text-slate-500 text-xs uppercase tracking-wider dark:text-slate-400">
            Archived
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {archived.map((w) => (
              <WorkspaceRow key={w.id} workspace={w} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-acrylic-light rounded-xl p-6 text-slate-600 text-sm dark:text-slate-400">
      {children}
    </div>
  );
}

function WorkspaceRow({
  workspace,
}: {
  workspace: Awaited<ReturnType<typeof getUserWorkspaces>>[number];
}) {
  return (
    <li>
      <Link
        href={`/workspaces/${workspace.id}/settings`}
        className="surface-acrylic-light block rounded-xl p-4 transition hover:ring-1 hover:ring-emerald-500/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900 dark:text-slate-50">
              {workspace.icon ? `${workspace.icon} ` : ""}
              {workspace.name}
            </div>
            <div className="mt-1 flex items-center gap-2 text-slate-500 text-xs dark:text-slate-400">
              <span className="capitalize">{workspace.type}</span>
              <span aria-hidden>·</span>
              <span>{workspace.defaultCurrency}</span>
              <span aria-hidden>·</span>
              <span className="capitalize">{workspace.role}</span>
            </div>
          </div>
          {workspace.status === "archived" && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-slate-200/60 px-2 py-0.5 font-medium text-slate-700 text-xs dark:bg-slate-800/60 dark:text-slate-300">
              archived
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
