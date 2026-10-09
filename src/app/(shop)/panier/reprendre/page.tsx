import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProductBySlug } from "@/lib/products";
import { ResumeCart, type ResumeLine } from "@/components/cart/ResumeCart";

export const metadata: Metadata = {
  title: "Reprendre votre panier",
  robots: { index: false },
};

/**
 * Page de reprise d'un panier abandonné (lien des e-mails de relance).
 * Valide la commande par `ref` + `token`, reconstruit les lignes de panier
 * complètes (image + matière via le catalogue), puis un composant client
 * ré-hydrate le panier et redirige vers /commande.
 */
export default async function ReprendrePanierPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; token?: string; promo?: string }>;
}) {
  const { ref, token, promo } = await searchParams;

  const order =
    ref && token
      ? await prisma.order.findUnique({
          where: { reference: ref },
          include: { items: true },
        })
      : null;

  const valid = Boolean(order && token && order.confirmToken === token);

  // Lien invalide / expiré → message + retour boutique.
  if (!order || !valid) {
    return (
      <div className="px-6 md:px-16 py-24 text-center min-h-[50vh]">
        <div className="eyebrow mb-4">Lien expiré</div>
        <h1 className="font-serif font-normal text-[32px] md:text-[40px] text-ink mb-4">
          Ce panier n&apos;est plus disponible
        </h1>
        <p className="font-sans text-[15px] text-warm-500 mb-8 max-w-[460px] mx-auto leading-[1.7]">
          Le lien de reprise est invalide ou a expiré. Retrouvez nos pièces dans
          la boutique — votre prochaine sélection vous y attend.
        </p>
        <Link
          href="/boutique"
          className="font-sans text-[13px] uppercase tracking-[0.08em] text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
        >
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  // Déjà finalisée (payée / expédiée / annulée…) → rien à reprendre.
  if (order.status !== "PENDING") {
    return (
      <div className="px-6 md:px-16 py-24 text-center min-h-[50vh]">
        <div className="eyebrow mb-4">Commande finalisée</div>
        <h1 className="font-serif font-normal text-[32px] md:text-[40px] text-ink mb-4">
          Ce panier est déjà traité
        </h1>
        <p className="font-sans text-[15px] text-warm-500 mb-8 max-w-[460px] mx-auto leading-[1.7]">
          Votre commande {order.reference} a déjà été validée. Merci pour votre
          confiance.
        </p>
        <Link
          href="/boutique"
          className="font-sans text-[13px] uppercase tracking-[0.08em] text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
        >
          Poursuivre mes achats
        </Link>
      </div>
    );
  }

  // Reconstruit les lignes de panier complètes (image + matière depuis le
  // catalogue). Les produits retirés/épuisés sont simplement ignorés.
  const lines: ResumeLine[] = [];
  for (const it of order.items) {
    const product = await getProductBySlug(it.slug);
    if (!product) continue;
    const variant = it.variantLabel
      ? product.variants.find((v) => v.label === it.variantLabel)
      : undefined;
    lines.push({
      productId: it.productId,
      slug: it.slug,
      name: it.name,
      materialLabel: product.materialLabel,
      unitPrice: it.unitPrice,
      image: product.images[0] ?? { src: "", alt: it.name },
      variantId: variant?.id,
      variantLabel: it.variantLabel ?? undefined,
      engraving: it.engraving ?? undefined,
      quantity: it.quantity,
    });
  }

  // Plus aucun article disponible → message dédié.
  if (lines.length === 0) {
    return (
      <div className="px-6 md:px-16 py-24 text-center min-h-[50vh]">
        <div className="eyebrow mb-4">Panier indisponible</div>
        <h1 className="font-serif font-normal text-[32px] md:text-[40px] text-ink mb-4">
          Vos pièces ne sont plus disponibles
        </h1>
        <p className="font-sans text-[15px] text-warm-500 mb-8 max-w-[460px] mx-auto leading-[1.7]">
          Les articles de ce panier ne sont plus au catalogue. Découvrez nos
          nouveautés dans la boutique.
        </p>
        <Link
          href="/boutique"
          className="font-sans text-[13px] uppercase tracking-[0.08em] text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
        >
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-16 py-24 text-center min-h-[50vh]">
      <ResumeCart lines={lines} promo={promo} />
      <div className="eyebrow mb-4">Un instant</div>
      <h1 className="font-serif font-normal text-[32px] md:text-[40px] text-ink mb-4">
        Nous rechargeons votre panier…
      </h1>
      <p className="font-sans text-[15px] text-warm-500 max-w-[460px] mx-auto leading-[1.7]">
        Vous allez être redirigé vers votre commande.{" "}
        <Link
          href="/commande"
          className="text-ink underline decoration-champagne underline-offset-2 hover:text-champagne transition-colors"
        >
          Cliquez ici
        </Link>{" "}
        si rien ne se passe.
      </p>
    </div>
  );
}
