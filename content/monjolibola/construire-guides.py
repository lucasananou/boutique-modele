#!/usr/bin/env python3
"""Mon Joli Bola : sources/*.md -> pages.json (table Page, chargée par store-content-sync)."""
import json, re, sys, glob, os
D = os.path.dirname(os.path.abspath(__file__))
NBSP = " "
def typo(t):
    t = t.replace("'", "’")
    t = re.sub(r" ([:;?!»])", NBSP + r"\1", t)
    t = re.sub(r"« ", "«" + NBSP, t)
    t = re.sub(r"(\d) (€|cm|mm|%|µg)", r"\1" + NBSP + r"\2", t)
    return t
def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
LIEN = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
def inline(t):
    out, i = [], 0
    for m in LIEN.finditer(t):
        out.append(rendu(t[i:m.start()]))
        u = m.group(2)
        ext = u.startswith("http")
        attrs = ' target="_blank" rel="noopener"' if ext else ""
        out.append(f'<a href="{u}"{attrs}>{rendu(m.group(1))}</a>')
        i = m.end()
    out.append(rendu(t[i:]))
    return "".join(out)
def rendu(t):
    t = typo(esc(t))
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\*(.+?)\*", r"<em>\1</em>", t)
    return t
def blocs(txt):
    html, para, liste = [], [], []
    def flush():
        nonlocal para, liste
        if para:
            html.append(f"<p>{inline(' '.join(para))}</p>"); para = []
        if liste:
            html.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in liste) + "</ul>"); liste = []
    for ligne in txt.split("\n"):
        l = ligne.strip()
        if not l: flush(); continue
        if l.startswith("### "): flush(); html.append(f"<h3>{inline(l[4:])}</h3>"); continue
        if l.startswith("## "): flush(); html.append(f"<h2>{inline(l[3:])}</h2>"); continue
        if l.startswith("- "):
            if para: flush()
            liste.append(l[2:]); continue
        if l.startswith("> "): flush(); html.append(f'<p class="guide__note">{inline(l[2:])}</p>'); continue
        if liste: flush()
        para.append(l)
    flush()
    return "".join(html)
DATE = "2026-11-09"
pages = []
for f in sorted(glob.glob(os.path.join(D, "sources", "*.md"))):
    s = open(f, encoding="utf8").read()
    m = re.match(r"---\n(.*?)\n---\n(.*)$", s, re.S)
    if not m: sys.exit(f"entête manquant : {f}")
    tete = {}
    for l in m.group(1).split("\n"):
        k, _, v = l.partition(":")
        tete[k.strip()] = v.strip()
    corps, _, faq = m.group(2).partition("\n[FAQ]\n")
    faqs = []
    for bloc in re.split(r"\n(?=\? )", "\n" + faq):
        bloc = bloc.strip()
        if not bloc.startswith("? "): continue
        q, _, a = bloc[2:].partition("\n")
        faqs.append({"q": typo(q.strip()), "a": blocs(a.strip())})
    mots = len(re.findall(r"\w+", re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", corps + faq)))
    data = {"metaTitle": typo(tete["meta"]), "illustration": tete.get("illustration", "non") == "oui"}
    for src, dst in (("chapo", "chapo"), ("alt", "alt"), ("grille_titre", "grilleTitre"), ("grille_note", "grilleNote")):
        if src in tete: data[dst] = typo(tete[src])
    if "grille" in tete:
        g = tete["grille"]
        data["grille"] = g if g in ("toutes", "argent", "dore") else g.split(",")
    pages.append({
        "slug": tete["slug"], "kind": tete.get("kind", "article"), "status": "published",
        "title": typo(tete["titre"]), "excerpt": typo(tete["extrait"]), "category": tete.get("rubrique", "Guide"),
        "image": tete.get("image", ""), "publishedAt": DATE, "contentUpdatedAt": DATE,
        "readingMinutes": max(1, round(mots / 200)), "faqs": faqs,
        "related": [x for x in tete.get("lies", "").split(",") if x], "body": blocs(corps), "data": data,
        "sortOrder": int(tete.get("ordre", "100")),
    })
    print(f"{tete['slug']:<55} {mots:>5} mots  meta {len(data['metaTitle'])}  desc {len(tete['extrait'])}  faq {len(faqs)}")
json.dump(pages, open(os.path.join(D, "pages.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(len(pages), "pages")
