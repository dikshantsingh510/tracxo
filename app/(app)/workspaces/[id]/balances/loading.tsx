import { Skeleton } from "@/components/ui/skeleton";

export default function BalancesLoading() {
  return (
    <div className="space-y-6">
      <header>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-4 w-28" />
      </header>

      <div className="space-y-6">
        <section className="surface-acrylic-light overflow-hidden rounded-2xl">
          <div className="border-border border-b px-5 py-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-1.5 h-3 w-44" />
          </div>
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
              <li key={i} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
