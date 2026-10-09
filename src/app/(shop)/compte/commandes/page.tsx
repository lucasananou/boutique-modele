import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { carrierLabel, trackingLink } from "@/lib/carriers";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency";
import { AccountNav } from "@/components/account/AccountNav";
import { headers } from "next/headers";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  return { title: t(locale).account.ordersMetaTitle };
}

export default async function CommandesPage() {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const copy = t(locale);
  const session = await auth();
  if (!session?.user) redirect(localizedPath("/compte/connexion", locale));
  const statusLabel: Record<string, string> = {
    PENDING: copy.account.statusPending,
    PAID: copy.account.statusPaid,
    SHIPPED: copy.account.statusShipped,
    DELIVERED: copy.account.statusDelivered,
    CANCELLED: copy.account.statusCancelled,
    REFUNDED: copy.account.statusRefunded,
  };

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email ?? "" },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-6 md:px-16 py-12 md:py-16">
      <header className="mb-10">
        <div className="eyebrow mb-3">{copy.account.space}</div>
        <h1 className="font-serif font-normal text-[36px] md:text-[44px] text-ink">
          {copy.account.orders}
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-16">
        <AccountNav active="commandes" locale={locale} />

        <div>
          {orders.length === 0 ? (
            <div className="bg-ivory-light border border-ink/10 rounded-md p-10 text-center">
              <p className="font-serif text-[22px] text-ink mb-3">
                {copy.account.noOrders}
              </p>
              <p className="font-sans text-[14px] text-warm-500 mb-7">
                {copy.account.noOrdersHelp}
              </p>
              <Link
                href={localizedPath("/boutique", locale)}
                className="font-sans text-[13px] uppercase tracking-[0.08em] text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
              >
                {copy.cart.discoverShop}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-ivory-light border border-ink/10 rounded-md p-6"
                >
                  <div className="flex flex-wrap justify-between items-baseline gap-3 pb-4 mb-4 border-b border-ink/8">
                    <div>
                      <div className="font-serif text-[18px] text-ink">
                        {order.reference}
                      </div>
                      <div className="font-sans text-[12px] text-warm-500 mt-0.5">
                        {order.createdAt.toLocaleDateString(locale === "he" ? "he-IL" : locale === "en" ? "en-US" : "fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <span className="font-sans text-[11px] tracking-[0.12em] uppercase text-champagne bg-champagne/10 px-3 py-1.5 rounded-xs">
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between gap-4 font-sans text-[14px]"
                      >
                        <span className="text-warm-700">
                          {item.name}
                          {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                          <span className="text-warm-500"> × {item.quantity}</span>
                        </span>
                        <span className="text-ink whitespace-nowrap">
                          {formatMoney(item.unitPrice * item.quantity, order.currency, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {order.trackingNumber && (order.status === "SHIPPED" || order.status === "DELIVERED") && (
                    <div className="font-sans text-[13px] text-warm-700 mt-4">
                      {carrierLabel(order.trackingCarrier)} · {order.trackingNumber}
                      {trackingLink(order.trackingCarrier, order.trackingNumber, order.trackingUrl) && (
                        <>
                          {" · "}
                          <a
                            href={trackingLink(order.trackingCarrier, order.trackingNumber, order.trackingUrl)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink border-b border-champagne"
                          >
                            {copy.account.trackParcel}
                          </a>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-4 mt-4 border-t border-ink/8">
                    <span className="font-sans text-[13px] text-warm-500">
                      {copy.common.total}
                    </span>
                    <span className="font-serif text-[18px] text-ink">
                      {formatMoney(order.amountTotal, order.currency, locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
