import { Ticker, Header, Footer, Mark } from "../Chrome";
import { addAttrs, perServing, usd, type Catalog, type Pack as DbPack } from "../packs";

type Pack = {
  units: number;
  name: string;
  img: string;
  alt: string;
  note: [string, string];
  qty: string;
  per: string;
  benefit: string;
  price: number;
  label: string;
  filled?: boolean;
  tag?: string;
};

const PACKS: Pack[] = [
  {
    units: 1,
    name: "One jar",
    img: "/stores/firstdraw/img/fd-shop1.jpg",
    alt: "One First Draw colostrum jar on a white background",
    note: ["Thirty mornings to see if", "the routine fits your day."],
    qty: "30 Servings",
    per: "$1.63 a serving",
    benefit: "Supports gut health and immune function.*",
    price: 49,
    label: "One jar",
  },
  {
    units: 2,
    name: "Two jars",
    img: "/stores/firstdraw/img/fd-shop2.jpg",
    alt: "Two First Draw colostrum jars side by side",
    note: ["Sixty mornings, long enough", "for a habit to take hold."],
    qty: "60 Servings",
    per: "$1.47 a serving",
    benefit: "Our most popular pack. Save 10%.",
    price: 88,
    label: "Two jars",
    filled: true,
    tag: "Most popular",
  },
  {
    units: 3,
    name: "Three jars",
    img: "/stores/firstdraw/img/fd-shop3.jpg",
    alt: "Three First Draw colostrum jars grouped together",
    note: ["Ninety mornings at our", "lowest one-time price."],
    qty: "90 Servings",
    per: "$1.30 a serving",
    benefit: "Best price per serving. Save 20%.",
    price: 117,
    label: "Three jars",
  },
];

const GUIDE = [
  {
    img: "/stores/firstdraw/img/fd-guide-powder.jpg",
    alt: "A small heap of colostrum powder beside a scoop",
    title: "Immunoglobulin G",
    text: "IgG is the antibody fraction colostrum is valued for. Every scoop holds 575 mg, and that number is printed on the front of the jar.",
    tags: ["575 mg", "25% IgG", "Per serving", "On the label"],
  },
  {
    img: "/stores/firstdraw/img/fd-guide-can.jpg",
    alt: "A stainless steel milk can",
    title: "The First Hours",
    text: "Colostrum is the first milk a cow makes after calving. Ours comes from one origin and is collected only after the calf has fed.",
    tags: ["One origin", "Grass-fed", "Calf first", "USA"],
  },
  {
    img: "/stores/firstdraw/img/fd-guide-lab.jpg",
    alt: "A test tube with white powder in a rack",
    title: "Tested Lot by Lot",
    text: "Every lot is assayed for IgG and screened before it ships. The lot code on the base of your jar links it to its test report.",
    tags: ["IgG assay", "Lot code", "Report online", "cGMP"],
  },
  {
    img: "/stores/firstdraw/img/fd-guide-glass.jpg",
    alt: "A glass of water with the drink just stirred",
    title: "Your Daily Scoop",
    text: "One scoop in six to eight ounces of cold water, before coffee. It tastes faintly of milk, because nothing else goes in the jar.",
    tags: ["One scoop", "Cold water", "60 seconds"],
  },
];

export default function Home({ catalog }: { catalog: Catalog }) {
  // Prix lus en base : pack de N pots ↔ carte N ; abonnement mis en avant = 2 pots.
  const byUnits = (n: number) => catalog.packs.find((x) => x.units === n) ?? catalog.packs[0];
  const featured = byUnits(2);
  return (
    <div className="page">
      <Ticker />
      <Header />
      <main>
        {/* HERO */}
        <section className="hero">
          <div className="hero-art">
            <img
              src="/stores/firstdraw/img/fd-hero.jpg"
              alt="Early morning on a dairy pasture, someone holds a First Draw jar"
              fetchPriority="high"
            />
            <div className="hero-copy">
              <p className="hand hero-note">
                There&apos;s a reason
                <br />
                it&apos;s called first draw
              </p>
              <h1>
                Colostrum for
                <br />
                the modern
                <br />
                morning
              </h1>
              <p className="hand hero-note2">
                Day
                <br />
                one
              </p>
              <div className="hero-cta">
                <a className="pill white" href="#shop">
                  Shop the jar <span className="sep" />
                  <Mark size={18} />
                </a>
                <span className="vbar" />
                <button type="button" className="watch" data-story>
                  <span className="play">▶</span>
                  <span>
                    Read
                    <br />
                    our story
                  </span>
                </button>
              </div>
            </div>
          </div>
          <aside>
            <img src="/stores/firstdraw/img/fd-shop1.jpg" alt="The First Draw jar" />
            <p className="hand">
              One scoop, one ingredient,
              <br />
              nothing else
            </p>
            <div className="info">
              <h3>At a Glance</h3>
              <em>The first scoop of your day</em>
              <a href="#shop">
                <span>
                  <Mark size={13} /> One jar, 30 servings
                </span>
                <span>↗</span>
              </a>
              <a href="/product">
                <span>
                  <Mark size={13} /> Subscribe &amp; save 18%
                </span>
                <span>↗</span>
              </a>
              <strong>
                575<small>mg IgG</small>
              </strong>
              <em>Per scoop, printed on the front.</em>
            </div>
          </aside>
        </section>

        {/* SHOP */}
        <section className="shop section" id="shop">
          <div className="section-title">
            <h2 className="h1">Choose your pack</h2>
            <a className="pill" href="/product">
              Compare packs
              <Mark size={16} />
            </a>
          </div>
          <div className="slider" id="products">
            {PACKS.slice(0, 1).map((p) => (
              <ProductCard key={p.name} p={p} catalog={catalog} pack={byUnits(p.units)} />
            ))}
            <article className="story-card">
              <img
                src="/stores/firstdraw/img/fd-pasture.jpg"
                alt="Cows grazing on a misty pasture at sunrise"
              />
              <span className="story-chip">✣ One origin, one herd network</span>
              <p className="hand story-quote">
                “Collected in the first hours after calving, only once the calf
                has fed. That is where the name comes from.”
              </p>
              <button
                type="button"
                data-story
                aria-label="Discover where our colostrum comes from"
              />
            </article>
            {PACKS.slice(1).map((p) => (
              <ProductCard key={p.name} p={p} catalog={catalog} pack={byUnits(p.units)} />
            ))}
            <article className="product">
              <img
                src="/stores/firstdraw/img/fd-hand.jpg"
                alt="A hand holding a First Draw jar"
              />
              <p className="hand">
                Two jars every sixty days.
                <br />
                Skip or cancel anytime.
              </p>
              <div className="spec">
                <span>
                  Plan
                  <br />
                  Subscribe &amp; Save
                </span>
                <span>
                  Price
                  <br />
                  {perServing(featured.subPrice, featured.units)} a serving
                </span>
              </div>
              <p className="benefit">18% off every order, free shipping.</p>
              <a className="add" href="/product">
                {`Subscribe – ${usd(featured.subPrice)}`}
              </a>
            </article>
          </div>
          <div className="slider-controls">
            <button
              type="button"
              data-slide="-1"
              data-target="products"
              aria-label="Previous packs"
            >
              ‹
            </button>
            <div className="progress" data-progress="products" />
            <button
              type="button"
              data-slide="1"
              data-target="products"
              aria-label="Next packs"
            >
              ›
            </button>
          </div>
        </section>

        {/* MANIFESTO */}
        <section className="manifesto section" id="science">
          <span className="badge">✣ Single origin</span>
          <h2>
            <mark>FIRST DRAW</mark> PUTS 575 MG OF IGG{" "}
            <br />
            IN EVERY SCOOP, FROM ONE ORIGIN,{" "}
            <br />
            WITH A <mark>TEST REPORT FOR EVERY LOT</mark>
          </h2>
          <div className="quiz-banner" id="quiz">
            <span className="avatars">
              <Mark size={36} />
            </span>
            <span>Not sure which pack?</span>
            <span className="emoji">✣</span>
            <button type="button" className="pill" data-quiz>
              Take the quiz ↪
            </button>
          </div>
        </section>

        {/* WELLNESS */}
        <section className="wellness section">
          <div className="runner">
            <img
              src="/stores/firstdraw/img/fd-runner.jpg"
              alt="A woman out for a morning run, smiling"
            />
            <svg
              className="arc"
              viewBox="0 0 1440 700"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 700 Q720 -60 1440 700"
                fill="none"
                stroke="var(--line-2)"
                strokeWidth="3"
              />
              <path
                d="M0 700 Q720 -60 1440 700"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="5"
                pathLength="1"
                className="arc-fill"
              />
            </svg>
            <h2 className="runner-title">
              One scoop,
              <br />
              every morning
            </h2>
            <p className="runner-sub">
              A simple daily ritual to support gut health and immune
              function.*
            </p>
            <span className="arc-dot" aria-hidden="true" />
            <span className="runner-tag">Day 30</span>
            <div className="runner-stat left">
              <small>IgG per serving</small>
              <b>575mg</b>
            </div>
            <div className="runner-stat right">
              <small>Ingredients in the jar</small>
              <b>1</b>
            </div>
            <div className="runner-buttons">
              <a className="pill" href="#shop">
                Get Started
                <Mark size={16} />
              </a>
              <a className="pill white" href="#guide">
                Learn More　↗
              </a>
            </div>
          </div>
          <div className="feature-grid">
            <article>
              <small>30 Servings | 1 ingredient, nothing added</small>
              <h3>
                Colostrum 575
                <br />– Unflavored
              </h3>
              <img
                src="/stores/firstdraw/img/fd-scoop.jpg"
                alt="A scoop heaped with colostrum powder next to the open jar"
              />
              <a className="pill" href="/product">
                Learn More ↗
              </a>
            </article>
            <article>
              <small>Your first 30 days | one jar</small>
              <h3>
                Build a habit that
                <br />
                survives a bad week
              </h3>
              <div className="immunity-copy">
                <span className="tag">Day 1</span>
                <p>One scoop in cold water, before coffee</p>
                <span className="tag yellow">Day 30</span>
                <p>
                  The jar runs out. Reorder, subscribe,
                  <br />
                  or use the 60-day guarantee
                </p>
              </div>
              <img src="/stores/firstdraw/img/fd-hand.jpg" alt="A hand holding the jar" />
            </article>
          </div>
        </section>

        {/* FIND */}
        <section className="find">
          <img
            src="/stores/firstdraw/img/fd-grass.jpg"
            alt="The First Draw jar standing in dewy pasture grass at sunrise"
          />
          <div>
            <h2>
              FIND WHAT YOUR
              <br />
              MORNING NEEDS
            </h2>
            <p className="hand gold">Three questions, one pack</p>
            <p>
              One jar to try it, two to build the habit, a subscription once
              you know it fits. Answer three questions and we point you to
              the right pack.
            </p>
            <ul>
              <li>Find the right pack for your routine</li>
              <li>See the price per serving before you buy</li>
              <li>Skip, move or cancel a subscription online</li>
            </ul>
            <button type="button" className="pill" data-quiz>
              Find my pack　↗
            </button>
          </div>
        </section>

        {/* GUIDE */}
        <section className="guide section" id="guide">
          <span className="badge">Colostrum</span>
          <h2>A GUIDE TO COLOSTRUM</h2>
          <div className="slider" id="guide-cards">
            {GUIDE.map((g) => (
              <article className="guide-card" key={g.title}>
                <img src={g.img} alt={g.alt} />
                <h3 className="hand">{g.title}</h3>
                <p>{g.text}</p>
                <div className="tags">
                  {g.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="slider-controls">
            <button
              type="button"
              data-slide="-1"
              data-target="guide-cards"
              aria-label="Previous cards"
            >
              ‹
            </button>
            <div className="progress" data-progress="guide-cards" />
            <button
              type="button"
              data-slide="1"
              data-target="guide-cards"
              aria-label="Next cards"
            >
              ›
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ProductCard({ p, catalog, pack }: { p: Pack; catalog: Catalog; pack: DbPack }) {
  return (
    <article className="product">
      {p.tag && <span className="card-tag">{p.tag}</span>}
      <img src={p.img} alt={p.alt} />
      <p className="hand">
        {p.note[0]}
        <br />
        {p.note[1]}
      </p>
      <div className="spec">
        <span>
          Pack
          <br />
          {p.name}
        </span>
        <span>
          Quantity
          <br />
          {p.qty}
        </span>
      </div>
      <p className="benefit">
        {p.benefit} <span className="per">{perServing(pack.price, pack.units)} a serving</span>
      </p>
      <button
        type="button"
        className={p.filled ? "add filled" : "add"}
        {...addAttrs(catalog, pack)}
      >
        {`Add to Cart – ${usd(pack.price)}`}
      </button>
    </article>
  );
}
