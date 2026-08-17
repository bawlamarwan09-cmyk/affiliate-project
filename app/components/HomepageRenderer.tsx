import Link from "next/link";
import type { HomepageSection, Product } from "../lib/types";

function ProductCard({ product }: { product: Product }) {
  return <article className="product-card">
    <div className="product-image">{product.image ? <img src={product.image} alt="" /> : <span>Image</span>}{product.badge && <b>{product.badge}</b>}</div>
    <div className="product-copy">{product.store && <small>{product.store.name}</small>}<h3>{product.title}</h3>
      {product.rating != null && <div className="rating">★★★★★ <span>{product.rating.toFixed(1)} ({product.reviewCount || 0})</span></div>}
      <div className="price"><strong>{product.currentPrice?.toLocaleString(undefined,{style:"currency",currency:"USD"})}</strong>{product.oldPrice && <s>{product.oldPrice.toLocaleString(undefined,{style:"currency",currency:"USD"})}</s>}</div>
      <a className="deal-button" href={product.affiliateUrl} rel="sponsored noopener noreferrer" target="_blank">{product.ctaLabel || "View deal"} <span>↗</span></a>
    </div>
  </article>;
}

export function HomepageRenderer({ sections }: { sections: HomepageSection[] }) {
  if (!sections.length) return <section className="empty-home"><div className="orb orb-one"/><div className="orb orb-two"/><div className="empty-inner"><span className="eyebrow">Your smarter shopping desk</span><h1>Worthwhile finds,<br/><em>beautifully curated.</em></h1><p>This storefront is ready for its first collection. Sign in to the studio to shape the homepage, publish products, and launch campaigns.</p><div className="empty-actions"><Link className="primary" href="/admin">Open the studio <span>→</span></Link><Link className="secondary" href="/about">Explore the platform</Link></div><div className="trust-row"><span>✓ Editorial control</span><span>✓ Live deal scheduling</span><span>✓ Transparent affiliate links</span></div></div><aside className="editorial-card"><div className="editorial-top"><span>CURATOR&apos;S NOTE</span><span>01</span></div><div className="editorial-visual"><div className="mini-card one"/><div className="mini-card two"/><div className="spark">✦</div></div><h2>Your content belongs in the spotlight.</h2><p>Every collection, story and recommendation is controlled from one focused workspace.</p></aside></section>;
  return <>{sections.map(section => {
    if (section.type === "HERO") return <section key={section.id} className="cms-hero" style={{background: section.background}}><div><span className="eyebrow">{String(section.config?.eyebrow || "")}</span><h1>{section.title}</h1><p>{section.subtitle}</p>{section.ctaUrl && <Link className="primary" href={section.ctaUrl}>{section.ctaText || "Explore"} →</Link>}</div>{section.config?.image && <img src={String(section.config.image)} alt=""/>}</section>;
    if (["FEATURED_PRODUCTS","STORE_PRODUCTS"].includes(section.type)) return <section key={section.id} className="content-section"><SectionTitle section={section}/><div className="product-grid">{section.products?.map(p => <ProductCard key={p.id} product={p}/>)}</div></section>;
    if (section.type === "CATEGORY_GRID") return <section key={section.id} className="content-section"><SectionTitle section={section}/><div className="category-grid">{section.categories?.map(c => <Link href={`/category/${c.slug}`} key={c.id}><span>{c.icon || "↗"}</span><strong>{c.name}</strong></Link>)}</div></section>;
    if (section.type === "STORE_LOGOS") return <section key={section.id} className="content-section"><SectionTitle section={section}/><div className="store-grid">{section.stores?.map(s => <Link href={`/store/${s.slug}`} key={s.id}>{s.logo ? <img src={s.logo} alt={s.name}/> : s.name}</Link>)}</div></section>;
    if (section.type === "PROMO_BANNER") return <section key={section.id} className="promo" style={{background:section.background}}><div><span>Featured campaign</span><h2>{section.title}</h2><p>{section.subtitle}</p></div>{section.ctaUrl && <Link href={section.ctaUrl}>{section.ctaText || "Shop now"} →</Link>}</section>;
    if (section.type === "BLOG") return <section key={section.id} className="content-section"><SectionTitle section={section}/><div className="blog-grid">{section.posts?.map(p => <Link href={`/blog/${p.slug}`} key={p.id}><div>{p.coverImage && <img src={p.coverImage} alt=""/>}</div><small>{p.category?.name} · {p.readingTime} min read</small><h3>{p.title}</h3></Link>)}</div></section>;
    return null;
  })}</>;
}
function SectionTitle({ section }: { section: HomepageSection }) { return <div className="section-title"><div><span className="eyebrow">Handpicked for you</span><h2>{section.title}</h2><p>{section.subtitle}</p></div>{section.ctaUrl && <Link href={section.ctaUrl}>{section.ctaText || "See all"} →</Link>}</div> }
