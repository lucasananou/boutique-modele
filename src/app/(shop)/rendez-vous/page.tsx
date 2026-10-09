import type { Metadata } from "next";
import { headers } from "next/headers";
import { brand } from "@/lib/brand";
import { PageHero } from "@/components/editorial/PageHero";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import type { Locale } from "@/lib/i18n";
import { store } from "@/stores";

const { pageCopy } = store.pages.rendezVous;



export async function generateMetadata(): Promise<Metadata> {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const copy = pageCopy[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: "/rendez-vous" },
  };
}

export default async function RendezVousPage() {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const copy = pageCopy[locale];
  return (
    <>
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
      />

      <section className="px-6 md:px-16 pb-20 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 max-w-[1100px] mx-auto">
          <div>
            <div className="eyebrow mb-5">{copy.contactEyebrow}</div>
            <h2 className="font-serif font-normal text-[28px] text-ink mb-5">
              {brand.legalName}
            </h2>
            <div className="font-sans text-[15px] leading-[1.9] text-warm-700">
              <p>
                {copy.body}
              </p>
              <p className="mt-4">
                {brand.contact.phone}
                <br />
                {brand.contact.email}
              </p>
              <p className="mt-4 text-warm-500">
                {copy.response}
                <br />
                {copy.whatsapp}
              </p>
            </div>
          </div>

          <AppointmentForm locale={locale} />
        </div>
      </section>
    </>
  );
}
