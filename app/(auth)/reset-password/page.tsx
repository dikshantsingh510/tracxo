import { AuthCard } from "@/components/auth/auth-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
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
      <AuthCard title="Invalid link">
        <Alert variant="destructive">
          <AlertDescription>
            This reset link is missing or malformed. Request a new one from the{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              forgot-password
            </Link>{" "}
            page.
          </AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Choose a password you don't use elsewhere.">
      <ResetForm token={token} />
    </AuthCard>
  );
}
