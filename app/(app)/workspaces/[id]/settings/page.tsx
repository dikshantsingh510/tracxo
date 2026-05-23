import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { currencyCodeEnum } from "@/lib/db/schema/auth";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="mx-auto w-full max-w-md space-y-4">
      <Link
        href="/workspaces"
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← All workspaces
      </Link>
      <AuthCard
        title={workspace.name}
        description={`${workspace.type === "personal" ? "Personal workspace" : "Team workspace"} · You are ${workspace.role}`}
        footer={
          <Link
            href={`/workspaces/${workspace.id}/members`}
            className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            Manage members →
          </Link>
        }
      >
        <SettingsForm workspace={workspace} currencies={[...currencyCodeEnum.enumValues]} />
      </AuthCard>
    </div>
  );
}
