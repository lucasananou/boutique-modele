import Link from "next/link";

/* The FIRST DRAW mark, drawn from the jar label: half disc, sun dot, arch. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="mark-svg"
    >
      <path d="M14 3a8 8 0 0 0 0 16z" fill="currentColor" />
      <circle cx="22.5" cy="8" r="3.6" fill="#FFC53D" />
      <path
        d="M5 29a11 11 0 0 1 22 0h-5.2a5.8 5.8 0 0 0-11.6 0z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="First Draw, home">
      <Mark />
      FIRST DRAW
    </Link>
  );
}

const TICKER = [
  "Free Shipping On Orders Over $50",
  "60-Day Money-Back Guarantee",
  "575 mg IgG In Every Scoop",
  "Free Shipping On Orders Over $50",
  "60-Day Money-Back Guarantee",
];

export function Ticker() {
  return (
    <div className="ticker">
      {TICKER.map((t, i) => (
        <span key={i}>✣ {t}</span>
      ))}
    </div>
  );
}

export function Header({ cta = "Shop Now", href = "/#shop" }) {
  return (
    <header className="site-head">
      <Logo />
      <nav aria-label="Main">
        <a href="/#science">What&apos;s inside</a>
        <a href="/#shop">Shop</a>
        <a href="/product">Subscribe &amp; Save</a>
        <button type="button" data-quiz>
          Take the quiz
        </button>
      </nav>
      <div className="nav-actions">
        <button type="button" aria-label="Search" data-search>
          ⌕
        </button>
        <button
          type="button"
          aria-label="Open shopping bag"
          data-bag
          className="bag"
        >
          <Mark size={20} />
          <span data-count />
        </button>
        <a className="pill outline" href={href}>
          {cta} ↗
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-foot">
      <div className="footer-top">
        <div>
          <Logo />
          <h3 className="hand">Be first in line</h3>
          <form data-newsletter>
            <input
              type="email"
              required
              placeholder="Email address"
              aria-label="Email address"
            />
            <button type="submit">
              Subscribe
              <Mark size={16} />
            </button>
          </form>
          <p data-newsletter-msg role="status" className="nl-msg" />
        </div>
        <div className="footer-links">
          <div>
            Shop
            <a href="/product">Colostrum 575</a>
            <a href="/#shop">Bundles</a>
            <a href="/product">Subscribe &amp; Save</a>
            <a href="/pages/first-draw-hidden-discount">Starter offer</a>
          </div>
          <div>
            Learn
            <a href="/#science">What&apos;s inside</a>
            <a href="/#guide">A guide to colostrum</a>
            <a href="/product#facts">Supplement facts</a>
            <a href="/product#lot">Lot reports</a>
          </div>
          <div>
            Support
            <a href="/product#faq">FAQs</a>
            <a href="/shipping-returns">Shipping &amp; Returns</a>
            <a href="/account">Manage subscription</a>
            <button type="button" data-contact>
              Contact Us
            </button>
          </div>
        </div>
      </div>
      <div className="footer-social">
        <p className="hand">
          One scoop,
          <br />
          every morning.
        </p>
        <span className="currency">United States · $ USD</span>
        <a href="https://www.youtube.com" aria-label="YouTube">
          ▶
        </a>
        <a href="https://www.tiktok.com" aria-label="TikTok">
          ♪
        </a>
        <a href="https://www.instagram.com" aria-label="Instagram">
          ◎
        </a>
        <a href="https://www.facebook.com" aria-label="Facebook">
          f
        </a>
      </div>
      <div className="fda">
        *These statements have not been evaluated by the Food and Drug
        Administration. This product is not intended to diagnose, treat, cure,
        or prevent any disease. Contains milk. Consult your healthcare provider
        before use if you are pregnant, nursing, taking medication or have a
        dairy allergy.
      </div>
      <div className="legal">
        <span>© 2026 FIRST DRAW. All rights reserved.</span>
        <span>Bovine colostrum, 575 mg IgG per serving. Made in the USA.</span>
        <span className="legal-links">
          <a href="/terms">Terms of Use</a> · <a href="/privacy">Privacy</a> ·{" "}
          <a href="/subscription-terms">Subscription terms</a>
        </span>
      </div>
      <div className="wordmark" aria-hidden="true">
        FIRST DRAW
      </div>
    </footer>
  );
}
