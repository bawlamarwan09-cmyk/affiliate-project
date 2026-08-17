import Link from "next/link";
import type { HomepageSection } from "../lib/types";
import { formatDate } from "../lib/format";
import { AffiliateDisclosure } from "./AffiliateDisclosure";
import { ProductCard } from "./ProductCard";
import { SafeImage } from "./SafeImage";
import { StoreDeals } from "./StoreDeals";

function SectionTitle({ section, flame = false }: { section: HomepageSection; flame?: boolean }) {
  return <div className="section-title"><div><h2>{flame && <span className="section-icon">◆</span>}{section.title}</h2>{section.subtitle && <p>{section.subtitle}</p>}</div>{section.ctaUrl && <Link href={section.ctaUrl}>{section.ctaText || "View all"} →</Link>}</div>;
}

function Hero({ section }: { section?: HomepageSection }) {
  if (!section) return <section className="reference-hero quiet-empty"><div className="hero-copy"><span className="eyebrow">New deals added regularly</span><h1>Big Deals.<br/><em>Smart Shopping.</em></h1><p>Discover worthwhile offers from trusted online stores, all gathered in one easy place.</p><form className="hero-search" action="/search"><input name="q" aria-label="Search" placeholder="Search products, brands or categories"/><button>Search deals</button></form><div className="hero-benefits"><span>★ Helpful product context</span><span>◇ Clear price information</span><span>◆ Store links</span><span>▣ Secure redirects</span></div></div><div className="hero-art shopping-art" aria-hidden="true"><div className="orange-disc"/><div className="bag bag-one"/><div className="bag bag-two"/><div className="tag">SAVE<br/><strong>BIG</strong></div><div className="cart-line"/></div></section>;
  return <section className="reference-hero cms-hero" style={{ background: section.background }}><div className="hero-copy"><span className="eyebrow">{String(section.config?.eyebrow || "")}</span><h1>{section.title}</h1><p>{section.subtitle}</p><form className="hero-search" action="/search"><input name="q" aria-label="Search" placeholder={String(section.config?.searchPlaceholder || "Search products, brands or categories")}/><button>{section.ctaText || "Search deals"}</button></form>{Array.isArray(section.config?.benefits) && <div className="hero-benefits">{(section.config.benefits as string[]).map((value) => <span key={value}>◆ {value}</span>)}</div>}</div><div className="hero-art">{section.config?.image ? <SafeImage src={String(section.config.image)} alt={String(section.config.imageAlt || section.title || "Shopping deals")} width={720} height={520} sizes="(max-width: 800px) 100vw, 50vw" priority/> : <div className="shopping-art" aria-hidden="true"><div className="orange-disc"/><div className="bag bag-one"/><div className="bag bag-two"/><div className="tag">SAVE<br/><strong>BIG</strong></div><div className="cart-line"/></div>}</div></section>;
}

export function HomepageRenderer({ sections, disclosure }: { sections: HomepageSection[]; disclosure?: string | null }) {
  const hero = sections.find((section) => section.type === "HERO" && section.title?.trim());
  return <div className="dynamic-home"><Hero section={hero}/><div className="homepage-disclosure"><AffiliateDisclosure text={disclosure}/></div>{sections.map((section) => {
    if (section.type === "HERO") return null;
    if (section.type === "STORE_LOGOS") {
      if (!section.stores?.length) return null;
      return <section key={section.id} className="store-logo-rail"><div><strong>{section.title}</strong>{section.subtitle && <small>{section.subtitle}</small>}</div>{section.stores.map((store) => <Link href={`/store/${store.slug}`} key={store.id}>{store.logo ? <SafeImage src={store.logo} alt={`${store.name} logo`} width={132} height={48} sizes="132px"/> : <b>{store.name}</b>}</Link>)}</section>;
    }
    if (section.type === "FEATURED_PRODUCTS") {
      if (!section.products?.length) return null;
      return <section key={section.id} className="content-section"><SectionTitle section={section} flame/><div className="product-grid">{section.products.map((product) => <ProductCard key={product.id} product={product} placement="homepage"/>)}</div></section>;
    }
    if (section.type === "CATEGORY_GRID") {
      if (!section.categories?.length) return null;
      return <section key={section.id} className="content-section"><SectionTitle section={section}/><div className="category-grid">{section.categories.map((category) => <Link href={`/category/${category.slug}`} key={category.id}>{category.image ? <SafeImage src={category.image} alt={`${category.name} deals`} width={120} height={90} sizes="120px"/> : <span aria-hidden="true">{category.icon || "◇"}</span>}<strong>{category.name}</strong></Link>)}</div></section>;
    }
    if (section.type === "PROMO_BANNER") {
      if (!section.title && !section.config?.image) return null;
      return <section key={section.id} className="promo" style={{ background: section.background }}><div>{Boolean(section.config?.storeLogo) && <SafeImage className="promo-logo" src={String(section.config?.storeLogo)} alt={String(section.config?.storeLogoAlt || `${section.title || "Store"} logo`)} width={150} height={52} sizes="150px"/>}<h2>{section.title}</h2>{section.subtitle && <p>{section.subtitle}</p>}{section.ctaUrl && <Link href={section.ctaUrl}>{section.ctaText || "Shop deals"} →</Link>}</div>{Boolean(section.config?.image) && <SafeImage className="promo-art" src={String(section.config?.image)} alt={String(section.config?.imageAlt || section.title || "Store promotion")} width={580} height={260} sizes="(max-width: 700px) 100vw, 50vw"/>}</section>;
    }
    if (section.type === "STORE_PRODUCTS") {
      if (!section.products?.length || !section.stores?.length) return null;
      return <StoreDeals key={section.id} section={section}/>;
    }
    if (section.type === "TRUST_FEATURES") {
      const items = Array.isArray(section.config?.items) ? section.config.items as { title: string; description: string; icon?: string }[] : [];
      if (!items.length) return null;
      return <section key={section.id} className="trust-strip">{items.map((item) => <div key={item.title}><i aria-hidden="true">{item.icon || "◆"}</i><span><strong>{item.title}</strong><small>{item.description}</small></span></div>)}</section>;
    }
    if (section.type === "BLOG") {
      if (!section.posts?.length) return null;
      return <section key={section.id} className="content-section blog-section"><SectionTitle section={section}/><div className="blog-grid">{section.posts.map((post) => <Link href={`/blog/${post.slug}`} key={post.id}><div>{post.coverImage && <SafeImage src={post.coverImage} alt={`${post.title} article`} width={520} height={280} sizes="(max-width: 700px) 100vw, 33vw"/>}</div><small>{post.category?.name}</small><h3>{post.title}</h3><p>{post.publishedAt && formatDate(post.publishedAt, { month: "short", day: "numeric", year: "numeric" })}{post.readingTime ? ` · ${post.readingTime} min read` : ""}</p></Link>)}</div></section>;
    }
    return null;
  })}</div>;
}
