"use client";

import { type ActivityForFormat, formatActivity } from "@/lib/activity/format";
import { formatDateTime, timeAgo } from "@/lib/dates";
import { useEffect, useRef, useState } from "react";

type FeedRow = ActivityForFormat & {
  id: string;
  actorId: string | null;
  subjectType: string;
  subjectId: string;
  // Server passes Date → ISO string across the boundary.
  createdAt: string;
};

export function ActivityFeed({
  workspaceId,
  initial,
}: {
  workspaceId: string;
  initial: FeedRow[];
}) {
  const [rows, setRows] = useState<FeedRow[]>(initial);
  const [connected, setConnected] = useState(false);
  const seen = useRef(new Set(initial.map((r) => r.id)));
  // Re-render once a minute so relative timestamps stay fresh without a
  // ticker per row. Starts null so SSR and first client render agree
  // (Date.now() in render = hydration mismatch); absolute times show until
  // mount, then upgrade to relative.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const es = new EventSource(`/api/workspaces/${workspaceId}/stream`);

    es.addEventListener("connected", () => setConnected(true));

    es.addEventListener("activity", (event) => {
      try {
        const row = JSON.parse((event as MessageEvent).data) as FeedRow;
        if (seen.current.has(row.id)) return;
        seen.current.add(row.id);
        setRows((prev) => [row, ...prev]);
      } catch {
        // Malformed event — skip silently; SSE will continue.
      }
    });

    es.onerror = () => {
      setConnected(false);
      // The browser auto-reconnects EventSource — no action needed.
    };

    return () => es.close();
  }, [workspaceId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span
          aria-hidden
          className={`inline-block size-2 rounded-full ${connected ? "bg-emerald-500" : "bg-neutral-400"}`}
        />
        <span className="text-neutral-500 dark:text-neutral-400">
          {connected ? "Live" : "Reconnecting…"}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-neutral-600 text-sm dark:text-neutral-400">
          No activity yet. Add an expense or invite someone to see this fill up.
        </p>
      ) : (
        <ol className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
          {rows.map((r) => (
            <li key={r.id} className="py-3">
              <div className="text-neutral-900 text-sm dark:text-neutral-50">
                {formatActivity(r)}
              </div>
              <div className="mt-0.5 text-neutral-500 text-xs dark:text-neutral-400">
                {now === null ? formatDateTime(r.createdAt) : timeAgo(r.createdAt, now)}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
