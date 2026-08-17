import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {cache} from "react";
import {AffiliateDisclosure} from "../../components/AffiliateDisclosure";
import {Breadcrumbs} from "../../components/Breadcrumbs";
import {JsonLd} from "../../components/JsonLd";
import {Pagination} from "../../components/Pagination";
import {ProductCard} from "../../components/ProductCard";
import {SafeImage} from "../../components/SafeImage";
import {PublicShell} from "../../components/PublicShell";
import {formatDate} from "../../lib/format";
import {entityMetadata,itemListSchema} from "../../lib/seo";
import {publicApi} from "../../lib/public-api";
import type {Brand,BuyingGuide,PaginationData,Product,SiteSettings} from "../../lib/types";

type Query=Record<string,string|string[]|undefined>;
type Props={params:Promise<{slug:string}>;searchParams:Promise<Query>};
type BrandDetail=Brand&{products:Product[];relatedGuides:BuyingGuide[];pagination:PaginationData};
const getBrand=cache((slug:string,page:number)=>publicApi<BrandDetail>(`/brands/${encodeURIComponent(slug)}?page=${page}`));
const getSettings=cache(()=>publicApi<SiteSettings>("/settings"));
const disclosureFallback="We may earn a commission when you buy through links on this page, at no added cost to you.";

function listingState(query:Query){const raw=query.page;const pageValue=typeof raw==="string"?raw:"1";const validPage=/^[1-9]\d*$/.test(pageValue);const page=validPage?Math.min(Number(pageValue),10_000):1;const unsupported=Object.keys(query).some(key=>key!=="page")||(raw!==undefined&&(!validPage||Array.isArray(raw)));return {page,noIndex:unsupported}}
function pageUrl(value:string,page:number){if(page<=1)return value;return `${value}${value.includes("?")?"&":"?"}page=${page}`}
function Text({value}:{value?:string|null}){if(!value?.trim())return null;return <>{value.trim().split(/\n{2,}/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</>}

export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
  const [{slug},query]=await Promise.all([params,searchParams]);const {page,noIndex}=listingState(query);const [brand,settings]=await Promise.all([getBrand(slug,page),getSettings()]);
  if(!brand)return {title:"Brand not found",robots:{index:false,follow:true}};
  const h1=`${brand.name} Products and Deals`;const baseCanonical=brand.canonicalUrl||`/brand/${brand.slug}`;const baseTitle=brand.seoTitle||h1;const entity={...brand,seoTitle:page>1?`${baseTitle} - Page ${page}`:brand.seoTitle,ogTitle:page>1?`${brand.ogTitle||baseTitle} - Page ${page}`:brand.ogTitle,canonicalUrl:pageUrl(baseCanonical,page),robotsIndex:brand.robotsIndex!==false&&!noIndex};
  return entityMetadata(entity,{title:h1,description:brand.description||`Explore current ${brand.name} products, deal information, and related buying guides.`,path:`/brand/${brand.slug}`,image:brand.logo},settings||undefined);
}

export default async function BrandPage({params,searchParams}:Props){
  const [{slug},query]=await Promise.all([params,searchParams]);const {page}=listingState(query);const [brand,settings]=await Promise.all([getBrand(slug,page),getSettings()]);if(!brand)notFound();if(page>1&&page>Number(brand.pagination?.totalPages||1))notFound();
  const products=Array.isArray(brand.products)?brand.products:[];const guides=Array.isArray(brand.relatedGuides)?brand.relatedGuides:[];const breadcrumbs=[{name:"Home",url:"/"},{name:"Brands",url:"/brands"},{name:brand.name,url:`/brand/${brand.slug}`}];const listData=itemListSchema(products.map(product=>({name:product.title,url:`/product/${product.slug}`,image:product.image})),settings||undefined);
  return <PublicShell><div className="listing-page brand-page">
    <Breadcrumbs items={breadcrumbs} settings={settings||undefined} schema={brand.schemaEnabled!==false}/>
    <header className="listing-hero brand-page-head"><div>{brand.logo&&<SafeImage src={brand.logo} alt={`${brand.name} logo`} width={300} height={100} sizes="180px" priority/>}<span className="eyebrow">Brand shopping guide</span><h1>{brand.name} Products and Deals</h1><Text value={brand.description}/>{page>1&&<p className="page-context">Page {page} of current listings</p>}</div></header>
    <section className="entity-section" aria-labelledby="brand-products"><div className="section-title"><div><h2 id="brand-products">Current {brand.name} Listings</h2><p>{Number(brand.pagination?.total||products.length).toLocaleString("en-US")} available result{Number(brand.pagination?.total||products.length)===1?"":"s"}</p></div></div>{products.length>0?<div className="product-grid">{products.map(product=><ProductCard key={product.id} product={product} placement="brand"/>)}</div>:<p>No active products are listed for this brand right now.</p>}<Pagination data={brand.pagination} path={`/brand/${brand.slug}`}/></section>
    {products.some(product=>product.affiliateUrl)&&<AffiliateDisclosure text={settings?.affiliateDisclosure||disclosureFallback}/>}
    {page===1&&guides.length>0&&<section className="entity-section related-guides"><h2>Related Buying Guides</h2><div className="guide-link-grid">{guides.map(guide=><article className="info-card" key={guide.id}><h3><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h3>{guide.intro&&<p>{guide.intro}</p>}<p className="article-meta">{guide.author?.name&&<>By <Link href={`/authors/${guide.author.slug}`}>{guide.author.name}</Link> · </>}{guide.updatedAt&&<>Updated <time dateTime={new Date(guide.updatedAt).toISOString()}>{formatDate(guide.updatedAt)}</time></>}</p></article>)}</div></section>}
    {brand.schemaEnabled!==false&&products.length>0&&<JsonLd id="brand-item-list-jsonld" data={listData}/>}
  </div></PublicShell>;
}
