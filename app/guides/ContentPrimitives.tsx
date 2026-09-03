import Link from "next/link";
import type {ReactNode} from "react";
import {SafeImage} from "../components/SafeImage";
import {formatDate} from "../lib/format";
import {richTextBlocks} from "../lib/rich-text";
import styles from "./content.module.css";

export {styles};

export type PageInfo={page:number;pageSize?:number;total?:number;totalPages:number;hasPrevious:boolean;hasNext:boolean};
export type Author={name:string;slug:string;bio?:string|null;profileImage?:string|null;expertise?:string[];profileUrls?:string[]};

export function pageNumber(value:string|string[]|undefined){const raw=Array.isArray(value)?value[0]:value;const valueNumber=Number.parseInt(raw||"1",10);return Number.isFinite(valueNumber)&&valueNumber>0?valueNumber:1}
export function hasUnlistedParams(params:Record<string,string|string[]|undefined>,allowed=["page"]){const rawPage=params.page;const invalidPage=rawPage!==undefined&&(Array.isArray(rawPage)||!/^\d+$/.test(rawPage)||Number(rawPage)<1);return invalidPage||Object.keys(params).some(key=>!allowed.includes(key))}
export function asFaqItems(value:unknown){if(!Array.isArray(value))return [];return value.filter((item):item is {question:string;answer:string}=>Boolean(item&&typeof item==="object"&&"question" in item&&"answer" in item&&typeof item.question==="string"&&typeof item.answer==="string"))}
export function safeExternalUrls(value?:string[]){return (value||[]).filter(raw=>{try{return ["http:","https:"].includes(new URL(raw).protocol)}catch{return false}})}

function safeContentHref(value:string){
  const href=value.trim();if(href.startsWith("/")&&!href.startsWith("//")&&!href.includes("\\"))return href;
  try{const url=new URL(href);return ["http:","https:"].includes(url.protocol)?href:null}catch{return null}
}
function InlineText({text}:{text:string}){
  const pattern=/(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^\s)]+\))/g;const nodes:ReactNode[]=[];let last=0;let match:RegExpExecArray|null;
  while((match=pattern.exec(text))){if(match.index>last)nodes.push(text.slice(last,match.index));const token=match[0];if(token.startsWith("**"))nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2,-2)}</strong>);else{const link=token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);const href=link&&safeContentHref(link[2]);if(link&&href){const external=/^https?:\/\//i.test(href);nodes.push(<a key={`${match.index}-link`} href={href} target={external?"_blank":undefined} rel={external?"noopener noreferrer":undefined}><InlineText text={link[1]}/></a>)}else nodes.push(token)}last=match.index+token.length}
  if(last<text.length)nodes.push(text.slice(last));return <>{nodes}</>;
}

export function RichText({text,sectionHeadingLevel=2,documentTitle,inferNaturalStructure=false}:{text?:string|null;sectionHeadingLevel?:2|3;documentTitle?:string;inferNaturalStructure?:boolean}){
  if(!text)return null;
  return <>{richTextBlocks(text,{documentTitle,inferNaturalStructure}).map((block,index)=>{
    if(block.type==="heading")return sectionHeadingLevel===3?<h3 key={index}><InlineText text={block.value}/></h3>:<h2 key={index}><InlineText text={block.value}/></h2>;
    if(block.type==="list"){const items=block.value.map((item,itemIndex)=><li key={`${item}-${itemIndex}`}><InlineText text={item}/></li>);return block.ordered?<ol key={index} type={block.lettered?"a":undefined}>{items}</ol>:<ul key={index}>{items}</ul>}
    if(block.type==="table")return <div className={styles.richTableWrap} key={index}><table className={styles.richTable}><thead><tr>{block.headers.map((cell,cellIndex)=><th key={cellIndex}><InlineText text={cell}/></th>)}</tr></thead><tbody>{block.rows.map((row,rowIndex)=><tr key={rowIndex}>{block.headers.map((_,cellIndex)=><td key={cellIndex}><InlineText text={row[cellIndex]||""}/></td>)}</tr>)}</tbody></table></div>;
    return <p key={index}><InlineText text={block.value}/></p>;
  })}</>;
}

export function Byline({author,publishedAt,updatedAt,readingTime}:{author?:Author|null;publishedAt?:string|null;updatedAt?:string|null;readingTime?:number|null}){
  return <div className={styles.meta}>{author&&<span>Written by <Link href={`/authors/${author.slug}`}>{author.name}</Link></span>}{publishedAt&&<span>Published <time dateTime={publishedAt}>{formatDate(publishedAt)}</time></span>}{updatedAt&&<span>Last updated <time dateTime={updatedAt}>{formatDate(updatedAt)}</time></span>}{readingTime&&<span>{readingTime} min read</span>}</div>;
}

type EditorialCardProps={href:string;title:string;description?:string|null;image?:string|null;imageAlt?:string|null;eyebrow?:string|null;date?:string|null};
export function EditorialCard({href,title,description,image,imageAlt,eyebrow,date}:EditorialCardProps){return <article className={styles.card}>{image&&<Link href={href} aria-label={`Read ${title}`}><SafeImage className={styles.cardImage} src={image} alt={imageAlt||title} width={640} height={360} sizes="(max-width: 760px) 100vw, (max-width: 1000px) 50vw, 33vw"/></Link>}<div className={styles.cardCopy}>{(eyebrow||date)&&<small>{eyebrow}{eyebrow&&date?" · ":""}{date?formatDate(date,{month:"short",day:"numeric",year:"numeric"}):""}</small>}<h2><Link href={href}>{title}</Link></h2>{description&&<p>{description}</p>}<Link href={href}>Read more →</Link></div></article>}

export function DirectoryCard({href,title,description,image,imageAlt,icon}:EditorialCardProps&{icon?:string}){return <Link href={href} className={styles.directoryCard}>{image?<SafeImage className={styles.directoryImage} src={image} alt={imageAlt||`${title} logo`} width={220} height={92} sizes="110px"/>:<span className={styles.directoryIcon} aria-hidden="true">{icon||"◇"}</span>}<div><h2>{title}</h2>{description&&<p>{description}</p>}</div></Link>}

export function EmptyState({children}:{children:React.ReactNode}){return <div className={styles.empty}>{children}</div>}
