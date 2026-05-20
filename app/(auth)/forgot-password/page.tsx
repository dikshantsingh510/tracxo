import { AuthCard } from "@/components/auth/auth-card";
import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Reset password · Tracxo" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="We'll email you a link to set a new password."
      footer={
        <Link href="/login" className="text-emerald-700 hover:underline dark:text-emerald-400">
          Back to login
        </Link>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
