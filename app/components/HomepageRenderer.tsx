import Link from "next/link";
import type { HomepageSection, Product } from "../lib/types";
import { StoreDeals } from "./StoreDeals";

export function ProductCard({ product }: { product: Product }) {
  return <article className="product-card">
    <div className="product-image">
      <Link href={`/product/${product.slug}`} aria-label={`View ${product.title}`}>{product.image ? <img src={product.image} alt={product.title} /> : <div className="product-image-fallback" aria-hidden="true">◇</div>}</Link>
      {product.discountPercent ? <b>-{product.discountPercent}%</b> : product.badge ? <b>{product.badge}</b> : null}
    </div>
    <div className="product-copy"><h3><Link href={`/product/${product.slug}`}>{product.title}</Link></h3>
      {product.rating != null && <div className="rating"><span aria-label={`${product.rating} out of 5 stars`}>★★★★★</span> <small>({product.reviewCount?.toLocaleString() || 0})</small></div>}
      <div className="price"><strong>{product.currentPrice?.toLocaleString(undefined,{style:"currency",currency:"USD"})}</strong>{product.oldPrice && <s>{product.oldPrice.toLocaleString(undefined,{style:"currency",currency:"USD"})}</s>}</div>
      {product.store && <div className="product-store">{product.store.logo ? <img src={product.store.logo} alt={product.store.name}/> : <strong>{product.store.name}</strong>}</div>}
      <a className="deal-button" href={product.affiliateUrl} rel="sponsored noopener noreferrer" target="_blank">{product.ctaLabel || "View deal"}</a>
    </div>
  </article>;
}

function SectionTitle({ section, flame=false }: { section: HomepageSection; flame?: boolean }) {
  return <div className="section-title"><div><h2>{flame && <span className="section-icon">◆</span>}{section.title}</h2>{section.subtitle && <p>{section.subtitle}</p>}</div>{section.ctaUrl && <Link href={section.ctaUrl}>{section.ctaText || "View all"} →</Link>}</div>;
}

function Hero({ section }: { section?: HomepageSection }) {
  if (!section) return <section className="reference-hero quiet-empty"><div className="hero-copy"><span className="eyebrow">New deals added regularly</span><h1>Big Deals.<br/><em>Smart Shopping.</em></h1><p>Discover worthwhile offers from trusted online stores, all gathered in one easy place.</p><form className="hero-search" action="/search"><input name="q" aria-label="Search" placeholder="Search products, brands or categories"/><button>Search deals</button></form><div className="hero-benefits"><span>★ Top-rated products</span><span>◇ Best prices</span><span>◆ Trusted stores</span><span>▣ Secure redirects</span></div></div><div className="hero-art shopping-art"><div className="orange-disc"/><div className="bag bag-one"/><div className="bag bag-two"/><div className="tag">SAVE<br/><strong>BIG</strong></div><div className="cart-line"/></div></section>;
  return <section className="reference-hero cms-hero" style={{background:section.background}}><div className="hero-copy"><span className="eyebrow">{String(section.config?.eyebrow||"")}</span><h1>{section.title}</h1><p>{section.subtitle}</p><form className="hero-search" action="/search"><input name="q" aria-label="Search" placeholder={String(section.config?.searchPlaceholder||"Search products, brands or categories")}/><button>{section.ctaText||"Search deals"}</button></form>{Array.isArray(section.config?.benefits)&&<div className="hero-benefits">{(section.config.benefits as string[]).map(x=><span key={x}>◆ {x}</span>)}</div>}</div><div className="hero-art">{section.config?.image?<img src={String(section.config.image)} alt=""/>:<div className="shopping-art"><div className="orange-disc"/><div className="bag bag-one"/><div className="bag bag-two"/><div className="tag">SAVE<br/><strong>BIG</strong></div><div className="cart-line"/></div>}</div></section>;
}

export function HomepageRenderer({ sections }: { sections: HomepageSection[] }) {
  const hero=sections.find(s=>s.type==="HERO");
  return <div className="dynamic-home"><Hero section={hero}/>{sections.map(section=>{
    if(section.type==="HERO")return null;
    if(section.type==="STORE_LOGOS"){if(!section.stores?.length)return null;return <section key={section.id} className="store-logo-rail"><div><strong>{section.title}</strong>{section.subtitle&&<small>{section.subtitle}</small>}</div>{section.stores.map(s=><Link href={`/store/${s.slug}`} key={s.id}>{s.logo?<img src={s.logo} alt={s.name}/>:<b>{s.name}</b>}</Link>)}</section>}
    if(section.type==="FEATURED_PRODUCTS"){if(!section.products?.length)return null;return <section key={section.id} className="content-section"><SectionTitle section={section} flame/><div className="product-grid">{section.products.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
    if(section.type==="CATEGORY_GRID"){if(!section.categories?.length)return null;return <section key={section.id} className="content-section"><SectionTitle section={section}/><div className="category-grid">{section.categories.map(c=><Link href={`/category/${c.slug}`} key={c.id}>{c.image?<img src={c.image} alt=""/>:<span>{c.icon||"◇"}</span>}<strong>{c.name}</strong></Link>)}</div></section>}
    if(section.type==="PROMO_BANNER"){if(!section.title&&!section.config?.image)return null;return <section key={section.id} className="promo" style={{background:section.background}}><div>{section.config?.storeLogo&&<img className="promo-logo" src={String(section.config.storeLogo)} alt=""/>}<h2>{section.title}</h2>{section.subtitle&&<p>{section.subtitle}</p>}{section.ctaUrl&&<Link href={section.ctaUrl}>{section.ctaText||"Shop deals"} →</Link>}</div>{section.config?.image&&<img className="promo-art" src={String(section.config.image)} alt=""/>}</section>}
    if(section.type==="STORE_PRODUCTS"){if(!section.products?.length||!section.stores?.length)return null;return <StoreDeals key={section.id} section={section}/>}
    if(section.type==="TRUST_FEATURES"){const items=Array.isArray(section.config?.items)?section.config.items as {title:string;description:string;icon?:string}[]:[];if(!items.length)return null;return <section key={section.id} className="trust-strip">{items.map(item=><div key={item.title}><i>{item.icon||"◆"}</i><span><strong>{item.title}</strong><small>{item.description}</small></span></div>)}</section>}
    if(section.type==="BLOG"){if(!section.posts?.length)return null;return <section key={section.id} className="content-section blog-section"><SectionTitle section={section}/><div className="blog-grid">{section.posts.map(p=><Link href={`/blog/${p.slug}`} key={p.id}><div>{p.coverImage&&<img src={p.coverImage} alt=""/>}</div><small>{p.category?.name}</small><h3>{p.title}</h3><p>{p.publishedAt&&new Date(p.publishedAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}{p.readingTime?` · ${p.readingTime} min read`:""}</p></Link>)}</div></section>}
    return null;
  })}</div>;
}
