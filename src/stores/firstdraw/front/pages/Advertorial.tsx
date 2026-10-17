import type { Metadata } from "next";
import { Ticker, Header, Footer, Mark } from "../Chrome";
import Faq from "../Faq";
import { addAttrs, perServing, usd, type Catalog } from "../packs";

export const metadata: Metadata = {
  title: "The colostrum number nobody prints | FIRST DRAW",
  robots: { index: false, follow: false },
};

const FAQS = [
  {
    q: "Is the discount real, or is the price inflated first?",
    a: "The $88 two-jar price is the standing one-time price on the product page, every day. The 18% is the subscription discount applied to that price. Nothing is marked up to be marked down.",
  },
  {
    q: "Does the calf get the colostrum first?",
    a: "Yes. Collection happens only from surplus after the calf has fed. It is written into the supply agreement.",
  },
  {
    q: "How do I cancel?",
    a: "From your account page, one click, no email thread, no phone call. You can also skip a single delivery or push the date back.",
  },
  {
    q: "When will I feel something?",
    a: "We cannot tell you that, and we are not going to guess. The jar is thirty servings and the guarantee is sixty days so that you can decide for yourself.",
  },
  {
    q: "Who should avoid it?",
    a: "Anyone with a dairy or milk-protein allergy. Speak to a clinician first if you are pregnant, nursing, immunocompromised or on prescription medication.",
  },
];

export default function Advertorial({ catalog }: { catalog: Catalog }) {
  // Offre de départ : 2 pots en abonnement tous les 60 jours (prix lus en base).
  const offer = catalog.packs.find((p) => p.units === 2) ?? catalog.packs[0];
  return (
    <div className="page">
      <Ticker />
      <Header cta="Claim the offer" href="#offer" />
      <main>
        <article className="article">
          <span className="badge">Advertorial, First Draw Co.</span>
          <h1>
            We compared colostrum labels for four months. Few print the number
            that matters.
          </h1>
          <p className="hand note">Hint: it&apos;s not the big one.</p>
          <p className="byline">
            By the First Draw team. Updated October 2026, 6 min read
          </p>
          <p>
            Colostrum went from a farm-supply curiosity to a $60-a-month habit
            in about two years. The jars got prettier. The copy got louder. And
            somewhere along the way the labels stopped saying how much of the
            active fraction was actually in them.
          </p>
          <p>
            Here is the mechanic. Colostrum powder is sold by immunoglobulin G
            content, the IgG percentage. A jar can be 15% IgG or 30% IgG and
            look identical in the scoop, and the difference in raw-material
            cost is enormous. So the convenient move is to print the total
            milligrams of powder, which is a big satisfying number, and never
            mention the percentage.
          </p>
          <p>
            <mark>
              3,000 mg of 15% colostrum is 450 mg of IgG. 2,300 mg of 25%
              colostrum is 575 mg.
            </mark>{" "}
            The smaller-sounding jar has more of the thing you are buying, and
            you cannot tell which one you are holding unless the brand tells
            you.
          </p>
          <figure>
            <img
              src="/stores/firstdraw/img/fd-hand.jpg"
              alt="A hand holding the First Draw jar, 575 mg IgG printed on the front"
              style={{ aspectRatio: "16 / 10", objectFit: "cover" }}
            />
            <figcaption>575 mg IgG, on the front, where you can see it.</figcaption>
          </figure>

          <h2>What colostrum is, and what it is not</h2>
          <p>
            Colostrum is the first milk a mammal produces after birth. In
            cattle, the surplus beyond what the calf drinks is collected,
            filtered and dried. It is a food, concentrated.
          </p>
          <p>
            It is <em>not</em> a medicine. It does not treat, prevent or cure
            anything, and any page that tells you otherwise is making a claim
            it cannot legally support. What we can say is that it is a daily
            supplement taken to support gut health and immune function.* That
            asterisk means what it says.
          </p>
          <p className="pullquote">
            If a supplement page promises you a feeling by a <mark>specific
            date</mark>, you are reading fiction.
          </p>

          <h2>What actually changes is the morning</h2>
          <p>
            We will not show you a before-and-after photo, because there is
            nothing honest to photograph. What we can describe is the routine:
            one scoop in cold water before coffee, one jar that visibly ends
            after thirty days, and a lot code on the base that opens its test
            report online.
          </p>
        </article>

        <div className="wide" style={{ marginTop: 30 }}>
          <div className="quiz-banner" style={{ marginTop: 0 }}>
            <span className="avatars">
              <Mark size={36} />
            </span>
            <span>Not sure which pack?</span>
            <span className="emoji">✣</span>
            <button type="button" className="pill" data-quiz>
              Take the quiz ↪
            </button>
          </div>
        </div>

        <section className="wellness section" id="inside">
          <div className="feature-grid">
            <article>
              <small>One ingredient | nothing added</small>
              <h3>
                2,300 mg of colostrum,
                <br />
                575 mg of it IgG
              </h3>
              <img
                src="/stores/firstdraw/img/fd-scoop.jpg"
                alt="A scoop heaped with colostrum powder next to the open jar"
              />
            </article>
            <article>
              <small>One origin | tested lot by lot</small>
              <h3>
                A report for every lot,
                <br />
                published before it ships
              </h3>
              <div className="immunity-copy">
                <span className="tag">Day 1</span>
                <p>One scoop in cold water, before coffee</p>
                <span className="tag yellow">Day 60</span>
                <p>
                  Keep going, or ask for a refund,
                  <br />
                  opened jars included
                </p>
              </div>
              <img src="/stores/firstdraw/img/fd-shop1.jpg" alt="The First Draw jar" />
            </article>
          </div>
        </section>

        <section className="section" id="offer" style={{ paddingTop: 80 }}>
          <div className="offer-card">
            <img
              src="/stores/firstdraw/img/fd-shop2.jpg"
              alt="Two First Draw jars side by side"
            />
            <div>
              <span className="card-tag" style={{ position: "static" }}>
                Most popular
              </span>
              <h2>Two jars, 60 days</h2>
              <p className="hand" style={{ fontSize: 18 }}>
                The starter offer, on a subscription.
              </p>
              <div className="price-line">
                <span className="price-now">{usd(offer.subPrice)}</span>
                <span className="price-each">
                  instead of {usd(offer.price)}, then {perServing(offer.subPrice, offer.units)} a serving
                </span>
              </div>
              <ul className="ticks">
                <li>18% off this order and every renewal</li>
                <li>Free shipping, 2 to 5 business days</li>
                <li>60-day guarantee, opened jars included</li>
                <li>Cancel or skip online in one click</li>
              </ul>
              <div className="btns">
                <button
                  type="button"
                  className="pill"
                  {...addAttrs(catalog, offer, offer.units * 30)}
                  data-open-bag=""
                >
                  Claim the starter offer
                  <Mark size={16} />
                </button>
                <a className="pill outline" href="/product">
                  Start with one jar ↗
                </a>
              </div>
              <p className="fine" style={{ marginTop: 16 }}>
                Secure checkout by Stripe. A subscription renews automatically at
                the discounted price on the interval you choose. You are emailed before each renewal and can cancel at
                any time. One starter offer per customer.
              </p>
            </div>
          </div>
        </section>

        <section className="guide section" id="faq">
          <span className="badge">FAQ</span>
          <h2>THE QUESTIONS WE GET</h2>
          <Faq items={FAQS} />
          <div className="slot" style={{ marginTop: 50 }}>
            <b>Customer stories start this fall</b>
            Unscripted videos from verified buyers, dated. Never paid actors,
            never scripted.
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
