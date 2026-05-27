export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-2 flex items-center" aria-hidden>
      <div className="flex-1 border-border border-t" />
      <span className="px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 border-border border-t" />
    </div>
  );
}
