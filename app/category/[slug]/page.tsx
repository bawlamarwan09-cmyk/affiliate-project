import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {cache} from "react";
import {AffiliateDisclosure} from "../../components/AffiliateDisclosure";
import {Breadcrumbs} from "../../components/Breadcrumbs";
import {FaqList,type FaqItem} from "../../components/FaqList";
import {JsonLd} from "../../components/JsonLd";
import {PageEvent} from "../../components/PageEvent";
import {Pagination} from "../../components/Pagination";
import {ProductCard} from "../../components/ProductCard";
import {SafeImage} from "../../components/SafeImage";
import {PublicShell} from "../../components/PublicShell";
import {formatDate} from "../../lib/format";
import {entityMetadata,itemListSchema} from "../../lib/seo";
import {publicApi} from "../../lib/public-api";
import type {Brand,BuyingGuide,Category,PaginationData,Product,SiteSettings} from "../../lib/types";

type Query=Record<string,string|string[]|undefined>;
type Props={params:Promise<{slug:string}>;searchParams:Promise<Query>};
type CategoryDetail=Category&{featuredProducts:Product[];products:Product[];topBrands:Brand[];guides:BuyingGuide[];pagination:PaginationData};
const getCategory=cache((slug:string,page:number)=>publicApi<CategoryDetail>(`/categories/${encodeURIComponent(slug)}?page=${page}`));
const getSettings=cache(()=>publicApi<SiteSettings>("/settings"));
const disclosureFallback="We may earn a commission when you buy through links on this page, at no added cost to you.";

function listingState(query:Query){const raw=query.page;const pageValue=typeof raw==="string"?raw:"1";const validPage=/^[1-9]\d*$/.test(pageValue);const page=validPage?Math.min(Number(pageValue),10_000):1;const unsupported=Object.keys(query).some(key=>key!=="page")||(raw!==undefined&&(!validPage||Array.isArray(raw)));return {page,noIndex:unsupported}}
function pageUrl(value:string,page:number){if(page<=1)return value;return `${value}${value.includes("?")?"&":"?"}page=${page}`}
function faqItems(value:unknown):FaqItem[]{return Array.isArray(value)?value.filter((item):item is FaqItem=>Boolean(item)&&typeof item.question==="string"&&typeof item.answer==="string"):[]}
function Text({value}:{value?:string|null}){if(!value?.trim())return null;return <>{value.trim().split(/\n{2,}/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</>}

export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
  const [{slug},query]=await Promise.all([params,searchParams]);const {page,noIndex}=listingState(query);const [category,settings]=await Promise.all([getCategory(slug,page),getSettings()]);
  if(!category)return {title:"Category not found",robots:{index:false,follow:true}};
  const h1=category.h1||`${category.name} Deals`;const baseCanonical=category.canonicalUrl||`/category/${category.slug}`;const baseTitle=category.seoTitle||h1;const entity={...category,seoTitle:page>1?`${baseTitle} - Page ${page}`:category.seoTitle,ogTitle:page>1?`${category.ogTitle||baseTitle} - Page ${page}`:category.ogTitle,canonicalUrl:pageUrl(baseCanonical,page),robotsIndex:category.robotsIndex!==false&&!noIndex};
  return entityMetadata(entity,{title:h1,description:category.description||category.editorialContent||`Browse current ${category.name.toLowerCase()} deals, featured products, and practical buying guidance.`,path:`/category/${category.slug}`,image:category.image},settings||undefined);
}

export default async function CategoryPage({params,searchParams}:Props){
  const [{slug},query]=await Promise.all([params,searchParams]);const {page}=listingState(query);const [category,settings]=await Promise.all([getCategory(slug,page),getSettings()]);if(!category)notFound();if(page>1&&page>Number(category.pagination?.totalPages||1))notFound();
  const products=Array.isArray(category.products)?category.products:[];const featured=Array.isArray(category.featuredProducts)?category.featuredProducts:[];const children=Array.isArray(category.children)?category.children:[];const brands=Array.isArray(category.topBrands)?category.topBrands:[];const guides=Array.isArray(category.guides)?category.guides:[];const h1=category.h1||`${category.name} Deals`;const faqs=faqItems(category.faqItems);
  const breadcrumbs=[{name:"Home",url:"/"},...(category.parent?[{name:category.parent.name,url:`/category/${category.parent.slug}`}]:[]),{name:category.name,url:`/category/${category.slug}`}];
  const listData=itemListSchema(products.map(product=>({name:product.title,url:`/product/${product.slug}`,image:product.image})),settings||undefined);
  return <PublicShell><div className="listing-page category-page">
    <PageEvent name="category_view" params={{category_id:category.id,category_name:category.name,page}}/>
    <Breadcrumbs items={breadcrumbs} settings={settings||undefined} schema={category.schemaEnabled!==false}/>
    <header className="listing-hero">{category.image&&<SafeImage src={category.image} alt={`${category.name} shopping guide`} width={560} height={320} sizes="(max-width: 800px) 100vw, 38vw" priority/>}<div><span className="eyebrow">Shop by category</span><h1>{h1}</h1><Text value={category.description}/>{page>1&&<p className="page-context">Page {page} of current listings</p>}</div></header>
    {page===1&&children.length>0&&<section className="entity-section"><h2>Popular Subcategories</h2><nav className="link-chip-list" aria-label={`${category.name} subcategories`}>{children.map(child=><Link href={`/category/${child.slug}`} key={child.id}>{child.name}</Link>)}</nav></section>}
    {page===1&&featured.length>0&&<section className="entity-section"><div className="section-title"><h2>Featured {category.name} Picks</h2></div><div className="product-grid">{featured.map(product=><ProductCard key={product.id} product={product} placement="category"/>)}</div></section>}
    {page===1&&(category.editorialContent||category.buyingTips?.length)&&<section className="editorial-grid" aria-label={`${category.name} buying advice`}>
      {category.editorialContent&&<article className="info-card"><h2>About {category.name} Deals</h2><Text value={category.editorialContent}/></article>}
      {Array.isArray(category.buyingTips)&&category.buyingTips.length>0&&<article className="info-card"><h2>Buying Tips</h2><ul>{category.buyingTips.map((tip:string)=><li key={tip}>{tip}</li>)}</ul></article>}
    </section>}
    {page===1&&brands.length>0&&<section className="entity-section"><h2>Top Brands in {category.name}</h2><nav className="link-chip-list" aria-label={`Brands in ${category.name}`}>{brands.map(brand=><Link href={`/brand/${brand.slug}`} key={brand.id}>{brand.name}</Link>)}</nav></section>}
    <section className="entity-section" aria-labelledby="category-products"><div className="section-title"><div><h2 id="category-products">Current {category.name} Products and Deals</h2><p>{Number(category.pagination?.total||products.length).toLocaleString("en-US")} available result{Number(category.pagination?.total||products.length)===1?"":"s"}</p></div></div>{products.length>0?<div className="product-grid">{products.map(product=><ProductCard key={product.id} product={product} placement="category"/>)}</div>:<p>No active products are available in this category right now.</p>}<Pagination data={category.pagination} path={`/category/${category.slug}`}/></section>
    {products.some(product=>product.affiliateUrl)&&<AffiliateDisclosure text={settings?.affiliateDisclosure||disclosureFallback}/>}
    {page===1&&guides.length>0&&<section className="entity-section related-guides"><h2>Related Buying Guides</h2><div className="guide-link-grid">{guides.map(guide=><article className="info-card" key={guide.id}><h3><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h3>{guide.intro&&<p>{guide.intro}</p>}<p className="article-meta">{guide.author?.name&&<>By <Link href={`/authors/${guide.author.slug}`}>{guide.author.name}</Link> · </>}{guide.updatedAt&&<>Updated <time dateTime={new Date(guide.updatedAt).toISOString()}>{formatDate(guide.updatedAt)}</time></>}</p></article>)}</div></section>}
    {page===1&&<FaqList items={faqs}/>}
    {category.schemaEnabled!==false&&products.length>0&&<JsonLd id="category-item-list-jsonld" data={listData}/>}
  </div></PublicShell>;
}
