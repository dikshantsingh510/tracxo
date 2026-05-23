import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { currencyCodeEnum } from "@/lib/db/schema/auth";
import Link from "next/link";
import { NewWorkspaceForm } from "./new-workspace-form";

export const metadata = { title: "New workspace · Tracxo" };

export default async function NewWorkspacePage() {
  await requireSession("/workspaces/new");

  return (
    <div className="mx-auto w-full max-w-md">
      <AuthCard
        title="Create a workspace"
        description="A workspace holds shared expenses. Invite others later from settings."
        footer={
          <Link
            href="/workspaces"
            className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            Cancel
          </Link>
        }
      >
        <NewWorkspaceForm currencies={[...currencyCodeEnum.enumValues]} />
      </AuthCard>
    </div>
  );
}
