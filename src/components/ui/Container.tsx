import type { ReactNode } from "react";

/**
 * Conteneur centré du storefront — largeur de la maquette (1240px) + gouttières.
 * Les fonds de section restent pleine largeur : seul le CONTENU est contraint.
 * Largeur centralisée ici : pour passer à 1280px, changer la seule valeur.
 */
export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={["max-w-[1240px] mx-auto px-6 md:px-10", className].join(" ")}>
      {children}
    </div>
  );
}
