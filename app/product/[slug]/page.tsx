import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {cache} from "react";
import {AffiliateDisclosure} from "../../components/AffiliateDisclosure";
import {AffiliateOutboundLink} from "../../components/AffiliateOutboundLink";
import {Breadcrumbs} from "../../components/Breadcrumbs";
import {FaqList,type FaqItem} from "../../components/FaqList";
import {JsonLd} from "../../components/JsonLd";
import {PageEvent} from "../../components/PageEvent";
import {ProductCard} from "../../components/ProductCard";
import {SafeImage} from "../../components/SafeImage";
import {PublicShell} from "../../components/PublicShell";
import {formatDate,formatUSD} from "../../lib/format";
import {absoluteUrl,entityMetadata} from "../../lib/seo";
import {publicApi} from "../../lib/public-api";
import type {BuyingGuide,Product,SiteSettings} from "../../lib/types";
import {ProductGallery} from "./ProductGallery";

type Props={params:Promise<{slug:string}>};
type ProductDetail=Product&{relatedProducts?:Product[];moreFromStore?:Product[];relatedGuides?:BuyingGuide[];affiliateDisclosure?:string|null};
const getProduct=cache((slug:string)=>publicApi<ProductDetail>(`/products/${encodeURIComponent(slug)}`));
const getSettings=cache(()=>publicApi<SiteSettings>("/settings"));
const disclosureFallback="We may earn a commission when you buy through links on this page, at no added cost to you.";

function asAmount(value:unknown){const amount=Number(value);return Number.isFinite(amount)?amount:null}
function asItems(value:unknown){return Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"&&Boolean(item.trim())):[]}
function asFaq(value:unknown):FaqItem[]{return Array.isArray(value)?value.filter((item):item is FaqItem=>Boolean(item)&&typeof item.question==="string"&&typeof item.answer==="string"):[]}

function Content({title,text,items,tone}:{title:string;text?:string|null;items?:string[];tone?:string}){
  const safeItems=asItems(items);if(!text?.trim()&&!safeItems.length)return null;
  return <article className={`info-card ${tone||""}`}><h2>{title}</h2>{text?.trim()&&<p className="preserve-lines">{text}</p>}{safeItems.length>0&&<ul>{safeItems.map(item=><li key={item}>{item}</li>)}</ul>}</article>;
}

function Specs({specs}:{specs:unknown}){
  if(!specs||typeof specs!=="object"||Array.isArray(specs))return null;
  const entries=Object.entries(specs).filter((entry):entry is [string,string]=>typeof entry[1]==="string"&&Boolean(entry[0].trim())&&Boolean(entry[1].trim()));
  if(!entries.length)return null;
  return <article className="info-card specs-card"><h2>Important Specs</h2><dl>{entries.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></article>;
}

function schemaAvailability(value:unknown){
  if(typeof value!=="string"||!value.trim())return undefined;
  const allowed=new Set(["Discontinued","InStock","InStoreOnly","LimitedAvailability","OnlineOnly","OutOfStock","PreOrder","PreSale","SoldOut"]);
  const direct=value.trim().replace(/^https?:\/\/schema\.org\//," ").trim();
  if(allowed.has(direct))return `https://schema.org/${direct}`;
  const labels:Record<string,string>={"in stock":"InStock","out of stock":"OutOfStock","in-store only":"InStoreOnly","in store only":"InStoreOnly","limited availability":"LimitedAvailability","online only":"OnlineOnly",preorder:"PreOrder","pre-order":"PreOrder",presale:"PreSale","pre-sale":"PreSale","sold out":"SoldOut",discontinued:"Discontinued"};
  const matched=labels[value.trim().toLowerCase()];return matched?`https://schema.org/${matched}`:undefined;
}

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;const [product,settings]=await Promise.all([getProduct(slug),getSettings()]);
  if(!product)return {title:"Product not found",robots:{index:false,follow:true}};
  return entityMetadata(product,{title:product.title,description:product.editorialSummary||product.shortDescription||product.description,path:`/product/${product.slug}`,image:product.images?.[0]?.url},settings||undefined);
}

export default async function ProductPage({params}:Props){
  const {slug}=await params;const [product,settings]=await Promise.all([getProduct(slug),getSettings()]);if(!product)notFound();
  const rating=asAmount(product.rating);const current=asAmount(product.currentPrice);const old=asAmount(product.oldPrice);const discount=asAmount(product.discountPercent);const images=Array.isArray(product.images)?product.images:[];const store=product.store;const related=product.relatedProducts||[];const more=(product.moreFromStore||[]).filter(item=>!related.some(relatedItem=>relatedItem.id===item.id));const faqs=asFaq(product.faqItems);
  const breadcrumbs=[{name:"Home",url:"/"},...(product.category?.parent?[{name:product.category.parent.name,url:`/category/${product.category.parent.slug}`}]:[]),...(product.category?[{name:product.category.name,url:`/category/${product.category.slug}`}]:[]),{name:product.title,url:`/product/${product.slug}`}];
  const offer=current!=null&&product.affiliateUrl?{"@type":"Offer",url:product.affiliateUrl,priceCurrency:"USD",price:current,...(schemaAvailability(product.availability)?{availability:schemaAvailability(product.availability)}:{})}:undefined;
  const jsonLd={"@context":"https://schema.org","@type":"Product",name:product.title,url:absoluteUrl(product.canonicalUrl||`/product/${product.slug}`,settings),image:images.length?images.map(item=>absoluteUrl(item.url,settings)):undefined,description:product.editorialSummary||product.shortDescription||product.description||undefined,sku:product.sku||undefined,brand:product.brand?.name?{"@type":"Brand",name:product.brand.name}:undefined,offers:offer,...(rating!=null&&rating>0&&Number(product.reviewCount)>0?{aggregateRating:{"@type":"AggregateRating",ratingValue:rating,reviewCount:Number(product.reviewCount)}}:{})};
  const verifiedIso=product.lastVerifiedAt?new Date(product.lastVerifiedAt).toISOString():null;const priceIso=product.priceUpdatedAt?new Date(product.priceUpdatedAt).toISOString():null;const contentIso=product.contentUpdatedAt?new Date(product.contentUpdatedAt).toISOString():null;const verifiedDate=verifiedIso?formatDate(verifiedIso):null;const priceDate=!verifiedDate&&priceIso?formatDate(priceIso):null;const contentDate=contentIso?formatDate(contentIso):null;
  const overview=product.editorialSummary||product.description;const additionalDescription=product.editorialSummary&&product.description&&product.editorialSummary.trim()!==product.description.trim()?product.description:null;
  return <PublicShell><div className="detail-page product-page">
    <PageEvent name="product_view" params={{product_id:product.id,product_name:product.title,store:store?.name}}/>
    <Breadcrumbs items={breadcrumbs} settings={settings||undefined} schema={product.schemaEnabled!==false}/>
    <section className="product-detail">
      <ProductGallery images={images} title={product.title}/>
      <div className="product-summary">
        <div className="summary-kicker">{product.category?.name||"Product guide"}</div>
        <h1>{product.title}</h1>
        <div className="product-relations">
          {product.brand?.name&&<span>Brand: <Link href={`/brand/${product.brand.slug}`}><b>{product.brand.name}</b></Link></span>}
          {store?.name&&<span>Deal at: <Link href={`/store/${store.slug}`}><b>{store.name}</b></Link></span>}
          {product.sku&&<span>SKU: <b>{product.sku}</b></span>}
        </div>
        {rating!=null&&rating>0&&<div className="detail-rating"><span aria-hidden="true">★</span><b><span className="sr-only">Rating: </span>{rating.toFixed(1)} out of 5</b>{Number(product.reviewCount)>0&&<small>({Number(product.reviewCount).toLocaleString("en-US")} reviews)</small>}</div>}
        <div className="badge-row">{discount!=null&&discount>0&&<b className="discount-badge">Save {Math.round(discount)}%</b>}{product.badge&&<b>{product.badge}</b>}{asItems(product.tags).filter(tag=>tag!=="demo-seed").map(tag=><b key={tag}>{tag}</b>)}</div>
        {current!=null&&<div className="detail-price"><strong>{formatUSD(current)}</strong>{old!=null&&old>current&&<s>{formatUSD(old)}</s>}</div>}
        {product.availability&&<p className="availability"><i/> {product.availability}</p>}
        {product.shortDescription&&<p className="short-description">{product.shortDescription}</p>}
        {store&&<aside className="store-card">{store.logo&&<Link href={`/store/${store.slug}`}><SafeImage src={store.logo} alt={`${store.name} logo`} width={140} height={56} sizes="105px"/></Link>}<div><small>Available at</small><strong><Link href={`/store/${store.slug}`}>{store.name}</Link></strong>{store.description&&<p>{store.description}</p>}</div></aside>}
        <AffiliateOutboundLink className="affiliate-cta" href={product.affiliateUrl} affiliateLinkId={product.affiliateLinkId} productId={product.id} productName={product.title} storeId={store?.id} storeName={store?.name} placement="product">{product.ctaLabel||(store?.name?`View at ${store.name}`:"View retailer")} <span>↗</span></AffiliateOutboundLink>
        {product.affiliateUrl&&<AffiliateDisclosure text={product.affiliateDisclosure||settings?.affiliateDisclosure||disclosureFallback}/>}
        {(verifiedDate||priceDate||contentDate)&&<div className="freshness-note">{verifiedDate&&verifiedIso&&<p>Price and availability checked on <time dateTime={verifiedIso}>{verifiedDate}</time>.</p>}{priceDate&&priceIso&&<p>Price updated on <time dateTime={priceIso}>{priceDate}</time>.</p>}{contentDate&&contentIso&&<p>Editorial content updated on <time dateTime={contentIso}>{contentDate}</time>.</p>}</div>}
      </div>
    </section>
    <section className="product-information" aria-label="Product editorial guidance">
      <Content title="Product Overview" text={overview}/>
      <Content title="About This Product" text={additionalDescription}/>
      <Content title="Who This Product Is For" text={product.idealFor||product.bestFor}/>
      <Content title="Who It May Not Suit" text={product.notIdealFor}/>
      <Content title="Key Features" items={product.keyFeatures}/>
      <Specs specs={product.importantSpecs}/>
      <Content title="Pros" items={product.pros} tone="pros"/>
      <Content title="Cons" items={product.cons} tone="cons"/>
      <Content title="What We Like" text={product.whatWeLike||product.whyRecommend}/>
      <Content title="What Could Be Better" text={product.whatCouldBeBetter}/>
      <Content title="Best Use Cases" items={product.bestUseCases}/>
      <Content title="Buying Advice" text={product.buyingAdvice}/>
      <Content title="Compared With Similar Options" text={product.comparisonNotes}/>
      <Content title="Price and Deal Context" text={product.dealAnalysis}/>
      <Content title="Alternatives" text={product.alternativesNotes}/>
    </section>
    {Array.isArray(product.relatedGuides)&&product.relatedGuides.length>0&&<section className="recommendations related-guides"><div className="section-title"><h2>Related Buying Guides</h2></div><div className="guide-link-grid">{product.relatedGuides.map(guide=><article className="info-card" key={guide.id}><h3><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h3>{guide.intro&&<p>{guide.intro}</p>}{guide.category&&<Link href={`/category/${guide.category.slug}`}>Explore {guide.category.name}</Link>}</article>)}</div></section>}
    <FaqList items={faqs}/>
    {related.length>0&&<section className="recommendations"><div className="section-title"><h2>Related Products</h2></div><div className="product-grid">{related.map(item=><ProductCard key={item.id} product={item} placement="product"/>)}</div></section>}
    {more.length>0&&<section className="recommendations"><div className="section-title"><h2>More Deals from {store?.name}</h2>{store?.slug&&<Link href={`/store/${store.slug}`}>View store page →</Link>}</div><div className="product-grid">{more.map(item=><ProductCard key={item.id} product={item} placement="product"/>)}</div></section>}
    {product.schemaEnabled!==false&&<JsonLd id="product-jsonld" data={jsonLd}/>}
  </div></PublicShell>;
}
