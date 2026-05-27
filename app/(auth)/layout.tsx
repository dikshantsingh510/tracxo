import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      {/* Toned ambient backdrop — focus stays on the form */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-32 -left-32 absolute size-[28rem] rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-700/10" />
        <div className="-bottom-32 -right-24 absolute size-[28rem] rounded-full bg-emerald-500/12 blur-3xl dark:bg-emerald-500/8" />
      </div>

      {/* Mobile-only logo lockup (split-screen pages hide their own logo here) */}
      <Link
        href="/"
        className="absolute top-6 left-1/2 -translate-x-1/2 rounded-md font-semibold text-foreground text-xl tracking-tight focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-2 lg:hidden"
      >
        Tracxo
      </Link>

      <div className="relative z-10 w-full">{children}</div>
    </main>
  );
}
