import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AffiliateDisclosure } from "../components/AffiliateDisclosure";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { JsonLd } from "../components/JsonLd";
import { PageEvent } from "../components/PageEvent";
import { PublicShell } from "../components/PublicShell";
import { RichText } from "../guides/ContentPrimitives";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { publicApi } from "../lib/public-api";
import { absoluteUrl, entityMetadata } from "../lib/seo";
import styles from "./page.module.css";

type HowToPage = {
  id: string;
  slug: string;
  title: string;
  intro?: string | null;
  content: string;
  publishedAt?: string | null;
  updatedAt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  schemaEnabled?: boolean;
};

type Step = { title: string; paragraphs: string[]; bullets: string[] };
const getHowToPage = cache(() => publicApi<HowToPage>("/pages/howto"));

function parseSteps(content: string): Step[] {
  return content.split(/\n(?=##\s+)/g).flatMap((raw) => {
    const block = raw.trim();
    if (!block.startsWith("## ")) return [];
    const [heading, ...bodyLines] = block.split("\n");
    const paragraphs: string[] = [];
    const bullets: string[] = [];
    for (const section of bodyLines.join("\n").trim().split(/\n\s*\n/)) {
      const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!lines.length) continue;
      if (lines.every((line) => /^[-*]\s/.test(line))) bullets.push(...lines.map((line) => line.replace(/^[-*]\s+/, "")));
      else paragraphs.push(lines.join(" "));
    }
    return [{ title: heading.slice(3).trim(), paragraphs, bullets }];
  }).slice(0, 12);
}

function StepVisual({ index }: { index: number }) {
  const labels = ["Find the offer", "Read the terms", "Open the listing", "Clip coupon", "Review your cart", "Apply the code", "Check the total"];
  return <div className={styles.stepVisual} aria-hidden="true">
    <div className={styles.mockWindow}>
      <div className={styles.mockToolbar}><span/><span/><span/><i>secure checkout</i></div>
      <div className={styles.mockBody}>
        <div className={styles.mockLabel}>{labels[index] || "Shopping step"}</div>
        {index === 0 && <><div className={styles.mockSearch}>Search products and deals <b>⌕</b></div><div className={styles.mockDeal}><i/><span/><button>View offer</button></div></>}
        {index === 1 && <><div className={styles.mockTerms}><b>Offer details</b><span/><span/><span/></div><div className={styles.mockNote}>◆ Check eligibility and expiration</div></>}
        {index === 2 && <><div className={styles.mockProduct}><i/><div><b>Exact product listing</b><span/><span/><small>Seller and returns</small></div></div><button className={styles.mockOrange}>Continue to retailer</button></>}
        {index === 3 && <><label className={styles.mockCoupon}><span>✓</span><b>Clip eligible coupon</b></label><div className={styles.mockNote}>Read the coupon terms first</div></>}
        {index === 4 && <><div className={styles.mockProduct}><i/><div><b>Correct item and variation</b><span/><small>Quantity: 1</small></div></div><div className={styles.mockTotal}><span>Cart subtotal</span><b>$—.—</b></div></>}
        {index === 5 && <><div className={styles.mockCode}><span>PROMO CODE</span><button>Apply</button></div><div className={styles.mockNote}>Paste the code exactly as shown</div></>}
        {index >= 6 && <><div className={styles.mockSuccess}>✓ Promotional discount applied</div><div className={styles.mockTotal}><span>Order total</span><b>Verify price</b></div></>}
      </div>
    </div>
  </div>;
}

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getHowToPage(), api.settings()]);
  if (!page) return { title: "Promo code guide", robots: { index: false, follow: true } };
  return entityMetadata(page, {
    title: page.title,
    description: page.intro,
    path: "/howto",
    image: page.ogImage,
  }, settings);
}

export default async function HowToPage() {
  const [page, settings] = await Promise.all([getHowToPage(), api.settings()]);
  if (!page) notFound();
  const steps = parseSteps(page.content);
  const canonical = page.canonicalUrl || "/howto";
  const howToSchema = page.schemaEnabled !== false && steps.length ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: page.title,
    description: page.intro || undefined,
    url: absoluteUrl(canonical, settings),
    datePublished: page.publishedAt || undefined,
    dateModified: page.updatedAt,
    publisher: { "@type": "Organization", name: settings.websiteName || "Bargain MOM", url: absoluteUrl("/", settings) },
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: [...step.paragraphs, ...step.bullets].join(" "),
      url: `${absoluteUrl(canonical, settings)}#step-${index + 1}`,
    })),
  } : null;

  return <PublicShell><article className={styles.page}>
    <div className={styles.inner}>
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Promo Code Guide", url: "/howto" }]} settings={settings} schema={page.schemaEnabled !== false}/>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>◆ Promo code guide</span>
          <h1>{page.title}</h1>
          {page.intro && <p>{page.intro}</p>}
          <div className={styles.heroActions}><Link href="/deals">Browse current deals <span>→</span></Link><Link href="/affiliate-disclosure">How our links work</Link></div>
          <small>Last updated <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time></small>
        </div>
        <div className={styles.heroArt} aria-hidden="true"><div className={styles.ticket}><small>SHOP</small><strong>SMART</strong><span>PROMO</span></div><i className={styles.heroSpark}>✦</i><i className={styles.heroCircle}/></div>
      </header>
      <AffiliateDisclosure text={settings.affiliateDisclosure}/>

      {steps.length ? <div className={styles.steps}>{steps.map((step, index) => <section className={styles.step} id={`step-${index + 1}`} key={step.title}>
        <div className={styles.stepCopy}><span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span><h2>{step.title}</h2>{step.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{step.bullets.length ? <ul>{step.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</div>
        <StepVisual index={index}/>
      </section>)}</div> : <div className={styles.fallback}><RichText text={page.content}/></div>}

      <aside className={styles.reminder}><span aria-hidden="true">!</span><div><h2>Check the final total every time</h2><p>Promotional codes can expire, apply only to selected variations, or stop working without notice. The retailer’s checkout is the final source for price, eligibility, availability, shipping, taxes, and returns.</p></div></aside>
      <section className={styles.cta}><span>Ready to compare offers?</span><h2>Find your next worthwhile deal.</h2><div><Link href="/deals">Browse deals →</Link><Link href="/stores">Explore stores</Link></div></section>
    </div>
    {howToSchema && <JsonLd id="promo-code-howto-jsonld" data={howToSchema}/>}<PageEvent name="guide_view" params={{ guide_type: "promo_code_howto", page_id: page.id }}/>
  </article></PublicShell>;
}
