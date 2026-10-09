import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { faqsToText, type Faq } from "@/lib/contentAdmin";
import { saveCategory, deleteCategory } from "@/app/admin/contenus/actions";
import { Card, PageTitle } from "@/components/admin/ui";
import { Field, Flash, Input, SubmitButton, TextArea } from "@/components/admin/FormFields";

export const metadata = { title: "Catégorie" };
export const dynamic = "force-dynamic";

export default async function AdminCategoryEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "nouvelle";
  const c = isNew
    ? null
    : await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
      });
  if (!isNew && !c) notFound();

  return (
    <div className="max-w-[820px]">
      <Link href="/admin/categories" className="text-[13px] font-medium" style={{ color: "rgba(20,21,26,0.55)" }}>
        ‹ Catégories
      </Link>
      <div className="mt-4">
        <PageTitle
          title={c?.name ?? "Nouvelle catégorie"}
          subtitle={c ? `${c._count.products} produit(s) · slug interne « ${c.slug} »` : undefined}
          action={
            c ? (
              <a href={`/${c.urlSlug || c.slug}`} target="_blank" rel="noreferrer" className="text-[13px]" style={{ color: "#1a5bff" }}>
                Voir la page ↗
              </a>
            ) : undefined
          }
        />
      </div>
      <Flash ok={sp.ok} error={sp.erreur} />

      <form action={saveCategory}>
        <input type="hidden" name="id" value={c?.id ?? ""} />
        <Card className="px-6 py-5 mb-3.5">
          <Field label="Nom">
            <Input name="name" defaultValue={c?.name ?? ""} required />
          </Field>
          {isNew && (
            <Field label="Slug interne" hint="Identifiant technique (filtres, produits). Repli : le nom.">
              <Input name="slug" mono />
            </Field>
          )}
          <Field label="Adresse publique" hint="Segment à la racine : « robes » → /robes. Changer l'adresse d'une catégorie indexée fait perdre son référencement (prévoir une redirection).">
            <Input name="urlSlug" defaultValue={c?.urlSlug ?? ""} mono />
          </Field>
          <Field label="Introduction (sous le titre)">
            <TextArea name="description" rows={3} defaultValue={c?.description ?? ""} />
          </Field>
          <div className="grid grid-cols-[1fr_120px] gap-3.5">
            <Field label="Visuel (URL)">
              <Input name="image" defaultValue={c?.image ?? c?.imageSrc ?? ""} mono />
            </Field>
            <Field label="Ordre">
              <Input name="sortOrder" type="number" defaultValue={String(c?.sortOrder ?? 0)} mono />
            </Field>
          </div>
          <Field label="Texte alternatif du visuel">
            <Input name="imageAlt" defaultValue={c?.imageAlt ?? ""} />
          </Field>
        </Card>

        <Card className="px-6 py-5 mb-3.5">
          <Field label="Titre H1 / SEO" hint="Repli : le nom. Le titre Google ajoute le suffixe de la boutique.">
            <Input name="seoTitle" defaultValue={c?.seoTitle ?? ""} />
          </Field>
          <Field label="Titre du texte SEO (sous la grille)">
            <Input name="seoHeading" defaultValue={c?.seoHeading ?? ""} />
          </Field>
          <Field label="Texte SEO (sous la grille)">
            <TextArea name="seoText" rows={5} defaultValue={c?.seoText ?? ""} />
          </Field>
          <Field label="FAQ" hint="Format : « Q: question » puis « R: réponse », une ligne vide entre deux questions.">
            <TextArea name="faqs" rows={8} defaultValue={faqsToText(c?.faqs as Faq[] | null)} mono />
          </Field>
          <p className="text-[11.5px] m-0" style={{ color: "rgba(20,21,26,0.45)" }}>
            Les traductions anglais / hébreu existantes sont conservées (édition en ligne prévue au P1).
          </p>
        </Card>
        <div className="flex gap-3">
          <SubmitButton>Enregistrer</SubmitButton>
        </div>
      </form>

      {c && c._count.products === 0 && (
        <form action={deleteCategory} className="mt-6">
          <input type="hidden" name="id" value={c.id} />
          <SubmitButton danger>Supprimer la catégorie (vide)</SubmitButton>
        </form>
      )}
    </div>
  );
}
