import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      {/* Toned ambient backdrop — half the saturation of marketing so the focus stays on the form */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-32 -left-32 absolute size-96 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-700/10" />
        <div className="-bottom-32 -right-24 absolute size-96 rounded-full bg-emerald-500/12 blur-3xl dark:bg-emerald-500/8" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-6 block rounded-md text-center font-semibold text-2xl text-foreground tracking-tight focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-2"
        >
          Tracxo
        </Link>
        {children}
      </div>
    </main>
  );
}
