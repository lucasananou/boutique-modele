import type { Product } from "@/lib/types";
import { brand } from "@/lib/brand";
import { siteUrl, absoluteUrl } from "@/lib/site";
import { store } from "@/stores";

/** Données structurées Organization (injectées globalement). */
export function organizationLd(origin: string = siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.legalName,
    alternateName: brand.name,
    url: origin,
    // logo: à ajouter quand un asset logo (PNG/JPG) sera fourni par le client.
    email: brand.contact.email,
    telephone: brand.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.contact.address.street,
      postalCode: brand.contact.address.zip,
      addressLocality: brand.contact.address.city,
      addressCountry: store.commerce.country,
    },
    hasMerchantReturnPolicy: merchantReturnPolicyLd(),
    sameAs: [brand.social.instagram, brand.social.pinterest].filter(Boolean),
  };
}

/** Données structurées WebSite. */
export function websiteLd(origin: string = siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: origin,
    inLanguage: "fr-FR",
  };
}

/** Données structurées Product + Offer pour une fiche produit. */
export function productLd(product: Product, origin: string = siteUrl) {
  const image = product.images
    .map((i) => i.src)
    .filter(Boolean)
    .map((src) => (src.startsWith("http") ? src : absoluteUrl(src, origin)));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteUrl(`/produit/${product.slug}#product`, origin),
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    ...(image.length ? { image } : {}),
    brand: { "@type": "Brand", name: brand.name },
    category: product.categoryName,
    material: product.materialLabel || product.materials.join(", "),
    offers: {
      "@type": "Offer",
      "@id": absoluteUrl(`/produit/${product.slug}#offer`, origin),
      url: absoluteUrl(`/produit/${product.slug}`, origin),
      priceCurrency: brand.currency,
      price: (product.price / 100).toFixed(2),
      priceValidUntil: `${new Date().getFullYear()}-12-31`,
      itemCondition: "https://schema.org/NewCondition",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: brand.legalName },
      shippingDetails: shippingDetailsLd(),
      hasMerchantReturnPolicy: merchantReturnPolicyLd(),
    },
  };
}

/** Politique de retour marchande, réutilisée par Organization et Offer. */
function merchantReturnPolicyLd() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: store.commerce.country,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: store.commerce.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: store.commerce.freeReturns
      ? "https://schema.org/FreeReturn"
      : "https://schema.org/ReturnShippingFees",
  };
}

/** Livraison annoncée (pays et délais : config boutique, `commerce`). */
function shippingDetailsLd() {
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: store.commerce.country,
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: store.commerce.handlingDays[0],
        maxValue: store.commerce.handlingDays[1],
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: store.commerce.transitDays[0],
        maxValue: store.commerce.transitDays[1],
        unitCode: "DAY",
      },
    },
  };
}

/** Données structurées ItemList (listing catégorie/collection/boutique). */
export function itemListLd(
  products: { slug: string; name: string }[],
  origin: string = siteUrl,
  limit = 30,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: products.length,
    itemListElement: products.slice(0, limit).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/produit/${p.slug}`, origin),
      name: p.name,
    })),
  };
}

/** Données structurées Article (blog / journal). */
export function articleLd(a: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  author?: string;
  language?: string;
  /** Dates ISO (E-E-A-T : signaux de fraîcheur sur un sujet prescriptif). */
  datePublished?: string;
  dateModified?: string;
}, origin: string = siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    ...(a.image ? { image: [a.image] } : {}),
    inLanguage: a.language ?? "fr-FR",
    author: { "@type": "Organization", name: a.author ?? brand.legalName },
    publisher: { "@type": "Organization", name: brand.legalName },
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    mainEntityOfPage: absoluteUrl(`/${a.slug}`, origin),
  };
}

/** Données structurées FAQPage (rich snippet FAQ). */
export function faqPageLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Données structurées BreadcrumbList (fil d'Ariane). */
export function breadcrumbLd(
  items: { name: string; path: string }[],
  origin: string = siteUrl,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, origin),
    })),
  };
}
