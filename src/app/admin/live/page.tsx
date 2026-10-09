import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import {
  getActiveSessions,
  getLiveStats,
  getRecentEvents,
  markInactiveSessions,
} from "@/lib/live/sessions";
import { getLiveAnalytics } from "@/lib/live/analytics";
import { LiveDashboard } from "@/components/admin/live/LiveDashboard";
import { PageTitle } from "@/components/admin/ui";
import type { LiveEventRow, LiveSession } from "@/store/live";
import type { LiveSession as DbLiveSession } from "@/generated/prisma";

export const metadata: Metadata = { title: "Live Commerce" };
export const dynamic = "force-dynamic";

function toClientSession(session: DbLiveSession): LiveSession {
  return {
    ...session,
    lastSeenAt: session.lastSeenAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
  };
}

function toClientEvent(
  event: Awaited<ReturnType<typeof getRecentEvents>>[number],
): LiveEventRow {
  return {
    ...event,
    createdAt: event.createdAt.toISOString(),
  };
}

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  await requireAdmin();
  const { demo } = await searchParams;
  const isDemo = demo === "1" || demo === "true";

  if (!isDemo) await markInactiveSessions();

  const [sessions, stats, events, analytics] = await Promise.all([
    getActiveSessions(),
    getLiveStats(),
    getRecentEvents(40),
    getLiveAnalytics(),
  ]);

  return (
    <div>
      <PageTitle
        title="Live Commerce"
        subtitle="Activité en temps réel sur la boutique."
      />
      <LiveDashboard
        initialSessions={sessions.map(toClientSession)}
        initialStats={stats}
        initialEvents={events.map(toClientEvent)}
        initialAnalytics={analytics}
        demo={isDemo}
      />
    </div>
  );
}
