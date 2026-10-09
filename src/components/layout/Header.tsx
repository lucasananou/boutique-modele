"use client";

import { useState } from "react";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { localeEnabled } from "@/stores";
import { primaryNav, megaMenu, navLabel } from "@/lib/nav";
import { useCart, selectCount } from "@/lib/store/cart";
import { useFavorites, selectFavCount } from "@/lib/store/favorites";
import { useHasMounted } from "@/lib/useHasMounted";
import { Container } from "@/components/ui/Container";
import { ProductImage } from "@/components/ui/ProductImage";
import { usePathname } from "next/navigation";
import { localeFromPathname, localizedPath, stripLocalePrefix, type Locale } from "@/lib/i18n";
import { crossDomainPath } from "@/lib/domains";
import { Flag } from "@/components/ui/Flag";
import { t } from "@/lib/translations";
import {
  SearchIcon,
  UserIcon,
  HeartIcon,
  BagIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/ui/icons";

const wordmark = brand.name.split(" ")[0];
const languageOptions = ([
  { locale: "fr", label: "Français" },
  { locale: "en", label: "English" },
  { locale: "he", label: "עברית" },
] as { locale: Locale; label: string }[]).filter((option) => localeEnabled(option.locale));
/** Sélecteur masqué quand la boutique ne sert qu'une langue (config.locales). */
const multilingual = languageOptions.length > 1;

function Wordmark({ size = "lg" }: { size?: "lg" | "sm" }) {
  const big = size === "lg";
  return (
    <div className="text-center leading-none">
      <span
        className={[
          "font-serif font-semibold text-ink block",
          big ? "text-[26px] tracking-[0.16em]" : "text-[20px] tracking-[0.14em]",
        ].join(" ")}
      >
        {wordmark.toUpperCase()}
      </span>
      <span
        className="font-sans text-warm-500 block"
        style={{
          fontSize: big ? "9px" : "8px",
          letterSpacing: "0.5em",
          marginTop: "3px",
          paddingLeft: "0.5em",
        }}
      >
        {brand.citySuffix.toUpperCase()}
      </span>
    </div>
  );
}

export function Header({ host }: { host: string | null }) {
  const [mega, setMega] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const openCart = useCart((s) => s.open);
  const cartCount = useCart(selectCount);
  const favCount = useFavorites(selectFavCount);
  const mounted = useHasMounted();
  const pathname = usePathname();
  const locale: Locale = localeFromPathname(pathname);
  const labels = t(locale);
  // Absolu quand la langue vit sur l'autre domaine : sinon le lien pointerait
  // vers une URL que le proxy redirige aussitôt, soit un 301 par changement de
  // langue. L'hôte courant se déduit de la locale courante — le proxy garantit
  // qu'une langue n'est servie que par son domaine — donc pas de lecture de
  // `window`, et aucune divergence d'hydratation.
  const languagePath = (target: Locale) => {
    const path = localizedPath(stripLocalePrefix(pathname), target);
    return crossDomainPath(path, target, host);
  };
  // Libellés traduits : config de la boutique (src/stores/<id>/nav.ts).
  const megaTitle = (title: string) => navLabel(title, locale);

  // Marquee : on duplique la séquence pour une boucle continue.
  const marquee = [...labels.nav.announcements, ...labels.nav.announcements];

  return (
    <header
      className="sticky top-0 z-40"
      onMouseLeave={() => setMega(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setMega(false);
      }}
    >
      {/* Bandeau marquee */}
      <div className="bg-ink text-ink-soft overflow-hidden whitespace-nowrap">
        <div
          className="inline-flex gap-[60px] py-2.5 font-sans text-[12px] tracking-[0.22em] uppercase"
          style={{ animation: "vMarquee 26s linear infinite", willChange: "transform" }}
        >
          {marquee.map((msg, i) => (
            <span key={i} className="flex items-center gap-[60px]">
              {msg}
              <span aria-hidden>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Barre principale */}
      <div className="relative bg-ivory/90 backdrop-blur-md border-b border-sand-soft">
        {/* Desktop */}
        <Container className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center h-[74px]">
          <nav className="flex gap-7 items-center">
            {primaryNav.map((item) => {
              const hasMega = "hasMega" in item && !!item.hasMega;
              return (
                <Link
                  key={item.label}
                  href={localizedPath(item.href, locale)}
                  onMouseEnter={() => setMega(hasMega)}
                  onFocus={() => setMega(hasMega)}
                  {...(hasMega ? { "aria-expanded": mega } : {})}
                  className="font-sans text-[13px] tracking-[0.04em] text-warm-700 hover:text-ink transition-colors py-7"
                >
                  {navLabel(item.label, locale)}
                </Link>
              );
            })}
          </nav>

          <Link href={localizedPath("/", locale)} onMouseEnter={() => setMega(false)}>
            <Wordmark />
          </Link>

          <div className="flex gap-5 items-center justify-end text-warm-700">
            {/* `<a>` et non `<Link>` : changer de langue doit provoquer une
                navigation complète. En navigation client, le layout racine
                n'est pas re-rendu — `lang` et surtout `dir="rtl"` pour l'hébreu
                resteraient figés sur la langue précédente. */}
            {multilingual ? (
            <nav aria-label={labels.nav.language} className="flex gap-1.5">
              {languageOptions.map((option) => (
                <a
                  key={option.locale}
                  href={languagePath(option.locale)}
                  hrefLang={option.locale}
                  aria-label={option.label}
                  aria-current={option.locale === locale ? "true" : undefined}
                  title={option.label}
                  className={[
                    // Soulignement plutôt qu'un cercle : un drapeau est
                    // rectangulaire, l'enfermer dans un rond le déforme.
                    "inline-flex items-center justify-center pb-1 border-b-2 transition-all",
                    option.locale === locale
                      ? "border-ink opacity-100"
                      : "border-transparent opacity-50 hover:opacity-100",
                  ].join(" ")}
                >
                  <Flag locale={option.locale} />
                </a>
              ))}
            </nav>
            ) : null}
            <Link
              href={localizedPath("/recherche", locale)}
              aria-label={labels.nav.search}
              className="hover:text-ink transition-colors flex"
            >
              <SearchIcon />
            </Link>
            <Link
              href={localizedPath("/compte", locale)}
              aria-label={labels.nav.account}
              className="hover:text-ink transition-colors flex"
            >
              <UserIcon />
            </Link>
            <Link
              href={localizedPath("/compte/favoris", locale)}
              aria-label={labels.nav.favorites}
              className="relative hover:text-ink transition-colors flex"
            >
              <HeartIcon />
              {mounted && favCount > 0 && (
                <span className="absolute -top-1 -right-1.5 font-sans text-[10px] text-champagne">
                  {favCount}
                </span>
              )}
            </Link>
            <button
              onClick={openCart}
              aria-label={labels.nav.cart}
              className="relative hover:text-ink transition-colors flex cursor-pointer"
            >
              <BagIcon />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-1 bg-ink text-white rounded-full font-sans text-[10px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </Container>

        {/* Mobile */}
        <div className="md:hidden grid grid-cols-[1fr_auto_1fr] items-center px-[18px] h-[60px]">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            className="justify-self-start text-ink flex cursor-pointer"
          >
            <MenuIcon />
          </button>
          <Link href={localizedPath("/", locale)}>
            <Wordmark size="sm" />
          </Link>
          <div className="flex gap-3.5 justify-self-end text-ink">
            <Link href={localizedPath("/recherche", locale)} aria-label={labels.nav.search} className="flex">
              <SearchIcon />
            </Link>
            <button
              onClick={openCart}
              aria-label={labels.nav.cart}
              className="relative flex cursor-pointer"
            >
              <BagIcon />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-1 bg-ink text-white rounded-full font-sans text-[10px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Méga-menu Boutique — éditorial, pleine largeur */}
        {mega && (
          <div className="absolute left-0 right-0 top-full bg-white border-b border-sand-soft shadow-[0_24px_50px_-30px_rgba(22,19,15,0.35)] animate-fade hidden md:block">
            <Container className="grid grid-cols-[1.5fr_0.9fr_1.1fr] gap-10 lg:gap-12 py-11 lg:py-12">
              {/* Zone 1 — Par catégorie, en tuiles visuelles */}
              <div>
                <div className="eyebrow mb-5">{megaTitle(megaMenu.type.title)}</div>
                <div className="grid grid-cols-3 gap-x-5 gap-y-6">
                  {megaMenu.type.links.map((l) => (
                    <Link key={l.label} href={localizedPath(l.href, locale)} className="group block">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xs bg-sand">
                        <ProductImage
                          src={l.image ?? ""}
                          alt={l.label}
                          className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                          sizes="(max-width: 1240px) 12vw, 150px"
                        />
                      </div>
                      <div className="mt-2.5 font-sans text-[13px] text-warm-700 group-hover:text-ink transition-colors">
                        {navLabel(l.label, locale)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Zone 2 — Colonnes texte affinées : Par tissu + Aide */}
              <div>
                <div className="eyebrow mb-[18px]">{megaTitle(megaMenu.material.title)}</div>
                <div className="flex flex-col gap-[13px]">
                  {megaMenu.material.links.map((l) => (
                    <Link
                      key={l.label}
                      href={localizedPath(l.href, locale)}
                      className="font-sans text-[14px] text-warm-700 hover:text-ink transition-colors"
                    >
                      {navLabel(l.label, locale)}
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-sand-soft my-6" />

                <div className="eyebrow mb-[18px]">{megaTitle(megaMenu.service.title)}</div>
                <div className="flex flex-col gap-[13px]">
                  {megaMenu.service.links.map((l) => (
                    <Link
                      key={l.label}
                      href={localizedPath(l.href, locale)}
                      className="font-sans text-[14px] text-warm-700 hover:text-ink transition-colors"
                    >
                      {navLabel(l.label, locale)}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Zone 3 — Carte éditoriale mise en avant */}
              <Link
                href={localizedPath(megaMenu.featured.href, locale)}
                className="group relative block h-full min-h-[280px] overflow-hidden rounded-xs bg-sand"
              >
                <ProductImage
                  src={megaMenu.featured.image}
                  alt={megaMenu.featured.title}
                  className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  sizes="(max-width: 1240px) 30vw, 340px"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(22,19,15,0.62), rgba(22,19,15,0) 58%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="font-sans text-[11px] tracking-[0.28em] uppercase text-champagne-light mb-2">
                    {labels.nav.nouveautes}
                  </div>
                  <div className="font-serif text-[26px] leading-none text-ivory mb-2.5">
                    {megaMenu.featured.title}
                  </div>
                  <span className="font-sans text-[13px] tracking-[0.04em] text-ivory-light group-hover:text-champagne-light transition-colors">
                    {labels.common.discover} →
                  </span>
                </div>
              </Link>
            </Container>
          </div>
        )}
      </div>

      {mobileOpen && <MobileMenu locale={locale} currentPath={pathname} host={host} onClose={() => setMobileOpen(false)} />}
    </header>
  );
}

function MobileMenu({
  locale,
  currentPath,
  host,
  onClose,
}: {
  locale: Locale;
  currentPath: string;
  host: string | null;
  onClose: () => void;
}) {
  const labels = t(locale);
  const languagePath = (target: Locale) =>
    crossDomainPath(localizedPath(stripLocalePrefix(currentPath), target), target, host);
  return (
    <div className="fixed inset-0 z-50 bg-ivory md:hidden animate-fade overflow-y-auto">
      <div className="flex items-center justify-between px-[18px] h-[60px] border-b border-sand-soft">
        <Wordmark size="sm" />
        <button
          onClick={onClose}
          aria-label={labels.nav.close}
          className="text-ink flex cursor-pointer"
        >
          <CloseIcon />
        </button>
      </div>
      <nav className="px-6 py-8 flex flex-col gap-6" onClick={onClose}>
        {primaryNav.map((item) => (
          <Link
            key={item.label}
            href={localizedPath(item.href, locale)}
            className="font-serif text-[26px] text-ink"
          >
            {navLabel(item.label, locale)}
          </Link>
        ))}
        <div className="h-px bg-sand-soft my-2" />
        <div className="eyebrow">{labels.catalog.category}</div>
        {megaMenu.type.links.map((l) => (
          <Link
            key={l.label}
            href={localizedPath(l.href, locale)}
            className="font-sans text-[15px] text-warm-700"
          >
            {navLabel(l.label, locale)}
          </Link>
        ))}
        <div className="h-px bg-sand-soft my-2" />
        {multilingual ? (
        <div>
          <div className="eyebrow mb-3">{labels.nav.language}</div>
          <div className="flex gap-2">
            {/* Navigation complète également ici — voir le sélecteur desktop. */}
            {languageOptions.map((option) => (
              <a
                key={option.locale}
                href={languagePath(option.locale)}
                hrefLang={option.locale}
                aria-label={option.label}
                aria-current={option.locale === locale ? "true" : undefined}
                title={option.label}
                className={[
                  "inline-flex items-center justify-center pb-1.5 border-b-2 transition-all",
                  option.locale === locale
                    ? "border-ink opacity-100"
                    : "border-transparent opacity-50 hover:opacity-100",
                ].join(" ")}
              >
                <Flag locale={option.locale} className="w-[28px] h-[20px]" />
              </a>
            ))}
          </div>
        </div>
        ) : null}
        <div className="h-px bg-sand-soft my-2" />
        <Link href={localizedPath("/compte", locale)} className="font-sans text-[15px] text-warm-700">
          {labels.nav.myAccount}
        </Link>
        <Link href={localizedPath("/compte/favoris", locale)} className="font-sans text-[15px] text-warm-700">
          {labels.nav.myFavorites}
        </Link>
        <Link href={localizedPath("/guide-des-tailles", locale)} className="font-sans text-[15px] text-warm-700">
          {labels.nav.sizeGuide}
        </Link>
      </nav>
    </div>
  );
}
