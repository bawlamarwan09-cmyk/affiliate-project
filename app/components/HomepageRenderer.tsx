import Link from "next/link";
import type { HomepageSection } from "../lib/types";
import { formatDate } from "../lib/format";
import { AffiliateDisclosure } from "./AffiliateDisclosure";
import { ProductCard } from "./ProductCard";
import { SafeImage } from "./SafeImage";
import { StoreDeals } from "./StoreDeals";
import { StoreLogoCarousel } from "./StoreLogoCarousel";

function SectionTitle({ section, flame = false }: { section: HomepageSection; flame?: boolean }) {
  const href = safeHref(section.ctaUrl);
  return <div className="section-title"><div><h2>{flame && <span className="section-icon">◆</span>}{section.title}</h2>{section.subtitle && <p>{section.subtitle}</p>}</div>{href && <Link href={href}>{section.ctaText || "View all"} →</Link>}</div>;
}

function safeHref(value: unknown) {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) return href;
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? href : null;
  } catch {
    return null;
  }
}

function configText(section: HomepageSection, key: string) {
  const value = section.config?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function configItems(section: HomepageSection) {
  const value = section.config?.items;
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 12)
    : [];
}

function CustomSection({ section }: { section: HomepageSection }) {
  const eyebrow = configText(section, "eyebrow");
  const body = configText(section, "body") || configText(section, "content");
  const image = configText(section, "image");
  const imageAlt = configText(section, "imageAlt") || section.title || "Homepage feature";
  const items = configItems(section);
  const href = safeHref(section.ctaUrl);
  const hasContent = section.title || section.subtitle || eyebrow || body || image || items.length || section.products?.length || section.categories?.length || section.stores?.length;
  if (!hasContent) return null;
  return <section className={`content-section custom-home-section ${image ? "has-image" : ""}`}>
    <div className="custom-home-copy">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {section.title && <h2>{section.title}</h2>}
      {section.subtitle && <p className="custom-home-subtitle">{section.subtitle}</p>}
      {body && <div className="custom-home-body">{body.split(/\n\s*\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}
      {items.length > 0 && <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>}
      {href && <Link className="custom-home-cta" href={href}>{section.ctaText || "Learn more"} →</Link>}
    </div>
    {image && <SafeImage src={image} alt={imageAlt} width={720} height={520} sizes="(max-width: 800px) 100vw, 46vw"/>}
    {section.products?.length ? <div className="product-grid custom-home-products">{section.products.map((product) => <ProductCard key={product.id} product={product} placement="homepage"/>)}</div> : null}
    {(section.categories?.length || section.stores?.length) ? <nav className="custom-home-links" aria-label={`${section.title || "Featured"} links`}>
      {section.categories?.map((category) => <Link key={`category-${category.id}`} href={`/category/${category.slug}`}>{category.name}</Link>)}
      {section.stores?.map((store) => <Link key={`store-${store.id}`} href={`/store/${store.slug}`}>{store.name}</Link>)}
    </nav> : null}
  </section>;
}

function Hero({ section, disclosure }: { section?: HomepageSection; disclosure?: string | null }) {
  if (!section) return <section className="reference-hero quiet-empty"><div className="hero-copy"><div className="hero-disclosure"><AffiliateDisclosure text={disclosure}/></div><span className="eyebrow">New deals added regularly</span><h1>Big Deals.<br/><em>Smart Shopping.</em></h1><p>Discover worthwhile offers from trusted online stores, all gathered in one easy place.</p><form className="hero-search" action="/search"><input name="q" aria-label="Search" placeholder="Search products, brands or categories"/><button>Search deals</button></form><div className="hero-benefits"><span>★ Helpful product context</span><span>◇ Clear price information</span><span>◆ Store links</span><span>▣ Secure redirects</span></div></div><div className="hero-art"><SafeImage className="hero-shopping-photo" src="/brand/hero-shopping-cutout.png" alt="Woman holding colorful shopping bags" width={1536} height={1024} sizes="(max-width: 800px) 100vw, 50vw" priority/></div></section>;
  return <section className="reference-hero cms-hero" style={{ background: section.background }}><div className="hero-copy"><div className="hero-disclosure"><AffiliateDisclosure text={disclosure}/></div><span className="eyebrow">{String(section.config?.eyebrow || "")}</span><h1>{section.title}</h1><p>{section.subtitle}</p><form className="hero-search" action="/search"><input name="q" aria-label="Search" placeholder={String(section.config?.searchPlaceholder || "Search products, brands or categories")}/><button>{section.ctaText || "Search deals"}</button></form>{Array.isArray(section.config?.benefits) && <div className="hero-benefits">{(section.config.benefits as string[]).map((value) => <span key={value}>◆ {value}</span>)}</div>}</div><div className="hero-art">{section.config?.image ? <SafeImage src={String(section.config.image)} alt={String(section.config.imageAlt || section.title || "Shopping deals")} width={720} height={520} sizes="(max-width: 800px) 100vw, 50vw" priority/> : <SafeImage className="hero-shopping-photo" src="/brand/hero-shopping-cutout.png" alt="Woman holding colorful shopping bags" width={1536} height={1024} sizes="(max-width: 800px) 100vw, 50vw" priority/>}</div></section>;
}

export function HomepageRenderer({ sections, disclosure }: { sections: HomepageSection[]; disclosure?: string | null }) {
  const hero = sections.find((section) => section.type === "HERO" && section.title?.trim());
  return <div className="dynamic-home"><Hero section={hero} disclosure={disclosure}/>{sections.map((section) => {
    if (section.type === "HERO") return null;
    if (section.type === "STORE_LOGOS") {
      if (!section.stores?.length) return null;
      return <StoreLogoCarousel key={section.id} title={section.title} subtitle={section.subtitle} stores={section.stores.map(({ id, name, slug, logo }) => ({ id, name, slug, logo }))}/>;
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
    if (section.type === "CUSTOM") return <CustomSection key={section.id} section={section}/>;
    return null;
  })}</div>;
}
