"use client";

import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/categories";
import type { CategoryRow } from "@/lib/queries/categories";
import { cn } from "@/lib/utils";

type Draft = { name: string; icon: string; color: string };
const EMPTY: Draft = { name: "", icon: "", color: "" };

// Curated swatches matching the chart palette (§8.20).
const SWATCHES = [
  "#10b981", // emerald
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
];

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#10b981"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
        aria-label="Pick custom color"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {SWATCHES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "size-6 rounded-full ring-2 ring-transparent transition-all hover:scale-110",
              value === s && "ring-foreground/40",
            )}
            style={{ backgroundColor: s }}
            aria-label={`Use color ${s}`}
            title={s}
          />
        ))}
      </div>
    </div>
  );
}

export function CategoryManager({
  workspaceId,
  initial,
}: {
  workspaceId: string;
  initial: CategoryRow[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CategoryRow | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return toast.error("Name is required");
    setBusy(true);
    try {
      await createCategory({
        workspaceId,
        name: draft.name.trim(),
        icon: draft.icon.trim() || undefined,
        color: draft.color.trim() || undefined,
      });
      toast.success("Category added");
      setDraft(EMPTY);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEdit(row: CategoryRow, next: Draft) {
    setBusy(true);
    try {
      await updateCategory({
        id: row.id,
        workspaceId,
        name: next.name.trim(),
        icon: next.icon.trim() || undefined,
        color: next.color.trim() || undefined,
      });
      toast.success("Category updated");
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(row: CategoryRow) {
    await deleteCategory({ id: row.id, workspaceId });
    toast.success("Category deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <section className="surface-acrylic-light space-y-4 rounded-2xl p-5">
        <h3 className="font-semibold text-foreground text-sm">Add a category</h3>
        <form onSubmit={onCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <div>
              <Label htmlFor="cat-name" className="mb-1.5 block text-xs">
                Name
              </Label>
              <Input
                id="cat-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Food"
                maxLength={50}
                className="h-10 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="cat-icon" className="mb-1.5 block text-xs">
                Icon (lucide)
              </Label>
              <Input
                id="cat-icon"
                value={draft.icon}
                onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                placeholder="utensils"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Color</Label>
            <ColorPicker value={draft.color} onChange={(c) => setDraft({ ...draft, color: c })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              <Plus className="size-3.5" strokeWidth={2} aria-hidden />
              Add category
            </Button>
          </div>
        </form>
      </section>

      {/* Existing categories */}
      <section className="space-y-3">
        <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Categories ({initial.length})
        </h3>
        {initial.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            heading="No categories yet"
            body="Add a category above to start tagging expenses."
          />
        ) : (
          <ul className="surface-acrylic-light divide-y divide-border overflow-hidden rounded-2xl">
            {initial.map((row) =>
              editing === row.id ? (
                <CategoryEditRow
                  key={row.id}
                  row={row}
                  busy={busy}
                  onCancel={() => setEditing(null)}
                  onSave={(next) => onSaveEdit(row, next)}
                />
              ) : (
                <li
                  key={row.id}
                  className="hover-tint flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0 text-sm">
                    <span
                      className="inline-block size-5 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: row.color ?? "transparent" }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{row.name}</div>
                      {row.icon ? (
                        <div className="truncate text-muted-foreground text-xs">{row.icon}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(row.id)}
                      aria-label={`Edit ${row.name}`}
                    >
                      <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(row)}
                      disabled={busy}
                      aria-label={`Delete ${row.name}`}
                    >
                      <Trash2
                        className="size-3.5 text-rose-700 dark:text-rose-400"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </Button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={pendingDelete ? `Delete "${pendingDelete.name}"?` : "Delete category?"}
        description="Existing expenses lose the tag but stay intact. You can recreate the category any time."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (pendingDelete) await doDelete(pendingDelete);
        }}
      />
    </div>
  );
}

function CategoryEditRow({
  row,
  busy,
  onCancel,
  onSave,
}: {
  row: CategoryRow;
  busy: boolean;
  onCancel: () => void;
  onSave: (next: Draft) => void;
}) {
  const [name, setName] = useState(row.name);
  const [icon, setIcon] = useState(row.icon ?? "");
  const [color, setColor] = useState(row.color ?? "");
  return (
    <li className="space-y-3 px-5 py-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="h-9 rounded-md"
          placeholder="Name"
        />
        <Input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="utensils"
          className="h-9 rounded-md"
        />
      </div>
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={busy} onClick={() => onSave({ name, icon, color })}>
          Save
        </Button>
      </div>
    </li>
  );
}
