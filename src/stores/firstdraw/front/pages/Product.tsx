import type { Metadata } from "next";
import { Ticker, Header, Footer, Mark } from "../Chrome";
import BuyBox from "../BuyBox";
import Gallery from "../Gallery";
import Faq from "../Faq";
import type { Catalog } from "../packs";
import { store } from "@/stores";

export const metadata: Metadata = {
  title: "Colostrum 575, 575 mg IgG per serving | FIRST DRAW",
  robots: { index: false, follow: false },
};

const FAQS = [
  {
    q: "How is the subscription billed?",
    a: "The discounted price is charged on each delivery at the interval you pick: 30, 60 or 90 days. You get an email before every renewal, and you can skip, reschedule or cancel from your account in one click.",
  },
  {
    q: "Does it taste like anything?",
    a: "Faintly of milk powder, nothing more. There is no flavoring in the jar, because flavoring would mean a second ingredient.",
  },
  {
    q: "What does “one origin” mean?",
    a: "Every jar is made from colostrum sourced through a single supply origin, collected only after the calf has fed. The lot code on the base ties your jar to its test report.",
  },
  {
    q: "Where do you ship?",
    a: "Within the United States for now, in 2 to 5 business days, free on orders over $50. You get a tracking link as soon as your order leaves the warehouse.",
  },
  {
    q: "Who should not take it?",
    a: "Anyone with a dairy or milk-protein allergy. If you are pregnant, nursing, immunocompromised or taking prescription medication, ask your clinician first.",
  },
];

export default function Product({ catalog }: { catalog: Catalog }) {
  return (
    <div className="page">
      <Ticker />
      <Header cta="Shop Now" href="#buy" />
      <main>
        <p className="crumbs">
          <a href="/">Home</a> / <a href="/#shop">Shop</a> / Colostrum 575
        </p>
        <section className="pdp" id="buy">
          <Gallery />
          <BuyBox
            catalog={catalog}
            intervals={store.subscriptions?.intervals ?? []}
            discountPercent={store.subscriptions?.discountPercent ?? 0}
          />
        </section>

        {/* manifesto, same block as home */}
        <section className="manifesto section" id="facts">
          <span className="badge">✣ What&apos;s in the jar</span>
          <h2>
            ONE INGREDIENT. <mark>575 MG OF IGG</mark>{" "}
            <br />
            PER SCOOP, ONE ORIGIN, AND A{" "}
            <br />
            <mark>REPORT FOR EVERY LOT</mark>
          </h2>
        </section>

        <div className="facts">
          <div>
            <small>Serving size</small>
            <b>1 scoop, 2.3 g</b>
          </div>
          <div>
            <small>Bovine colostrum</small>
            <b>2,300 mg</b>
          </div>
          <div className="hl">
            <small>Of which IgG, 25%</small>
            <b>575 mg</b>
          </div>
          <div>
            <small>Servings per jar</small>
            <b>30</b>
          </div>
          <div>
            <small>Net weight</small>
            <b>69 g, 2.43 oz</b>
          </div>
          <div>
            <small>Allergen</small>
            <b>Milk</b>
          </div>
        </div>

        {/* feature grid, as on home */}
        <section className="wellness section" style={{ paddingTop: 80 }}>
          <div className="feature-grid">
            <article>
              <small>How to take it | 60 seconds</small>
              <h3>
                One scoop in six to eight
                <br />
                ounces of cold water
              </h3>
              <img
                src="/stores/firstdraw/img/fd-scoop.jpg"
                alt="A scoop heaped with colostrum powder next to the open jar"
              />
            </article>
            <article id="lot">
              <small>Batch testing | every lot</small>
              <h3>
                The lot code on the base
                <br />
                opens its report
              </h3>
              <div className="immunity-copy">
                <span className="tag">IgG assay</span>
                <p>Released only if it reaches 25%</p>
                <span className="tag yellow">Lot report</span>
                <p>
                  Published online before
                  <br />
                  the jar ships
                </p>
              </div>
              <img src="/stores/firstdraw/img/fd-hand.jpg" alt="A hand holding the jar" />
            </article>
          </div>
        </section>

        {/* find split, as on home */}
        <section className="find">
          <img
            src="/stores/firstdraw/img/fd-grass.jpg"
            alt="The First Draw jar standing in dewy pasture grass at sunrise"
          />
          <div>
            <h2>
              SIXTY DAYS,
              <br />
              OPENED JARS TOO
            </h2>
            <p className="hand gold">Try it on your own mornings</p>
            <p>
              Take it every morning for two months. If you would not buy it
              again, email us and we refund the order, even if the jar is
              empty.
            </p>
            <ul>
              <li>60-day money-back guarantee</li>
              <li>Free shipping over $50, 2 to 5 business days</li>
              <li>Cancel a subscription online in one click</li>
            </ul>
            <a className="pill" href="#buy">
              Choose your pack
              <Mark size={16} />
            </a>
          </div>
        </section>

        {/* reviews: verified buyers only, opens with the first jars */}
        <section className="guide section" id="reviews">
          <span className="badge">Reviews</span>
          <h2>VERIFIED ONLY</h2>
          <div className="slot">
            <b>First jars ship this fall</b>
            Reviews from verified buyers will appear here, dated and
            unedited. Never written by us.
          </div>
        </section>

        <section className="guide section" id="faq" style={{ paddingTop: 0 }}>
          <span className="badge">FAQ</span>
          <h2>BEFORE YOU ORDER</h2>
          <Faq items={FAQS} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
