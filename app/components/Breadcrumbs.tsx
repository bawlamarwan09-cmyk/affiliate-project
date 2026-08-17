import Link from "next/link";
import {breadcrumbSchema,type SeoSettings} from "../lib/seo";
import {JsonLd} from "./JsonLd";
export function Breadcrumbs({items,settings,schema=true}:{items:{name:string;url:string}[];settings?:SeoSettings;schema?:boolean}){return <><nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((item,index)=><span key={item.url}>{index>0&&<i aria-hidden="true">›</i>}{index===items.length-1?<b aria-current="page">{item.name}</b>:<Link href={item.url}>{item.name}</Link>}</span>)}</nav>{schema&&<JsonLd id="breadcrumb-jsonld" data={breadcrumbSchema(items,settings)}/>}</>}
