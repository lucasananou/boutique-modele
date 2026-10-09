"use client";

import { useFavorites } from "@/lib/store/favorites";
import { useHasMounted } from "@/lib/useHasMounted";
import { HeartIcon } from "@/components/ui/icons";

export function FavoriteButton({
  productId,
  className = "",
  floating = false,
}: {
  productId: string;
  className?: string;
  floating?: boolean;
}) {
  const mounted = useHasMounted();
  const toggle = useFavorites((s) => s.toggle);
  const ids = useFavorites((s) => s.ids);
  const isFav = mounted && ids.includes(productId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isFav}
      className={[
        floating
          ? "absolute top-3 right-3 z-[3] w-[34px] h-[34px] rounded-full bg-ivory-light/85 hover:bg-white flex items-center justify-center"
          : "flex items-center justify-center",
        isFav ? "text-champagne" : "text-ink",
        "transition-colors cursor-pointer",
        className,
      ].join(" ")}
    >
      <HeartIcon filled={isFav} width={16} height={16} />
    </button>
  );
}
