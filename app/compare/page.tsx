import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {Breadcrumbs} from "../components/Breadcrumbs";
import {JsonLd} from "../components/JsonLd";
import {Pagination} from "../components/Pagination";
import {PublicShell} from "../components/PublicShell";
import {api} from "../lib/api";
import {publicApi} from "../lib/public-api";
import {entityMetadata,itemListSchema} from "../lib/seo";
import {EditorialCard,EmptyState,hasUnlistedParams,pageNumber,styles,type PageInfo} from "../guides/ContentPrimitives";

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
type Comparison={id:string;slug:string;title:string;introduction:string;heroImage?:string|null;heroImageAlt?:string|null;publishedAt?:string|null;updatedAt?:string|null;products?:{product:{title:string}}[];stores?:{store:{name:string}}[]};
type Response={items:Comparison[];pagination:PageInfo};
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{const params=await searchParams;const page=pageNumber(params.page);const settings=await api.settings();return entityMetadata({robotsIndex:!hasUnlistedParams(params),robotsFollow:true},{title:page===1?"Product and Store Comparisons":`Product and Store Comparisons — Page ${page}`,description:"Original, practical comparisons of products and retailers for U.S. shoppers.",path:page===1?"/compare":`/compare?page=${page}`},settings as any)}
export default async function ComparisonsPage({searchParams}:Props){const params=await searchParams;const page=pageNumber(params.page);const [data,settings]=await Promise.all([publicApi<Response>(`/comparisons?page=${page}`),api.settings()]);if(page>1&&(!data||page>data.pagination.totalPages))notFound();const items=data?.items||[];return <PublicShell><div className={styles.page}><Breadcrumbs items={[{name:"Home",url:"/"},{name:"Compare",url:"/compare"}]} settings={settings as any}/><header className={styles.listingIntro}><span className={styles.eyebrow}>Side-by-side analysis</span><h1 className={styles.title}>Product and Store Comparisons</h1><p className={styles.lead}>Understand the meaningful differences in features, pricing, strengths, and tradeoffs before you choose.</p></header>{items.length?<div className={styles.cardGrid}>{items.map(item=>{const names=[...(item.products||[]).map(x=>x.product.title),...(item.stores||[]).map(x=>x.store.name)];return <EditorialCard key={item.id} href={`/compare/${item.slug}`} title={item.title} description={item.introduction} image={item.heroImage} imageAlt={item.heroImageAlt} eyebrow={names.slice(0,2).join(" vs ")||"Comparison"} date={item.updatedAt||item.publishedAt}/>})}</div>:<EmptyState>No published comparisons are available yet.</EmptyState>}<Pagination data={data?.pagination} path="/compare"/>{items.length>0&&<JsonLd id="comparison-list-jsonld" data={itemListSchema(items.map(item=>({name:item.title,url:`/compare/${item.slug}`,image:item.heroImage})),settings as any)}/>}</div></PublicShell>}
