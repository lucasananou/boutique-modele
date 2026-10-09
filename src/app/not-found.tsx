import Link from "next/link";
import { headers } from "next/headers";
import { brand } from "@/lib/brand";
import { localizedPath, type Locale } from "@/lib/i18n";

export const metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

const copyByLocale = {
  fr: {
    eyebrow: "Erreur 404",
    title: "Cette page s'est égarée",
    body: "La page que vous cherchez n'existe pas ou a été déplacée. Laissez-vous plutôt guider vers nos créations.",
    home: "Retour à l'accueil",
    help: "Besoin d'aide ?",
    links: [
      { href: "/boutique", label: "La boutique" },
      { href: "/collections", label: "Les collections" },
      { href: "/recherche", label: "Rechercher" },
      { href: "/la-maison", label: "La Maison" },
    ],
  },
  en: {
    eyebrow: "Error 404",
    title: "This page wandered off",
    body: "The page you are looking for does not exist or has moved. Let us guide you back to our pieces instead.",
    home: "Back to home",
    help: "Need help?",
    links: [
      { href: "/boutique", label: "Shop" },
      { href: "/collections", label: "Collections" },
      { href: "/recherche", label: "Search" },
      { href: "/la-maison", label: "The House" },
    ],
  },
  he: {
    eyebrow: "שגיאה 404",
    title: "העמוד הזה הלך לאיבוד",
    body: "העמוד שחיפשת לא קיים או הועבר. בואי נחזיר אותך אל הפריטים שלנו.",
    home: "חזרה לעמוד הבית",
    help: "צריכה עזרה?",
    links: [
      { href: "/boutique", label: "חנות" },
      { href: "/collections", label: "קולקציות" },
      { href: "/recherche", label: "חיפוש" },
      { href: "/la-maison", label: "הבית" },
    ],
  },
} satisfies Record<Locale, {
  eyebrow: string;
  title: string;
  body: string;
  home: string;
  help: string;
  links: { href: string; label: string }[];
}>;

export default async function NotFound() {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const copy = copyByLocale[locale];
  return (
    <div className="bg-ivory text-ink min-h-screen flex flex-col">
      {/* En-tête minimal brandé */}
      <header className="px-6 md:px-16 h-[76px] flex items-center justify-center border-b border-ink/8">
        <Link
          href="/"
          className="font-serif text-[24px] font-medium tracking-[0.34em] text-ink"
          style={{ paddingLeft: "0.34em" }}
        >
          {brand.name}
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-24 text-center">
        <div className="max-w-[560px]">
          <div className="eyebrow mb-5">{copy.eyebrow}</div>
          <h1 className="font-serif font-normal text-[40px] md:text-[56px] leading-[1.05] text-ink mb-6">
            {copy.title}
          </h1>
          <p className="font-sans text-[15px] leading-[1.8] text-warm-700 mb-10">
            {copy.body}
          </p>

          <Link
            href={localizedPath("/", locale)}
            className="inline-block font-sans text-[13px] tracking-[0.08em] uppercase text-ivory-light bg-ink px-7 py-4 rounded-xs hover:bg-champagne transition-colors"
          >
            {copy.home}
          </Link>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-12 pt-10 border-t border-ink/10">
            {copy.links.map((l) => (
              <Link
                key={l.href}
                href={localizedPath(l.href, locale)}
                className="font-sans text-[14px] text-warm-700 hover:text-champagne transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <p className="font-sans text-[12px] text-warm-500 mt-12">
            {copy.help} {brand.contact.phone} · {brand.contact.email}
          </p>
        </div>
      </main>
    </div>
  );
}
