import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendAdminChatMessage } from "@/lib/email";

const MAX_LEN = 2000;

const schema = z.object({
  type: z.enum(["open", "send", "email"]),
  token: z.string().optional(),
  body: z.string().max(MAX_LEN).optional(),
  email: z.string().email().optional(),
  name: z.string().max(120).optional(),
  page: z.string().max(300).optional(),
});

function pub(m: { id: string; sender: string; body: string; createdAt: Date }) {
  return {
    id: m.id,
    sender: m.sender,
    body: m.body,
    at: m.createdAt.toISOString(),
  };
}

async function convByToken(token?: string) {
  if (!token) return null;
  return prisma.chatConversation.findUnique({ where: { token } });
}

/**
 * Chat visiteuse : ouvrir/reprendre une conversation, envoyer un message,
 * laisser son e-mail pour une réponse différée. Conversation anonyme identifiée
 * par un jeton (stocké en localStorage côté widget).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`chat:${ip}`, { limit: 25, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de messages — réessayez dans un instant." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 422 });
  }
  const { type, token, page } = parsed.data;
  const ua = req.headers.get("user-agent")?.slice(0, 300) ?? null;

  let conv = await convByToken(token);

  // Ouvrir / reprendre.
  if (type === "open") {
    if (!conv) {
      conv = await prisma.chatConversation.create({
        data: { page: page ?? null, userAgent: ua },
      });
    } else {
      await prisma.chatConversation.update({
        where: { id: conv.id },
        data: { visitorSeenAt: new Date(), visitorUnread: 0 },
      });
    }
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return NextResponse.json({
      token: conv.token,
      email: conv.email,
      messages: messages.map(pub),
    });
  }

  if (!conv) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  // Laisser son e-mail (réponse différée).
  if (type === "email") {
    const email = parsed.data.email;
    if (!email) return NextResponse.json({ error: "E-mail requis" }, { status: 422 });
    await prisma.chatConversation.update({
      where: { id: conv.id },
      data: {
        email: email.toLowerCase().trim(),
        name: parsed.data.name?.trim() || conv.name,
      },
    });
    return NextResponse.json({ ok: true });
  }

  // Envoyer un message.
  const text = (parsed.data.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Message vide" }, { status: 422 });
  const msg = await prisma.chatMessage.create({
    data: {
      conversationId: conv.id,
      sender: "VISITOR",
      body: text.slice(0, MAX_LEN),
    },
  });
  await prisma.chatConversation.update({
    where: { id: conv.id },
    data: {
      adminUnread: { increment: 1 },
      lastMessageAt: new Date(),
      visitorSeenAt: new Date(),
      status: "open",
    },
  });
  // Alerte e-mail à l'équipe au premier message non lu (pas à chaque message).
  if (conv.adminUnread === 0) {
    await sendAdminChatMessage({ body: msg.body, email: conv.email, page: conv.page });
  }
  return NextResponse.json({ message: pub(msg) });
}

/** Polling visiteuse : messages postérieurs à `after` (réponses de l'admin). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? undefined;
  const after = url.searchParams.get("after");

  const conv = await convByToken(token);
  if (!conv) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      conversationId: conv.id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Présence + reset des non-lus côté visiteuse.
  await prisma.chatConversation.update({
    where: { id: conv.id },
    data: { visitorSeenAt: new Date(), visitorUnread: 0 },
  });

  return NextResponse.json({ messages: messages.map(pub), status: conv.status });
}
