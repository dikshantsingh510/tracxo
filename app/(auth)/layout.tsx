import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
      {/* Frosted-emerald ambient backdrop — emerald-300/500 blurred orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-32 -left-32 absolute size-96 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-700/20" />
        <div className="-bottom-32 -right-24 absolute size-96 rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-6 block text-center font-semibold text-2xl text-slate-900 tracking-tight dark:text-slate-50"
        >
          Tracxo
        </Link>
        {children}
      </div>
    </main>
  );
}
