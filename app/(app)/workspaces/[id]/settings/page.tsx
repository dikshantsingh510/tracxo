import { notFound } from "next/navigation";

import { RoleBadge } from "@/components/ui/role-badge";
import { requireSession } from "@/lib/auth/server";
import { currencyCodeEnum } from "@/lib/db/schema/auth";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Workspace settings · Tracxo" };

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/settings`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">Settings</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {workspace.name} · <span className="capitalize">{workspace.type}</span>
          </p>
        </div>
        <RoleBadge role={workspace.role} />
      </header>
      <SettingsForm workspace={workspace} currencies={[...currencyCodeEnum.enumValues]} />
    </div>
  );
}
