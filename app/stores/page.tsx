import type {Metadata} from "next";
import {Breadcrumbs} from "../components/Breadcrumbs";
import {JsonLd} from "../components/JsonLd";
import {PublicShell} from "../components/PublicShell";
import {api} from "../lib/api";
import {publicApi} from "../lib/public-api";
import {entityMetadata,itemListSchema} from "../lib/seo";
import {DirectoryCard,EmptyState,styles} from "../guides/ContentPrimitives";

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
type Store={id:string;name:string;slug:string;description?:string|null;logo?:string|null};
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{const params=await searchParams;const settings=await api.settings();return entityMetadata({robotsIndex:Object.keys(params).length===0,robotsFollow:true},{title:"Deals by Store",description:"Browse active stores and find current product deals, shopping tips, and original editorial notes.",path:"/stores"},settings as any)}
export default async function StoresPage(){const [items,settings]=await Promise.all([publicApi<Store[]>("/stores"),api.settings()]);const stores=items||[];return <PublicShell><div className={styles.page}><Breadcrumbs items={[{name:"Home",url:"/"},{name:"Stores",url:"/stores"}]} settings={settings as any}/><header className={styles.listingIntro}><span className={styles.eyebrow}>Retailer directories</span><h1 className={styles.title}>Deals by Store</h1><p className={styles.lead}>Find active offers and useful shopping context for each retailer represented on the site.</p></header>{stores.length?<div className={styles.directoryGrid}>{stores.map(store=><DirectoryCard key={store.id} href={`/store/${store.slug}`} title={store.name} description={store.description} image={store.logo} imageAlt={store.logo?`${store.name} logo`:undefined}/>)}</div>:<EmptyState>No active stores are available yet.</EmptyState>}{stores.length>0&&<JsonLd id="store-directory-jsonld" data={itemListSchema(stores.map(store=>({name:store.name,url:`/store/${store.slug}`,image:store.logo})),settings as any)}/>}</div></PublicShell>}
