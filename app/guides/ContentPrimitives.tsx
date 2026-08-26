import Link from "next/link";
import {SafeImage} from "../components/SafeImage";
import {formatDate} from "../lib/format";
import styles from "./content.module.css";

export {styles};

export type PageInfo={page:number;pageSize?:number;total?:number;totalPages:number;hasPrevious:boolean;hasNext:boolean};
export type Author={name:string;slug:string;bio?:string|null;profileImage?:string|null;expertise?:string[];profileUrls?:string[]};

export function pageNumber(value:string|string[]|undefined){const raw=Array.isArray(value)?value[0]:value;const valueNumber=Number.parseInt(raw||"1",10);return Number.isFinite(valueNumber)&&valueNumber>0?valueNumber:1}
export function hasUnlistedParams(params:Record<string,string|string[]|undefined>,allowed=["page"]){const rawPage=params.page;const invalidPage=rawPage!==undefined&&(Array.isArray(rawPage)||!/^\d+$/.test(rawPage)||Number(rawPage)<1);return invalidPage||Object.keys(params).some(key=>!allowed.includes(key))}
export function asFaqItems(value:unknown){if(!Array.isArray(value))return [];return value.filter((item):item is {question:string;answer:string}=>Boolean(item&&typeof item==="object"&&"question" in item&&"answer" in item&&typeof item.question==="string"&&typeof item.answer==="string"))}
export function safeExternalUrls(value?:string[]){return (value||[]).filter(raw=>{try{return ["http:","https:"].includes(new URL(raw).protocol)}catch{return false}})}

export function RichText({text}:{text?:string|null}){
  if(!text)return null;
  return <>{text.split(/\n\s*\n/).map((raw,index)=>{const block=raw.trim();if(!block)return null;if(block.startsWith("### "))return <h3 key={index}>{block.slice(4)}</h3>;if(block.startsWith("## "))return <h2 key={index}>{block.slice(3)}</h2>;const lines=block.split("\n");if(lines.every(line=>/^[-*] /.test(line.trim())))return <ul key={index}>{lines.map(line=><li key={line}>{line.trim().slice(2)}</li>)}</ul>;return <p key={index}>{block}</p>})}</>;
}

export function Byline({author,publishedAt,updatedAt,readingTime}:{author?:Author|null;publishedAt?:string|null;updatedAt?:string|null;readingTime?:number|null}){
  return <div className={styles.meta}>{author&&<span>Written by <Link href={`/authors/${author.slug}`}>{author.name}</Link></span>}{publishedAt&&<span>Published <time dateTime={publishedAt}>{formatDate(publishedAt)}</time></span>}{updatedAt&&<span>Last updated <time dateTime={updatedAt}>{formatDate(updatedAt)}</time></span>}{readingTime&&<span>{readingTime} min read</span>}</div>;
}

type EditorialCardProps={href:string;title:string;description?:string|null;image?:string|null;imageAlt?:string|null;eyebrow?:string|null;date?:string|null};
export function EditorialCard({href,title,description,image,imageAlt,eyebrow,date}:EditorialCardProps){return <article className={styles.card}>{image&&<Link href={href} aria-label={`Read ${title}`}><SafeImage className={styles.cardImage} src={image} alt={imageAlt||title} width={640} height={360} sizes="(max-width: 760px) 100vw, (max-width: 1000px) 50vw, 33vw"/></Link>}<div className={styles.cardCopy}>{(eyebrow||date)&&<small>{eyebrow}{eyebrow&&date?" · ":""}{date?formatDate(date,{month:"short",day:"numeric",year:"numeric"}):""}</small>}<h2><Link href={href}>{title}</Link></h2>{description&&<p>{description}</p>}<Link href={href}>Read more →</Link></div></article>}

export function DirectoryCard({href,title,description,image,imageAlt,icon}:EditorialCardProps&{icon?:string}){return <Link href={href} className={styles.directoryCard}>{image?<SafeImage className={styles.directoryImage} src={image} alt={imageAlt||`${title} logo`} width={220} height={92} sizes="110px"/>:<span className={styles.directoryIcon} aria-hidden="true">{icon||"◇"}</span>}<div><h2>{title}</h2>{description&&<p>{description}</p>}</div></Link>}

export function EmptyState({children}:{children:React.ReactNode}){return <div className={styles.empty}>{children}</div>}
