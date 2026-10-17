import type { ReactNode } from "react";
import { Ticker, Header, Footer } from "./Chrome";

/* Chrome commun des pages boutique (ticker, header, footer de la maquette). */
export default function Shell({
  children,
  cta = "Shop Now",
  href = "/#shop",
}: {
  children: ReactNode;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="page">
      <Ticker />
      <Header cta={cta} href={href} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
