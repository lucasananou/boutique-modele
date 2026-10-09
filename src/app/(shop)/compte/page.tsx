import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { AccountNav } from "@/components/account/AccountNav";
import { headers } from "next/headers";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  return { title: t(locale).account.metaTitle };
}

export default async function ComptePage() {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const session = await auth();
  if (!session?.user) redirect(localizedPath("/compte/connexion", locale));
  const copy = t(locale);
  const admin = await isAdminSession(session);

  const orderCount = await prisma.order.count({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email ?? "" },
      ],
    },
  });

  return (
    <div className="px-6 md:px-16 py-12 md:py-16">
      <header className="mb-10">
        <div className="eyebrow mb-3">{copy.account.space}</div>
        <h1 className="font-serif font-normal text-[36px] md:text-[44px] text-ink">
          {copy.account.hello} {session.user.name ?? ""}
        </h1>
      </header>

      {admin && (
        <Link
          href="/admin"
          className="flex items-center justify-between gap-4 mb-8 bg-ink text-ivory-light rounded-md px-6 py-5 hover:bg-champagne transition-colors"
        >
          <div>
            <div className="font-sans text-[11px] tracking-[0.18em] uppercase text-champagne-light mb-1">
              {copy.account.adminSpace}
            </div>
            <div className="font-serif text-[20px]">{copy.account.adminCta}</div>
          </div>
          <span className="font-sans text-[24px]">→</span>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-16">
        <AccountNav active="compte" locale={locale} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card
            href={localizedPath("/compte/commandes", locale)}
            title={copy.account.orders}
            value={`${orderCount} ${orderCount > 1 ? copy.account.orderPlural : copy.account.orderSingular}`}
            hint={copy.account.ordersHint}
          />
          <Card
            href={localizedPath("/compte/favoris", locale)}
            title={copy.account.favorites}
            value={copy.account.favoritesValue}
            hint={copy.account.favoritesHint}
          />
          <Card
            href={localizedPath("/rendez-vous", locale)}
            title={copy.account.contact}
            value={copy.account.contactValue}
            hint={copy.account.contactHint}
          />
          <Card
            href={localizedPath("/boutique", locale)}
            title={copy.account.shop}
            value={copy.account.shopValue}
            hint={copy.account.shopHint}
          />
        </div>
      </div>
    </div>
  );
}

function Card({
  href,
  title,
  value,
  hint,
}: {
  href: string;
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-ivory-light border border-ink/10 rounded-md p-6 hover:border-champagne transition-colors"
    >
      <div className="eyebrow mb-3">{title}</div>
      <div className="font-serif text-[20px] text-ink mb-1.5">{value}</div>
      <div className="font-sans text-[13px] text-warm-500">{hint}</div>
    </Link>
  );
}
