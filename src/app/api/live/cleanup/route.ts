import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { markInactiveSessions } from "@/lib/live/sessions";

// Appelable manuellement depuis l'admin ou via un cron Coolify.
export async function POST(req: Request) {
  // Accepte soit une session admin, soit un secret cron dans le header
  const cronSecret = req.headers.get("x-cron-secret");
  const validCron =
    cronSecret && cronSecret === process.env.LIVE_CLEANUP_SECRET;

  if (!validCron) {
    const session = await auth();
    if (!(await isAdminSession(session))) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const result = await markInactiveSessions();
  return Response.json({ updated: result.count });
}
