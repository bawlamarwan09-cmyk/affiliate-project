import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {cache} from "react";
import {AffiliateDisclosure} from "../../components/AffiliateDisclosure";
import {Breadcrumbs} from "../../components/Breadcrumbs";
import {FaqList,type FaqItem} from "../../components/FaqList";
import {JsonLd} from "../../components/JsonLd";
import {Pagination} from "../../components/Pagination";
import {ProductCard} from "../../components/ProductCard";
import {SafeImage} from "../../components/SafeImage";
import {PublicShell} from "../../components/PublicShell";
import {formatDate} from "../../lib/format";
import {entityMetadata,itemListSchema} from "../../lib/seo";
import {publicApi} from "../../lib/public-api";
import type {BuyingGuide,Category,PaginationData,Product,SiteSettings,Store} from "../../lib/types";

type Query=Record<string,string|string[]|undefined>;
type Props={params:Promise<{slug:string}>;searchParams:Promise<Query>};
type StoreDetail=Store&{products:Product[];popularCategories:Category[];relatedGuides:BuyingGuide[];pagination:PaginationData};
const getStore=cache((slug:string,page:number)=>publicApi<StoreDetail>(`/stores/${encodeURIComponent(slug)}?page=${page}`));
const getSettings=cache(()=>publicApi<SiteSettings>("/settings"));
const disclosureFallback="We may earn a commission when you buy through links on this page, at no added cost to you.";

function listingState(query:Query){const raw=query.page;const pageValue=typeof raw==="string"?raw:"1";const validPage=/^[1-9]\d*$/.test(pageValue);const page=validPage?Math.min(Number(pageValue),10_000):1;const unsupported=Object.keys(query).some(key=>key!=="page")||(raw!==undefined&&(!validPage||Array.isArray(raw)));return {page,noIndex:unsupported}}
function pageUrl(value:string,page:number){if(page<=1)return value;return `${value}${value.includes("?")?"&":"?"}page=${page}`}
function faqItems(value:unknown):FaqItem[]{return Array.isArray(value)?value.filter((item):item is FaqItem=>Boolean(item)&&typeof item.question==="string"&&typeof item.answer==="string"):[]}
function Text({value}:{value?:string|null}){if(!value?.trim())return null;return <>{value.trim().split(/\n{2,}/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</>}

export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
  const [{slug},query]=await Promise.all([params,searchParams]);const {page,noIndex}=listingState(query);const [store,settings]=await Promise.all([getStore(slug,page),getSettings()]);
  if(!store)return {title:"Store not found",robots:{index:false,follow:true}};
  const h1=`${store.name} Deals`;const baseCanonical=store.canonicalUrl||`/store/${store.slug}`;const baseTitle=store.seoTitle||h1;const entity={...store,seoTitle:page>1?`${baseTitle} - Page ${page}`:store.seoTitle,ogTitle:page>1?`${store.ogTitle||baseTitle} - Page ${page}`:store.ogTitle,canonicalUrl:pageUrl(baseCanonical,page),robotsIndex:store.robotsIndex!==false&&!noIndex};
  return entityMetadata(entity,{title:h1,description:store.description||store.editorialNotes||`Browse current ${store.name} products, deal context, popular categories, and practical shopping tips.`,path:`/store/${store.slug}`,image:store.logo},settings||undefined);
}

export default async function StorePage({params,searchParams}:Props){
  const [{slug},query]=await Promise.all([params,searchParams]);const {page}=listingState(query);const [store,settings]=await Promise.all([getStore(slug,page),getSettings()]);if(!store)notFound();if(page>1&&page>Number(store.pagination?.totalPages||1))notFound();
  const products=Array.isArray(store.products)?store.products:[];const categories=Array.isArray(store.popularCategories)?store.popularCategories:[];const guides=Array.isArray(store.relatedGuides)?store.relatedGuides:[];const faqs=faqItems(store.faqItems);const breadcrumbs=[{name:"Home",url:"/"},{name:"Stores",url:"/stores"},{name:store.name,url:`/store/${store.slug}`}];const listData=itemListSchema(products.map(product=>({name:product.title,url:`/product/${product.slug}`,image:product.image})),settings||undefined);
  return <PublicShell><div className="listing-page store-page">
    <Breadcrumbs items={breadcrumbs} settings={settings||undefined} schema={store.schemaEnabled!==false}/>
    <header className="listing-hero store-page-head"><div>{store.logo&&<SafeImage src={store.logo} alt={`${store.name} logo`} width={300} height={100} sizes="180px" priority/>}<span className="eyebrow">Store deal guide</span><h1>{store.name} Deals</h1><Text value={store.description}/>{page>1&&<p className="page-context">Page {page} of current listings</p>}</div></header>
    {page===1&&categories.length>0&&<section className="entity-section"><h2>Popular Categories at {store.name}</h2><nav className="link-chip-list" aria-label={`Popular categories at ${store.name}`}>{categories.map(category=><Link href={`/category/${category.slug}`} key={category.id}>{category.name}</Link>)}</nav></section>}
    {page===1&&(store.editorialNotes||store.shoppingTips?.length)&&<section className="editorial-grid" aria-label={`${store.name} shopping guidance`}>
      {store.editorialNotes&&<article className="info-card"><h2>What to Know About Shopping at {store.name}</h2><Text value={store.editorialNotes}/></article>}
      {Array.isArray(store.shoppingTips)&&store.shoppingTips.length>0&&<article className="info-card"><h2>Shopping Tips</h2><ul>{store.shoppingTips.map((tip:string)=><li key={tip}>{tip}</li>)}</ul></article>}
    </section>}
    <section className="entity-section" aria-labelledby="store-products"><div className="section-title"><div><h2 id="store-products">Current Products and Deals</h2><p>{Number(store.pagination?.total||products.length).toLocaleString("en-US")} available result{Number(store.pagination?.total||products.length)===1?"":"s"}</p></div></div>{products.length>0?<div className="product-grid">{products.map(product=><ProductCard key={product.id} product={product} placement="store"/>)}</div>:<p>No active products are listed for this store right now.</p>}<Pagination data={store.pagination} path={`/store/${store.slug}`}/></section>
    {products.some(product=>product.affiliateUrl)&&<AffiliateDisclosure text={settings?.affiliateDisclosure||disclosureFallback}/>}
    {page===1&&guides.length>0&&<section className="entity-section related-guides"><h2>Related Buying Guides</h2><div className="guide-link-grid">{guides.map(guide=><article className="info-card" key={guide.id}><h3><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h3>{guide.intro&&<p>{guide.intro}</p>}<p className="article-meta">{guide.author?.name&&<>By <Link href={`/authors/${guide.author.slug}`}>{guide.author.name}</Link> · </>}{guide.updatedAt&&<>Updated <time dateTime={new Date(guide.updatedAt).toISOString()}>{formatDate(guide.updatedAt)}</time></>}</p></article>)}</div></section>}
    {page===1&&<FaqList items={faqs}/>}
    {store.schemaEnabled!==false&&products.length>0&&<JsonLd id="store-item-list-jsonld" data={listData}/>}
  </div></PublicShell>;
}
