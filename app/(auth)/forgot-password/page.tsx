import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Reset password · Tracxo" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Forgot it? Happens to the best of us."
      heading="Reset your password."
      subheading="Drop your email and we'll send a link to set a new one. Link expires in an hour."
    >
      <AuthCard
        title="Reset your password"
        description="We'll email you a link to set a new password."
        footer={
          <Link
            href="/login"
            className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            ← Back to login
          </Link>
        }
      >
        <ForgotForm />
      </AuthCard>
    </AuthShell>
  );
}
