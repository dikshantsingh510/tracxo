import { AuthCard } from "@/components/auth/auth-card";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleButton } from "@/components/auth/google-button";
import Link from "next/link";
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
    <AuthCard
      title="Create your account"
      description="Track shared expenses in seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login${safeNext !== "/" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
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
  );
}
