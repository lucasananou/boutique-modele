import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import {
  getActiveSessions,
  getLiveStats,
  getRecentEvents,
  markInactiveSessions,
} from "@/lib/live/sessions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!(await isAdminSession(session))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // Stream déjà fermé
        }
      }

      async function pushSnapshot(type: "snapshot" | "update") {
        await markInactiveSessions();
        const [sessions, stats, events] = await Promise.all([
          getActiveSessions(),
          getLiveStats(),
          getRecentEvents(40),
        ]);
        send({ type, sessions, stats, events });
      }

      // Snapshot initial
      try {
        await pushSnapshot("snapshot");
      } catch (err) {
        console.error("[live:stream] snapshot initial", err);
      }

      // Polling toutes les 3s
      intervalId = setInterval(async () => {
        try {
          await pushSnapshot("update");
        } catch (err) {
          console.error("[live:stream] poll", err);
          if (intervalId) clearInterval(intervalId);
          controller.close();
        }
      }, 3000);
    },

    cancel() {
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Désactive le buffering Apache/nginx
    },
  });
}
