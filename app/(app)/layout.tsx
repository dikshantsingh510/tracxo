// Minimal wrapper for the authenticated route group. The full app shell
// (sidebar + topbar + workspace switcher) lands in a later PR. For now we
// share the Frosted Emerald backdrop with the (auth) layout.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-32 -left-32 absolute size-96 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-700/20" />
        <div className="-bottom-32 -right-24 absolute size-96 rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-500/10" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-4xl">{children}</div>
    </main>
  );
}
