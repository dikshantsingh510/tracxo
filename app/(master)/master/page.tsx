import { getMasterStats } from "@/lib/queries/master";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Master · Stats" };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-acrylic-light rounded-xl p-5">
      <div className="text-slate-500 text-xs uppercase tracking-wider dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 font-semibold text-3xl text-slate-900 tracking-tight dark:text-slate-50">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

export default async function MasterHomePage() {
  const s = await getMasterStats();
  return (
    <div className="space-y-6">
      <h1 className="font-semibold text-2xl tracking-tight">Platform stats</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Users" value={s.users} />
        <Stat label="Active workspaces" value={s.workspacesActive} />
        <Stat label="Archived workspaces" value={s.workspacesArchived} />
        <Stat label="Deleted workspaces" value={s.workspacesDeleted} />
        <Stat label="Live expenses" value={s.expenses} />
        <Stat label="Live settlements" value={s.settlements} />
      </div>
    </div>
  );
}
