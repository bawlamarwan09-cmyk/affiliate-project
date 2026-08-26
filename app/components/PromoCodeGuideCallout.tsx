import Link from "next/link";

export function PromoCodeGuideCallout() {
  return (
    <aside className="promo-code-guide" aria-labelledby="promo-code-guide-title">
      <div className="promo-code-guide-icon" aria-hidden="true">%</div>
      <div>
        <span className="promo-code-guide-eyebrow">Promo code help</span>
        <h2 id="promo-code-guide-title">Have a promotional code?</h2>
        <p>
          Follow our seven-step guide to check eligibility, apply the code at
          checkout, and verify the final price before ordering.
        </p>
      </div>
      <Link href="/howto">See how promo codes work <span aria-hidden="true">→</span></Link>
    </aside>
  );
}
