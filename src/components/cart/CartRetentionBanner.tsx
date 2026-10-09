"use client";

import { useEffect, useState } from "react";
import { useCart, selectCount } from "@/lib/store/cart";
import { useHasMounted } from "@/lib/useHasMounted";
import { bannerSeen, markBannerSeen } from "@/lib/leadCapture";

/**
 * Bandeau discret « on a gardé votre panier » pour le visiteur qui revient avec
 * un panier déjà rempli (persisté). Aucune donnée requise : un clic rouvre le
 * panier. Affiché une seule fois par session, et jamais par-dessus le tiroir
 * ouvert (donc pas juste après un ajout).
 */
export function CartRetentionBanner() {
  const mounted = useHasMounted();
  const count = useCart(selectCount);
  const openCart = useCart((s) => s.open);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!mounted || count === 0 || bannerSeen()) return;
    const t = setTimeout(() => {
      // Ne s'affiche pas par-dessus le tiroir (cas d'un ajout en cours).
      if (useCart.getState().isOpen) return;
      markBannerSeen();
      setShow(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [mounted, count]);

  if (!mounted || !show || count === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-[300px] bg-ink text-ivory rounded-sm shadow-[0_20px_50px_-15px_rgba(28,23,18,0.6)] p-4 pr-3 flex items-start gap-3">
      <span className="text-[18px] leading-none mt-0.5" aria-hidden>
        👜
      </span>
      <div className="flex-1">
        <div className="font-sans text-[13.5px] leading-[1.4]">
          On a gardé votre panier
          <br />
          <span className="text-ivory/60">
            {count} article{count > 1 ? "s" : ""} en attente
          </span>
        </div>
        <button
          onClick={() => {
            setShow(false);
            openCart();
          }}
          className="mt-2 font-sans text-[12px] uppercase tracking-[0.08em] text-champagne-light border-b border-champagne/50 pb-0.5 hover:text-champagne transition-colors cursor-pointer"
        >
          Reprendre
        </button>
      </div>
      <button
        onClick={() => setShow(false)}
        aria-label="Fermer"
        className="text-ivory/50 hover:text-ivory text-[13px] leading-none cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
}
