"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArchiveRestore, ArchiveX, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          {isOwner ? (
            <TabsTrigger value="danger" className="text-rose-700 dark:text-rose-400">
              Danger zone
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Section title="General" description="Rename your workspace and set its icon.">
            <GeneralSection
              workspace={workspace}
              disabled={!canManage}
              onSaved={() => router.refresh()}
            />
          </Section>
        </TabsContent>

        <TabsContent value="currency" className="mt-6">
          <Section
            title="Currency"
            description="Default currency new expenses fall back to. Existing expenses keep theirs."
          >
            <CurrencySection
              workspace={workspace}
              currencies={currencies}
              disabled={!canManage}
              onSaved={() => router.refresh()}
            />
          </Section>
        </TabsContent>

        {isOwner ? (
          <TabsContent value="danger" className="mt-6">
            <Section
              title="Danger zone"
              description="Archive hides this workspace without losing data. Delete starts a 30-day grace period."
              danger
            >
              <DangerSection workspace={workspace} onAfter={() => router.refresh()} />
            </Section>
          </TabsContent>
        ) : null}
      </Tabs>

      {!canManage ? (
        <p className="text-muted-foreground text-xs">Only owners and admins can edit settings.</p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  description,
  children,
  danger,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`surface-acrylic-light rounded-2xl p-5 sm:p-6 ${danger ? "ring-1 ring-rose-500/20" : ""}`}
    >
      <header className="mb-4 border-border border-b pb-3">
        <h3
          className={`font-semibold ${danger ? "text-rose-700 dark:text-rose-400" : "text-foreground"}`}
        >
          {title}
        </h3>
        {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
      </header>
      {children}
    </div>
  );
}

function GeneralSection({
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
      toast.success("Saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace name</FormLabel>
              <FormControl>
                <Input disabled={disabled} className="h-11 rounded-xl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={disabled || submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </Form>
  );
}

function CurrencySection({
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
      toast.success("Saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  className="h-11 rounded-xl"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                An emoji or short label that appears in the workspace switcher.
              </FormDescription>
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
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={disabled || submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </Form>
  );
}

function DangerSection({
  workspace,
  onAfter,
}: {
  workspace: WorkspaceDetail;
  onAfter: () => void;
}) {
  const router = useRouter();
  const [confirmKey, setConfirmKey] = useState<"archive" | "restore" | "delete" | null>(null);
  const isPersonal = workspace.type === "personal";
  const isArchived = workspace.status === "archived";

  async function doArchive() {
    await archiveWorkspace({ id: workspace.id });
    toast.success("Workspace archived");
    onAfter();
  }
  async function doRestore() {
    await restoreWorkspace({ id: workspace.id });
    toast.success("Workspace restored");
    onAfter();
  }
  async function doDelete() {
    await softDeleteWorkspace({ id: workspace.id });
    toast.success("Workspace deleted");
    router.push("/workspaces");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="font-medium text-foreground text-sm">
            {isArchived ? "Restore workspace" : "Archive workspace"}
          </p>
          <p className="text-muted-foreground text-xs">
            {isArchived
              ? "Bring this workspace back to active state."
              : "Hide this workspace from members. Data stays intact."}
          </p>
        </div>
        <Button variant="outline" onClick={() => setConfirmKey(isArchived ? "restore" : "archive")}>
          {isArchived ? (
            <>
              <ArchiveRestore className="size-3.5" strokeWidth={1.75} aria-hidden />
              Restore
            </>
          ) : (
            <>
              <ArchiveX className="size-3.5" strokeWidth={1.75} aria-hidden />
              Archive
            </>
          )}
        </Button>
      </div>

      {!isPersonal ? (
        <div className="flex flex-col items-start justify-between gap-3 border-rose-500/20 border-t pt-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium text-foreground text-sm">Delete workspace</p>
            <p className="text-muted-foreground text-xs">
              Soft-deletes with 30 days to restore. Members lose access immediately.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setConfirmKey("delete")}>
            <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
            Delete
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">Personal workspaces cannot be deleted.</p>
      )}

      <ConfirmDialog
        open={confirmKey === "archive"}
        onOpenChange={(o) => !o && setConfirmKey(null)}
        title={`Archive "${workspace.name}"?`}
        description="Members will lose access until you restore. All expense history stays intact."
        confirmLabel="Archive"
        onConfirm={doArchive}
      />
      <ConfirmDialog
        open={confirmKey === "restore"}
        onOpenChange={(o) => !o && setConfirmKey(null)}
        title={`Restore "${workspace.name}"?`}
        description="Members will regain access immediately."
        confirmLabel="Restore"
        onConfirm={doRestore}
      />
      <ConfirmDialog
        open={confirmKey === "delete"}
        onOpenChange={(o) => !o && setConfirmKey(null)}
        title={`Delete "${workspace.name}"?`}
        description="Soft-deletes the workspace. You have 30 days to restore before data is permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  );
}
