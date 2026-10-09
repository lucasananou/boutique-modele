import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { PageHero } from "@/components/editorial/PageHero";
import { localizedPath, type Locale } from "@/lib/i18n";
import { store } from "@/stores";

// Textes propres à la boutique : src/stores/<id>/pages/guideDesTailles.ts
const { sizeRows, copy } = store.pages.guideDesTailles;

async function currentLocale(): Promise<Locale> {
  const h = (await headers()).get("x-store-locale");
  return h === "en" || h === "he" ? h : "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  const c = copy[await currentLocale()];
  return { title: c.title, description: c.description, alternates: { canonical: "/guide-des-tailles" } };
}

export default async function GuideTaillesPage() {
  const locale = await currentLocale();
  const c = copy[locale];
  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.heroTitle} subtitle={c.subtitle} />
      <section className="px-6 md:px-10 pb-20 max-w-[880px] mx-auto">
        <h2 className="font-serif text-[26px] md:text-[30px] text-ink mb-6">{c.measureTitle}</h2>
        <p className="font-sans text-[15px] leading-[1.85] text-warm-700 mb-8">{c.measure}</p>
        <div className="overflow-x-auto rounded-md border border-sand-soft">
          <table className="w-full text-left font-sans">
            <thead><tr className="bg-mineral">{c.headers.map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>{sizeRows.map((r) => <tr key={r[0]} className="border-t border-sand-soft">{r.map((cell, index) => <Td key={cell}>{index === 0 ? <span className="font-serif text-[17px]">{cell}</span> : cell}</Td>)}</tr>)}</tbody>
          </table>
        </div>
        <h2 className="font-serif text-[26px] md:text-[30px] text-ink mt-16 mb-6">{c.lengthsTitle}</h2>
        <div className="flex flex-col gap-4">
          {c.lengths.map(([title, body]) => (
            <div key={title} className="flex flex-col sm:flex-row gap-2 sm:gap-5 sm:items-baseline border-b border-sand-soft pb-4">
              <span className="font-serif text-[19px] text-ink sm:w-[160px] shrink-0">{title}</span>
              <span className="font-sans text-[15px] leading-[1.7] text-warm-700">{body}</span>
            </div>
          ))}
        </div>
        <div className="mt-12 bg-ivory-light border border-sand-soft rounded-md p-7">
          <p className="font-sans text-[14.5px] leading-[1.8] text-warm-700">{c.help} <Link href={localizedPath("/rendez-vous", locale)} className="text-ink underline decoration-champagne underline-offset-2">{c.contact}</Link>.</p>
        </div>
      </section>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-sans text-[11px] tracking-[0.14em] uppercase text-warm-500 px-4 py-3.5 font-normal">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="font-sans text-[15px] text-ink px-4 py-3.5">{children}</td>;
}
