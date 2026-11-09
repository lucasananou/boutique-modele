import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticles, getLandings, getPage, type ContentPage } from "@/lib/pages";
import { store } from "@/stores";
import Page from "../Page";
import type { CatalogItem } from "../catalog";
import { loadCatalog } from "../catalog";
import { BandeFinale, Carte } from "../blocs";

/* Guides SEO et catégories (table Page, source versionnée : content/monjolibola/sources). */

const ORIGIN = `https://${store.domains.primary}`;
const NAME = "Mon Joli Bola";
const robots: Metadata["robots"] = process.env.INDEXER === "1" ? { index: true, follow: true } : { index: false, follow: false, nocache: true };
const CSS = "/stores/monjolibola/guides.css?v=1";
export const GUIDES_INDEX_META: Metadata = {
  title: "Guides sur le bola de grossesse · Mon Joli Bola",
  description: "Toutes nos réponses sur le bola de grossesse : sens, port, sécurité, matières, longueur de chaîne, cadeau et après la naissance.",
  alternates: { canonical: `${ORIGIN}/guide` },
  robots,
};

type GuideData = {
  metaTitle?: string;
  chapo?: string;
  illustration?: boolean;
  alt?: string;
  grille?: "toutes" | "argent" | "dore" | string[];
  grilleTitre?: string;
  grilleNote?: string;
};

const abs = (p: string) => (p.startsWith("http") ? p : `${ORIGIN}${p}`);
const texte = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const dateFr = (iso?: string) => (iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "");
const ld = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");
const dataDe = (p: ContentPage) => (p.data ?? {}) as GuideData;

function grilleDe(items: CatalogItem[], g: GuideData["grille"]): CatalogItem[] {
  if (!g) return [];
  if (g === "toutes") return items;
  if (g === "argent") return items.filter((i) => /couleur argent/i.test(i.matiere));
  if (g === "dore") return items.filter((i) => /couleur dorée/i.test(i.matiere));
  return g.map((s) => items.find((i) => i.slug === s)).filter((i): i is CatalogItem => Boolean(i));
}

export async function guideMetadata(slug: string): Promise<Metadata> {
  const p = await getPage(slug);
  if (!p) return { title: `Introuvable · ${NAME}`, robots: { index: false } };
  const d = dataDe(p);
  const title = d.metaTitle || p.title;
  const url = `${ORIGIN}/${p.slug}`;
  return {
    title,
    description: p.excerpt,
    alternates: { canonical: url },
    robots,
    openGraph: { title, description: p.excerpt, url, type: p.kind === "article" ? "article" : "website", images: p.image ? [{ url: abs(p.image) }] : undefined, siteName: NAME, locale: "fr_FR" },
  };
}

function Fil({ items }: { items: [string, string][] }) {
  return <nav className="guide__fil" aria-label="Fil d’Ariane">{items.map(([h, t], i) => (h ? <span key={t}><a href={h}>{t}</a><i aria-hidden> / </i></span> : <span key={t} aria-current="page">{t}</span>))}</nav>;
}

export async function GuidePage({ slug }: { slug: string }) {
  const p = await getPage(slug);
  if (!p) notFound();
  const d = dataDe(p);
  const url = `${ORIGIN}/${p.slug}`;
  const isArticle = p.kind === "article";
  const sous = p.slug.startsWith("bola-de-grossesse/");
  const catalog = d.grille ? await loadCatalog() : null;
  const grille = catalog ? grilleDe(catalog.items, d.grille) : [];
  const [articles, landings] = await Promise.all([getArticles(), getLandings()]);
  const tous = [...articles, ...landings];
  const lies = (p.related ?? []).map((s) => tous.find((x) => x.slug === s)).filter((x): x is ContentPage => Boolean(x));
  const fil: [string, string][] = [["/", "Accueil"]];
  if (isArticle) fil.push(["/guide", "Guides"]);
  if (sous) fil.push(["/bola-de-grossesse", "Bola de grossesse"]);
  fil.push(["", p.title.replace(/ : .*$/, "")]);
  const faqs = p.faqs ?? [];
  const graphe: unknown[] = [
    { "@type": "BreadcrumbList", itemListElement: fil.map(([h, t], i) => ({ "@type": "ListItem", position: i + 1, name: t, item: h ? `${ORIGIN}${h === "/" ? "" : h}` : url })) },
  ];
  if (isArticle) {
    graphe.push({
      "@type": "Article",
      headline: p.title,
      description: p.excerpt,
      image: p.image ? abs(p.image) : undefined,
      datePublished: p.publishedAt,
      dateModified: p.updatedAt ?? p.publishedAt,
      inLanguage: "fr-FR",
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: NAME, url: ORIGIN },
      publisher: { "@type": "Organization", name: NAME, url: ORIGIN },
    });
  } else {
    graphe.push({ "@type": "CollectionPage", name: p.title, description: p.excerpt, url, inLanguage: "fr-FR" });
    if (grille.length) {
      graphe.push({
        "@type": "ItemList",
        itemListElement: grille.map((i, n) => ({
          "@type": "ListItem",
          position: n + 1,
          item: {
            "@type": "Product",
            name: i.name,
            url: `${ORIGIN}/produit/${i.slug}`,
            image: i.img ? abs(i.img) : undefined,
            description: i.matiere,
            offers: { "@type": "Offer", price: (i.price / 100).toFixed(2), priceCurrency: "EUR", availability: i.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${ORIGIN}/produit/${i.slug}` },
          },
        })),
      });
    }
  }
  if (faqs.length) graphe.push({ "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: texte(f.a) } })) });
  return (
    <Page>
      <link rel="stylesheet" href={CSS} precedence="mjb" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld({ "@context": "https://schema.org", "@graph": graphe }) }} />
      <article className={`guide${d.grille ? " guide--cat" : ""}`}>
        <Fil items={fil} />
        <header className="guide__tete">
          <p className="sur leve">{p.category}</p>
          <h1 className="leve">{p.title}</h1>
          {d.chapo && <p className="guide__chapo leve l1">{d.chapo}</p>}
          {isArticle && <p className="guide__maj">Mis à jour le {dateFr(p.updatedAt ?? p.publishedAt)}{p.readingMinutes ? ` · ${p.readingMinutes} min de lecture` : ""}</p>}
        </header>
        {grille.length > 0 && (
          <section className="guide__grille">
            <h2>{d.grilleTitre ?? "Nos bolas"}</h2>
            {d.grilleNote && <p className="guide__note-grille">{d.grilleNote}</p>}
            <div className="grille">{grille.map((i) => <Carte key={i.slug} item={i} />)}</div>
            <p className="guide__cta"><a className="btn btn--ligne" href="/boutique">Voir toute la boutique</a></p>
          </section>
        )}
        {p.image && (
          <figure className="guide__img">
            <img src={p.image} alt={d.alt ?? ""} width={1200} height={800} loading={grille.length ? "lazy" : "eager"} decoding="async" />
            {d.illustration && <figcaption>Image d’illustration</figcaption>}
          </figure>
        )}
        <div className="guide__corps" dangerouslySetInnerHTML={{ __html: p.body }} />
        {faqs.length > 0 && (
          <section className="guide__faq">
            <h2>Questions fréquentes</h2>
            {faqs.map((f) => <details key={f.q}><summary>{f.q}<span aria-hidden>+</span></summary><div dangerouslySetInnerHTML={{ __html: f.a }} /></details>)}
          </section>
        )}
        {lies.length > 0 && (
          <aside className="guide__lies">
            <h2>À lire ensuite</h2>
            <ul>{lies.map((l) => <li key={l.slug}><a href={`/${l.slug}`}>{l.title}</a><p>{l.excerpt}</p></li>)}</ul>
          </aside>
        )}
      </article>
      <BandeFinale />
    </Page>
  );
}

export async function GuidesIndex() {
  const [articles, landings] = await Promise.all([getArticles(), getLandings()]);
  const pilier = landings.find((l) => l.slug === "bola-de-grossesse");
  const cats = landings.filter((l) => l.slug.startsWith("bola-de-grossesse/"));
  const url = `${ORIGIN}/guide`;
  const graphe = [
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: ORIGIN }, { "@type": "ListItem", position: 2, name: "Guides", item: url }] },
    { "@type": "CollectionPage", name: "Guides sur le bola de grossesse", url, inLanguage: "fr-FR", mainEntity: { "@type": "ItemList", itemListElement: articles.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${ORIGIN}/${a.slug}`, name: a.title })) } },
  ];
  return (
    <Page>
      <link rel="stylesheet" href={CSS} precedence="mjb" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld({ "@context": "https://schema.org", "@graph": graphe }) }} />
      <div className="guide guide--index">
        <Fil items={[["/", "Accueil"], ["", "Guides"]]} />
        <header className="guide__tete">
          <p className="sur leve">Guides</p>
          <h1 className="leve">Le bola de grossesse, <em>sans promesses</em></h1>
          <p className="guide__chapo leve l1">Ce qu’est ce bijou, d’où il vient, comment le choisir et le porter. Nous disons ce qui est établi, ce qui relève de la tradition et ce que personne ne sait.</p>
        </header>
        {pilier && <p className="guide__pilier"><a href={`/${pilier.slug}`}>{pilier.title}</a> : l’essentiel en une page, avec tous nos modèles.</p>}
        <div className="guide__cartes">
          {articles.map((a) => (
            <a className="guide__carte" href={`/${a.slug}`} key={a.slug}>
              {a.image && <img src={a.image} alt="" width={640} height={420} loading="lazy" decoding="async" />}
              <span className="sur">{a.category}</span>
              <h2>{a.title}</h2>
              <p>{a.excerpt}</p>
            </a>
          ))}
        </div>
        {cats.length > 0 && (
          <section className="guide__lies">
            <h2>Parcourir les modèles</h2>
            <ul>{cats.map((c) => <li key={c.slug}><a href={`/${c.slug}`}>{c.title}</a></li>)}</ul>
          </section>
        )}
      </div>
      <BandeFinale />
    </Page>
  );
}
