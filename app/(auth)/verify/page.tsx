import { AuthCard } from "@/components/auth/auth-card";
import { VerifyForm } from "./verify-form";

export const metadata = { title: "Verify email · Tracxo" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;
  const safeNext = next?.startsWith("/") ? next : "/";

  return (
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
  );
}
