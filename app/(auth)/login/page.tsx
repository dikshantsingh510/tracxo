import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { safeRedirectPath } from "@/lib/validation/redirect";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in · Tracxo" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next);

  return (
    <AuthShell
      eyebrow="Welcome back"
      heading="Pick up where you left off."
      subheading="Your workspaces, balances, and pending settlements — exactly where you left them."
    >
      <AuthCard
        title="Welcome back"
        description="Log in to continue tracking shared expenses."
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link
              href={`/signup${safeNext !== "/" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
              className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              Sign up
            </Link>
          </>
        }
      >
        <GoogleButton next={safeNext} />
        <AuthDivider />
        <LoginForm next={safeNext} />
      </AuthCard>
    </AuthShell>
  );
}
