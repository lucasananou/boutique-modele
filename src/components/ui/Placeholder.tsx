import { brand } from "@/lib/brand";

interface PlaceholderProps {
  /** Légende discrète décrivant le visuel attendu (repris de l'alt). */
  label?: string;
  className?: string;
  /** Affiche le monogramme de la Maison au centre. */
  monogram?: boolean;
  /** Variante sombre (sur fonds ink). */
  dark?: boolean;
  rounded?: boolean;
}

/**
 * Emplacement visuel raffiné, en attendant les vraies photographies du client.
 * Reproduit le principe « image-slot » des maquettes : fond minéral, monogramme,
 * et légende du cadrage attendu. Remplacer par <ProductImage> dès que les
 * fichiers réels sont fournis.
 */
export function Placeholder({
  label,
  className = "",
  monogram = true,
  dark = false,
  rounded = false,
}: PlaceholderProps) {
  return (
    <div
      className={[
        "relative flex items-center justify-center overflow-hidden",
        dark
          ? "bg-ink text-champagne-light"
          : "bg-gradient-to-br from-mineral to-sand text-champagne",
        rounded ? "rounded-sm" : "",
        className,
      ].join(" ")}
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {/* texture diagonale très discrète */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 14px)",
        }}
      />
      {monogram && (
        <span
          className="font-serif select-none"
          style={{
            fontSize: "clamp(1.5rem, 6vw, 3rem)",
            letterSpacing: "0.2em",
            opacity: 0.5,
          }}
        >
          {brand.name.charAt(0)}
        </span>
      )}
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}
