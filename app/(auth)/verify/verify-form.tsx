"use client";

import { ArrowRight, Loader2 } from "lucide-react";

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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { emailOtp } from "@/lib/auth/client";
import { type VerifyOtpInput, verifyOtpSchema } from "@/lib/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function VerifyForm({ defaultEmail, next }: { defaultEmail: string; next: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const form = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: defaultEmail, otp: "" },
  });

  async function onSubmit(values: VerifyOtpInput) {
    setSubmitting(true);
    const { error } = await emailOtp.verifyEmail({ email: values.email, otp: values.otp });
    setSubmitting(false);

    if (error) {
      toast.error(error.message ?? "Invalid or expired code");
      return;
    }
    toast.success("Email verified");
    router.push(next);
    router.refresh();
  }

  async function onResend() {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "Email is required to resend" });
      return;
    }
    setResending(true);
    const { error } = await emailOtp.sendVerificationOtp({ email, type: "email-verification" });
    setResending(false);
    if (error) {
      toast.error(error.message ?? "Could not resend code");
      return;
    }
    toast.success("New code sent");
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
                  readOnly={!!defaultEmail}
                  className={`h-11 rounded-xl ${defaultEmail ? "bg-muted/40" : ""}`}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>6-digit code</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
                  <InputOTPGroup className="gap-1.5 [&>div]:h-12 [&>div]:w-12 [&>div]:rounded-xl [&>div]:border-border [&>div]:bg-background [&>div]:text-base">
                    {Array.from({ length: 6 }).map((_, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: positional slots
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
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
              Verifying…
            </>
          ) : (
            <>
              Verify
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full rounded-xl"
          onClick={onResend}
          disabled={resending}
        >
          {resending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Sending…
            </>
          ) : (
            "Resend code"
          )}
        </Button>
      </form>
    </Form>
  );
}
