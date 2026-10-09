import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { getTopbarSnapshot, type TopbarPeriod } from "@/lib/live/topbar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PERIODS: TopbarPeriod[] = ["today", "7d", "30d"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!(await isAdminSession(session))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("period");
  const period = PERIODS.includes(raw as TopbarPeriod) ? (raw as TopbarPeriod) : "today";

  try {
    return NextResponse.json(await getTopbarSnapshot(period), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[live:topbar]", err);
    return NextResponse.json({ error: "snapshot_failed" }, { status: 500 });
  }
}
