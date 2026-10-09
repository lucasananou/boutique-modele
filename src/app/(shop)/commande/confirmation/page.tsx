import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { stripe, isStripeLive } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatMoney } from "@/lib/currency";
import { brand } from "@/lib/brand";
import { ClearCart } from "@/components/cart/ClearCart";
import { TrackPurchase } from "@/components/analytics/EcommerceTrackers";
import {
  PackageUpsell,
  type UpsellItem,
} from "@/components/checkout/PackageUpsell";
import { localeConfig, localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import type { OrderStatus } from "@/generated/prisma";

async function readLocale(): Promise<Locale> {
  const header = (await headers()).get("x-store-locale");
  return header === "en" || header === "he" ? header : "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocale();
  return { title: t(locale).confirmation.metaTitle, robots: { index: false } };
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; token?: string; payment_intent?: string }>;
}) {
  const { ref, token } = await searchParams;
  if (!ref) notFound();
  const locale = await readLocale();
  const copy = t(locale);

  const found = await prisma.order.findUnique({
    where: { reference: ref },
    include: { items: true },
  });
  if (!found) notFound();
  let order = found;

  // Anti-énumération : accès réservé au porteur du jeton opaque
  // OU au client connecté propriétaire de la commande.
  const session = await auth();
  const ownsByToken = Boolean(token && order.confirmToken === token);
  const ownsBySession =
    Boolean(session?.user?.id && order.userId === session.user.id) ||
    Boolean(
      session?.user?.email &&
        order.email.toLowerCase() === session.user.email.toLowerCase(),
    );
  if (!ownsByToken && !ownsBySession) notFound();

  // Repli : la cliente peut arriver ici avant que le webhook Stripe ne soit
  // livré. On interroge alors le PaymentIntent pour confirmer nous-mêmes.
  // `markOrderPaid` est idempotent : le webhook qui arrivera ensuite ne fera
  // ni double décrément de stock ni second e-mail.
  if (order.status === "PENDING" && isStripeLive && stripe && order.stripePaymentIntent) {
    try {
      const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntent);
      if (intent.status === "succeeded" && intent.amount_received === order.amountTotal) {
        await markOrderPaid(order.id, {
          paymentIntent: intent.id,
          locale: order.locale as Locale,
        });
        const refreshed = await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        });
        if (refreshed) order = refreshed;
      }
    } catch (e) {
      console.error(`[confirmation] PaymentIntent illisible pour ${ref}:`, e);
    }
  }

  const paid = order.status !== "PENDING" && order.status !== "CANCELLED";
  const firstName = order.shippingName?.trim().split(/\s+/)[0] ?? "";
  const ordered = new Set(order.items.map((i) => i.slug));

  // `OrderItem` ne stocke pas de visuel (le prix et le nom sont figés à
  // l'achat, l'image non). On les récupère par slug : une pièce retirée du
  // catalogue reste retrouvable, et à défaut `ProductImage` affiche son
  // placeholder. La variante commandée prime sur le visuel principal.
  const visuals = new Map(
    await Promise.all(
      [...ordered].map(
        async (slug) => [slug, await getProductBySlug(slug, locale)] as const,
      ),
    ),
  );

  function imageFor(slug: string, variantId: string | null, name: string) {
    const product = visuals.get(slug);
    const image =
      product?.images.find((i) => variantId && i.variantId === variantId) ??
      product?.images[0];
    return { src: image?.src ?? "", alt: image?.alt ?? name };
  }

  // Suggestions du bandeau « même colis » : trois pièces hors commande.
  const catalogue = await getAllProducts(locale);
  const upsells: UpsellItem[] = catalogue
    .filter((p) => !ordered.has(p.slug) && p.inStock)
    .slice(0, 3)
    .map((p) => ({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      materialLabel: p.materialLabel,
      price: p.price,
      image: { src: p.images[0]?.src ?? "", alt: p.images[0]?.alt ?? p.name },
    }));

  return (
    <div className="pb-16 md:pb-24">
      <ClearCart />
      <TrackPurchase
        id={order.reference}
        valueCents={order.amountTotal}
        currency={order.currency}
        items={order.items.map((i) => ({
          slug: i.slug,
          name: i.name,
          priceCents: i.unitPrice,
          quantity: i.quantity,
          variantLabel: i.variantLabel ?? undefined,
        }))}
      />

      <div className="px-6 md:px-11 pt-16 text-center max-w-[680px] mx-auto">
        <div className="eyebrow mb-[22px]">{copy.confirmation.confirmed}</div>
        <h1 className="font-serif font-normal text-[36px] md:text-[44px] leading-[1.15] text-ink mb-[18px] text-pretty">
          {firstName
            ? copy.confirmation.titleNamed.replace("{name}", firstName)
            : copy.confirmation.title}
        </h1>
        <p className="font-sans text-[16px] leading-[1.7] text-warm-700">
          {copy.confirmation.orderNumber}&nbsp;
          <span className="text-ink tracking-[0.06em]">{order.reference}</span> ·{" "}
          {copy.confirmation.emailSent} <span className="text-ink">{order.email}</span>
        </p>
      </div>

      <div className="px-6 md:px-11 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-12 lg:gap-16 pt-13 max-w-[1000px] mx-auto">
        <div>
          <Timeline status={order.status} labels={copy.confirmation.steps} paid={paid} />

          <div className="eyebrow mb-[18px] mt-[38px]">{copy.confirmation.order}</div>
          <div className="grid gap-4 border-t border-ink/12 pt-[18px]">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3.5 items-center">
                <div className="relative w-[52px] aspect-[3/4] shrink-0 overflow-hidden">
                  <ProductImage {...imageFor(item.slug, item.variantId, item.name)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-[15px] leading-[1.4] text-ink">
                    {item.name}
                  </div>
                  <div className="font-sans text-[12px] leading-[1.5] text-warm-500 mt-[3px]">
                    {item.variantLabel ? `${item.variantLabel} · ` : ""}
                    {copy.confirmation.quantity} {item.quantity}
                  </div>
                </div>
                <div className="font-sans text-[15px] text-ink whitespace-nowrap">
                  {formatMoney(item.unitPrice * item.quantity, order.currency, locale)}
                </div>
              </div>
            ))}
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between mt-[18px] font-sans text-[14px] text-champagne">
              <span>
                {copy.checkout.discount}
                {order.discountCode ? ` · ${order.discountCode}` : ""}
              </span>
              <span>−{formatMoney(order.discountAmount, order.currency, locale)}</span>
            </div>
          )}

          <div className="mt-[22px] pt-[18px] border-t border-ink/12 flex justify-between items-baseline">
            <span className="font-serif text-[18px] text-ink">
              {copy.confirmation.totalPaid}
            </span>
            <span className="font-serif text-[22px] text-ink">
              {formatMoney(order.amountTotal, order.currency, locale)}
            </span>
          </div>

          {order.giftWrap && (
            <p className="font-sans text-[12.5px] text-champagne mt-4">
              {copy.confirmation.gift}
            </p>
          )}
        </div>

        <aside>
          <div className="bg-ivory-light p-[26px]">
            <div className="eyebrow mb-4">{copy.confirmation.delivery}</div>
            <div className="font-sans text-[15px] leading-[1.8] text-warm-700">
              {order.shippingName}
              <br />
              {order.shippingLine1}
              <br />
              {order.shippingZip} {order.shippingCity}
              {order.shippingCountry ? `, ${order.shippingCountry}` : ""}
            </div>
            <div className="font-sans text-[14px] leading-[1.7] text-warm-500 mt-4 pt-4 border-t border-ink/12">
              {copy.checkout.freeShippingLabel}
              <br />
              <span className="text-ink">
                {copy.confirmation.estimated}{" "}
                {estimatedWindow(order.createdAt, locale)}
              </span>
            </div>
            <Link
              href={localizedPath("/compte/commandes", locale)}
              className="block mt-5 border border-ink text-center py-3.5 font-sans text-[12px] tracking-[0.08em] uppercase text-ink hover:bg-ink hover:text-ivory-light transition-colors"
            >
              {copy.confirmation.track}
            </Link>
          </div>
          <p className="font-sans text-[13px] leading-[1.7] text-warm-500 mt-5">
            {copy.confirmation.contactNote}
          </p>
        </aside>
      </div>

      <PackageUpsell items={upsells} locale={locale} copy={copy} />

      <div className="px-6 md:px-11 max-w-[1000px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 pt-[30px] font-sans text-[13px] leading-[1.6] text-warm-500">
        <span>{copy.confirmation.accountPrompt}</span>
        <Link
          href={localizedPath("/boutique", locale)}
          className="text-ink underline underline-offset-[3px] hover:text-champagne transition-colors"
        >
          {copy.cart.continueShopping}
        </Link>
      </div>

      <p className="px-6 md:px-11 text-center font-sans text-[12px] text-warm-500 mt-10">
        {copy.confirmation.question} {brand.contact.phone} · {brand.contact.email}
      </p>
    </div>
  );
}

/**
 * Suivi visuel en quatre temps. « En préparation » n'a pas de statut dédié en
 * base : une commande payée reste sur « Confirmée » jusqu'à son expédition.
 */
function stageOf(status: OrderStatus, paid: boolean): number {
  if (!paid) return -1;
  if (status === "DELIVERED") return 3;
  if (status === "SHIPPED") return 2;
  return 0;
}

function Timeline({
  status,
  labels,
  paid,
}: {
  status: OrderStatus;
  labels: readonly string[];
  paid: boolean;
}) {
  const current = stageOf(status, paid);

  return (
    <div>
      <div className="flex items-center">
        {labels.map((label, i) => (
          <div key={label} className="contents">
            {i > 0 && (
              <span
                className={["h-px flex-1", i <= current ? "bg-champagne" : "bg-ink/16"].join(
                  " ",
                )}
              />
            )}
            <span
              className={[
                "w-[9px] h-[9px] rounded-full shrink-0",
                i <= current ? "bg-champagne" : "border border-ink/30",
              ].join(" ")}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between font-sans text-[12px] leading-[1.5] text-warm-500 mt-3">
        {labels.map((label, i) => (
          <span key={label} className={i === current ? "text-ink" : ""}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Fenêtre de livraison indicative : J+2 à J+5 après la commande. */
function estimatedWindow(createdAt: Date, locale: Locale): string {
  const format = new Intl.DateTimeFormat(localeConfig[locale].intlLocale, {
    day: "numeric",
    month: "long",
  });
  const from = new Date(createdAt.getTime() + 2 * 86_400_000);
  const to = new Date(createdAt.getTime() + 5 * 86_400_000);
  return format.formatRange(from, to);
}
