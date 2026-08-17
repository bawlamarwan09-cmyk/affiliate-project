import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {cache} from "react";
import {ProductCard} from "../../components/HomepageRenderer";
import {PublicShell} from "../../components/PublicShell";
import {publicApi} from "../../lib/public-api";
import {ProductGallery} from "./ProductGallery";

type Props={params:Promise<{slug:string}>};
const getProduct=cache((slug:string)=>publicApi<any>(`/products/${encodeURIComponent(slug)}`));
const money=(value:unknown)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(value));
const card=(product:any)=>({...product,image:product.images?.[0]?.url,currentPrice:product.currentPrice==null?undefined:Number(product.currentPrice),oldPrice:product.oldPrice==null?undefined:Number(product.oldPrice),rating:product.rating==null?undefined:Number(product.rating)});

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;const product=await getProduct(slug);if(!product)return {title:"Product not found"};
  const title=product.seoTitle||product.title;const description=product.seoDescription||product.shortDescription||product.description||undefined;const image=product.images?.[0]?.url;
  return {title,description,alternates:{canonical:`/product/${product.slug}`},openGraph:{title,description,images:image?[{url:image,alt:product.title}]:undefined,type:"website"}};
}

function Content({title,text,items,tone}:{title:string;text?:string|null;items?:string[];tone?:string}){if(!text&&!items?.length)return null;return <article className={`info-card ${tone||""}`}><h2>{title}</h2>{text&&<p>{text}</p>}{items?.length&&<ul>{items.map(item=><li key={item}>{item}</li>)}</ul>}</article>}

export default async function ProductPage({params}:Props){
  const {slug}=await params;const product=await getProduct(slug);if(!product)notFound();
  const rating=product.rating==null?null:Number(product.rating);const current=product.currentPrice==null?null:Number(product.currentPrice);const old=product.oldPrice==null?null:Number(product.oldPrice);const discount=product.discountPercent==null?null:Number(product.discountPercent);const images=product.images||[];const store=product.store;const related=(product.relatedProducts||[]).map(card);const more=(product.moreFromStore||[]).filter((item:any)=>!related.some((relatedItem:any)=>relatedItem.id===item.id)).map(card);
  const jsonLd:any={"@context":"https://schema.org","@type":"Product",name:product.title,image:images.map((item:any)=>item.url),description:product.description||product.shortDescription,sku:product.sku||undefined,brand:product.brand?.name?{"@type":"Brand",name:product.brand.name}:undefined};
  if(current!=null)jsonLd.offers={"@type":"Offer",url:`/product/${product.slug}`,priceCurrency:"USD",price:current,availability:product.availability?.toLowerCase().includes("out")?"https://schema.org/OutOfStock":"https://schema.org/InStock",seller:store?.name?{"@type":"Organization",name:store.name}:undefined};
  if(rating!=null&&product.reviewCount>0)jsonLd.aggregateRating={"@type":"AggregateRating",ratingValue:rating,reviewCount:product.reviewCount};
  return <PublicShell><main className="detail-page product-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span>{product.category?<><Link href={`/category/${product.category.slug}`}>{product.category.name}</Link><span>›</span></>:null}<span aria-current="page">{product.title}</span></nav>
    <section className="product-detail">
      <ProductGallery images={images} title={product.title}/>
      <div className="product-summary">
        <div className="summary-kicker">{product.category?.name||"Featured deal"}</div><h1>{product.title}</h1>
        <div className="product-relations">{product.brand?.name&&<span>By <b>{product.brand.name}</b></span>}{store?.name&&<span>Sold at <b>{store.name}</b></span>}</div>
        {rating!=null&&<div className="detail-rating"><span aria-label={`${rating} out of 5 stars`}>★★★★★</span><b>{rating.toFixed(1)}</b>{product.reviewCount>0&&<small>({Number(product.reviewCount).toLocaleString()} reviews)</small>}</div>}
        <div className="badge-row">{discount!=null&&discount>0&&<b className="discount-badge">Save {discount}%</b>}{product.badge&&<b>{product.badge}</b>}{product.tags?.filter((tag:string)=>tag!=="demo-seed").map((tag:string)=><b key={tag}>{tag}</b>)}</div>
        {current!=null&&<div className="detail-price"><strong>{money(current)}</strong>{old!=null&&old>current&&<s>{money(old)}</s>}</div>}
        {product.availability&&<p className="availability"><i/> {product.availability}</p>}{product.shortDescription&&<p className="short-description">{product.shortDescription}</p>}
        {store&&<aside className="store-card">{store.logo&&<img src={store.logo} alt={`${store.name} logo`}/>}<div><small>Available at</small><strong>{store.name}</strong>{store.description&&<p>{store.description}</p>}</div></aside>}
        <a className="affiliate-cta" href={product.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">{product.ctaLabel||"View Deal"}{store?.name?` at ${store.name}`:""} <span>↗</span></a>
        {product.affiliateDisclosure&&<p className="affiliate-disclosure">ⓘ {product.affiliateDisclosure}</p>}
      </div>
    </section>
    <section className="product-information"><Content title="Overview" text={product.description}/><Content title="Key Features" items={product.keyFeatures}/><Content title="Why We Recommend It" text={product.whyRecommend}/><Content title="Pros" items={product.pros} tone="pros"/><Content title="Cons" items={product.cons} tone="cons"/><Content title="Best For" text={product.bestFor}/><Content title="Buying Advice" text={product.buyingAdvice}/></section>
    {related.length>0&&<section className="recommendations"><div className="section-title"><h2>You May Also Like</h2></div><div className="product-grid">{related.map((item:any)=><ProductCard key={item.id} product={item}/>)}</div></section>}
    {more.length>0&&<section className="recommendations"><div className="section-title"><h2>More Deals from {store?.name}</h2></div><div className="product-grid">{more.map((item:any)=><ProductCard key={item.id} product={item}/>)}</div></section>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>
  </main></PublicShell>;
}
