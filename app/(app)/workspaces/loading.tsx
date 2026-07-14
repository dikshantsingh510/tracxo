import { Skeleton } from "@/components/ui/skeleton";

// Loading skeletons mirror the real page's container classes exactly so the
// settled content lands in the same box — zero layout shift on resolve.
// Same pattern in the other (app) loading.tsx files.
export default function WorkspacesLoading() {
  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </header>

      <section>
        <Skeleton className="mb-3 h-3 w-14" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
            <li key={i} className="surface-acrylic-light rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-1.5 h-3 w-1/2" />
                </div>
              </div>
              <div className="mt-4 border-border border-t pt-3">
                <Skeleton className="h-3 w-2/3" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
