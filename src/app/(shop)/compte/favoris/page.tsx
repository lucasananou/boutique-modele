import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllProducts } from "@/lib/products";
import { AccountNav } from "@/components/account/AccountNav";
import { FavoritesGrid } from "@/components/account/FavoritesGrid";
import { headers } from "next/headers";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  return { title: t(locale).account.favoritesMetaTitle };
}

export default async function FavorisPage() {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const copy = t(locale);
  const session = await auth();
  if (!session?.user) redirect(localizedPath("/compte/connexion", locale));
  const catalog = await getAllProducts(locale);

  return (
    <div className="px-6 md:px-16 py-12 md:py-16">
      <header className="mb-10">
        <div className="eyebrow mb-3">{copy.account.space}</div>
        <h1 className="font-serif font-normal text-[36px] md:text-[44px] text-ink">
          {copy.account.favorites}
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-16">
        <AccountNav active="favoris" locale={locale} />
        <FavoritesGrid catalog={catalog} locale={locale} />
      </div>
    </div>
  );
}
