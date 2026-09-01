import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {cache} from "react";
import {AffiliateDisclosure} from "../../components/AffiliateDisclosure";
import {Breadcrumbs} from "../../components/Breadcrumbs";
import {FaqList} from "../../components/FaqList";
import {JsonLd} from "../../components/JsonLd";
import {PageEvent} from "../../components/PageEvent";
import {ProductCard} from "../../components/ProductCard";
import {PublicShell} from "../../components/PublicShell";
import {SafeImage} from "../../components/SafeImage";
import {api} from "../../lib/api";
import {publicApi} from "../../lib/public-api";
import {absoluteUrl,entityMetadata} from "../../lib/seo";
import type {BuyingGuide,Product} from "../../lib/types";
import {asFaqItems,Byline,EditorialCard,RichText,styles,type Author} from "../../guides/ContentPrimitives";

type Props={params:Promise<{slug:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
type Post={id:string;slug:string;title:string;excerpt?:string|null;content:string;coverImage?:string|null;productLinks?:string[];author?:string|null;authorProfile?:Author|null;publishedAt?:string|null;contentUpdatedAt?:string|null;updatedAt:string;readingTime?:number|null;category?:{name:string;slug:string}|null;faqItems?:unknown;relatedProducts?:Product[];relatedGuides?:BuyingGuide[];relatedCategories?:{id:string;name:string;slug:string}[];seoTitle?:string|null;seoDescription?:string|null;canonicalUrl?:string|null;ogTitle?:string|null;ogDescription?:string|null;ogImage?:string|null;robotsIndex?:boolean;robotsFollow?:boolean;schemaEnabled?:boolean};
const getPost=cache((slug:string)=>publicApi<Post>(`/blog/${encodeURIComponent(slug)}`));

export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
  const [{slug},query]=await Promise.all([params,searchParams]);
  const [post,settings]=await Promise.all([getPost(slug),api.settings()]);
  if(!post)return {title:"Article not found",robots:{index:false,follow:true}};
  const metadata=entityMetadata({...post,robotsIndex:post.robotsIndex!==false&&Object.keys(query).length===0},{title:post.title,description:post.excerpt||post.content.slice(0,160),path:`/blog/${post.slug}`,image:post.coverImage},settings);
  return {...metadata,openGraph:{...metadata.openGraph,type:"article",publishedTime:post.publishedAt||undefined,modifiedTime:post.contentUpdatedAt||post.updatedAt,authors:post.authorProfile?[absoluteUrl(`/authors/${post.authorProfile.slug}`,settings)]:undefined}};
}

export default async function BlogPostPage({params}:Props){
  const {slug}=await params;
  const [post,settings]=await Promise.all([getPost(slug),api.settings()]);
  if(!post)notFound();
  const updated=post.contentUpdatedAt||post.updatedAt;
  const visibleAuthor=post.authorProfile?.name||post.author||undefined;
  const faqs=asFaqItems(post.faqItems);
  const schema=post.schemaEnabled!==false?{"@context":"https://schema.org","@type":"BlogPosting",headline:post.title,description:post.excerpt||undefined,image:post.coverImage?absoluteUrl(post.coverImage,settings):undefined,datePublished:post.publishedAt||undefined,dateModified:updated,author:visibleAuthor?{"@type":"Person",name:visibleAuthor,url:post.authorProfile?absoluteUrl(`/authors/${post.authorProfile.slug}`,settings):undefined}:undefined,mainEntityOfPage:absoluteUrl(post.canonicalUrl||`/blog/${post.slug}`,settings)}:null;
  return <PublicShell><article className={`${styles.page} ${styles.narrow}`}>
    <Breadcrumbs items={[{name:"Home",url:"/"},{name:"Blog",url:"/blog"},{name:post.title,url:`/blog/${post.slug}`}]} settings={settings} schema={post.schemaEnabled!==false}/>
    <header className={styles.heroCopy}><span className={styles.eyebrow}>{post.category?.name||"Shopping advice"}</span><h1 className={styles.title}>{post.title}</h1>{post.excerpt&&<p className={styles.lead}>{post.excerpt}</p>}<Byline author={post.authorProfile} publishedAt={post.publishedAt} updatedAt={updated} readingTime={post.readingTime}/>{!post.authorProfile&&post.author&&<div className={styles.meta}><span>Written by {post.author}</span></div>}</header>
    {post.coverImage&&<SafeImage className={styles.heroImage} src={post.coverImage} alt={post.title} width={1200} height={675} sizes="(max-width: 980px) 100vw, 900px" priority/>}
    <AffiliateDisclosure text={settings.affiliateDisclosure}/>
    <div className={styles.body}><RichText text={post.content} sectionHeadingLevel={3}/>{post.productLinks?.length?<section className={styles.productLinks} aria-labelledby="shop-this-product"><h3 id="shop-this-product">Shop this product</h3><div>{post.productLinks.map((url,index)=>{const external=/^https?:\/\//i.test(url);return <a key={`${url}-${index}`} href={url} target={external?"_blank":undefined} rel={external?"sponsored nofollow noopener noreferrer":undefined}>View product{post.productLinks!.length>1?` ${index+1}`:""} →</a>})}</div></section>:null}</div>
    <FaqList items={faqs}/>
    {post.relatedProducts?.length?<section className={styles.section}><h2>Products mentioned in this article</h2><div className={`product-grid ${styles.productGrid}`}>{post.relatedProducts.map(product=><ProductCard key={product.id} product={product} placement="blog"/>)}</div></section>:null}
    {post.relatedCategories?.length?<section className={styles.articleLinks}><h2>Explore related categories</h2><nav className={styles.related} aria-label="Related categories">{post.relatedCategories.map(category=><Link key={category.id} href={`/category/${category.slug}`}>{category.name}</Link>)}</nav></section>:null}
    {post.relatedGuides?.length?<section className={styles.section}><h2>Related buying guides</h2><div className={styles.cardGrid}>{post.relatedGuides.map(guide=><EditorialCard key={guide.id} href={`/guides/${guide.slug}`} title={guide.title} description={guide.intro} image={guide.heroImage} imageAlt={guide.heroImageAlt} eyebrow={guide.category?.name||"Buying guide"} date={guide.updatedAt}/>)}</div></section>:null}
    {schema&&<JsonLd id="blog-post-jsonld" data={schema}/>}<PageEvent name="article_view" params={{article_id:post.id,article_title:post.title}}/>
  </article></PublicShell>;
}
