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
type Post={id:string;slug:string;title:string;excerpt?:string|null;coverImage?:string|null;publishedAt?:string|null;updatedAt?:string|null;category?:{name:string}|null};
type Response={items:Post[];pagination:PageInfo};
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{const params=await searchParams;const page=pageNumber(params.page);const settings=await api.settings();return entityMetadata({robotsIndex:!hasUnlistedParams(params),robotsFollow:true},{title:page===1?"Shopping Advice and Deal Insights":`Shopping Advice and Deal Insights — Page ${page}`,description:"Useful shopping advice, product explainers, and deal insights for U.S. shoppers.",path:page===1?"/blog":`/blog?page=${page}`},settings as any)}
export default async function BlogPage({searchParams}:Props){const params=await searchParams;const page=pageNumber(params.page);const [data,settings]=await Promise.all([publicApi<Response>(`/blog?page=${page}`),api.settings()]);if(page>1&&(!data||page>data.pagination.totalPages))notFound();const items=data?.items||[];return <PublicShell><div className={styles.page}><Breadcrumbs items={[{name:"Home",url:"/"},{name:"Blog",url:"/blog"}]} settings={settings as any}/><header className={styles.listingIntro}><span className={styles.eyebrow}>Shopping knowledge</span><h1 className={styles.title}>Shopping Advice and Deal Insights</h1><p className={styles.lead}>Editorial articles that explain how to compare products, evaluate offers, and shop with more confidence.</p></header>{items.length?<div className={styles.cardGrid}>{items.map(post=><EditorialCard key={post.id} href={`/blog/${post.slug}`} title={post.title} description={post.excerpt} image={post.coverImage} imageAlt={post.title} eyebrow={post.category?.name||"Shopping advice"} date={post.publishedAt||post.updatedAt}/>)}</div>:<EmptyState>No published articles are available yet.</EmptyState>}<Pagination data={data?.pagination} path="/blog"/>{items.length>0&&<JsonLd id="blog-list-jsonld" data={itemListSchema(items.map(item=>({name:item.title,url:`/blog/${item.slug}`,image:item.coverImage})),settings as any)}/>}</div></PublicShell>}
