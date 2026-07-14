import { Skeleton } from "@/components/ui/skeleton";

export default function SettlementsLoading() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-44" />
          <Skeleton className="mt-2 h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </header>

      <ul className="surface-acrylic-light divide-y divide-border overflow-hidden rounded-2xl">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          <li key={i} className="px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-2 h-3 w-1/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}
