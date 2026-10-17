import { notFound } from "next/navigation";
import { front } from "@/stores/current-front";

/*
 * Vitrine sur mesure (voir src/stores/front.ts). Atteinte seulement par la
 * réécriture de src/proxy.ts ; sans vitrine (boutique standard), 404.
 */
export default function VitrineLayout({ children }: { children: React.ReactNode }) {
  if (!front) notFound();
  const { Layout } = front;
  return <Layout>{children}</Layout>;
}
