import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db";

const ONLINE_MS = 30_000;

/**
 * Admin : liste des conversations de chat (ou `?count=1` → total de non-lus
 * pour le badge de la nav).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!(await isAdminSession(session))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("count")) {
    const agg = await prisma.chatConversation.aggregate({
      _sum: { adminUnread: true },
      where: { status: "open" },
    });
    return NextResponse.json({ unread: agg._sum.adminUnread ?? 0 });
  }

  const convos = await prisma.chatConversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const now = Date.now();
  return NextResponse.json({
    conversations: convos.map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      status: c.status,
      adminUnread: c.adminUnread,
      lastMessageAt: c.lastMessageAt.toISOString(),
      preview: c.messages[0]?.body?.slice(0, 90) ?? "",
      lastSender: c.messages[0]?.sender ?? null,
      online: now - c.visitorSeenAt.getTime() < ONLINE_MS,
      page: c.page,
    })),
  });
}
