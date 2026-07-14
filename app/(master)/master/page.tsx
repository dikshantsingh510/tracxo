import { Archive, Building2, Receipt, Trash2, Users2, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";

import { requireMaster } from "@/lib/auth/server";
import { getMasterStats } from "@/lib/queries/master";

export const metadata: Metadata = { title: "Master · Stats" };

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="surface-acrylic-light flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {label}
        </span>
        <Icon
          className={
            accent
              ? "size-4 text-emerald-600 dark:text-emerald-400"
              : "size-4 text-muted-foreground"
          }
          strokeWidth={1.75}
          aria-hidden
        />
      </div>
      <span className="font-semibold text-4xl text-foreground tabular-nums tracking-[-0.02em]">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default async function MasterHomePage() {
  // Defense in depth: the (master) layout also gates on role, but layouts
  // don't re-render on soft navigation — every page re-verifies itself
  // (contract documented in lib/queries/master.ts).
  await requireMaster();
  const s = await getMasterStats();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">
          Platform stats
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">Live counts across the whole platform.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Users" value={s.users} icon={Users2} accent />
        <Stat label="Active workspaces" value={s.workspacesActive} icon={Building2} accent />
        <Stat label="Archived workspaces" value={s.workspacesArchived} icon={Archive} />
        <Stat label="Deleted workspaces" value={s.workspacesDeleted} icon={Trash2} />
        <Stat label="Live expenses" value={s.expenses} icon={Receipt} />
        <Stat label="Live settlements" value={s.settlements} icon={Wallet} />
      </div>
    </div>
  );
}
