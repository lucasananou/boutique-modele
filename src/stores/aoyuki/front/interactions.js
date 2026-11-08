// Aoyuki : interactions de la maquette portées sur la vraie boutique (panier
// en base au checkout, catalogue réel). Fichier non typé : portage direct de
// app.js et produit.js, le comportement doit rester identique à la maquette.
import { addLine, cartTotals, clearCart, eur as eurCents, readCart, removeLine, setQuantity, CART_EVENT, FREE_OVER } from "./cart";
import { demandeRetour, subscribeNewsletter } from "./actions";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const eur = (n) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const IMG = "/stores/aoyuki/img/";
const SEUIL = FREE_OVER / 100;

export default function boot() {
  if (document.documentElement.dataset.aoyukiBoot) return;
  document.documentElement.dataset.aoyukiBoot = "1";
  document.documentElement.classList.add("js");

  const dataEl = $("#aoyuki-catalog");
  if (!dataEl) return;
  const catalog = JSON.parse(dataEl.textContent);
  const byHandle = Object.fromEntries(catalog.items.map((i) => [i.handle, i]));

  const toastEl = $("[data-toast]");
  let tId;
  const say = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("is-on"));
    clearTimeout(tId);
    tId = setTimeout(() => toastEl.classList.remove("is-on"), 3200);
  };

  // Menu mobile
  const menuBtn = $("[data-menu]");
  const menu = $("#menu-mobile");
  if (menuBtn && menu) {
    const closeMenu = () => {
      menu.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    };
    menuBtn.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
  }

  // Liens sans destination réelle encore (réseaux inexistants…)
  $$("[data-demo]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      say(b.dataset.demo);
    }),
  );

  // Panier (tiroir de la maquette, lignes réelles)
  const drawer = $("#panier");
  const body = $("[data-cart-body]");
  const countEl = $("[data-cart-count]");
  const totalEl = $("[data-cart-total]");
  const nEl = $("[data-cart-n]");
  const prog = $("[data-prog]");
  const txt = $("[data-prog-txt]");
  const checkoutBtn = $("[data-checkout]");
  const SUGG = catalog.items.filter((i) => i.variants.length);
  let lastFocus = null;

  const renderCart = () => {
    const lines = readCart();
    const totals = cartTotals(lines);
    let html = "";
    for (const it of lines) {
      const meta = `${it.size}${it.intervalDays ? `, abonnement -10 %, tous les ${it.intervalDays} jours` : ""}`;
      html += `<div class="line"><img src="${it.img}" alt="" width="64" height="80">
        <div><p class="line__name">${it.name}</p><p class="line__meta">${meta}</p>
        <div class="line__qty"><button type="button" aria-label="Retirer une unité" data-dec="${it.key}">-</button><span aria-live="polite">${it.quantity}</span><button type="button" aria-label="Ajouter une unité" data-inc="${it.key}">+</button><button type="button" class="line__rm" data-rm="${it.key}">Supprimer</button></div></div>
        <p class="line__price">${eurCents(it.quantity * it.unitPrice)}</p></div>`;
    }
    if (!lines.length) html = `<p class="drawer__empty">Votre panier est vide. <a href="/#produits">Découvrir nos thés</a></p>`;
    if (catalog.examples) {
      html += `<label class="sacopt"><input type="checkbox" data-sac><span>Ajouter un sac cadeau</span><b>2,00 € <em>exemple</em></b></label>`;
    }
    const inCart = new Set(lines.map((l) => l.handle));
    const sugg = SUGG.filter((p) => !inCart.has(p.handle)).slice(0, 3);
    if (sugg.length)
      html +=
        `<p class="up__t">Vous aimerez aussi</p>` +
        sugg
          .map(
            (p) =>
              `<div class="up"><img src="${p.img}" alt="" width="44" height="54"><p>${p.name}<span>${eurCents(p.price)}</span></p><button type="button" data-up="${p.handle}" aria-label="Ajouter ${p.name}">Ajouter</button></div>`,
          )
          .join("");
    if (body) body.innerHTML = html;
    if (countEl) countEl.textContent = totals.count;
    if (nEl) nEl.textContent = totals.count;
    if (totalEl) totalEl.textContent = eurCents(totals.subtotal);
    if (prog) {
      const euros = totals.subtotal / 100;
      prog.style.width = `${Math.min(100, (euros / SEUIL) * 100)}%`;
      txt.textContent = euros >= SEUIL ? "Livraison offerte" : `Plus que ${eur(SEUIL - euros)} pour la livraison offerte`;
    }
    if (checkoutBtn) checkoutBtn.disabled = totals.count === 0;
  };

  const openCart = () => {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    setTimeout(() => $(".drawer__close", drawer)?.focus(), reduce() ? 0 : 60);
  };
  const closeCart = () => {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(
      () => {
        drawer.hidden = true;
        lastFocus?.focus();
      },
      reduce() ? 0 : 420,
    );
  };

  // Ajoute un produit du catalogue (format, abonnement éventuel).
  const addHandle = ({ handle, size, freq, qty = 1 }) => {
    const p = byHandle[handle];
    if (!p || !p.variants.length) {
      say("Ce produit n’est pas disponible pour le moment.");
      return;
    }
    const variant = p.variants.find((v) => v.label === size) ?? p.variants[0];
    const base = variant.price;
    const unitPrice = freq ? Math.round(base * 0.9) : base;
    const result = addLine(
      {
        handle: p.handle,
        productId: p.productId,
        slug: p.slug,
        variantId: variant.id,
        name: p.name,
        size: variant.label,
        unitPrice,
        intervalDays: freq ? parseInt(freq, 10) : undefined,
        img: p.img,
      },
      qty,
    );
    renderCart();
    if (countEl) {
      countEl.classList.remove("bump");
      void countEl.offsetWidth;
      countEl.classList.add("bump");
      setTimeout(() => countEl.classList.remove("bump"), 300);
    }
    if (result === "replaced") say("Un seul abonnement par commande : le précédent a été remplacé.");
    if (drawer?.hidden) openCart();
  };

  if (body) {
    body.addEventListener("click", (e) => {
      if (e.target.closest(".drawer__empty a")) {
        closeCart();
        return;
      }
      const rm = e.target.closest("[data-rm]");
      if (rm) {
        removeLine(rm.dataset.rm);
        renderCart();
        return;
      }
      const up = e.target.closest("[data-up]");
      if (up) {
        addHandle({ handle: up.dataset.up });
        return;
      }
      const inc = e.target.closest("[data-inc]");
      const dec = e.target.closest("[data-dec]");
      const key = inc?.dataset.inc || dec?.dataset.dec;
      if (!key) return;
      const line = readCart().find((l) => l.key === key);
      if (line) setQuantity(key, line.quantity + (inc ? 1 : -1));
      renderCart();
    });
    body.addEventListener("change", (e) => {
      if (!e.target.matches("[data-sac]")) return;
      e.target.checked = false;
      say("Option d’exemple : non disponible à la commande.");
    });
  }

  $$("[data-open-cart]").forEach((b) => b.addEventListener("click", openCart));
  $$("[data-close-cart]").forEach((b) => b.addEventListener("click", closeCart));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer && !drawer.hidden) closeCart();
  });
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      window.location.href = "/commande";
    });
  }
  window.addEventListener(CART_EVENT, renderCart);
  window.addEventListener("storage", renderCart);

  // Boutons Ajouter (produits, vedette, cartes associées)
  $$("[data-add]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const p = btn.closest("[data-product]");
      addHandle({ handle: p.dataset.product });
    }),
  );

  // Abonnement de l'accueil
  const aboForm = $("[data-abo]");
  if (aboForm) {
    const aboPrice = $("[data-abo-price]");
    const aboOld = $("[data-abo-old]");
    const aboPer = $("[data-abo-per]");
    const current = () => {
      const prod = $('input[name="abo-produit"]:checked', aboForm);
      return {
        handle: prod.value,
        base: parseFloat(prod.dataset.price),
        freq: $('input[name="abo-freq"]:checked', aboForm).value,
      };
    };
    const renderAbo = () => {
      const { base, freq } = current();
      aboPrice.textContent = eur(Math.round(base * 90) / 100);
      aboOld.textContent = eur(base);
      aboPer.textContent = `la canette de 30 g, tous les ${freq} jours`;
    };
    aboForm.addEventListener("change", renderAbo);
    aboForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const { handle, freq } = current();
      addHandle({ handle, freq });
    });
    $("[data-abo-once]")?.addEventListener("click", () => addHandle({ handle: current().handle }));
    $$("[data-pick]").forEach((t) =>
      t.addEventListener("click", () => {
        const input = $(`input[name="abo-produit"][value="${t.dataset.pick}"]`, aboForm);
        if (input) {
          input.checked = true;
          renderAbo();
        }
      }),
    );
  }

  // Carrousel « Pourquoi Aoyuki »
  const carTrack = $("[data-car-track]");
  if (carTrack) {
    const slides = $$(".car__slide", carTrack);
    const dots = $$("[data-car-dot]");
    const prev = $("[data-car-prev]");
    const next = $("[data-car-next]");
    const idx = () => Math.round(carTrack.scrollLeft / carTrack.clientWidth);
    const go = (i) =>
      carTrack.scrollTo({ left: slides[Math.max(0, Math.min(slides.length - 1, i))].offsetLeft, behavior: reduce() ? "auto" : "smooth" });
    const syncCar = () => {
      const i = idx();
      dots.forEach((d, n) => (n === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
      prev.disabled = i <= 0;
      next.disabled = i >= slides.length - 1;
    };
    let frame;
    carTrack.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(syncCar);
      },
      { passive: true },
    );
    dots.forEach((d, n) => d.addEventListener("click", () => go(n)));
    prev.addEventListener("click", () => go(idx() - 1));
    next.addEventListener("click", () => go(idx() + 1));
    carTrack.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      go(idx() + (e.key === "ArrowRight" ? 1 : -1));
    });
    syncCar();
  }

  // Newsletter : enregistrée en base, aucun e-mail envoyé tant que Resend n'est pas branché.
  $$("[data-news]").forEach((form) => {
    const email = $('input[type="email"]', form);
    const msg = $("[id$=email-msg], .news__msg", form) ?? $("#email-msg");
    const initial = msg?.textContent ?? "";
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = email.value.trim();
      msg?.classList.remove("is-error", "is-ok");
      if (!v) {
        email.setAttribute("aria-invalid", "true");
        if (msg) {
          msg.textContent = "Indiquez votre adresse e-mail.";
          msg.classList.add("is-error");
        }
        email.focus();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        email.setAttribute("aria-invalid", "true");
        if (msg) {
          msg.textContent = "Cette adresse semble incomplète, par exemple prenom@exemple.fr.";
          msg.classList.add("is-error");
        }
        email.focus();
        return;
      }
      email.removeAttribute("aria-invalid");
      const ok = await subscribeNewsletter(v).catch(() => false);
      if (msg) {
        msg.textContent = ok ? "Merci, c’est noté." : "Réessayez dans un instant.";
        msg.classList.add(ok ? "is-ok" : "is-error");
      }
      if (ok) form.reset();
    });
    email.addEventListener("input", () => {
      if (email.getAttribute("aria-invalid")) {
        email.removeAttribute("aria-invalid");
        msg?.classList.remove("is-error");
        if (msg) msg.textContent = initial;
      }
    });
  });

  renderCart();

  // Page produit
  const form = $("[data-pp]");
  if (form) bootProduct({ form, addHandle, say, syncCart: renderCart });

  // Formulaire de retour / rétractation (tiroir et page dédiée)
  $$("[data-retour-form]").forEach((f) => {
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      const res = await demandeRetour(data).catch(() => ({ ok: false, error: "Réessayez dans un instant." }));
      if (res.ok) {
        say("Votre demande est enregistrée, nous revenons vers vous.");
        f.reset();
        document.dispatchEvent(new Event("aoyuki:close-drawers"));
      } else {
        say(res.error ?? "Vérifiez le formulaire.");
      }
    });
  });

  window.Aoyuki = { addHandle, clearCart };
}

function bootProduct({ form, addHandle, say }) {
  const smooth = reduce() ? "auto" : "smooth";
  const handle = form.dataset.handle;
  const fmt = () => $('input[name="format"]:checked', form);
  const mode = () => $('input[name="mode"]:checked', form);
  const off = (n, p) => Math.round(n * (100 - p)) / 100;
  let qty = 1;
  const state = () => {
    const f = fmt();
    const m = mode();
    const base = parseFloat(f.dataset.price);
    return { size: f.value, grams: parseFloat(f.dataset.grams), base, mode: m.value, price: off(base, parseFloat(m.dataset.off)) };
  };

  const track = (el, onIndex) => {
    let raf;
    const idx = () => Math.round(el.scrollLeft / el.clientWidth);
    el.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => onIndex(idx()));
      },
      { passive: true },
    );
    return {
      idx,
      go: (i) => el.scrollTo({ left: el.children[Math.max(0, Math.min(el.children.length - 1, i))].offsetLeft - el.offsetLeft, behavior: smooth }),
    };
  };

  // Galerie
  const gal = $("[data-gal]");
  const main = $("[data-gal-main]");
  let galT = null;
  if (gal) {
    const thumbs = $$("[data-gal-go]");
    const dots = $$(".gal__dots span");
    galT = track(gal, (i) => {
      thumbs.forEach((t, n) => (n === i ? t.setAttribute("aria-current", "true") : t.removeAttribute("aria-current")));
      dots.forEach((d, n) => d.classList.toggle("is-on", n === i));
    });
    thumbs.forEach((t, i) => t.addEventListener("click", () => galT.go(i)));
  }
  const images =
    handle === "ceremonie"
      ? {
          "30 g": [IMG + "pp-30g.webp", "Canette verte Aoyuki Matcha Cérémonie sur fond crème."],
          "100 g": [IMG + "pp-100g.webp", "Grande canette verte Aoyuki Matcha Cérémonie de 100 g sur fond crème."],
        }
      : null;

  const setText = (sel, value) => {
    const el = $(sel);
    if (el) el.textContent = value;
  };
  const render = () => {
    const s = state();
    setText('[data-opt="unique"]', eur(s.base));
    for (const k of ["abo", "eng"]) {
      const input = $(`input[name="mode"][value="${k}"]`, form);
      if (!input) continue;
      const p = parseFloat(input.dataset.off);
      setText(`[data-opt="${k}"]`, eur(off(s.base, p)));
      setText(`[data-old="${k}"]`, eur(s.base));
    }
    const freq = $("[data-pp-freq]");
    if (freq) freq.hidden = s.mode !== "abo";
    setText("[data-pp-qty]", qty);
    setText("[data-pp-add]", `Ajouter au panier · ${eur(s.price * qty)}`);
    setText("[data-bar-meta]", `${s.size} · ${eur(s.price)}`);
  };
  form.addEventListener("change", (e) => {
    render();
    if (e.target.name === "format" && images && main) {
      [main.src, main.alt] = images[e.target.value];
      galT?.go(0);
    }
  });
  $$("[data-qty]", form).forEach((b) =>
    b.addEventListener("click", () => {
      qty = Math.min(9, Math.max(1, qty + parseInt(b.dataset.qty, 10)));
      render();
    }),
  );
  const add = () => {
    const s = state();
    if (s.mode === "eng") {
      say("Option d’exemple : non disponible à la commande.");
      return;
    }
    const freq = s.mode === "abo" ? $('input[name="freq"]:checked', form).value : undefined;
    addHandle({ handle, size: s.size, freq, qty });
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    add();
  });
  $("[data-bar-add]")?.addEventListener("click", add);

  // Message tournant
  const rot = $("[data-rot]");
  if (rot) {
    const msgs = $$("li", rot);
    const rd = $$(".rot__d button", rot);
    let rIdx = 0;
    let rTimer;
    const showRot = (i) => {
      rIdx = i;
      msgs.forEach((m, n) => m.classList.toggle("is-on", n === i));
      rd.forEach((d, n) => (n === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
    };
    rd.forEach((d, i) =>
      d.addEventListener("click", () => {
        clearInterval(rTimer);
        showRot(i);
      }),
    );
    if (!reduce() && msgs.length > 1) {
      rTimer = setInterval(() => showRot((rIdx + 1) % msgs.length), 4200);
      rot.addEventListener("pointerenter", () => clearInterval(rTimer));
    }
  }

  // Étapes
  const stepsEl = $("[data-steps-track]");
  if (stepsEl) {
    const sb = $$("[data-step]");
    const stepsT = track(stepsEl, (i) => sb.forEach((b, n) => (n === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"))));
    sb.forEach((b, i) => b.addEventListener("click", () => stepsT.go(i)));
  }

  // Onglets
  const tabs = (list, onSelect) => {
    if (!list) return;
    const ts = $$('[role="tab"]', list);
    const select = (t) => {
      ts.forEach((x) => {
        const on = x === t;
        x.setAttribute("aria-selected", String(on));
        x.tabIndex = on ? 0 : -1;
        $("#" + x.getAttribute("aria-controls")).hidden = !on;
      });
      onSelect?.();
    };
    ts.forEach((t) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        const i = ts.indexOf(t);
        const n = ts[(i + (e.key === "ArrowRight" ? 1 : ts.length - 1)) % ts.length];
        n.focus();
        select(n);
      });
    });
  };
  const ip = $("[data-info-prev]");
  const inx = $("[data-info-next]");
  const curTrack = () => $$("[data-info-track]").find((t) => !t.hidden);
  const syncArr = () => {
    const t = curTrack();
    if (!t || !ip) return;
    const max = t.scrollWidth - t.clientWidth;
    ip.disabled = t.scrollLeft <= 2;
    inx.disabled = t.scrollLeft >= max - 2;
  };
  if (ip && inx) {
    $$("[data-info-track]").forEach((t) => t.addEventListener("scroll", () => requestAnimationFrame(syncArr), { passive: true }));
    const stepBy = (d) => {
      const t = curTrack();
      t.scrollBy({ left: d * (t.children[0].offsetWidth + 12), behavior: smooth });
    };
    ip.addEventListener("click", () => stepBy(-1));
    inx.addEventListener("click", () => stepBy(1));
    tabs($(".info__tabs"), syncArr);
    addEventListener("resize", syncArr);
    syncArr();
  }
  tabs($(".fq__cats"));

  // Avis
  const rvEl = $("[data-rv-track]");
  if (rvEl) {
    const rp = $("[data-rv-prev]");
    const rn = $("[data-rv-next]");
    const syncRv = (i) => {
      rp.disabled = i <= 0;
      rn.disabled = i >= rvEl.children.length - 1;
    };
    const rvT = track(rvEl, syncRv);
    rp.addEventListener("click", () => rvT.go(rvT.idx() - 1));
    rn.addEventListener("click", () => rvT.go(rvT.idx() + 1));
    syncRv(0);
  }

  // Tiroirs secondaires (tous les avis, retours)
  let last = null;
  let open = null;
  const openD = (id) => {
    const el = $("#" + id);
    if (!el) return;
    last = document.activeElement;
    open = el;
    open.hidden = false;
    requestAnimationFrame(() => open.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    setTimeout(() => $("[data-close-drawer].drawer__close", open)?.focus(), reduce() ? 0 : 60);
  };
  const closeD = () => {
    if (!open) return;
    const d = open;
    d.classList.remove("is-open");
    document.body.style.overflow = "";
    open = null;
    setTimeout(
      () => {
        d.hidden = true;
        last?.focus();
      },
      reduce() ? 0 : 420,
    );
  };
  $$("[data-open-drawer]").forEach((b) => b.addEventListener("click", () => openD(b.dataset.openDrawer)));
  $$("[data-close-drawer]").forEach((b) => b.addEventListener("click", closeD));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeD();
  });
  document.addEventListener("aoyuki:close-drawers", closeD);

  // Barre d'achat mobile
  const bar = $("[data-buybar]");
  const barBtn = $("[data-bar-add]");
  const cta = $("[data-pp-cta]");
  if (bar && cta) {
    let barF;
    const syncBar = () => {
      const on = cta.getBoundingClientRect().bottom < 0;
      bar.classList.toggle("is-on", on);
      bar.setAttribute("aria-hidden", String(!on));
      if (barBtn) barBtn.tabIndex = on ? 0 : -1;
    };
    addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(barF);
        barF = requestAnimationFrame(syncBar);
      },
      { passive: true },
    );
    addEventListener("resize", syncBar);
    syncBar();
  }
  render();
}
