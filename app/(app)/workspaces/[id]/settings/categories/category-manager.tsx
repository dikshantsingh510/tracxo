"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/categories";
import type { CategoryRow } from "@/lib/queries/categories";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Draft = { name: string; icon: string; color: string };

const EMPTY: Draft = { name: "", icon: "", color: "" };

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

  async function onDelete(row: CategoryRow) {
    if (!confirm(`Delete "${row.name}"? Existing expenses will lose this category.`)) return;
    setBusy(true);
    try {
      await deleteCategory({ id: row.id, workspaceId });
      toast.success("Category deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={onCreate}
        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_120px_auto]"
      >
        <div>
          <Label className="text-slate-700 text-xs dark:text-slate-300">Name</Label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Food"
            maxLength={50}
          />
        </div>
        <div>
          <Label className="text-slate-700 text-xs dark:text-slate-300">Icon (lucide)</Label>
          <Input
            value={draft.icon}
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            placeholder="utensils"
          />
        </div>
        <div>
          <Label className="text-slate-700 text-xs dark:text-slate-300">Color</Label>
          <Input
            value={draft.color}
            onChange={(e) => setDraft({ ...draft, color: e.target.value })}
            placeholder="#10b981"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy} className="w-full">
            Add
          </Button>
        </div>
      </form>

      {initial.length === 0 ? (
        <p className="text-slate-600 text-sm dark:text-slate-400">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
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
              <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 text-sm">
                  {row.color && (
                    <span
                      className="inline-block size-4 rounded-full"
                      style={{ backgroundColor: row.color }}
                      aria-hidden
                    />
                  )}
                  <span className="font-medium text-slate-900 dark:text-slate-50">{row.name}</span>
                  {row.icon && (
                    <span className="text-slate-500 text-xs dark:text-slate-400">{row.icon}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(row.id)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(row)} disabled={busy}>
                    Delete
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
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
    <li className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[1fr_120px_120px_auto]">
      <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
      <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="utensils" />
      <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#10b981" />
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => onSave({ name, icon, color })}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </li>
  );
}
