import { cn } from "@/lib/utils";

// Pure-CSS gradient mesh for the landing hero. No JS, no canvas, no GPU
// shader — keeps the LCP target (<1.2s on mid-tier mobile) safe.
// 3 large blurred radial blobs slowly drift via @keyframes; @media
// prefers-reduced-motion halts them (handled in globals.css).

export function AnimatedMeshBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {/* Soft grid overlay, masked to fade out near edges */}
      <div className="absolute inset-0 opacity-[0.18] dark:opacity-[0.08] [background-image:linear-gradient(to_right,theme(colors.neutral.300/.5)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.neutral.300/.5)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black_30%,transparent_75%)]" />
      {/* Orbs */}
      <div className="-top-32 -left-24 absolute size-[28rem] rounded-full bg-emerald-300/45 blur-3xl animate-mesh-drift-1 dark:bg-emerald-700/35" />
      <div className="-right-40 top-20 absolute size-[34rem] rounded-full bg-teal-300/35 blur-3xl animate-mesh-drift-2 dark:bg-teal-800/30" />
      <div className="-bottom-32 absolute left-1/3 size-[30rem] rounded-full bg-emerald-500/30 blur-3xl animate-mesh-drift-3 dark:bg-emerald-600/20" />
    </div>
  );
}
