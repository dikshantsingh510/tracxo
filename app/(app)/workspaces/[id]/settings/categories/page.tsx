import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { listCategories } from "@/lib/queries/categories";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryManager } from "./category-manager";

export const metadata = { title: "Categories · Tracxo" };

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/settings/categories`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const categories = await listCategories(workspace.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/settings`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Workspace settings
      </Link>
      <AuthCard
        title="Expense categories"
        description="Tag expenses to group them on lists and reports."
      >
        <CategoryManager workspaceId={workspace.id} initial={categories} />
      </AuthCard>
    </div>
  );
}
