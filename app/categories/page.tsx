import type {Metadata} from "next";
import {Breadcrumbs} from "../components/Breadcrumbs";
import {JsonLd} from "../components/JsonLd";
import {PublicShell} from "../components/PublicShell";
import {api} from "../lib/api";
import {publicApi} from "../lib/public-api";
import {entityMetadata,itemListSchema} from "../lib/seo";
import {DirectoryCard,EmptyState,styles} from "../guides/ContentPrimitives";

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
type Category={id:string;name:string;slug:string;description?:string|null;image?:string|null;icon?:string|null};
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{const params=await searchParams;const settings=await api.settings();return entityMetadata({robotsIndex:Object.keys(params).length===0,robotsFollow:true},{title:"Shop Deals by Category",description:"Browse curated product and deal categories, with concise buying advice for U.S. shoppers.",path:"/categories"},settings as any)}
export default async function CategoriesPage(){const [items,settings]=await Promise.all([publicApi<Category[]>("/categories"),api.settings()]);const categories=items||[];return <PublicShell><div className={styles.page}><Breadcrumbs items={[{name:"Home",url:"/"},{name:"Categories",url:"/categories"}]} settings={settings as any}/><header className={styles.listingIntro}><span className={styles.eyebrow}>Browse by need</span><h1 className={styles.title}>Shop Deals by Category</h1><p className={styles.lead}>Explore categories to find current products, practical guidance, and deals relevant to what you are shopping for.</p></header>{categories.length?<div className={styles.directoryGrid}>{categories.map(category=><DirectoryCard key={category.id} href={`/category/${category.slug}`} title={category.name} description={category.description} image={category.image} imageAlt={category.image?`${category.name} category`:undefined} icon={category.icon||"◇"}/>)}</div>:<EmptyState>No active categories are available yet.</EmptyState>}{categories.length>0&&<JsonLd id="category-directory-jsonld" data={itemListSchema(categories.map(category=>({name:category.name,url:`/category/${category.slug}`,image:category.image})),settings as any)}/>}</div></PublicShell>}
