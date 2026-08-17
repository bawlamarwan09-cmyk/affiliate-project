"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HomepageSection } from "../lib/types";
import { ProductCard } from "./ProductCard";

export function StoreDeals({ section }: { section: HomepageSection }) {
  const stores = section.stores || [];
  const [active, setActive] = useState(stores[0]?.id || "");
  const products = useMemo(
    () => section.products?.filter((product) => product.store?.id === active) || [],
    [section.products, active],
  );

  return <section className="content-section store-deals"><div className="section-title store-title"><h2>{section.title}</h2>{section.ctaUrl && <Link href={section.ctaUrl}>{section.ctaText || "View all stores"} →</Link>}</div><div className="store-tabs" role="tablist" aria-label="Deals by store">{stores.map((store) => <button key={store.id} className={active === store.id ? "active" : ""} onClick={() => setActive(store.id)} role="tab" aria-selected={active === store.id}>{store.name}</button>)}</div><nav className="store-crawl-links" aria-label="Store pages">{stores.map((store) => <Link key={store.id} href={`/store/${store.slug}`}>Browse {store.name}</Link>)}</nav>{products.length > 0 && <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} placement="homepage"/>)}</div>}</section>;
}
