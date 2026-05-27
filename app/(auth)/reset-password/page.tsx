import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Set new password · Tracxo" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell
        eyebrow="Hmm — link's broken"
        heading="That reset link isn't valid."
        subheading="Either the link expired, was used already, or got mangled by an email client. Request a fresh one."
      >
        <AuthCard title="Invalid link">
          <Alert variant="destructive">
            <AlertDescription>
              This reset link is missing or malformed. Request a new one from the{" "}
              <Link
                href="/forgot-password"
                className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
              >
                forgot-password
              </Link>{" "}
              page.
            </AlertDescription>
          </Alert>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Almost there"
      heading="Set a new password."
      subheading="Make it something memorable. We'll log you out everywhere else so old sessions can't sneak back in."
    >
      <AuthCard title="Set a new password" description="Choose a password you don't use elsewhere.">
        <ResetForm token={token} />
      </AuthCard>
    </AuthShell>
  );
}
