import Link from "next/link";
import type { HomepageSection, Product } from "../lib/types";

function ProductCard({ product }: { product: Product }) {
  return <article className="product-card">
    <div className="product-image">
      {product.image ? <img src={product.image} alt="" /> : <span className="image-placeholder" aria-hidden="true" />}
      {product.badge && <b>{product.badge}</b>}
    </div>
    <div className="product-copy">
      <h3>{product.title}</h3>
      {product.rating != null && <div className="rating"><span aria-hidden="true">★★★★★</span> <small>{product.rating.toFixed(1)} ({product.reviewCount || 0})</small></div>}
      <div className="price"><strong>{product.currentPrice?.toLocaleString(undefined,{style:"currency",currency:"USD"})}</strong>{product.oldPrice && <s>{product.oldPrice.toLocaleString(undefined,{style:"currency",currency:"USD"})}</s>}</div>
      {product.store && <div className="product-store">{product.store.logo ? <img src={product.store.logo} alt=""/> : null}<span>{product.store.name}</span></div>}
      <a className="deal-button" href={product.affiliateUrl} rel="sponsored noopener noreferrer" target="_blank">{product.ctaLabel || "View deal"}</a>
    </div>
  </article>;
}

function SectionTitle({ section, label }: { section: HomepageSection; label?: string }) {
  return <div className="section-title"><div>{label && <span className="section-icon">{label}</span>}<h2>{section.title}</h2>{section.subtitle && <p>{section.subtitle}</p>}</div>{section.ctaUrl && <Link href={section.ctaUrl}>{section.ctaText || "View all"} <span>→</span></Link>}</div>;
}

function EmptyPreview() {
  return <div className="storefront-preview">
    <section className="reference-hero">
      <div className="hero-copy"><span className="eyebrow">Storefront ready</span><h1>Build a homepage<br/><em>made to convert.</em></h1><p>Your published headline, supporting copy, search experience and campaign artwork will appear here automatically.</p><form className="hero-search" action="/search"><input name="q" aria-label="Search" placeholder="Search your published catalog"/><button>Search deals</button></form><div className="hero-benefits"><span>✦ Curated content</span><span>◇ Live pricing</span><span>● Trusted partners</span><span>▣ Secure redirects</span></div></div>
      <div className="hero-art" aria-label="Homepage hero image placeholder"><div className="orange-disc"/><div className="bag bag-one"/><div className="bag bag-two"/><div className="tag">CMS<br/><strong>READY</strong></div><div className="cart-line"/></div>
    </section>
    <section className="empty-rail"><div><strong>Partner stores</strong><small>Published from the studio</small></div>{[1,2,3,4,5].map(n=><span key={n}><i/></span>)}</section>
    <section className="preview-content"><div className="preview-heading"><h2><span>◆</span> Featured Deals</h2><Link href="/admin">Manage deals →</Link></div><div className="skeleton-products">{[1,2,3,4,5,6].map(n=><div key={n}><i/><b/><span/><span/><button>Awaiting content</button></div>)}</div><div className="preview-heading"><h2>Shop by Category</h2><Link href="/admin">Manage categories →</Link></div><div className="skeleton-categories">{[1,2,3,4,5,6,7,8].map(n=><div key={n}><i/><span/></div>)}</div><div className="skeleton-promos"><article><small>PROMOTIONAL BANNER</small><h3>Campaign space</h3><p>Connect a store, image and CTA in the studio.</p></article><article><small>PROMOTIONAL BANNER</small><h3>Campaign space</h3><p>Scheduled content appears automatically.</p></article></div><div className="preview-heading"><h2>Top Deals by Store</h2><Link href="/admin">Configure section →</Link></div><div className="skeleton-products compact">{[1,2,3,4,5,6].map(n=><div key={n}><i/><b/><span/><span/></div>)}</div><div className="empty-trust">{[["◇","Best prices"],["◆","Trusted stores"],["↗","Clear redirects"],["♥","Thoughtful picks"]].map(([a,b])=><div key={b}><i>{a}</i><span><strong>{b}</strong><small>Managed from your dashboard</small></span></div>)}</div><div className="preview-heading"><h2>Latest from the Blog</h2><Link href="/admin">Manage articles →</Link></div><div className="skeleton-blog">{[1,2,3,4].map(n=><article key={n}><i/><small>EDITORIAL</small><b/><span/></article>)}</div></section>
  </div>;
}

export function HomepageRenderer({ sections }: { sections: HomepageSection[] }) {
  if (!sections.length) return <EmptyPreview />;
  return <div className="dynamic-home">{sections.map(section => {
    if (section.type === "HERO") return <section key={section.id} className="reference-hero cms-hero" style={{background: section.background}}><div className="hero-copy"><span className="eyebrow">{String(section.config?.eyebrow || "")}</span><h1>{section.title}</h1><p>{section.subtitle}</p><form className="hero-search" action="/search"><input name="q" aria-label="Search" placeholder={String(section.config?.searchPlaceholder || "Search products, brands or categories")}/><button>{section.ctaText || "Search deals"}</button></form>{Array.isArray(section.config?.benefits)&&<div className="hero-benefits">{(section.config.benefits as string[]).map(x=><span key={x}>◆ {x}</span>)}</div>}</div><div className="hero-art">{section.config?.image ? <img src={String(section.config.image)} alt=""/> : <div className="hero-media-placeholder"><span>Hero media</span></div>}</div></section>;
    if (section.type === "STORE_LOGOS") return <section key={section.id} className="store-logo-rail"><div><strong>{section.title}</strong><small>{section.subtitle}</small></div>{section.stores?.map(s=><Link href={`/store/${s.slug}`} key={s.id}>{s.logo?<img src={s.logo} alt={s.name}/>:<b>{s.name}</b>}</Link>)}</section>;
    if (["FEATURED_PRODUCTS","STORE_PRODUCTS"].includes(section.type)) return <section key={section.id} className="content-section"><SectionTitle section={section} label={section.type==="FEATURED_PRODUCTS"?"◆":""}/><div className="product-grid">{section.products?.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>;
    if (section.type === "CATEGORY_GRID") return <section key={section.id} className="content-section"><SectionTitle section={section}/><div className="category-grid">{section.categories?.map(c=><Link href={`/category/${c.slug}`} key={c.id}>{c.image?<img src={c.image} alt=""/>:<span>{c.icon||"◇"}</span>}<strong>{c.name}</strong></Link>)}</div></section>;
    if (section.type === "PROMO_BANNER") return <section key={section.id} className="promo" style={{background:section.background}}><div><span>Featured campaign</span><h2>{section.title}</h2><p>{section.subtitle}</p>{section.ctaUrl&&<Link href={section.ctaUrl}>{section.ctaText||"Shop now"} →</Link>}</div>{section.config?.image&&<img src={String(section.config.image)} alt=""/>}</section>;
    if (section.type === "TRUST_FEATURES") return <section key={section.id} className="trust-strip">{Array.isArray(section.config?.items)&&(section.config.items as {title:string;description:string;icon?:string}[]).map(item=><div key={item.title}><i>{item.icon||"◆"}</i><span><strong>{item.title}</strong><small>{item.description}</small></span></div>)}</section>;
    if (section.type === "BLOG") return <section key={section.id} className="content-section"><SectionTitle section={section}/><div className="blog-grid">{section.posts?.map(p=><Link href={`/blog/${p.slug}`} key={p.id}><div>{p.coverImage&&<img src={p.coverImage} alt=""/>}</div><small>{p.category?.name} · {p.readingTime} min read</small><h3>{p.title}</h3></Link>)}</div></section>;
    return null;
  })}</div>;
}
