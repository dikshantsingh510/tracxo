import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { safeRedirectPath } from "@/lib/validation/redirect";
import { VerifyForm } from "./verify-form";

export const metadata = { title: "Verify email · Tracxo" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;
  const safeNext = safeRedirectPath(next);

  return (
    <AuthShell
      eyebrow="One last step"
      heading="Verify your email."
      subheading="We sent a 6-digit code to your inbox. Paste it in or type the digits — auto-advances between boxes."
    >
      <AuthCard
        title="Check your email"
        description={
          email
            ? `Enter the 6-digit code we sent to ${email}.`
            : "Enter your email and the 6-digit code we sent you."
        }
      >
        <VerifyForm defaultEmail={email ?? ""} next={safeNext} />
      </AuthCard>
    </AuthShell>
  );
}
