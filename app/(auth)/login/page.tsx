import { AuthCard } from "@/components/auth/auth-card";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleButton } from "@/components/auth/google-button";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in · Tracxo" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") ? next : "/";

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to continue tracking shared expenses."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup${safeNext !== "/" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
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
  );
}
