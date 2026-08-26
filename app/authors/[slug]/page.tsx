import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {cache} from "react";
import {Breadcrumbs} from "../../components/Breadcrumbs";
import {PublicShell} from "../../components/PublicShell";
import {SafeImage} from "../../components/SafeImage";
import {api} from "../../lib/api";
import {publicApi} from "../../lib/public-api";
import {entityMetadata} from "../../lib/seo";
import type {BlogPost,BuyingGuide,Comparison} from "../../lib/types";
import {EditorialCard,EmptyState,safeExternalUrls,styles,type Author} from "../../guides/ContentPrimitives";

type Props={params:Promise<{slug:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
type AuthorPage=Author&{id:string;indexableWorkCount?:number;posts?:BlogPost[];guides?:BuyingGuide[];comparisons?:Comparison[]};
const getAuthor=cache((slug:string)=>publicApi<AuthorPage>(`/authors/${encodeURIComponent(slug)}`));

export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
  const [{slug},query]=await Promise.all([params,searchParams]);
  const [author,settings]=await Promise.all([getAuthor(slug),api.settings()]);
  if(!author)return {title:"Author not found",robots:{index:false,follow:true}};
  return entityMetadata(
    {robotsIndex:Object.keys(query).length===0&&Number(author.indexableWorkCount)>0,robotsFollow:true},
    {title:`${author.name} — Author`,description:author.bio||`Articles and buying guides written by ${author.name}.`,path:`/authors/${author.slug}`,image:author.profileImage},
    settings,
  );
}

export default async function AuthorProfilePage({params}:Props){
  const {slug}=await params;
  const [author,settings]=await Promise.all([getAuthor(slug),api.settings()]);
  if(!author)notFound();
  const hasWork=Boolean(author.posts?.length||author.guides?.length||author.comparisons?.length);
  const profileUrls=safeExternalUrls(author.profileUrls);
  return <PublicShell><div className={`${styles.page} ${styles.narrow}`}>
    <Breadcrumbs items={[{name:"Home",url:"/"},{name:author.name,url:`/authors/${author.slug}`}]} settings={settings}/>
    <header className={styles.profile}>
      {author.profileImage&&<SafeImage className={styles.profileImage} src={author.profileImage} alt={`${author.name} profile photo`} width={320} height={320} sizes="160px" priority/>}
      <div><span className={styles.eyebrow}>Author</span><h1 className={styles.title}>{author.name}</h1>{author.bio&&<p className={styles.lead}>{author.bio}</p>}{author.expertise?.length?<div className={styles.badgeList} aria-label="Areas of expertise">{author.expertise.map(item=><span key={item}>{item}</span>)}</div>:null}{profileUrls.length?<div className={styles.profileLinks}>{profileUrls.map(url=><a key={url} href={url} target="_blank" rel="me noopener noreferrer">Profile ↗</a>)}</div>:null}</div>
    </header>
    {author.posts?.length?<section className={styles.section}><h2>Articles by {author.name}</h2><div className={styles.cardGrid}>{author.posts.map(post=><EditorialCard key={post.id} href={`/blog/${post.slug}`} title={post.title} description={post.excerpt} image={post.coverImage} imageAlt={post.title} eyebrow="Article" date={post.publishedAt}/>)}</div></section>:null}
    {author.guides?.length?<section className={styles.section}><h2>Buying guides by {author.name}</h2><div className={styles.cardGrid}>{author.guides.map(guide=><EditorialCard key={guide.id} href={`/guides/${guide.slug}`} title={guide.title} description={guide.intro} image={guide.heroImage} imageAlt={guide.heroImageAlt} eyebrow="Buying guide" date={guide.updatedAt}/>)}</div></section>:null}
    {author.comparisons?.length?<section className={styles.section}><h2>Comparisons by {author.name}</h2><div className={styles.cardGrid}>{author.comparisons.map(item=><EditorialCard key={item.id} href={`/compare/${item.slug}`} title={item.title} description={item.introduction} image={item.heroImage} imageAlt={item.heroImageAlt} eyebrow="Comparison" date={item.updatedAt}/>)}</div></section>:null}
    {!hasWork&&<EmptyState>No published work is currently attached to this author profile.</EmptyState>}
    <p className={styles.articleLinks}><Link href="/guides">Browse all buying guides →</Link></p>
  </div></PublicShell>;
}
