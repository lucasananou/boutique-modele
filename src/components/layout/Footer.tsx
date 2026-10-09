import Link from "next/link";
import { brand } from "@/lib/brand";
import { footerNav, megaMenu, collectionsNav, seoGuidesNav, navLabel } from "@/lib/nav";
import { Newsletter } from "./Newsletter";
import { Container } from "@/components/ui/Container";
import { InstagramIcon, PinterestIcon } from "@/components/ui/icons";
import { headers } from "next/headers";
import { defaultLocale, localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

const wordmark = brand.name.split(" ")[0];

export async function Footer() {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : defaultLocale;
  const copy = t(locale);
  const label = (value: string) => navLabel(value, locale);
  return (
    <>
      <Newsletter locale={locale} />
      <footer className="bg-ink-deep text-warm-300 pt-[72px] pb-10">
        <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-12 pb-14 border-b border-ink-soft/10">
          <div>
            <Link
              href={localizedPath("/", locale)}
              className="mb-5 inline-block text-center leading-none"
              aria-label={brand.name}
            >
              <span className="font-serif font-semibold text-ivory block text-[26px] tracking-[0.16em]">
                {wordmark.toUpperCase()}
              </span>
              <span
                className="font-sans text-warm-300/70 block"
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.5em",
                  marginTop: "3px",
                  paddingLeft: "0.5em",
                }}
              >
                {brand.citySuffix.toUpperCase()}
              </span>
            </Link>
            <p className="font-sans text-[13.5px] leading-[1.8] text-warm-300/80 mb-6 max-w-[300px]">
              {copy.footer.about} {brand.contact.address.street}, {brand.contact.address.zip}{" "}
              {brand.contact.address.city}.
            </p>
            <div className="flex gap-3">
              <a
                href={brand.social.instagram}
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[38px] h-[38px] border border-ink-soft/20 rounded-full flex items-center justify-center text-warm-300 hover:border-champagne-light hover:text-champagne-light transition-colors"
              >
                <InstagramIcon />
              </a>
              <a
                href={brand.social.pinterest}
                aria-label="Pinterest"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[38px] h-[38px] border border-ink-soft/20 rounded-full flex items-center justify-center text-warm-300 hover:border-champagne-light hover:text-champagne-light transition-colors"
              >
                <PinterestIcon />
              </a>
            </div>
          </div>

          <div>
            <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne-light mb-5">
              {copy.footer.shop}
            </div>
            <div className="flex flex-col gap-[13px]">
              {megaMenu.type.links.map((l) => (
                <Link
                  key={l.href}
                  href={localizedPath(l.href, locale)}
                  className="font-sans text-[13.5px] text-warm-300 hover:text-ivory transition-colors"
                >
                  {label(l.label)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne-light mb-5">
              {copy.footer.collections}
            </div>
            <div className="flex flex-col gap-[13px]">
              {collectionsNav.map((l) => (
                <Link
                  key={l.href}
                  href={localizedPath(l.href, locale)}
                  className="font-sans text-[13.5px] text-warm-300 hover:text-ivory transition-colors"
                >
                  {label(l.label)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne-light mb-5">
              {copy.footer.guides}
            </div>
            <div className="flex flex-col gap-[13px]">
              {seoGuidesNav.map((l) => (
                <Link
                  key={l.href}
                  href={localizedPath(l.href, locale)}
                  className="font-sans text-[13.5px] text-warm-300 hover:text-ivory transition-colors"
                >
                  {label(l.label)}
                </Link>
              ))}
            </div>
          </div>

          {[footerNav.maison, footerNav.services].map((col) => (
            <div key={col.title}>
              <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne-light mb-5">
                {col.title === "La Maison" ? brand.name : copy.footer.guides}
              </div>
              <div className="flex flex-col gap-[13px]">
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    href={localizedPath(l.href, locale)}
                    className="font-sans text-[13.5px] text-warm-300 hover:text-ivory transition-colors"
                  >
                    {label(l.label)}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div>
            <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne-light mb-5">
              {copy.footer.contact}
            </div>
            <div className="flex flex-col gap-[13px] font-sans text-[13.5px] text-warm-300">
              <span>{brand.contact.phone}</span>
              <a href={`mailto:${brand.contact.email}`} className="hover:text-ivory transition-colors">
                {brand.contact.email}
              </a>
              <span className="leading-[1.6]">
                {brand.contact.address.street}
                <br />
                {brand.contact.address.zip} {brand.contact.address.city}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-7">
          <span className="font-sans text-[12px] text-warm-300/60">
            © 2026 {brand.legalName}. {copy.footer.rights}
          </span>
          <div className="flex gap-6">
            {footerNav.legal.map((l) => (
              <Link
                key={l.label}
                href={localizedPath(l.href, locale)}
                className="font-sans text-[12px] text-warm-300/60 hover:text-ivory transition-colors"
              >
                {label(l.label)}
              </Link>
            ))}
          </div>
        </div>
        </Container>
      </footer>
    </>
  );
}
