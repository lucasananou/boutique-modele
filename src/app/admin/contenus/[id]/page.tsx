import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { faqsToText, type Faq } from "@/lib/contentAdmin";
import { savePage, deletePage } from "@/app/admin/contenus/actions";
import { Card, PageTitle } from "@/components/admin/ui";
import { Field, Flash, Input, SubmitButton, TextArea } from "@/components/admin/FormFields";

export const metadata = { title: "Contenu" };
export const dynamic = "force-dynamic";

export default async function AdminPageEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; type?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "nouveau";
  const [p, categories] = await Promise.all([
    isNew ? null : prisma.page.findUnique({ where: { id }, include: { translations: { select: { locale: true } } } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
  ]);
  if (!isNew && !p) notFound();
  const kind = p?.kind ?? (sp.type === "landing" ? "landing" : "article");

  return (
    <div className="max-w-[900px]">
      <Link href={`/admin/contenus?type=${kind}`} className="text-[13px] font-medium" style={{ color: "rgba(20,21,26,0.55)" }}>
        ‹ Contenus
      </Link>
      <div className="mt-4">
        <PageTitle
          title={p?.title ?? (kind === "landing" ? "Nouvelle landing" : "Nouvel article")}
          subtitle={
            p?.translations.length
              ? `Traductions existantes : ${p.translations.map((t) => t.locale).join(", ")} (conservées ; édition en ligne au P1)`
              : undefined
          }
          action={
            p?.status === "published" ? (
              <a href={`/${p.slug}`} target="_blank" rel="noreferrer" className="text-[13px]" style={{ color: "#1a5bff" }}>
                Voir la page ↗
              </a>
            ) : undefined
          }
        />
      </div>
      <Flash ok={sp.ok} error={sp.erreur} />

      <form action={savePage}>
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <input type="hidden" name="kind" value={kind} />
        <Card className="px-6 py-5 mb-3.5">
          <Field label="Titre">
            <Input name="title" defaultValue={p?.title ?? ""} required />
          </Field>
          <div className="grid grid-cols-[1fr_160px] gap-3.5">
            <Field label="Adresse" hint="/adresse à la racine du site. Repli : le titre.">
              <Input name="slug" defaultValue={p?.slug ?? ""} mono />
            </Field>
            <Field label="Statut">
              <select name="status" defaultValue={p?.status ?? "draft"} className="w-full text-[14px] px-[13px] py-[10px] rounded-[10px]" style={{ background: "#FBFAF8", border: "1px solid rgba(20,21,26,0.1)" }}>
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
              </select>
            </Field>
          </div>
          <Field label={kind === "landing" ? "Meta description" : "Résumé (carte du journal + meta description)"}>
            <TextArea name="excerpt" rows={2} defaultValue={p?.excerpt ?? ""} />
          </Field>
          {kind === "article" && (
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="Rubrique">
                <Input name="category" defaultValue={p?.category ?? ""} />
              </Field>
              <Field label="Visuel d'en-tête (URL)">
                <Input name="image" defaultValue={p?.image ?? ""} mono />
              </Field>
              <Field label="Auteur" hint="Repli : « La rédaction <boutique> ».">
                <Input name="author" defaultValue={p?.author ?? ""} />
              </Field>
              <Field label="Temps de lecture (min)">
                <Input name="readingMinutes" type="number" defaultValue={p?.readingMinutes ? String(p.readingMinutes) : ""} mono />
              </Field>
              <Field label="Publié le (AAAA-MM-JJ)">
                <Input name="publishedAt" defaultValue={p?.publishedAt ?? ""} mono />
              </Field>
              <Field label="Mis à jour le (AAAA-MM-JJ)">
                <Input name="contentUpdatedAt" defaultValue={p?.contentUpdatedAt ?? ""} mono />
              </Field>
            </div>
          )}
          <Field label="Ordre">
            <Input name="sortOrder" type="number" defaultValue={String(p?.sortOrder ?? 0)} mono />
          </Field>
        </Card>

        {kind === "article" ? (
          <Card className="px-6 py-5 mb-3.5">
            <Field
              label="Corps de l'article (HTML)"
              hint={
                <>
                  Balises : p, h2, h3, ul/ol/li, a, strong, em, blockquote, table. Produit
                  cité : <code>{'<cited-product data-props=\'{"category":"robes"}\'></cited-product>'}</code>
                  {" "}(ou {'{"slug":"…"}'}). Tout script ou style est retiré à l&apos;affichage.
                </>
              }
            >
              <TextArea name="body" rows={22} defaultValue={p?.body ?? "<p></p>"} mono />
            </Field>
            <Field label="FAQ" hint="« Q: question » puis « R: réponse », une ligne vide entre deux questions.">
              <TextArea name="faqs" rows={6} defaultValue={faqsToText(p?.faqs as Faq[] | null)} mono />
            </Field>
            <Field label="Pièces mises en avant (catégories)">
              <div className="flex gap-4 flex-wrap text-[13px]">
                {categories.map((c) => (
                  <label key={c.slug} className="flex items-center gap-1.5">
                    <input type="checkbox" name="outfitCategories" value={c.slug} defaultChecked={p?.outfitCategories.includes(c.slug)} />
                    {c.name}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Titre du bloc « pièces »">
              <Input name="outfitTitle" defaultValue={p?.outfitTitle ?? ""} />
            </Field>
            <Field label="Articles liés (adresses, séparées par des virgules)">
              <Input name="related" defaultValue={p?.related.join(", ") ?? ""} mono />
            </Field>
            <Field label="URL canonique forcée (facultatif)">
              <Input name="canonical" defaultValue={p?.canonical ?? ""} mono />
            </Field>
          </Card>
        ) : (
          <Card className="px-6 py-5 mb-3.5">
            <Field
              label="Contenu de la landing (JSON)"
              hint="Champs : title, description, eyebrow, intro, productCategory, productHints[], primaryCta{href,label}, secondaryCta, sections[{title,body}], faqs[{q,a}], relatedLinks[{href,label}]."
            >
              <TextArea name="data" rows={24} defaultValue={JSON.stringify(p?.data ?? { title: "", description: "", eyebrow: "", intro: "", productCategory: categories[0]?.slug ?? "", productHints: [], primaryCta: { href: "/boutique", label: "Voir la boutique" }, sections: [], faqs: [], relatedLinks: [] }, null, 2)} mono />
            </Field>
          </Card>
        )}
        <SubmitButton>Enregistrer</SubmitButton>
      </form>

      {p && p.status !== "published" && (
        <form action={deletePage} className="mt-6">
          <input type="hidden" name="id" value={p.id} />
          <SubmitButton danger>Supprimer ce brouillon</SubmitButton>
        </form>
      )}
    </div>
  );
}
