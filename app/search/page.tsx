import type { Metadata } from "next";
import { AffiliateDisclosure } from "../components/AffiliateDisclosure";
import { PageEvent } from "../components/PageEvent";
import { Pagination } from "../components/Pagination";
import { ProductCard } from "../components/ProductCard";
import { PublicShell } from "../components/PublicShell";
import { api } from "../lib/api";
import { publicApi } from "../lib/public-api";
import { absoluteUrl } from "../lib/seo";
import type { PaginationData, Product } from "../lib/types";

type Params = Promise<{ q?: string; page?: string }>;
type ProductResults = { items: Product[]; pagination: PaginationData; query: string };

export async function generateMetadata({ searchParams }: { searchParams: Params }): Promise<Metadata> {
  const [{ q = "" }, settings] = await Promise.all([searchParams, api.settings()]);
  const title = q.trim() ? `Search results for “${q.trim()}”` : "Search deals";
  return {
    title,
    description: "Search Bargain MOM product research and deal listings.",
    alternates: { canonical: absoluteUrl("/search", settings) },
    robots: { index: false, follow: true },
    openGraph: { title, description: "Search Bargain MOM product research and deal listings.", locale: "en_US", url: absoluteUrl("/search", settings) },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const [results, settings] = await Promise.all([
    q ? publicApi<ProductResults>(`/products?q=${encodeURIComponent(q)}&page=${page}`) : null,
    api.settings(),
  ]);

  return <PublicShell><section className="listing-page"><PageEvent name="search" params={{ search_term: q, results_count: results?.pagination.total || 0 }}/><span className="eyebrow">Search</span><h1>{q ? `Results for “${q}”` : "Find your next deal"}</h1><form className="hero-search" action="/search"><input name="q" defaultValue={q} aria-label="Search products" placeholder="Search products, brands or categories"/><button>Search</button></form>{results?.items.length ? <><AffiliateDisclosure text={settings.affiliateDisclosure}/><div className="product-grid">{results.items.map((product) => <ProductCard key={product.id} product={product} placement="search"/>)}</div><Pagination data={results.pagination} path="/search" query={{ q }}/></> : q ? <p className="empty-state">No matching products were found. Try a broader product, category, brand, or store name.</p> : <p>Search by product, category, brand, or store.</p>}</section></PublicShell>;
}
