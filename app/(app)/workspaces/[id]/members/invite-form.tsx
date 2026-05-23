"use client";

import { Button } from "@/components/ui/button";
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
import { createInvitation } from "@/lib/actions/members";
import { type CreateInvitationInput, createInvitationSchema } from "@/lib/validation/member";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function InviteForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { workspaceId, email: "", role: "member" },
  });

  async function onSubmit(values: CreateInvitationInput) {
    setSubmitting(true);
    try {
      const { token } = await createInvitation(values);
      const inviteUrl = `${window.location.origin}/invite/${token}`;
      try {
        await navigator.clipboard.writeText(inviteUrl);
        toast.success("Invitation created — link copied to clipboard");
      } catch {
        toast.success("Invitation created");
        toast.message(inviteUrl);
      }
      form.reset({ workspaceId, email: "", role: "member" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create invitation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  autoComplete="off"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                If provided, only this address can redeem and an email is sent.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <select {...field} className={selectClass}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </FormControl>
              <FormDescription>
                Members can add expenses. Admins can also invite and manage settings.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating…" : "Create invitation"}
        </Button>
      </form>
    </Form>
  );
}
