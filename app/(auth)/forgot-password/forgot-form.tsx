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
import { requestPasswordReset } from "@/lib/auth/client";
import { type ForgotPasswordInput, forgotPasswordSchema } from "@/lib/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function ForgotForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true);
    const { error } = await requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message ?? "Could not send reset link");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="surface-emerald-frosted flex flex-col items-center gap-3 rounded-xl px-6 py-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
          <MailCheck className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="font-medium text-foreground">Check your inbox</p>
        <p className="max-w-xs text-muted-foreground text-sm leading-relaxed">
          If that email exists, a reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="lg"
          className="group h-11 w-full rounded-xl font-medium text-base transition hover:shadow-emerald-500/20 hover:shadow-lg"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
