"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { HomepageSection, Product } from "../lib/types";

function ProductCard({product}:{product:Product}){return <article className="product-card"><div className="product-image"><Link href={`/product/${product.slug}`} aria-label={`View ${product.title}`}>{product.image?<img src={product.image} alt={product.title}/>:<div className="product-image-fallback" aria-hidden="true">◇</div>}</Link>{product.discountPercent?<b>-{product.discountPercent}%</b>:product.badge?<b>{product.badge}</b>:null}</div><div className="product-copy"><h3><Link href={`/product/${product.slug}`}>{product.title}</Link></h3>{product.rating!=null&&<div className="rating"><span>★★★★★</span> <small>({product.reviewCount?.toLocaleString()||0})</small></div>}<div className="price"><strong>{product.currentPrice?.toLocaleString(undefined,{style:"currency",currency:"USD"})}</strong>{product.oldPrice&&<s>{product.oldPrice.toLocaleString(undefined,{style:"currency",currency:"USD"})}</s>}</div>{product.store&&<div className="product-store">{product.store.logo?<img src={product.store.logo} alt={product.store.name}/>:<strong>{product.store.name}</strong>}</div>}<a className="deal-button" href={product.affiliateUrl} rel="sponsored noopener noreferrer" target="_blank">{product.ctaLabel||"View deal"}</a></div></article>}

export function StoreDeals({section}:{section:HomepageSection}){
  const stores=section.stores||[];const [active,setActive]=useState(stores[0]?.id||"");
  const products=useMemo(()=>section.products?.filter(p=>p.store?.id===active)||[],[section.products,active]);
  return <section className="content-section store-deals"><div className="section-title store-title"><h2>{section.title}</h2>{section.ctaUrl&&<a href={section.ctaUrl}>{section.ctaText||"View all stores"} →</a>}</div><div className="store-tabs" role="tablist">{stores.map(store=><button key={store.id} className={active===store.id?"active":""} onClick={()=>setActive(store.id)} role="tab" aria-selected={active===store.id}>{store.name}</button>)}</div>{products.length>0&&<div className="product-grid">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>}</section>
}
