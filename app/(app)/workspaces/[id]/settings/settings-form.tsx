"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  archiveWorkspace,
  renameWorkspace,
  restoreWorkspace,
  softDeleteWorkspace,
  updateWorkspaceMeta,
} from "@/lib/actions/workspaces";
import type { WorkspaceDetail } from "@/lib/queries/workspaces";
import {
  type RenameWorkspaceInput,
  type UpdateWorkspaceMetaInput,
  renameWorkspaceSchema,
  updateWorkspaceMetaSchema,
} from "@/lib/validation/workspace";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function SettingsForm({
  workspace,
  currencies,
}: {
  workspace: WorkspaceDetail;
  currencies: string[];
}) {
  const router = useRouter();
  const canManage = workspace.role === "owner" || workspace.role === "admin";
  const isOwner = workspace.role === "owner";
  const isPersonal = workspace.type === "personal";
  const isArchived = workspace.status === "archived";

  return (
    <div className="space-y-6">
      <RenameSection workspace={workspace} disabled={!canManage} onSaved={() => router.refresh()} />
      <MetaSection
        workspace={workspace}
        currencies={currencies}
        disabled={!canManage}
        onSaved={() => router.refresh()}
      />
      {isOwner && (
        <DangerSection
          workspace={workspace}
          isPersonal={isPersonal}
          isArchived={isArchived}
          onAfter={() => router.refresh()}
        />
      )}
      {!canManage && (
        <p className="text-slate-500 text-xs dark:text-slate-400">
          Only owners and admins can edit settings.
        </p>
      )}
    </div>
  );
}

function RenameSection({
  workspace,
  disabled,
  onSaved,
}: {
  workspace: WorkspaceDetail;
  disabled: boolean;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<RenameWorkspaceInput>({
    resolver: zodResolver(renameWorkspaceSchema),
    defaultValues: { id: workspace.id, name: workspace.name },
  });

  async function onSubmit(values: RenameWorkspaceInput) {
    setSubmitting(true);
    try {
      await renameWorkspace(values);
      toast.success("Renamed");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" disabled={disabled || submitting}>
          {submitting ? "Saving…" : "Save name"}
        </Button>
      </form>
    </Form>
  );
}

function MetaSection({
  workspace,
  currencies,
  disabled,
  onSaved,
}: {
  workspace: WorkspaceDetail;
  currencies: string[];
  disabled: boolean;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<UpdateWorkspaceMetaInput>({
    resolver: zodResolver(updateWorkspaceMetaSchema),
    defaultValues: {
      id: workspace.id,
      icon: workspace.icon ?? "",
      defaultCurrency: workspace.defaultCurrency,
    },
  });

  async function onSubmit(values: UpdateWorkspaceMetaInput) {
    setSubmitting(true);
    try {
      await updateWorkspaceMeta(values);
      toast.success("Settings updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update settings");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder="🏖️"
                  maxLength={64}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default currency</FormLabel>
              <FormControl>
                <select disabled={disabled} className={inputClass} {...field}>
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" disabled={disabled || submitting}>
          {submitting ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </Form>
  );
}

function DangerSection({
  workspace,
  isPersonal,
  isArchived,
  onAfter,
}: {
  workspace: WorkspaceDetail;
  isPersonal: boolean;
  isArchived: boolean;
  onAfter: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    try {
      await fn();
      toast.success(`${label} done`);
      onAfter();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${label.toLowerCase()}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 border-slate-200/60 border-t pt-4 dark:border-slate-800/60">
      <h3 className="font-medium text-slate-700 text-sm dark:text-slate-300">Owner actions</h3>
      <div className="flex flex-wrap gap-2">
        {!isArchived ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => run("Archive", () => archiveWorkspace({ id: workspace.id }))}
          >
            {busy === "Archive" ? "Archiving…" : "Archive"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => run("Restore", () => restoreWorkspace({ id: workspace.id }))}
          >
            {busy === "Restore" ? "Restoring…" : "Restore"}
          </Button>
        )}
        {!isPersonal && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={busy !== null}
            onClick={async () => {
              if (!confirm(`Delete "${workspace.name}"? You have 30 days to restore.`)) return;
              await run("Delete", () => softDeleteWorkspace({ id: workspace.id }));
              router.push("/workspaces");
            }}
          >
            {busy === "Delete" ? "Deleting…" : "Delete"}
          </Button>
        )}
      </div>
      {isPersonal && (
        <p className="text-slate-500 text-xs dark:text-slate-400">
          Personal workspaces cannot be deleted.
        </p>
      )}
    </div>
  );
}
