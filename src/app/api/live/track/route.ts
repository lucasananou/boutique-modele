import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { shouldIgnoreAnalyticsPayload } from "@/lib/analytics/ignore";
import { fetchGeoForIp } from "@/lib/live/geo";
import type { LiveStatus, LiveEventType } from "@/generated/prisma";

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/firefox\//i.test(ua)) return "Firefox";
  return "Autre";
}

const TrackSchema = z.object({
  anonymousId: z.string().min(1).max(64),
  referrer: z.string().max(500).optional(),
  eventType: z.enum([
    "PAGE_VIEW",
    "PRODUCT_VIEW",
    "ADD_TO_CART",
    "REMOVE_FROM_CART",
    "CART_UPDATE",
    "BEGIN_CHECKOUT",
    "PURCHASE",
    "HEARTBEAT",
  ]),
  page: z.string().max(500).optional(),
  productId: z.string().max(64).optional(),
  productName: z.string().max(200).optional(),
  productSlug: z.string().max(200).optional(),
  cartItemsCount: z.number().int().min(0).max(9999).optional(),
  cartValue: z.number().int().min(0).optional(),
  orderValue: z.number().int().min(0).optional(),
  orderRef: z.string().max(32).optional(),
});

function deriveStatus(eventType: string, current: string): LiveStatus {
  switch (eventType) {
    case "ADD_TO_CART":
    case "REMOVE_FROM_CART":
    case "CART_UPDATE":
      return "CART";
    case "BEGIN_CHECKOUT":
      return "CHECKOUT";
    case "PURCHASE":
      return "CONVERTED";
    default:
      return (current === "INACTIVE" ? "BROWSING" : current) as LiveStatus;
  }
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TrackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const data = parsed.data;
    if (shouldIgnoreAnalyticsPayload({ page: data.page, referrer: data.referrer })) {
      return new NextResponse(null, { status: 204 });
    }

    const existing = await prisma.liveSession.findUnique({
      where: { anonymousId: data.anonymousId },
      select: { id: true, status: true },
    });

    const newStatus = deriveStatus(data.eventType, existing?.status ?? "BROWSING");

    // Géolocalisation uniquement à la création (une seule requête ip-api par session)
    let geo: {
      country?: string | null;
      city?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      timezone?: string | null;
    } = {};
    let browser: string | undefined;
    if (!existing) {
      const ip = clientIp(req);
      if (ip) geo = await fetchGeoForIp(ip);
      const ua = req.headers.get("user-agent") ?? "";
      if (ua) browser = parseBrowser(ua);
    }

    const session = await prisma.liveSession.upsert({
      where: { anonymousId: data.anonymousId },
      create: {
        anonymousId: data.anonymousId,
        status: newStatus,
        currentPage: data.page,
        cartItemsCount: data.cartItemsCount ?? 0,
        cartValue: data.cartValue ?? 0,
        orderValue: data.orderValue,
        browser,
        referrer: data.referrer,
        ...geo,
      },
      update: {
        status: newStatus,
        lastSeenAt: new Date(),
        ...(data.page !== undefined && { currentPage: data.page }),
        ...(data.cartItemsCount !== undefined && { cartItemsCount: data.cartItemsCount }),
        ...(data.cartValue !== undefined && { cartValue: data.cartValue }),
        ...(data.orderValue !== undefined && { orderValue: data.orderValue }),
      },
    });

    // Les heartbeats ne créent pas d'événement (trop de bruit dans le feed)
    if (data.eventType !== "HEARTBEAT") {
      await prisma.liveEvent.create({
        data: {
          sessionId: session.id,
          eventType: data.eventType as LiveEventType,
          page: data.page,
          productId: data.productId,
          productName: data.productName,
          productSlug: data.productSlug,
          cartItemsCount: data.cartItemsCount,
          cartValue: data.cartValue,
          orderValue: data.orderValue,
          orderRef: data.orderRef,
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[live:track]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
