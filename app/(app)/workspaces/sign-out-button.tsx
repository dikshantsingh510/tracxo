"use client";

import { signOut } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white/60 px-4 font-medium text-slate-900 text-sm transition hover:bg-white disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-50 dark:hover:bg-slate-900"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
