import { notFound } from "next/navigation";

import { requireSession } from "@/lib/auth/server";
import { listCategories } from "@/lib/queries/categories";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import { CategoryManager } from "./category-manager";

export const metadata = { title: "Categories · Tracxo" };

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/settings/categories`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const categories = await listCategories(workspace.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">Categories</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Tag expenses to group them in lists and reports.
        </p>
      </header>
      <CategoryManager workspaceId={workspace.id} initial={categories} />
    </div>
  );
}
