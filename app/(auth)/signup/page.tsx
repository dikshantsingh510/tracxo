import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up · Tracxo" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") ? next : "/";

  return (
    <AuthShell
      eyebrow="Start free in 30 seconds"
      heading="Stop tracking debts in your head."
      subheading="Free forever for groups under 10. No card required. UPI deep-link checkout built in."
    >
      <AuthCard
        title="Create your account"
        description="Track shared expenses in seconds."
        footer={
          <>
            Already have an account?{" "}
            <Link
              href={`/login${safeNext !== "/" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
              className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              Log in
            </Link>
          </>
        }
      >
        <GoogleButton next={safeNext} />
        <AuthDivider />
        <SignupForm next={safeNext} />
      </AuthCard>
    </AuthShell>
  );
}
