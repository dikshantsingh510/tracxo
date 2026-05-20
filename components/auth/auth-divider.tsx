export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-1 flex items-center" aria-hidden>
      <div className="flex-1 border-slate-200/70 border-t dark:border-slate-800/70" />
      <span className="px-3 text-slate-500 text-xs uppercase tracking-wider dark:text-slate-400">
        {label}
      </span>
      <div className="flex-1 border-slate-200/70 border-t dark:border-slate-800/70" />
    </div>
  );
}
