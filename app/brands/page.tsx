import type {Metadata} from "next";
import {Breadcrumbs} from "../components/Breadcrumbs";
import {JsonLd} from "../components/JsonLd";
import {PublicShell} from "../components/PublicShell";
import {api} from "../lib/api";
import {publicApi} from "../lib/public-api";
import {entityMetadata,itemListSchema} from "../lib/seo";
import {DirectoryCard,EmptyState,styles} from "../guides/ContentPrimitives";

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
type Brand={id:string;name:string;slug:string;description?:string|null;logo?:string|null};
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{const params=await searchParams;const settings=await api.settings();return entityMetadata({robotsIndex:Object.keys(params).length===0,robotsFollow:true},{title:"Browse Products by Brand",description:"Explore products and buying guides organized by brand, with current deal information when available.",path:"/brands"},settings as any)}
export default async function BrandsPage(){const [items,settings]=await Promise.all([publicApi<Brand[]>("/brands"),api.settings()]);const brands=items||[];return <PublicShell><div className={styles.page}><Breadcrumbs items={[{name:"Home",url:"/"},{name:"Brands",url:"/brands"}]} settings={settings as any}/><header className={styles.listingIntro}><span className={styles.eyebrow}>Explore manufacturers</span><h1 className={styles.title}>Browse Products by Brand</h1><p className={styles.lead}>Use brand pages to discover relevant products, editorial guidance, and live deal context without creating thin keyword variations.</p></header>{brands.length?<div className={styles.directoryGrid}>{brands.map(brand=><DirectoryCard key={brand.id} href={`/brand/${brand.slug}`} title={brand.name} description={brand.description} image={brand.logo} imageAlt={brand.logo?`${brand.name} logo`:undefined}/>)}</div>:<EmptyState>No active brands are available yet.</EmptyState>}{brands.length>0&&<JsonLd id="brand-directory-jsonld" data={itemListSchema(brands.map(brand=>({name:brand.name,url:`/brand/${brand.slug}`,image:brand.logo})),settings as any)}/>}</div></PublicShell>}
