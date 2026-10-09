import type { Metadata, Viewport } from "next";
import { brand } from "@/lib/brand";
import { store, themeCss } from "@/stores";
import { requestOrigin } from "@/lib/site";
import { organizationLd, websiteLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { LiveTracker } from "@/components/live/LiveTracker";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { headers } from "next/headers";
import { defaultLocale, localeConfig, localizedPath, type Locale } from "@/lib/i18n";
import { fontVariables } from "@/stores/current-fonts";
import "./globals.css";

const siteMetadata: Record<Locale, { tagline: string; description: string; ogLocale: string }> = {
  fr: {
    tagline: brand.tagline,
    description: brand.manifesto,
    ogLocale: "fr_FR",
  },
  en: { ...brand.localizedMeta.en, ogLocale: "en_US" },
  he: { ...brand.localizedMeta.he, ogLocale: "he_IL" },
};

export async function generateMetadata(): Promise<Metadata> {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : defaultLocale;
  const copy = siteMetadata[locale];
  // Origine réelle de la requête : c'est elle qui résout tous les `canonical`
  // relatifs déclarés par les pages. Une constante de build renverrait les
  // canonicals du `.fr` sur le domaine international.
  const origin = await requestOrigin();

  return {
    metadataBase: new URL(origin),
    title: {
      default: `${brand.name} — ${copy.tagline}`,
      template: `%s — ${brand.name}`,
    },
    description: copy.description,
    openGraph: {
      title: `${brand.name} — ${copy.tagline}`,
      description: copy.description,
      url: `${origin}${localizedPath("/", locale)}`,
      siteName: brand.name,
      locale: copy.ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand.name} — ${copy.tagline}`,
      description: copy.description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: store.theme.colors.ink ?? "#16130f",
};

// Couleurs de la boutique (config) appliquées aux tokens de globals.css.
const storeThemeCss = themeCss();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : defaultLocale;
  const config = localeConfig[locale];
  // Déclaré ici et pas seulement dans generateMetadata : c'est une autre
  // fonction. Attention, `origin` existe comme global navigateur, donc une
  // référence non déclarée passe le typecheck et n'échoue qu'à l'exécution.
  const origin = await requestOrigin();
  return (
    <html
      lang={config.htmlLang}
      dir={config.dir}
      className={`${fontVariables} h-full antialiased`}
    >
      <head>
        {storeThemeCss && (
          <style id="store-theme" dangerouslySetInnerHTML={{ __html: storeThemeCss }} />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <ConsentProvider>
          <GoogleAnalytics />
          <LiveTracker />
          <JsonLd data={[organizationLd(origin), websiteLd(origin)]} />
          {children}
          {/* Sans ce bandeau, aucune visiteuse ne peut donner son consentement :
              la mesure d'audience reste alors définitivement muette (constaté du
              10 au 13 août, 0 nouvelle session enregistrée). */}
          <CookieBanner locale={locale} />
        </ConsentProvider>
      </body>
    </html>
  );
}
