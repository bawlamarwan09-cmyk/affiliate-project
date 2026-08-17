import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {cache} from "react";
import {Breadcrumbs} from "../components/Breadcrumbs";
import {JsonLd} from "../components/JsonLd";
import {PublicShell} from "../components/PublicShell";
import {api} from "../lib/api";
import {formatDate} from "../lib/format";
import {publicApi} from "../lib/public-api";
import {absoluteUrl,entityMetadata} from "../lib/seo";
import {RichText,styles} from "../guides/ContentPrimitives";

type Props={params:Promise<{slug:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
type Page={id:string;slug:string;title:string;intro?:string|null;content:string;publishedAt?:string|null;updatedAt:string;seoTitle?:string|null;seoDescription?:string|null;canonicalUrl?:string|null;ogTitle?:string|null;ogDescription?:string|null;ogImage?:string|null;robotsIndex?:boolean;robotsFollow?:boolean;schemaEnabled?:boolean};
const getPage=cache((slug:string)=>publicApi<Page>(`/pages/${encodeURIComponent(slug)}`));

export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
  const [{slug},query]=await Promise.all([params,searchParams]);
  const [page,settings]=await Promise.all([getPage(slug),api.settings()]);
  if(!page)return {title:"Page not found",robots:{index:false,follow:true}};
  return entityMetadata({...page,robotsIndex:page.robotsIndex!==false&&Object.keys(query).length===0},{title:page.title,description:page.intro||page.content.slice(0,160),path:`/${page.slug}`},settings as any);
}

export default async function EditorialPage({params}:Props){
  const {slug}=await params;
  const [page,settings]=await Promise.all([getPage(slug),api.settings()]);
  if(!page)notFound();
  const schema=page.schemaEnabled?{"@context":"https://schema.org","@type":"WebPage",name:page.title,description:page.intro||undefined,url:absoluteUrl(page.canonicalUrl||`/${page.slug}`,settings as any),datePublished:page.publishedAt||undefined,dateModified:page.updatedAt}:null;
  return <PublicShell><article className={`${styles.page} ${styles.narrow} ${styles.legal}`}>
    <Breadcrumbs items={[{name:"Home",url:"/"},{name:page.title,url:`/${page.slug}`}]} settings={settings as any} schema={page.schemaEnabled!==false}/>
    <header><span className={styles.eyebrow}>Bargain MOM</span><h1 className={styles.title}>{page.title}</h1>{page.intro&&<p className={styles.lead}>{page.intro}</p>}<p className={styles.meta}>{page.publishedAt&&<>Published <time dateTime={page.publishedAt}>{formatDate(page.publishedAt)}</time><span aria-hidden="true"> · </span></>}Last updated <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time></p></header>
    <div className={styles.body}><RichText text={page.content}/></div>
    {schema&&<JsonLd id="editorial-page-jsonld" data={schema}/>}
  </article></PublicShell>;
}
