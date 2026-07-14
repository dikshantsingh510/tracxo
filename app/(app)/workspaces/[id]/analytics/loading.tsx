import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          <section key={i} className="surface-acrylic-light rounded-2xl p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-56 w-full rounded-xl" />
          </section>
        ))}
      </div>
    </div>
  );
}
