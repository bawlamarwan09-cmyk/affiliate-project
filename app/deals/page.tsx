import type {Metadata} from "next";
import {AffiliateDisclosure} from "../components/AffiliateDisclosure";
import {Breadcrumbs} from "../components/Breadcrumbs";
import {JsonLd} from "../components/JsonLd";
import {ProductCard} from "../components/ProductCard";
import {PromoCodeGuideCallout} from "../components/PromoCodeGuideCallout";
import {PublicShell} from "../components/PublicShell";
import {api} from "../lib/api";
import {formatDate} from "../lib/format";
import {publicApi} from "../lib/public-api";
import {entityMetadata,itemListSchema} from "../lib/seo";
import type {Product} from "../lib/types";
import {EmptyState,styles} from "../guides/ContentPrimitives";

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
type Deal={id:string;endsAt:string;product:Product};
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{const params=await searchParams;const settings=await api.settings();return entityMetadata({robotsIndex:Object.keys(params).length===0,robotsFollow:true},{title:"Today’s Active Deals",description:"Browse currently active affiliate deals and compare the latest price context available in our database.",path:"/deals"},settings)}
export default async function DealsPage(){const [items,settings]=await Promise.all([publicApi<Deal[]>("/deals"),api.settings()]);const deals=items||[];return <PublicShell><div className={styles.page}><Breadcrumbs items={[{name:"Home",url:"/"},{name:"Deals",url:"/deals"}]} settings={settings}/><header className={styles.listingIntro}><span className={styles.eyebrow}>Current offers</span><h1 className={styles.title}>Today’s Active Deals</h1><p className={styles.lead}>These offers are currently active in our catalog. Prices and availability can change at the retailer.</p></header><AffiliateDisclosure text={settings.affiliateDisclosure}/><PromoCodeGuideCallout/>{deals.length?<section className={styles.section} aria-label="Active deals"><div className="product-grid">{deals.map(deal=><div key={deal.id}><ProductCard product={deal.product} placement="deals"/><p className={styles.meta}>Scheduled through <time dateTime={deal.endsAt}>{formatDate(deal.endsAt)}</time></p></div>)}</div></section>:<EmptyState>There are no active deals right now. Product pages may still contain useful editorial information.</EmptyState>}{deals.length>0&&<JsonLd id="deal-list-jsonld" data={itemListSchema(deals.map(deal=>({name:deal.product.title,url:`/product/${deal.product.slug}`,image:deal.product.image})),settings)}/>}</div></PublicShell>}
