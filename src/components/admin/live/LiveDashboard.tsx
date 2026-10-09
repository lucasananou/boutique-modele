"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveStream } from "@/hooks/useLiveStream";
import { useDemoStream } from "@/hooks/useDemoStream";
import { useLiveStore } from "@/store/live";
import { makeDemoAnalytics, makeDemoRange } from "@/lib/live/demo";
import { LiveGlobeHero } from "./LiveGlobeHero";
import { LiveEventFeed } from "./LiveEventFeed";
import { LiveSessionsTable } from "./LiveSessionsTable";
import { LiveAnalytics } from "./LiveAnalytics";
import { LivePeriodSelector, LIVE_PERIOD, type PeriodSelection } from "./LivePeriodSelector";
import type { LiveSession, LiveEventRow, LiveStats } from "@/store/live";
import type { LiveAnalytics as LiveAnalyticsType } from "@/lib/live/analytics";

interface Props {
  initialSessions: LiveSession[];
  initialStats: LiveStats;
  initialEvents: LiveEventRow[];
  initialAnalytics: LiveAnalyticsType;
  demo?: boolean;
}

interface RangeData {
  stats: LiveStats;
  sessions: LiveSession[];
  events: LiveEventRow[];
  analytics: LiveAnalyticsType;
}

const EMPTY_ANALYTICS: LiveAnalyticsType = {
  topPages: [], topProducts: [], topConversions: [], topCountries: [], topBrowsers: [], topReferrers: [],
};
const EMPTY_STATS: LiveStats = {
  visitors: 0, carts: 0, cartValue: 0, checkouts: 0, recentPurchaseCount: 0,
  recentPurchaseValue: 0, sessionsToday: 0, salesTodayValue: 0, ordersToday: 0, pageViewsSeries: [],
};

export function LiveDashboard({
  initialSessions,
  initialStats,
  initialEvents,
  initialAnalytics,
  demo = false,
}: Props) {
  const [period, setPeriod] = useState<PeriodSelection>(LIVE_PERIOD);
  const isLive = period.key === "live";

  useLiveStream(!demo && isLive);
  useDemoStream(demo && isLive);

  const sessions = useLiveStore((s) => s.sessions);
  const stats = useLiveStore((s) => s.stats);
  const events = useLiveStore((s) => s.events);
  const connected = useLiveStore((s) => s.connected);
  const hasSnapshot = useLiveStore((s) => s.hasSnapshot);

  const liveAnalytics = useMemo(
    () => (demo ? makeDemoAnalytics() : initialAnalytics),
    [demo, initialAnalytics],
  );

  // Données historiques (mode période)
  const [rangeData, setRangeData] = useState<RangeData | null>(null);
  useEffect(() => {
    if (isLive) return;
    let cancelled = false;
    (async () => {
      try {
        await Promise.resolve();
        let data: RangeData;
        if (demo) {
          data = makeDemoRange(period.from, period.to) as RangeData;
        } else {
          const res = await fetch(
            `/api/live/range?from=${encodeURIComponent(period.from!)}&to=${encodeURIComponent(period.to!)}`,
          );
          data = (await res.json()) as RangeData;
        }
        if (!cancelled) setRangeData(data);
      } catch {
        if (!cancelled) setRangeData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLive, period, demo]);

  const displaySessions = isLive ? (hasSnapshot ? sessions : initialSessions) : rangeData?.sessions ?? [];
  const displayStats = isLive ? (hasSnapshot ? stats : initialStats) : rangeData?.stats ?? EMPTY_STATS;
  const displayEvents = isLive ? (hasSnapshot ? events : initialEvents) : rangeData?.events ?? [];
  const displayAnalytics = isLive ? liveAnalytics : rangeData?.analytics ?? EMPTY_ANALYTICS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <LivePeriodSelector value={period} onChange={setPeriod} loading={false} />
        <span style={{ fontSize: 13, color: "rgba(20,21,26,0.45)" }}>
          {isLive ? "Activité en temps réel" : "Données agrégées sur la période"}
        </span>
      </div>

      <LiveGlobeHero
        sessions={displaySessions}
        stats={displayStats}
        connected={connected}
        demo={demo}
        periodLabel={isLive ? undefined : period.label}
      />

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 360px" }}>
        <LiveSessionsTable sessions={displaySessions} />
        <LiveEventFeed events={displayEvents} />
      </div>

      <LiveAnalytics data={displayAnalytics} />
    </div>
  );
}
