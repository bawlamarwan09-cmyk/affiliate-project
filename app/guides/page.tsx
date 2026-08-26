import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {api} from "../lib/api";
import {publicApi} from "../lib/public-api";
import {entityMetadata,itemListSchema} from "../lib/seo";
import {Breadcrumbs} from "../components/Breadcrumbs";
import {JsonLd} from "../components/JsonLd";
import {PageEvent} from "../components/PageEvent";
import {Pagination} from "../components/Pagination";
import {PublicShell} from "../components/PublicShell";
import {EditorialCard,EmptyState,hasUnlistedParams,pageNumber,styles,type PageInfo} from "./ContentPrimitives";

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
type Guide={id:string;slug:string;title:string;intro:string;heroImage?:string|null;heroImageAlt?:string|null;publishedAt?:string|null;updatedAt?:string|null;category?:{name:string}|null};
type Response={items:Guide[];pagination:PageInfo};

export async function generateMetadata({searchParams}:Props):Promise<Metadata>{const params=await searchParams;const page=pageNumber(params.page);const settings=await api.settings();const path=page===1?"/guides":`/guides?page=${page}`;return entityMetadata({robotsIndex:!hasUnlistedParams(params),robotsFollow:true},{title:page===1?"Buying Guides":"Buying Guides — Page "+page,description:"Practical buying guides that help U.S. shoppers compare products, prices, features, and use cases.",path},settings)}

export default async function GuidesPage({searchParams}:Props){const params=await searchParams;const page=pageNumber(params.page);const [data,settings]=await Promise.all([publicApi<Response>(`/guides?page=${page}`),api.settings()]);if(page>1&&(!data||page>data.pagination.totalPages))notFound();const items=data?.items||[];return <PublicShell><div className={styles.page}><Breadcrumbs items={[{name:"Home",url:"/"},{name:"Guides",url:"/guides"}]} settings={settings}/><header className={styles.listingIntro}><span className={styles.eyebrow}>Independent editorial help</span><h1 className={styles.title}>Buying Guides</h1><p className={styles.lead}>Clear, useful guides for comparing options, understanding tradeoffs, and finding worthwhile deals.</p></header>{items.length?<div className={styles.cardGrid}>{items.map(guide=><EditorialCard key={guide.id} href={`/guides/${guide.slug}`} title={guide.title} description={guide.intro} image={guide.heroImage} imageAlt={guide.heroImageAlt} eyebrow={guide.category?.name||"Buying guide"} date={guide.updatedAt||guide.publishedAt}/>)}</div>:<EmptyState>No published buying guides are available yet.</EmptyState>}<Pagination data={data?.pagination} path="/guides"/>{items.length>0&&<JsonLd id="guide-list-jsonld" data={itemListSchema(items.map(item=>({name:item.title,url:`/guides/${item.slug}`,image:item.heroImage})),settings)}/>}<PageEvent name="guide_view" params={{listing:true,page}}/></div></PublicShell>}
