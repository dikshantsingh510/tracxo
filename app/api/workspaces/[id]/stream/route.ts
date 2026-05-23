import { getSession } from "@/lib/auth/server";
import { fetchActivitySince, isMember } from "@/lib/queries/activity";
import type { NextRequest } from "next/server";

// Server-Sent Events stream for live activity.
//
// Neon HTTP has no persistent connection (no LISTEN/NOTIFY), so we poll
// activity_log every ~3 seconds and emit any rows newer than the cursor.
// This is intentionally simple — when the activity volume justifies the
// switch, swap the poll for the websocket-driver LISTEN path.
//
// The handler keeps the connection open until the client aborts; closes are
// reported via `request.signal.aborted`. Heartbeats every 15s keep proxies
// from dropping idle connections.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 3_000;
const HEARTBEAT_MS = 15_000;
const MAX_CONNECTION_MS = 25 * 60 * 1000; // Vercel function ceiling buffer.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: workspaceId } = await params;
  const ok = await isMember(workspaceId, session.user.id);
  if (!ok) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let cursor = new Date();
  const startedAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const abort = request.signal;
      let alive = true;

      const send = (chunk: string): void => {
        if (!alive) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream may be closing; swallow to avoid throwing during teardown.
        }
      };

      const cleanup = (): void => {
        if (!alive) return;
        alive = false;
        clearInterval(pollHandle);
        clearInterval(heartbeatHandle);
        clearTimeout(ceilingHandle);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      abort.addEventListener("abort", cleanup);

      // Initial "stream open" event so the client can flip a connected flag.
      send(`event: connected\ndata: {"workspaceId":"${workspaceId}"}\n\n`);

      const pollHandle = setInterval(async () => {
        if (!alive) return;
        try {
          const rows = await fetchActivitySince(workspaceId, cursor);
          if (rows.length > 0) {
            // Postgres `timestamp` has µs precision; JS Date has ms. Advance
            // the cursor by 1ms past the latest row so `gt` doesn't re-match.
            cursor = new Date(rows[rows.length - 1].createdAt.getTime() + 1);
            for (const r of rows) {
              send(`event: activity\ndata: ${JSON.stringify(r)}\n\n`);
            }
          }
        } catch (err) {
          // Surface as a comment so the client can log without breaking format.
          send(`: poll-error ${err instanceof Error ? err.message : "unknown"}\n\n`);
        }
      }, POLL_MS);

      const heartbeatHandle = setInterval(() => {
        send(`: keepalive ${Date.now()}\n\n`);
      }, HEARTBEAT_MS);

      const ceilingHandle = setTimeout(
        () => {
          send(`event: reconnect\ndata: {"reason":"max-duration"}\n\n`);
          cleanup();
        },
        MAX_CONNECTION_MS - (Date.now() - startedAt),
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      // Disable buffering on common reverse proxies.
      "X-Accel-Buffering": "no",
    },
  });
}
