import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { sendChatReply } from "@/lib/email";

const ONLINE_MS = 30_000;

async function isAdmin() {
  const session = await auth();
  return isAdminSession(session);
}

/** Admin : messages d'une conversation (poll). Ouvrir = marquer lu côté admin. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const after = new URL(req.url).searchParams.get("after");

  const conv = await prisma.chatConversation.findUnique({ where: { id } });
  if (!conv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const messages = await prisma.chatMessage.findMany({
    where: {
      conversationId: id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  if (conv.adminUnread > 0) {
    await prisma.chatConversation.update({
      where: { id },
      data: { adminUnread: 0 },
    });
  }

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      body: m.body,
      at: m.createdAt.toISOString(),
    })),
    email: conv.email,
    name: conv.name,
    status: conv.status,
    online: Date.now() - conv.visitorSeenAt.getTime() < ONLINE_MS,
  });
}

const replySchema = z.object({ body: z.string().min(1).max(2000) });

/** Admin : répondre. Notifie la visiteuse par e-mail si elle est hors-ligne. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const conv = await prisma.chatConversation.findUnique({ where: { id } });
  if (!conv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const parsed = replySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide" }, { status: 422 });
  }
  const text = parsed.data.body.trim();
  if (!text) return NextResponse.json({ error: "Message vide" }, { status: 422 });

  const msg = await prisma.chatMessage.create({
    data: { conversationId: id, sender: "ADMIN", body: text },
  });
  await prisma.chatConversation.update({
    where: { id },
    data: {
      visitorUnread: { increment: 1 },
      adminUnread: 0,
      lastMessageAt: new Date(),
      status: "open",
    },
  });

  // E-mail à la visiteuse si elle a laissé son adresse ET a quitté le site
  // (débounce : au plus un e-mail toutes les 2 min pour une rafale de réponses).
  const now = Date.now();
  const offline = now - conv.visitorSeenAt.getTime() > ONLINE_MS;
  const notifStale =
    !conv.lastNotifiedAt || now - conv.lastNotifiedAt.getTime() > 2 * 60_000;
  if (conv.email && offline && notifStale) {
    await sendChatReply(conv.email, text, conv.name);
    await prisma.chatConversation.update({
      where: { id },
      data: { lastNotifiedAt: new Date() },
    });
  }

  return NextResponse.json({
    message: {
      id: msg.id,
      sender: "ADMIN",
      body: msg.body,
      at: msg.createdAt.toISOString(),
    },
  });
}
