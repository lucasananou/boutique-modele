import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageHero } from "@/components/editorial/PageHero";
import { Prose } from "@/components/editorial/Prose";
import type { Locale } from "@/lib/i18n";
import { store } from "@/stores";

const { copy } = store.pages.livraisonRetours;



async function currentLocale(): Promise<Locale> {
  const h = (await headers()).get("x-store-locale");
  return h === "en" || h === "he" ? h : "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  const c = copy[await currentLocale()];
  return { title: c.title as string, description: c.description as string, alternates: { canonical: "/livraison-retours" } };
}

export default async function LivraisonPage() {
  const c = copy[await currentLocale()];
  return (
    <>
      <PageHero eyebrow={c.eyebrow as string} title={c.title as string} subtitle={c.subtitle as string} />
      <Prose>
        <h2>{c.h2Shipping as string}</h2>
        <p>{c.shippingP1 as string}</p>
        <ul>{(c.shippingItems as string[]).map((item) => <li key={item}>{item}</li>)}</ul>
        <p>{c.shippingP2 as string}</p>
        <h2>{c.h2Returns as string}</h2>
        <p>{c.returnsP as string}</p>
        <ul>{(c.returnsItems as string[]).map((item) => <li key={item}>{item}</li>)}</ul>
        <h2>{c.h2Payment as string}</h2>
        <p>{c.paymentP as string}</p>
      </Prose>
    </>
  );
}
