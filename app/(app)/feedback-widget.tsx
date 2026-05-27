"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFeedback } from "@/lib/actions/feedback";
import { type CreateFeedbackInput, createFeedbackSchema } from "@/lib/validation/feedback";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateFeedbackInput>({
    resolver: zodResolver(createFeedbackSchema),
    defaultValues: { type: "general", message: "", pageUrl: "", userAgent: "" },
  });

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  async function onSubmit(values: CreateFeedbackInput) {
    setSubmitting(true);
    try {
      await createFeedback({
        ...values,
        pageUrl:
          typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "",
      });
      toast.success("Thanks — feedback recorded");
      form.reset({ type: "general", message: "", pageUrl: "", userAgent: "" });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={panelRef}
      className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6"
      style={{ zIndex: "var(--z-toast)" }}
    >
      {open && (
        <div className="surface-acrylic-heavy mb-3 w-80 rounded-xl border border-slate-200/60 p-4 shadow-xl dark:border-slate-800/60">
          <h3 className="font-semibold text-slate-900 text-sm dark:text-slate-50">
            Send us feedback
          </h3>
          <p className="mt-1 text-slate-500 text-xs dark:text-slate-400">
            Bug, idea, or hello — we read everything.
          </p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-xs dark:text-slate-300">Type</Label>
              <select className={SELECT_CLASS} {...form.register("type")}>
                <option value="bug">Bug</option>
                <option value="idea">Idea</option>
                <option value="general">General</option>
                <option value="praise">Praise</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-xs dark:text-slate-300">Message</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="What's on your mind?"
                maxLength={4000}
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <p className="text-rose-600 text-xs dark:text-rose-400">
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>
            {/* Hidden — populated client-side on submit so master can debug. */}
            <Input type="hidden" {...form.register("pageUrl")} />
            <Input type="hidden" {...form.register("userAgent")} />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Close feedback" : "Send feedback"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
      >
        <MessageSquare className="size-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
