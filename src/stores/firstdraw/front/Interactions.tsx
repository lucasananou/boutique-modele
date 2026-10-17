"use client";

import { useEffect } from "react";
import { addToBag, bagTotals, BAG_EVENT, clearBag, readBag, setQuantity, usd } from "./cart";
import { trackPixel } from "./Pixels";
import { subscribeNewsletter } from "./actions";

/* Port of Mycel's app.js: one modal, one toast, the bag, sliders with
   dashed arrows, quiz, search, story. Everything is wired by data-
   attributes through event delegation, so server-rendered markup stays
   plain HTML and works the same on the three pages. */

const esc = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export default function Interactions() {
  useEffect(() => {
    const modal = document.querySelector<HTMLDialogElement>("#modal");
    const content = document.querySelector<HTMLDivElement>("#modal-content");
    const toastEl = document.querySelector<HTMLDivElement>("#toast");
    if (!modal || !content || !toastEl) return;
    let toastTimer: ReturnType<typeof setTimeout>;

    const show = (html: string) => {
      content.innerHTML = html;
      if (!modal.open) modal.showModal();
    };
    const toast = (msg: string) => {
      toastEl.textContent = msg;
      toastEl.classList.add("visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 2800);
    };
    const paintCount = () => {
      const n = bagTotals(readBag()).count;
      document.querySelectorAll("[data-count]").forEach((el) => {
        el.textContent = n ? ` (${n})` : "";
      });
    };
    paintCount();

    /* The bag: real lines (pack, plan, quantity), totals with the same
       shipping rule as checkout, then the checkout page. */
    const bag = () => {
      const items = readBag();
      const t = bagTotals(items);
      show(
        items.length
          ? `<h2>Your bag</h2>${items
              .map(
                (i) =>
                  `<div class="bag-item"><img src="${esc(i.img)}" alt=""><div><p class="bag-line"><span>${esc(i.name)}</span><span>${usd(i.unitPrice * i.quantity)}</span></p><p class="bag-meta">${
                    i.intervalDays ? `Delivered every ${i.intervalDays} days, cancel anytime` : "One-time purchase"
                  }</p><div class="bag-qty"><button type="button" data-qty="${esc(i.key)}" data-delta="-1" aria-label="One less">−</button><span>${i.quantity}</span><button type="button" data-qty="${esc(i.key)}" data-delta="1" aria-label="One more">+</button><button type="button" class="bag-remove" data-qty="${esc(i.key)}" data-delta="-99">Remove</button></div></div></div>`,
              )
              .join("")}<hr><p class="bag-line"><span>Subtotal</span><span>${usd(t.subtotal)}</span></p><p class="bag-line"><span>Shipping</span><span>${t.shipping ? usd(t.shipping) : "Free"}</span></p><p class="bag-line"><b>Total</b><b>${usd(t.total)}</b></p>${
              !t.hasSub && t.shipping ? `<p class="fine">Free shipping from $50, or on any subscription.</p>` : ""
            }<a class="pill" href="/checkout" data-close>Checkout ↗</a><button class="pill outline" data-clear>Empty the bag</button><p class="fine">We ship to US addresses only.</p>`
          : `<h2>Your bag</h2><p>Your bag is empty. Your first morning scoop starts here.</p><a class="pill" href="/#shop" data-close>Shop the packs ↗</a>`,
      );
    };

    const quiz = () => {
      show(
        `<span class="badge">Pack finder</span><h2>How do you want to start?</h2><p>Pick the answer that sounds most like you.</p><div class="quiz-opts"><button class="pill" data-goal="1">I want to try it first</button><button class="pill" data-goal="2">I want to build the habit</button><button class="pill" data-goal="s">I already know I’ll keep going</button></div>`,
      );
    };
    const RESULTS: Record<string, [string, string]> = {
      "1": [
        "One jar, $49",
        "Thirty servings, thirty mornings. Enough to see whether the routine fits your day, backed by our 60-day guarantee.",
      ],
      "2": [
        "Two jars, $88",
        "Sixty servings at $1.47 each, our most popular pack. A new morning habit usually needs more than one jar to settle in.",
      ],
      s: [
        "Subscribe & save 18%",
        "Two jars delivered every 60 days for $72.16, or $1.20 a serving. Skip, move or cancel online in one click.",
      ],
    };

    const story = () =>
      show(
        `<span class="badge">Our story</span><h2>One origin. The first hours.</h2><p>Colostrum is the first milk a cow makes after calving. Ours comes from one origin, collected only after the calf has fed, then dried at low temperature and tested lot by lot.</p><img src="/stores/firstdraw/img/fd-pasture.jpg" alt="A dairy pasture at sunrise" class="modal-img"><p class="fine">Pasture, first hours, low-heat drying, IgG assay, your jar. Five steps, one ingredient, a lot code on every base.</p>`,
      );

    const search = () => {
      show(
        `<h2>Search First Draw</h2><input id="search-field" class="field" placeholder="Try jar, subscribe or IgG" aria-label="Search"><div id="results"></div>`,
      );
      const field = document.querySelector<HTMLInputElement>("#search-field");
      const out = document.querySelector<HTMLDivElement>("#results");
      field?.focus();
      const LIST: [string, string][] = [
        ["One jar, 30 servings", "/product"],
        ["Two jars, most popular", "/product"],
        ["Three jars, best price per serving", "/product"],
        ["Subscribe & save 18%", "/product"],
        ["What’s inside: 575 mg IgG", "/#science"],
        ["A guide to colostrum", "/#guide"],
        ["Starter offer", "/pages/first-draw-hidden-discount"],
      ];
      field?.addEventListener("input", () => {
        if (!out) return;
        const q = field.value.toLowerCase().trim();
        out.innerHTML = q
          ? LIST.filter(([t]) => t.toLowerCase().includes(q))
              .map(([t, h]) => `<p><a href="${h}" data-close>${t} ↗</a></p>`)
              .join("") || "<p>No results. Try “jar”.</p>"
          : "";
      });
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t === modal) return modal.close();
      const el = t.closest<HTMLElement>(
        "[data-slide],[data-product],[data-qty],[data-bag],[data-quiz],[data-goal],[data-story],[data-search],[data-contact],[data-close],[data-clear],#close",
      );
      if (!el) return;
      const d = el.dataset;
      if (el.id === "close") return modal.close();
      if (d.slide) {
        const s = document.getElementById(d.target || "");
        s?.scrollBy({
          left: s.clientWidth * 0.7 * Number(d.slide),
          behavior: "smooth",
        });
        return;
      }
      if (d.product) {
        e.preventDefault();
        if (!d.vid || !d.pid || !d.slug) return;
        const interval = d.interval ? Number(d.interval) : undefined;
        const result = addToBag({
          productId: d.pid,
          slug: d.slug,
          variantId: d.vid,
          name: d.product,
          pack: d.pack || "",
          unitPrice: Math.round(Number(d.price || 0) * 100),
          intervalDays: interval,
          img: d.img || "",
        });
        paintCount();
        trackPixel("AddToCart", { value: Number(d.price || 0), currency: "USD" });
        toast(
          result === "replaced"
            ? "Subscription updated in your bag (one per order)"
            : `${d.product} added to your bag`,
        );
        if ("openBag" in d) bag();
        return;
      }
      if (d.qty) {
        const line = readBag().find((l) => l.key === d.qty);
        if (line) setQuantity(line.key, line.quantity + Number(d.delta || 0));
        paintCount();
        return bag();
      }
      if ("bag" in d) return bag();
      if ("quiz" in d) return quiz();
      if ("story" in d) return story();
      if ("search" in d) return search();
      if ("clear" in d) {
        clearBag();
        paintCount();
        return bag();
      }
      if (d.goal) {
        const [h, p] = RESULTS[d.goal];
        show(
          `<span class="badge">Your match</span><h2>${h}</h2><p>${p}</p><p class="fine">A shopping guide, not health advice. Talk to your clinician if you are pregnant, nursing, on medication or allergic to milk.</p><a class="pill" href="/product" data-close>See it on the product page ↗</a>`,
        );
        return;
      }
      if ("contact" in d) {
        show(
          `<h2>FIRST DRAW</h2><p>Questions about an order, a subscription or the product? Email <a href="mailto:support@firstdrawco.com"><b>support@firstdrawco.com</b></a> and a person answers within one business day.</p><p>We ship within the US in 2 to 5 business days, free over $50, and every order is covered by a 60-day money-back guarantee, opened jars included.</p><a class="pill outline" href="/shipping-returns" data-close>Shipping &amp; Returns ↗</a><a class="pill outline" href="/account" data-close>Manage subscription ↗</a>`,
        );
        return;
      }
      if ("close" in d) modal.close();
    };

    /* Slider progress bar follows the real scroll position. */
    const bars: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>("[data-progress]").forEach((bar) => {
      const s = document.getElementById(bar.dataset.progress || "");
      if (!s) return;
      const paint = () => {
        const max = s.scrollWidth - s.clientWidth;
        const seen = (s.clientWidth + s.scrollLeft) / s.scrollWidth;
        bar.style.setProperty(
          "--p",
          `${Math.round((max > 0 ? seen : 1) * 100)}%`,
        );
      };
      s.addEventListener("scroll", paint, { passive: true });
      window.addEventListener("resize", paint);
      paint();
      bars.push(() => {
        s.removeEventListener("scroll", paint);
        window.removeEventListener("resize", paint);
      });
    });

    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if (!f.matches("[data-newsletter]")) return;
      e.preventDefault();
      const msg = f.parentElement?.querySelector("[data-newsletter-msg]");
      const email = f.querySelector<HTMLInputElement>("input[type=email]")?.value ?? "";
      if (msg) msg.textContent = "One moment…";
      subscribeNewsletter(email)
        .then((ok) => {
          if (msg)
            msg.textContent = ok
              ? "Thank you, you are on the list. We only write when it is worth reading."
              : "That email doesn't look right. Please check it.";
          if (ok) f.reset();
        })
        .catch(() => {
          if (msg) msg.textContent = "Something went wrong. Please try again.";
        });
    };

    /* Bag changed in another tab, or by the checkout page. */
    const onBag = () => paintCount();
    window.addEventListener(BAG_EVENT, onBag);
    window.addEventListener("storage", onBag);

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener(BAG_EVENT, onBag);
      window.removeEventListener("storage", onBag);
      bars.forEach((f) => f());
    };
  }, []);

  return null;
}
