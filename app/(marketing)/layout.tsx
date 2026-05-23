import Link from "next/link";

// Public marketing chrome. Kept intentionally light — no client-side JS so
// the Lighthouse mobile target (≥95) and LCP (<1.2s) stay reachable.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-40 -left-32 absolute size-[36rem] rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-700/20" />
        <div className="-bottom-32 -right-32 absolute size-[40rem] rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-semibold text-2xl tracking-tight">
          Tracxo
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="text-slate-700 underline-offset-4 hover:underline dark:text-slate-300"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-4 font-medium text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl border-slate-200/50 border-t px-6 py-8 text-slate-500 text-sm dark:border-slate-800/50 dark:text-slate-400">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} Tracxo. Split smarter.</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
