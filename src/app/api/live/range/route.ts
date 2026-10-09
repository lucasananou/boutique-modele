import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { getRangeSnapshot } from "@/lib/live/range";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!(await isAdminSession(session))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : null;
  const to = toParam ? new Date(toParam) : new Date();

  if (!from || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  try {
    const snapshot = await getRangeSnapshot(from, to);
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[live:range]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
