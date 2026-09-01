"use client";
import { ClipboardEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SafeImage } from "../components/SafeImage";
import { api, ApiError, uploadImage } from "./api";

type Field={name:string;label:string;type?:"text"|"email"|"textarea"|"lines"|"number"|"url"|"date"|"checkbox"|"select"|"multiselect"|"image"|"images"|"json";required?:boolean;option?:string;choices?:string[];help?:string;placeholder?:string};
type Config={resource:string;singular:string;fields:Field[];statusField?:"status"|"active"|"visible";reorder?:boolean};
type AdminRole="OWNER"|"ADMIN"|"EDITOR";
type SessionAdmin={id:string;email:string;name:string;role:AdminRole};
type ContactMessage={id:string;name:string;email:string;subject?:string|null;message:string;readAt?:string|null;createdAt:string};
type NewsletterSubscriber={id:string;email:string;status:"ACTIVE"|"INACTIVE";createdAt:string};
type RelationId={productId?:string;categoryId?:string;storeId?:string;guideId?:string};
type ProductPlacement=RelationId&{product?:{slug?:string}};
type AdminRecord={
  [key:string]:unknown;
  id?:string;
  title?:string;name?:string;label?:string;websiteName?:string;slug?:string;type?:string;role?:AdminRole;
  status?:string;active?:boolean;visible?:boolean;updatedAt?:string;product?:{title?:string};
  products?:RelationId[];categories?:RelationId[];stores?:RelationId[];featuredProducts?:RelationId[];
  productPlacements?:ProductPlacement[];guidePlacements?:RelationId[];commerceCategoryPlacements?:RelationId[];
};
type AdminStats=Record<string,number|undefined>;
type SeoAuditData={summary?:{checked?:number;withWarnings?:number;warnings?:number};items?:{id:string;type:string;title:string;path:string;warnings:string[]}[]};
type ImageValue={url:string;altText?:string};
const commonSeo:Field[]=[{name:"seoTitle",label:"SEO title override"},{name:"seoDescription",label:"Meta description override",type:"textarea"},{name:"canonicalUrl",label:"Canonical URL override",type:"url"},{name:"ogTitle",label:"Open Graph title"},{name:"ogDescription",label:"Open Graph description",type:"textarea"},{name:"ogImage",label:"Open Graph image",type:"image"},{name:"robotsIndex",label:"Allow search indexing",type:"checkbox"},{name:"robotsFollow",label:"Allow link following",type:"checkbox"},{name:"schemaEnabled",label:"Enable structured data",type:"checkbox"}];
const configs:Record<string,Config>={
  Products:{resource:"products",singular:"Product",statusField:"status",fields:[{name:"title",label:"Title",required:true},{name:"slug",label:"Slug",required:true},{name:"shortDescription",label:"Short description",type:"textarea"},{name:"description",label:"Product overview",type:"textarea"},{name:"editorialSummary",label:"Answer-first editorial summary",type:"textarea"},{name:"idealFor",label:"Who this is for",type:"textarea"},{name:"notIdealFor",label:"Who this is not for",type:"textarea"},{name:"keyFeatures",label:"Key features (one per line)",type:"lines"},{name:"importantSpecs",label:"Important specs (JSON)",type:"json"},{name:"whatWeLike",label:"What we like",type:"textarea"},{name:"whatCouldBeBetter",label:"What could be better",type:"textarea"},{name:"whyRecommend",label:"Why we recommend it",type:"textarea"},{name:"pros",label:"Pros (one per line)",type:"lines"},{name:"cons",label:"Cons (one per line)",type:"lines"},{name:"bestFor",label:"Best for",type:"textarea"},{name:"bestUseCases",label:"Best use cases (one per line)",type:"lines"},{name:"comparisonNotes",label:"Comparison notes",type:"textarea"},{name:"dealAnalysis",label:"Price / deal context",type:"textarea"},{name:"alternativesNotes",label:"Alternatives notes",type:"textarea"},{name:"buyingAdvice",label:"Buying advice",type:"textarea"},{name:"faqItems",label:"FAQ items (JSON)",type:"json"},{name:"currentPrice",label:"Current price",type:"number"},{name:"oldPrice",label:"Old price",type:"number"},{name:"discountPercent",label:"Fallback discount %",type:"number"},{name:"categoryId",label:"Category",type:"select",option:"categories"},{name:"brandId",label:"Brand",type:"select",option:"brands"},{name:"storeId",label:"Store",type:"select",option:"stores"},{name:"affiliateUrl",label:"Affiliate URL",type:"url"},{name:"ctaLabel",label:"CTA label"},{name:"badge",label:"Fallback badge"},{name:"sku",label:"SKU"},{name:"availability",label:"Availability"},{name:"tags",label:"Badges / tags (comma separated)"},{name:"rating",label:"Rating",type:"number"},{name:"reviewCount",label:"Review count",type:"number"},{name:"featured",label:"Featured",type:"checkbox"},{name:"status",label:"Status",type:"select",choices:["DRAFT","ACTIVE","INACTIVE","ARCHIVED"]},{name:"images",label:"Product images",type:"images"},...commonSeo]},
  Categories:{resource:"categories",singular:"Category",statusField:"status",fields:[{name:"name",label:"Name",required:true},{name:"slug",label:"Slug",required:true},{name:"h1",label:"Page H1 override"},{name:"icon",label:"Icon"},{name:"image",label:"Image",type:"image"},{name:"description",label:"Introduction",type:"textarea"},{name:"editorialContent",label:"Editorial content",type:"textarea"},{name:"buyingTips",label:"Buying tips (one per line)",type:"lines"},{name:"faqItems",label:"FAQ items (JSON)",type:"json"},{name:"featuredProductIds",label:"Featured products",type:"multiselect",option:"products"},{name:"parentId",label:"Parent category",type:"select",option:"categories"},{name:"sortOrder",label:"Sort order",type:"number"},{name:"status",label:"Status",type:"select",choices:["ACTIVE","INACTIVE"]},...commonSeo]},
  Stores:{resource:"stores",singular:"Store",statusField:"active",fields:[{name:"name",label:"Name",required:true},{name:"slug",label:"Slug",required:true},{name:"logo",label:"Logo",type:"image"},{name:"description",label:"Unique introduction",type:"textarea"},{name:"editorialNotes",label:"Editorial notes",type:"textarea"},{name:"shoppingTips",label:"Shopping tips (one per line)",type:"lines"},{name:"faqItems",label:"FAQ items (JSON)",type:"json"},{name:"websiteUrl",label:"Website URL",type:"url"},{name:"affiliateBaseUrl",label:"Affiliate base URL",type:"url"},{name:"color",label:"Brand color"},{name:"active",label:"Active",type:"checkbox"},...commonSeo]},
  Brands:{resource:"brands",singular:"Brand",statusField:"active",fields:[{name:"name",label:"Name",required:true},{name:"slug",label:"Slug",required:true},{name:"logo",label:"Logo",type:"image"},{name:"description",label:"Editorial introduction",type:"textarea"},{name:"active",label:"Active",type:"checkbox"},...commonSeo]},
  Deals:{resource:"deals",singular:"Deal",statusField:"status",fields:[{name:"slug",label:"Slug",required:true},{name:"productId",label:"Product",type:"select",option:"products",required:true},{name:"discountPercent",label:"Discount %",type:"number"},{name:"badge",label:"Badge"},{name:"featured",label:"Featured",type:"checkbox"},{name:"status",label:"Status",type:"select",choices:["DRAFT","ACTIVE","INACTIVE"]},...commonSeo]},
  Banners:{resource:"banners",singular:"Banner",statusField:"status",fields:[{name:"title",label:"Title",required:true},{name:"subtitle",label:"Subtitle",type:"textarea"},{name:"image",label:"Banner image",type:"image"},{name:"logo",label:"Logo",type:"image"},{name:"background",label:"Background"},{name:"buttonLabel",label:"CTA label"},{name:"buttonUrl",label:"CTA URL (relative or absolute)"},{name:"storeId",label:"Store",type:"select",option:"stores"},{name:"startsAt",label:"Starts",type:"date"},{name:"endsAt",label:"Ends",type:"date"},{name:"sortOrder",label:"Sort order",type:"number"},{name:"status",label:"Status",type:"select",choices:["DRAFT","ACTIVE","INACTIVE"]}]},
  "Homepage Sections":{resource:"homepage-sections",singular:"Homepage Section",statusField:"visible",reorder:true,fields:[{name:"type",label:"Section type",type:"select",choices:["HERO","STORE_LOGOS","FEATURED_PRODUCTS","CATEGORY_GRID","STORE_PRODUCTS","PROMO_BANNER","BLOG","TRUST_FEATURES","CUSTOM"],required:true},{name:"title",label:"Title"},{name:"subtitle",label:"Subtitle",type:"textarea"},{name:"productIds",label:"Products",type:"multiselect",option:"products"},{name:"categoryIds",label:"Categories",type:"multiselect",option:"categories"},{name:"storeIds",label:"Stores",type:"multiselect",option:"stores"},{name:"maxItems",label:"Display limit",type:"number"},{name:"sortOrder",label:"Sort order",type:"number"},{name:"visible",label:"Visible",type:"checkbox"},{name:"background",label:"Background"},{name:"ctaText",label:"CTA text"},{name:"ctaUrl",label:"CTA URL"},{name:"config",label:"Advanced configuration (JSON)",type:"json"}]},
  Blog:{resource:"blog",singular:"Blog Post",statusField:"status",fields:[{name:"title",label:"Title (page H1)",required:true,help:"The main article headline. It appears once as the page H1."},{name:"slug",label:"Slug",required:true},{name:"excerpt",label:"Short description",type:"textarea",help:"A brief introduction shown directly below the headline."},{name:"content",label:"Blog description",type:"textarea",required:true,help:"Paste your description normally—line breaks, paragraphs, and lists are preserved. Start a subsection with ### followed by its H3 heading."},{name:"coverImage",label:"Cover image",type:"image"},{name:"categoryId",label:"Blog category",type:"select",option:"blogCategories"},{name:"productLinks",label:"Product links (one per line)",type:"lines",help:"Paste any product or retailer URL. The product does not need to exist or be active in Products."},{name:"guideIds",label:"Related buying guides",type:"multiselect",option:"guides"},{name:"commerceCategoryIds",label:"Related shopping categories",type:"multiselect",option:"categories"},{name:"authorId",label:"Author profile",type:"select",option:"authors"},{name:"author",label:"Fallback author name"},{name:"faqItems",label:"FAQ items (JSON)",type:"json"},{name:"tags",label:"Tags (comma separated)"},{name:"publishedAt",label:"Publish date",type:"date"},{name:"contentUpdatedAt",label:"Content updated",type:"date"},{name:"readingTime",label:"Reading time",type:"number"},{name:"status",label:"Status",type:"select",choices:["DRAFT","ACTIVE","INACTIVE"]},...commonSeo]},
  Authors:{resource:"authors",singular:"Author",statusField:"active",fields:[{name:"name",label:"Name",required:true},{name:"slug",label:"Slug",required:true},{name:"bio",label:"Bio",type:"textarea"},{name:"profileImage",label:"Profile image",type:"image"},{name:"expertise",label:"Expertise (one per line)",type:"lines"},{name:"profileUrls",label:"Profile URLs (one per line)",type:"lines"},{name:"active",label:"Active",type:"checkbox"}]},
  "Buying Guides":{resource:"guides",singular:"Buying Guide",statusField:"status",fields:[{name:"title",label:"Title",required:true},{name:"slug",label:"Slug",required:true},{name:"intro",label:"Answer-first introduction",type:"textarea",required:true},{name:"body",label:"Main body",type:"textarea"},{name:"editorialSections",label:"Editorial sections (JSON)",type:"json"},{name:"categoryId",label:"Category",type:"select",option:"categories"},{name:"productIds",label:"Selected products",type:"multiselect",option:"products"},{name:"authorId",label:"Author",type:"select",option:"authors"},{name:"heroImage",label:"Hero image",type:"image"},{name:"heroImageAlt",label:"Hero image alt text"},{name:"faqItems",label:"FAQ items (JSON)",type:"json"},{name:"publishedAt",label:"Publish date",type:"date"},{name:"status",label:"Status",type:"select",choices:["DRAFT","ACTIVE","INACTIVE","ARCHIVED"]},...commonSeo]},
  Comparisons:{resource:"comparisons",singular:"Comparison",statusField:"status",fields:[{name:"title",label:"Title",required:true},{name:"slug",label:"Slug",required:true},{name:"introduction",label:"Answer-first introduction",type:"textarea",required:true},{name:"productIds",label:"Products",type:"multiselect",option:"products"},{name:"storeIds",label:"Stores",type:"multiselect",option:"stores"},{name:"comparisonTable",label:"Comparison table (JSON)",type:"json"},{name:"strengths",label:"Strengths by item (JSON)",type:"json"},{name:"weaknesses",label:"Weaknesses by item (JSON)",type:"json"},{name:"pricingNotes",label:"Pricing notes",type:"textarea"},{name:"bestFor",label:"Best for",type:"textarea"},{name:"verdict",label:"Verdict",type:"textarea"},{name:"faqItems",label:"FAQ items (JSON)",type:"json"},{name:"authorId",label:"Author",type:"select",option:"authors"},{name:"heroImage",label:"Hero image",type:"image"},{name:"heroImageAlt",label:"Hero image alt text"},{name:"publishedAt",label:"Publish date",type:"date"},{name:"status",label:"Status",type:"select",choices:["DRAFT","ACTIVE","INACTIVE","ARCHIVED"]},...commonSeo]},
  "Trust Pages":{resource:"pages",singular:"Trust Page",statusField:"status",fields:[{name:"title",label:"Title",required:true},{name:"slug",label:"Slug",required:true},{name:"intro",label:"Introduction",type:"textarea"},{name:"content",label:"Page content",type:"textarea",required:true},{name:"publishedAt",label:"Publish date",type:"date"},{name:"status",label:"Status",type:"select",choices:["DRAFT","ACTIVE","INACTIVE","ARCHIVED"]},...commonSeo]},
  Navigation:{resource:"navigation",singular:"Navigation Item",statusField:"active",reorder:true,fields:[{name:"label",label:"Label",required:true},{name:"url",label:"URL",required:true},{name:"parentId",label:"Dropdown parent",type:"select",option:"navigation"},{name:"sortOrder",label:"Sort order",type:"number"},{name:"active",label:"Active",type:"checkbox"}]},
  Footer:{resource:"footer",singular:"Footer Column",statusField:"active",reorder:true,fields:[{name:"title",label:"Column title",required:true},{name:"content",label:"Content",type:"textarea"},{name:"links",label:"Links JSON",type:"json"},{name:"sortOrder",label:"Sort order",type:"number"},{name:"active",label:"Active",type:"checkbox"}]},
  "Affiliate Links":{resource:"affiliate-links",singular:"Affiliate Link",statusField:"active",fields:[{name:"label",label:"Label",required:true},{name:"url",label:"Destination URL",type:"url",required:true},{name:"productId",label:"Product",type:"select",option:"products"},{name:"clickCount",label:"Click count",type:"number"},{name:"active",label:"Active",type:"checkbox"}]},
  "Users / Admins":{resource:"admins",singular:"Administrator",statusField:"active",fields:[{name:"name",label:"Name",required:true},{name:"email",label:"Email",type:"email",required:true},{name:"password",label:"Password (10+ characters)"},{name:"role",label:"Role",type:"select",choices:["OWNER","ADMIN","EDITOR"],required:true},{name:"active",label:"Active",type:"checkbox"}]},
};
const modules=["Overview","SEO Audit","Contact Messages","Subscribers",...Object.keys(configs),"Settings"];
type Option={id:string;name?:string;title?:string;label?:string;slug?:string;status?:string;affiliateUrl?:string|null;affiliateLinks?:{url:string}[]};
type Options=Record<string,Option[]>;

export default function Admin(){
  const [authenticated,setAuthenticated]=useState<boolean|null>(null);
  const [currentAdmin,setCurrentAdmin]=useState<SessionAdmin|null>(null);
  const [active,setActive]=useState("Overview");
  const [stats,setStats]=useState<AdminStats>({});
  const [audit,setAudit]=useState<SeoAuditData>({summary:{},items:[]});
  const [records,setRecords]=useState<AdminRecord[]>([]);
  const [contactMessages,setContactMessages]=useState<ContactMessage[]>([]);
  const [subscribers,setSubscribers]=useState<NewsletterSubscriber[]>([]);
  const [options,setOptions]=useState<Options>({});
  const [editing,setEditing]=useState<AdminRecord|null>(null);
  const [creating,setCreating]=useState(false);
  const [busy,setBusy]=useState(false);
  const [navOpen,setNavOpen]=useState(false);
  const [notice,setNotice]=useState<{kind:"success"|"error";text:string}|null>(null);
  const config=configs[active];
  const visibleModules=useMemo(()=>modules.filter(module=>currentAdmin?.role!=="EDITOR"||!["Contact Messages","Subscribers","Users / Admins","Settings"].includes(module)),[currentAdmin?.role]);
  const modalConfig=useMemo(()=>{
    if(!config||config.resource!=="admins"||currentAdmin?.role==="OWNER")return config;
    return {...config,fields:config.fields.map(field=>field.name==="role"?{...field,choices:["ADMIN","EDITOR"]}:field)};
  },[config,currentAdmin?.role]);
  const notify=useCallback((kind:"success"|"error",text:string)=>{setNotice({kind,text});window.setTimeout(()=>setNotice(null),4500)},[]);

  useEffect(()=>{
    let cancelled=false;
    api<{admin:SessionAdmin}|SessionAdmin>("/auth/session").then(payload=>{
      if(cancelled)return;
      const admin="admin" in payload?payload.admin:payload;
      setCurrentAdmin(admin);
      setAuthenticated(true);
    }).catch(error=>{
      if(cancelled)return;
      setCurrentAdmin(null);
      setAuthenticated(false);
      if(!(error instanceof ApiError)||error.status!==401)notify("error",error instanceof Error?error.message:"Unable to verify your session");
    });
    return()=>{cancelled=true};
  },[notify]);

  useEffect(()=>{
    if(!navOpen)return;
    const previous=document.body.style.overflow;
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setNavOpen(false)};
    document.body.style.overflow="hidden";
    window.addEventListener("keydown",closeOnEscape);
    return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",closeOnEscape)};
  },[navOpen]);

  const load=useCallback(async()=>{
    if(!authenticated)return;
    try{
      if(active==="Overview"){setStats(await api("/admin/overview"));setRecords([])}
      else if(active==="SEO Audit"){setAudit(await api("/admin/seo-audit"));setRecords([])}
      else if(active==="Contact Messages"){setContactMessages(await api<ContactMessage[]>("/admin/contact-messages"));setRecords([]);setOptions({})}
      else if(active==="Subscribers"){setSubscribers(await api<NewsletterSubscriber[]>("/admin/subscribers"));setRecords([]);setOptions({})}
      else if(active==="Settings"){setEditing(await api("/admin/settings")||{});setRecords([])}
      else if(config){const [data,opts]=await Promise.all([api<AdminRecord[]>(`/admin/${config.resource}`),api<Options>("/admin/options")]);setRecords(data);setOptions({...opts,navigation:config.resource==="navigation"?data:[]})}
    }catch(error){
      if(error instanceof ApiError&&error.status===401){setAuthenticated(false);setCurrentAdmin(null)}
      else notify("error",error instanceof Error?error.message:"Failed to load data");
    }
  },[active,authenticated,config,notify]);

  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);

  function selectModule(module:string){setActive(module);setEditing(null);setCreating(false);setNavOpen(false)}

  async function login(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);const data=new FormData(event.currentTarget);
    try{
      const payload=await api<{admin:SessionAdmin}>("/auth/login",{method:"POST",body:JSON.stringify({email:data.get("email"),password:data.get("password")})});
      setCurrentAdmin(payload.admin);setAuthenticated(true);
    }catch(error){notify("error",error instanceof Error?error.message:"Login failed")}finally{setBusy(false)}
  }

  async function logout(){
    setBusy(true);
    try{await api("/auth/logout",{method:"POST"})}
    catch(error){notify("error",error instanceof Error?error.message:"Logout failed");return}
    finally{setBusy(false)}
    setCurrentAdmin(null);setAuthenticated(false);setActive("Overview");setNavOpen(false);
  }

  async function save(value:AdminRecord){
    if(!config)return;setBusy(true);
    try{await api(`/admin/${config.resource}${editing?.id?`/${editing.id}`:""}`,{method:editing?.id?"PATCH":"POST",body:JSON.stringify(value)});notify("success",`${config.singular} ${editing?.id?"updated":"created"} successfully`);setEditing(null);setCreating(false);await load()}
    catch(error){notify("error",error instanceof Error?error.message:"Save failed")}finally{setBusy(false)}
  }

  async function remove(row:AdminRecord){
    if(!config||!window.confirm(`Are you sure you want to delete this ${config.singular.toLowerCase()}?`))return;setBusy(true);
    try{await api(`/admin/${config.resource}/${row.id}`,{method:"DELETE"});notify("success",`${config.singular} deleted successfully`);await load()}
    catch(error){notify("error",error instanceof Error?error.message:"Delete failed")}finally{setBusy(false)}
  }

  async function toggle(row:AdminRecord){
    if(!config)return;const isActive=config.statusField==="status"?row.status==="ACTIVE":Boolean(row[config.statusField!]);setBusy(true);
    try{await api(`/admin/${config.resource}/${row.id}/toggle`,{method:"POST",body:JSON.stringify({active:!isActive})});notify("success",`${config.singular} ${isActive?"deactivated":"activated"}`);await load()}
    catch(error){notify("error",error instanceof Error?error.message:"Update failed")}finally{setBusy(false)}
  }

  async function move(row:AdminRecord,direction:"up"|"down"){
    if(!config)return;setBusy(true);
    try{await api(`/admin/${config.resource}/${row.id}/move`,{method:"POST",body:JSON.stringify({direction})});await load()}
    catch(error){notify("error",error instanceof Error?error.message:"Reorder failed")}
    finally{setBusy(false)}
  }

  async function toggleContact(row:ContactMessage){
    setBusy(true);
    try{await api(`/admin/contact-messages/${row.id}/toggle`,{method:"POST",body:JSON.stringify({read:!row.readAt})});notify("success",`Message marked ${row.readAt?"unread":"read"}`);await load()}
    catch(error){notify("error",error instanceof Error?error.message:"Message update failed")}finally{setBusy(false)}
  }

  async function deleteContact(row:ContactMessage){
    if(!window.confirm(`Delete the message from ${row.name}?`))return;setBusy(true);
    try{await api(`/admin/contact-messages/${row.id}`,{method:"DELETE"});notify("success","Message deleted");await load()}
    catch(error){notify("error",error instanceof Error?error.message:"Message deletion failed")}finally{setBusy(false)}
  }

  async function toggleSubscriber(row:NewsletterSubscriber){
    const isActive=row.status==="ACTIVE";setBusy(true);
    try{await api(`/admin/subscribers/${row.id}/toggle`,{method:"POST",body:JSON.stringify({active:!isActive})});notify("success",`Subscriber ${isActive?"deactivated":"reactivated"}`);await load()}
    catch(error){notify("error",error instanceof Error?error.message:"Subscriber update failed")}finally{setBusy(false)}
  }

  async function deleteSubscriber(row:NewsletterSubscriber){
    if(!window.confirm(`Permanently delete ${row.email} from the subscriber list?`))return;setBusy(true);
    try{await api(`/admin/subscribers/${row.id}`,{method:"DELETE"});notify("success","Subscriber deleted");await load()}
    catch(error){notify("error",error instanceof Error?error.message:"Subscriber deletion failed")}finally{setBusy(false)}
  }

  async function saveSettings(value:Record<string,unknown>){
    setBusy(true);
    try{await api("/admin/settings",{method:"PUT",body:JSON.stringify(value)});notify("success","Settings saved successfully");await load()}
    catch(error){notify("error",error instanceof Error?error.message:"Save failed")}finally{setBusy(false)}
  }

  if(authenticated===null)return <main className="admin-loading" aria-live="polite"><span>Loading content studio…</span></main>;
  if(authenticated===false)return <><Login onSubmit={login} busy={busy}/>{notice&&<Toast {...notice}/>}</>;
  const initials=currentAdmin?.name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()||"AD";
  return <div className="admin-shell">
    {navOpen&&<button type="button" className="admin-nav-overlay" aria-label="Close admin navigation" onClick={()=>setNavOpen(false)}/>}
    <aside id="admin-navigation" aria-label="Admin navigation" className={navOpen?"open":""}>
      <div className="admin-brand-row"><Link className="admin-brand" href="/"><SafeImage src="/brand/bargain-mom-logo.webp" alt="Bargain MOM" width={230} height={104}/></Link><button type="button" className="admin-nav-close" aria-label="Close navigation" onClick={()=>setNavOpen(false)}>×</button></div>
      <nav className="admin-menu" aria-label="Workspace sections">
        <p>WORKSPACE</p>
        {visibleModules.map(module=><button type="button" key={module} className={active===module?"active":""} aria-current={active===module?"page":undefined} onClick={()=>selectModule(module)}><span aria-hidden="true">{icon(module)}</span>{module}</button>)}
      </nav>
      <div className="admin-user"><div className="admin-avatar">{initials}</div><span><b>{currentAdmin?.name||"Administrator"}</b><small>{roleLabel(currentAdmin?.role)}</small></span></div>
    </aside>
    <main className="admin-main">
      <header><button type="button" className="admin-nav-toggle" aria-label="Open admin navigation" aria-controls="admin-navigation" aria-expanded={navOpen} onClick={()=>setNavOpen(true)}>☰</button><div className="admin-page-title"><small>CONTENT STUDIO</small><h1>{active}</h1></div><div className="admin-actions"><Link href="/">View site ↗</Link><button type="button" onClick={logout} disabled={busy}>Log out</button></div></header>
      {active==="Overview"?<Overview stats={stats} onCreate={()=>{setActive("Products");setEditing(null);setCreating(true)}}/>:active==="SEO Audit"?<SeoAudit audit={audit}/>:active==="Contact Messages"?<ContactInbox records={contactMessages} busy={busy} onToggle={toggleContact} onDelete={deleteContact}/>:active==="Subscribers"?<SubscriberManager records={subscribers} busy={busy} onToggle={toggleSubscriber} onDelete={deleteSubscriber}/>:active==="Settings"?<SettingsForm key={`${String(editing?.id||"settings")}-${String(editing?.updatedAt||"")}`} initial={editing||{}} busy={busy} onSave={saveSettings}/>:config?<Resource config={config} records={records} busy={busy} currentAdmin={currentAdmin} onAdd={()=>{setEditing(null);setCreating(true)}} onEdit={row=>{setEditing(normalize(row,config));setCreating(true)}} onDelete={remove} onToggle={toggle} onMove={move}/>:null}
    </main>
    {creating&&modalConfig&&<RecordModal config={modalConfig} initial={editing||{}} options={options} busy={busy} onClose={()=>{setCreating(false);setEditing(null)}} onSave={save}/>} {notice&&<Toast {...notice}/>}</div>}

function Login({onSubmit,busy}:{onSubmit:(e:FormEvent<HTMLFormElement>)=>void;busy:boolean}){return <main className="login-screen"><form onSubmit={onSubmit}><SafeImage src="/brand/bargain-mom-logo.webp" alt="Bargain MOM" width={420} height={192} priority/><h1>Admin sign in</h1><label>Email<input name="email" type="email" required autoComplete="username"/></label><label>Password<input name="password" type="password" minLength={10} required autoComplete="current-password"/></label><button type="submit" disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form></main>}
function Overview({stats,onCreate}:{stats:AdminStats;onCreate:()=>void}){return <><section className="welcome"><div><span>STORE OVERVIEW</span><h2>Welcome back.</h2><p>Here is the latest from your storefront.</p></div><button type="button" onClick={onCreate}>+ Create product</button></section><div className="stat-grid">{[["Products",stats.products],["Active deals",stats.deals],["Stores",stats.stores],["Subscribers",stats.subscribers]].map(([label,count])=><article key={String(label)}><small>{label}</small><strong>{count||0}</strong><p>Current total</p></article>)}</div></>}
function SeoAudit({audit}:{audit:SeoAuditData}){return <section className="resource seo-audit"><div className="resource-head"><div><h2>SEO guidance</h2><p>Non-blocking checks for published, indexable content</p></div></div><div className="stat-grid">{[["Pages checked",audit.summary?.checked],["Needs attention",audit.summary?.withWarnings],["Total suggestions",audit.summary?.warnings]].map(([label,count])=><article key={String(label)}><small>{label}</small><strong>{count||0}</strong><p>Current audit</p></article>)}</div><div className="audit-list">{audit.items?.map(item=><article key={`${item.type}-${item.id}`}><div><span>{item.type}</span><h3>{item.title}</h3><a href={item.path} target="_blank" rel="noreferrer">Preview ↗</a></div>{item.warnings.length?<ul>{item.warnings.map(warning=><li key={warning}>{warning}</li>)}</ul>:<p className="audit-good">No warnings found.</p>}</article>)}</div></section>}
function ContactInbox({records,busy,onToggle,onDelete}:{records:ContactMessage[];busy:boolean;onToggle:(row:ContactMessage)=>void;onDelete:(row:ContactMessage)=>void}){return <section className="resource contact-inbox"><div className="resource-head"><div><h2>Contact messages</h2><p>{records.length} customer {records.length===1?"message":"messages"}</p></div></div>{records.length?<div className="message-list">{records.map(row=><article key={row.id} className={row.readAt?"read":"unread"}><header><div><span className="message-state">{row.readAt?"READ":"NEW"}</span><h3>{row.subject||"Website inquiry"}</h3><p>From <strong>{row.name}</strong> · <a href={`mailto:${row.email}`}>{row.email}</a></p></div><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</time></header><p className="message-body">{row.message}</p><footer><button type="button" disabled={busy} onClick={()=>onToggle(row)}>Mark {row.readAt?"unread":"read"}</button><button type="button" className="danger" disabled={busy} onClick={()=>onDelete(row)}>Delete</button></footer></article>)}</div>:<div className="inbox-empty"><b>No contact messages</b><p>New messages submitted through the Contact page will appear here.</p></div>}</section>}
function csvCell(value:string){const safe=/^[=+\-@]/.test(value)?`'${value}`:value;return `"${safe.replaceAll('"','""')}"`}
function exportSubscribers(records:NewsletterSubscriber[]){const rows=[["Email","Status","Subscribed at"],...records.map(row=>[row.email,row.status,new Date(row.createdAt).toISOString()])];const csv=rows.map(row=>row.map(csvCell).join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([`\uFEFF${csv}`],{type:"text/csv;charset=utf-8"}));const anchor=document.createElement("a");anchor.href=url;anchor.download=`bargain-mom-subscribers-${new Date().toISOString().slice(0,10)}.csv`;document.body.append(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),0)}
function SubscriberManager({records,busy,onToggle,onDelete}:{records:NewsletterSubscriber[];busy:boolean;onToggle:(row:NewsletterSubscriber)=>void;onDelete:(row:NewsletterSubscriber)=>void}){
  const [query,setQuery]=useState("");const [status,setStatus]=useState("ALL");
  const filtered=useMemo(()=>records.filter(row=>(status==="ALL"||row.status===status)&&row.email.toLowerCase().includes(query.trim().toLowerCase())),[query,records,status]);
  const activeCount=records.filter(row=>row.status==="ACTIVE").length;
  return <section className="resource subscribers"><div className="resource-head"><div><h2>Newsletter subscribers</h2><p>{activeCount} active · {records.length} total</p></div><button type="button" disabled={!filtered.length} onClick={()=>exportSubscribers(filtered)}>Export CSV</button></div><div className="subscriber-tools"><label><span>Search email</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search subscribers…"/></label><label><span>Status</span><select value={status} onChange={event=>setStatus(event.target.value)}><option value="ALL">All subscribers</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><div className="data-table subscriber-table"><div className="data-row subscriber-row heading"><span>Email</span><span>Status</span><span>Subscribed</span><span>Actions</span></div>{filtered.length?filtered.map(row=><div className="data-row subscriber-row" key={row.id}><span><a href={`mailto:${row.email}`}>{row.email}</a></span><span><em className={`status ${row.status==="ACTIVE"?"active":""}`}>{row.status}</em></span><span><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</time></span><span className="row-actions"><button type="button" disabled={busy} onClick={()=>onToggle(row)}>{row.status==="ACTIVE"?"Deactivate":"Reactivate"}</button><button type="button" className="danger" disabled={busy} onClick={()=>onDelete(row)}>Delete</button></span></div>):<div className="table-empty"><b>{records.length?"No subscribers match these filters":"No subscribers yet"}</b><p>{records.length?"Try another email or status.":"New email signups will appear here automatically."}</p></div>}</div></section>
}
function Resource({config,records,busy,currentAdmin,onAdd,onEdit,onDelete,onToggle,onMove}:{config:Config;records:AdminRecord[];busy:boolean;currentAdmin:SessionAdmin|null;onAdd:()=>void;onEdit:(record:AdminRecord)=>void;onDelete:(record:AdminRecord)=>void;onToggle:(record:AdminRecord)=>void;onMove:(record:AdminRecord,direction:"up"|"down")=>void}){return <section className="resource"><div className="resource-head"><div><h2>{config.resource.replaceAll("-"," ")}</h2><p>{records.length} records</p></div><button type="button" onClick={onAdd}>+ Add {config.singular}</button></div><div className="data-table"><div className="data-row heading"><span>Name</span><span>Status</span><span>Updated</span><span>Actions</span></div>{records.length?records.map(row=>{const ownerProtected=config.resource==="admins"&&currentAdmin?.role!=="OWNER"&&row.role==="OWNER";const ownAccount=config.resource==="admins"&&currentAdmin?.id===row.id;return <div className="data-row" key={row.id}><span><b>{displayName(row)}</b><small>{row.slug||row.type||row.role||""}</small></span><span><Status row={row} config={config}/></span><span>{row.updatedAt?new Date(row.updatedAt).toLocaleDateString("en-US"):"—"}</span><span className="row-actions">{ownerProtected?<em className="owner-lock">Owner account</em>:<><button type="button" onClick={()=>onEdit(row)}>Edit</button>{config.statusField&&<button type="button" onClick={()=>onToggle(row)} disabled={busy||ownAccount} title={ownAccount?"You cannot deactivate your own account":undefined}>{activeValue(row,config)?"Deactivate":"Activate"}</button>}{config.reorder&&<><button type="button" onClick={()=>onMove(row,"up")} disabled={busy} aria-label={`Move ${displayName(row)} up`}>↑</button><button type="button" onClick={()=>onMove(row,"down")} disabled={busy} aria-label={`Move ${displayName(row)} down`}>↓</button></>}<button type="button" className="danger" onClick={()=>onDelete(row)} disabled={busy||ownAccount} title={ownAccount?"You cannot delete your own account":undefined}>Delete</button></>}</span></div>}):<div className="table-empty"><b>No records yet</b><p>Create the first {config.singular.toLowerCase()} to get started.</p></div>}</div></section>}
function RecordModal({config,initial,options,busy,onClose,onSave}:{config:Config;initial:AdminRecord;options:Options;busy:boolean;onClose:()=>void;onSave:(value:AdminRecord)=>void}){
  const [values,setValues]=useState<AdminRecord>(initial);
  const [uploading,setUploading]=useState("");
  useEffect(()=>{const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape"&&!busy)onClose()};window.addEventListener("keydown",closeOnEscape);return()=>window.removeEventListener("keydown",closeOnEscape)},[busy,onClose]);
  async function image(field:Field,file?:File){if(!file)return;setUploading(field.name);try{const result=await uploadImage(file);setValues(current=>{const images=Array.isArray(current[field.name])?current[field.name]:[];return {...current,[field.name]:field.type==="images"?[...images,{url:result.url}]:result.url}})}catch(error){window.alert(error instanceof Error?error.message:"Upload failed")}finally{setUploading("")}}
  function submit(event:FormEvent){event.preventDefault();const out:AdminRecord={...values};for(const field of config.fields){if(field.type==="number"&&out[field.name]!==""&&out[field.name]!=null)out[field.name]=Number(out[field.name]);if(field.type==="date"&&out[field.name])out[field.name]=new Date(`${String(out[field.name]).slice(0,10)}T00:00:00.000Z`).toISOString();if(field.name==="tags"&&typeof out.tags==="string")out.tags=out.tags.split(",").map(item=>item.trim()).filter(Boolean);if(field.type==="lines"&&typeof out[field.name]==="string")out[field.name]=out[field.name].split("\n").map(item=>item.trim()).filter(Boolean);if(field.type==="json"&&typeof out[field.name]==="string")try{out[field.name]=JSON.parse(out[field.name]||(field.name==="links"?"[]":"{}"))}catch{return window.alert(`${field.label} must contain valid JSON`)}}if(config.resource==="blog"){const links=Array.isArray(out.productLinks)?out.productLinks.map(String):[];const invalid=links.filter(link=>!isSafeProductLink(link));if(invalid.length)return window.alert(`Use a product page path or a complete http(s) URL:\n\n${invalid.join("\n")}`);const resolved=links.map(link=>resolveProductLink(link,options.products||[])).filter((product):product is Option=>Boolean(product));out.productIds=Array.from(new Set(resolved.map(product=>product.id)));out.productLinks=links}if(config.resource==="admins"&&!out.password)delete out.password;onSave(out)}
  return <div className="modal-backdrop"><form className="record-modal" role="dialog" aria-modal="true" aria-labelledby="record-modal-title" onSubmit={submit}><header><div><small>{initial.id?"EDIT":"CREATE"}</small><h2 id="record-modal-title">{config.singular}</h2></div><button type="button" onClick={onClose} aria-label={`Close ${config.singular} form`}>×</button></header><div className="form-intro"><strong>Quick guide</strong><p>Start with fields marked <b>Required</b>. Everything else is optional and can be added later. Short tips and examples are shown under each field.</p></div><div className="form-grid">{config.fields.map(field=>{const help=fieldHelp(field);const className=field.type==="textarea"||field.type==="lines"||field.type==="json"||field.type==="images"?"wide":"";const input=<FieldInput field={field} value={values[field.name]} options={options} uploading={uploading===field.name} onImage={file=>image(field,file)} onChange={value=>setValues(current=>({...current,[field.name]:value}))}/>;const heading=field.type!=="checkbox"&&<span className="field-label"><b>{field.label}{field.required&&<em>Required</em>}</b>{help&&<small>{help}</small>}</span>;return field.type==="multiselect"?<div key={field.name} className={`form-field ${className}`}>{heading}{input}</div>:<label key={field.name} className={className}>{heading}{input}{field.type==="checkbox"&&help&&<small className="field-help">{help}</small>}</label>})}</div><footer><button className="cancel" type="button" onClick={onClose}>Cancel</button><button className="save" type="submit" disabled={busy||Boolean(uploading)}>{busy?"Saving…":initial.id?"Save changes":"Create"}</button></footer></form></div>
}
function fieldHelp(field:Field){
  if(field.help)return field.help;
  const named:Record<string,string>={
    name:"The customer-facing name shown throughout the site.",title:"The customer-facing heading shown on the website.",slug:"The page address. Use lowercase words with hyphens, for example summer-kitchen-deals.",
    logo:"Upload a clean logo with a transparent background when possible.",image:"Upload the image visitors should see for this item.",images:"Upload clear product images. Add descriptive alt text for accessibility.",
    description:"A short, original introduction written for shoppers.",shortDescription:"A concise summary used in lists and cards.",websiteUrl:"The retailer or brand’s public website, not an affiliate tracking link.",affiliateUrl:"The tracked retailer link used when shoppers click to buy.",affiliateBaseUrl:"Optional base affiliate URL used for this store’s outgoing links.",
    currentPrice:"Enter the current U.S. dollar price as a number, for example 49.99.",oldPrice:"Optional previous U.S. dollar price. It helps show a real discount.",discountPercent:"Optional discount percentage, for example 20. Leave blank when unknown.",
    shoppingTips:"Add one useful shopper tip per line.",buyingTips:"Add one useful buying tip per line.",keyFeatures:"Add one feature per line so the site can display a clean list.",pros:"Add one advantage per line.",cons:"Add one limitation per line.",
    faqItems:"Optional advanced field. Add only real, useful shopper questions; leave blank if you do not need FAQs.",importantSpecs:"Optional advanced field for structured specifications. Leave blank if not needed.",
    startsAt:"The first day this deal should be eligible to appear.",endsAt:"The final day this deal should appear as active.",status:"Draft keeps this off the public site. Active makes it eligible to display.",active:"Turn this on when this item is ready for visitors to use.",visible:"Turn this on when this section is ready to show on the homepage.",
    seoTitle:"Optional search result title. Leave blank to use the automatic title.",seoDescription:"Optional search result description. Leave blank to use the automatic description.",canonicalUrl:"Usually leave blank—the site creates the correct canonical URL automatically.",robotsIndex:"Turn on only for pages that should appear in search engines.",robotsFollow:"Allows search engines to follow the links on this page.",schemaEnabled:"Adds accurate structured data for search engines when available."
  };
  if(named[field.name])return named[field.name];
  if(field.type==="json")return "Optional advanced field. Leave it blank unless you have this information ready.";
  if(field.type==="lines")return "Enter one item per line.";
  if(field.type==="image")return "Upload an image from your computer.";
  if(field.type==="multiselect")return "Choose one or more related items.";
  if(field.type==="select")return "Choose the best matching option.";
  if(field.type==="textarea")return "Optional. Write clear, helpful copy for shoppers.";
  return "Optional. You can add this later.";
}
function fieldPlaceholder(field:Field){
  if(field.placeholder)return field.placeholder;
  const named:Record<string,string>={name:"e.g., Example Store",title:"e.g., Best kitchen deals this week",slug:"e.g., example-store",websiteUrl:"https://www.example.com",affiliateUrl:"https://retailer.example/your-link",affiliateBaseUrl:"https://retailer.example/affiliate",productLinks:"https://bargainmom.net/product/example-product",color:"e.g., #ff6413",ctaLabel:"e.g., Shop now",ctaText:"e.g., View deals",ctaUrl:"e.g., /store/example-store",currentPrice:"e.g., 49.99",oldPrice:"e.g., 79.99",discountPercent:"e.g., 20",sku:"e.g., ABC-123",tags:"e.g., Editor’s pick, Travel",faqItems:'[{"question":"…","answer":"…"}]',importantSpecs:'[{"label":"…","value":"…"}]',config:'{"key":"value"}',links:'[{"label":"About","url":"/about"}]'};
  if(named[field.name])return named[field.name];
  if(field.type==="lines")return "One item per line";
  if(field.type==="textarea")return "Write a clear, shopper-friendly description…";
  if(field.type==="url")return "https://";
  return undefined;
}
function optionText(option:Option){return option.name||option.title||option.label||"Untitled option"}
function MultiSelectField({field,value,options,onChange}:{field:Field;value:unknown;options:Options;onChange:(value:unknown)=>void}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const root=useRef<HTMLDivElement>(null);
  const selected=Array.isArray(value)?value.map(String):[];
  const choices=field.option?options[field.option]||[]:[];
  const selectedOptions=choices.filter(option=>selected.includes(option.id));
  const filtered=choices.filter(option=>optionText(option).toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(()=>{if(!open)return;const close=(event:MouseEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[open]);
  function toggle(id:string){onChange(selected.includes(id)?selected.filter(valueId=>valueId!==id):[...selected,id])}
  return <div className={`multi-select${open?" open":""}`} ref={root}>
    <button className="multi-select-trigger" type="button" aria-expanded={open} onClick={()=>setOpen(current=>!current)}>
      <span>{selectedOptions.length?selectedOptions.slice(0,2).map(option=>optionText(option)).join(", "):"Choose options…"}</span>
      {selectedOptions.length>2&&<small>+{selectedOptions.length-2} more</small>}
      {selectedOptions.length>0&&selectedOptions.length<=2&&<small>{selectedOptions.length} selected</small>}
    </button>
    {open&&<div className="multi-select-menu">
      <div className="multi-select-tools"><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search options…" aria-label={`Search ${field.label}`}/>{selected.length>0&&<button type="button" onClick={()=>onChange([])}>Clear</button>}</div>
      <div className="multi-select-options" role="group" aria-label={field.label}>{filtered.length?filtered.map(option=><label key={option.id} className="multi-select-option"><input type="checkbox" checked={selected.includes(option.id)} onChange={()=>toggle(option.id)}/><span>{optionText(option)}</span></label>):<p>No matching options</p>}</div>
    </div>}
  </div>
}
function FieldInput({field,value,options,uploading,onImage,onChange}:{field:Field;value:unknown;options:Options;uploading:boolean;onImage:(file?:File)=>void;onChange:(value:unknown)=>void}){
  if(field.type==="checkbox")return <span className="check"><input type="checkbox" checked={Boolean(value)} onChange={event=>onChange(event.target.checked)}/>{field.label}</span>;
  if(field.type==="textarea"||field.type==="lines"||field.type==="json"){
    const textValue=field.type==="json"?(typeof value==="string"?value:value==null?"":JSON.stringify(value,null,2)):field.type==="lines"&&Array.isArray(value)?value.join("\n"):typeof value==="string"||typeof value==="number"?String(value):"";
    return <textarea required={field.required} value={textValue} placeholder={fieldPlaceholder(field)} onPaste={field.name==="content"?event=>pasteStructuredBlogContent(event,textValue,onChange):undefined} onChange={event=>onChange(event.target.value)} rows={field.name==="content"?10:4}/>;
  }
  if(field.type==="select"){const selected=typeof value==="string"||typeof value==="number"?String(value):"";return <select required={field.required} value={selected} onChange={event=>onChange(event.target.value)}><option value="">Select…</option>{(field.choices||[]).map(choice=><option key={choice}>{choice}</option>)}{field.option&&options[field.option]?.map(option=><option value={option.id} key={option.id}>{option.name||option.title||option.label}</option>)}</select>}
  if(field.type==="multiselect")return <MultiSelectField field={field} value={value} options={options} onChange={onChange}/>;
  if(field.type==="image"||field.type==="images"){const images=Array.isArray(value)?value.filter(isImageValue):[];return <div className="upload-field">{field.type==="image"&&typeof value==="string"&&value&&<span className="single-image"><SafeImage src={value} alt="Preview" width={180} height={105}/><button type="button" onClick={()=>onChange("")} aria-label={`Remove ${field.label.toLowerCase()}`}>×</button></span>}{field.type==="images"&&images.map((image,index)=><span key={`${image.url}-${index}`}><SafeImage src={image.url} alt="Preview" width={180} height={105}/><input type="text" value={image.altText||""} placeholder="Descriptive alt text" aria-label={`Alt text for image ${index+1}`} onChange={event=>onChange(images.map((item,itemIndex)=>itemIndex===index?{...item,altText:event.target.value}:item))}/><button type="button" onClick={()=>onChange(images.filter((_,itemIndex)=>itemIndex!==index))} aria-label={`Remove image ${index+1}`}>×</button></span>)}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple={field.type==="images"} onChange={async event=>{const input=event.currentTarget;const files=Array.from(input.files||[]);for(const file of files)await onImage(file);input.value=""}}/><small>{uploading?"Uploading…":"JPEG, PNG, WebP or GIF · max 5MB"}</small></div>}
  const inputValue=field.type==="date"?dateInputValue(value):typeof value==="string"||typeof value==="number"?value:"";
  return <input type={field.type||"text"} required={field.required} value={inputValue} placeholder={fieldPlaceholder(field)} step={field.type==="number"?"any":undefined} onChange={event=>onChange(event.target.value)}/>
}
function SettingsForm({initial,busy,onSave}:{initial:Record<string,unknown>;busy:boolean;onSave:(value:Record<string,unknown>)=>void}){
  const [values,setValues]=useState<Record<string,unknown>>(initial);
  const fields:Field[]=[
    {name:"websiteName",label:"Website name",required:true},{name:"siteUrl",label:"Canonical site URL",type:"url"},{name:"logo",label:"Site logo path or URL"},{name:"favicon",label:"Favicon path or URL"},{name:"primaryColor",label:"Primary color"},{name:"accentColor",label:"Accent color"},{name:"supportEmail",label:"Support email",type:"email"},{name:"searchPlaceholder",label:"Search placeholder"},{name:"headerCtaLabel",label:"Header CTA label"},{name:"headerCtaUrl",label:"Header CTA path or URL"},
    {name:"announcementItems",label:"Announcement messages JSON",type:"json"},
    {name:"footerDescription",label:"Footer description",type:"textarea"},{name:"newsletterTitle",label:"Newsletter title"},{name:"newsletterText",label:"Newsletter text",type:"textarea"},{name:"defaultSeoTitle",label:"Default SEO title"},{name:"defaultSeoDescription",label:"Default SEO description",type:"textarea"},{name:"homepageSeoTitle",label:"Homepage SEO title"},{name:"homepageSeoDescription",label:"Homepage meta description",type:"textarea"},{name:"homepageCanonicalUrl",label:"Homepage canonical override",type:"url"},{name:"homepageOgTitle",label:"Homepage Open Graph title"},{name:"homepageOgDescription",label:"Homepage Open Graph description",type:"textarea"},{name:"homepageOgImage",label:"Homepage Open Graph image path or URL"},{name:"homepageRobotsIndex",label:"Index homepage",type:"checkbox"},{name:"homepageRobotsFollow",label:"Follow homepage links",type:"checkbox"},{name:"homepageSchemaEnabled",label:"Homepage structured data",type:"checkbox"},{name:"googleSiteVerification",label:"Google verification token"},{name:"bingSiteVerification",label:"Bing verification token"},{name:"affiliateDisclosure",label:"Affiliate disclosure",type:"textarea"},{name:"copyright",label:"Copyright"},{name:"socialMedia",label:"Social links JSON",type:"json"},{name:"analyticsIds",label:"Analytics IDs JSON (ga4 / gtm)",type:"json"}
  ];
  return <form className="settings-form" onSubmit={event=>{event.preventDefault();const out:Record<string,unknown>={};for(const field of fields){let value=values[field.name];if(field.type==="json"&&typeof value==="string")try{value=JSON.parse(value||"{}")}catch{return window.alert(`${field.label} must be valid JSON`)}if(value==null)value=field.type==="checkbox"?false:field.type==="json"?{}:"";out[field.name]=value}onSave(out)}}><div className="form-grid">{fields.map(field=><label key={field.name} className={field.type==="textarea"||field.type==="json"?"wide":""}>{field.type!=="checkbox"&&<span>{field.label}</span>}<FieldInput field={field} value={values[field.name]} options={{}} uploading={false} onImage={()=>{}} onChange={value=>setValues(current=>({...current,[field.name]:value}))}/></label>)}</div><button className="settings-save" type="submit" disabled={busy}>{busy?"Saving…":"Save settings"}</button></form>
}
function Toast({kind,text}:{kind:string;text:string}){return <div className={`toast ${kind}`} role="status" aria-live="polite">{text}</div>}
function displayName(record:AdminRecord){return record.title||record.name||record.label||record.product?.title||record.websiteName||record.type||"Untitled"}
function activeValue(record:AdminRecord,config:Config){return config.statusField==="status"?record.status==="ACTIVE":Boolean(record[config.statusField!])}
function Status({row,config}:{row:AdminRecord;config:Config}){return <i className={activeValue(row,config)?"status active":"status"}>{config.statusField==="status"?row.status:activeValue(row,config)?"ACTIVE":"INACTIVE"}</i>}
function dateInputValue(value:unknown){if(!value)return "";const match=String(value).match(/^\d{4}-\d{2}-\d{2}/);return match?.[0]||""}
function roleLabel(role?:AdminRole){return role==="OWNER"?"Site owner":role==="ADMIN"?"Administrator":"Content editor"}
function isImageValue(value:unknown):value is ImageValue{return Boolean(value&&typeof value==="object"&&"url" in value&&typeof (value as {url?:unknown}).url==="string")}
function relationIds(items:RelationId[]|undefined,key:keyof RelationId){return items?.map(item=>item[key]).filter((id):id is string=>typeof id==="string")||[]}
function normalize(row:AdminRecord,config:Config){const value:AdminRecord={...row};if(config.resource==="homepage-sections"){value.productIds=relationIds(row.products,"productId");value.categoryIds=relationIds(row.categories,"categoryId");value.storeIds=relationIds(row.stores,"storeId")}if(config.resource==="categories")value.featuredProductIds=relationIds(row.featuredProducts,"productId");if(config.resource==="blog"){value.productLinks=Array.isArray(row.productLinks)?row.productLinks.map(String):(row.productPlacements||[]).map(item=>item.product?.slug?`/product/${item.product.slug}`:null).filter((link):link is string=>Boolean(link));value.guideIds=relationIds(row.guidePlacements,"guideId");value.commerceCategoryIds=relationIds(row.commerceCategoryPlacements,"categoryId")}if(config.resource==="guides")value.productIds=relationIds(row.products,"productId");if(config.resource==="comparisons"){value.productIds=relationIds(row.products,"productId");value.storeIds=relationIds(row.stores,"storeId")}if(Array.isArray(value.tags))value.tags=value.tags.map(String).join(", ");for(const key of ["keyFeatures","pros","cons","bestUseCases","buyingTips","shoppingTips","expertise","profileUrls","productLinks"])if(Array.isArray(value[key]))value[key]=value[key].map(String).join("\n");return value}

function comparableProductUrl(raw:string){try{const url=new URL(raw,window.location.origin);return `${url.hostname.toLowerCase().replace(/^www\./,"")}${url.pathname.replace(/\/+$/,"")||"/"}`}catch{return raw.trim().replace(/\/+$/,"")}}
function isSafeProductLink(raw:string){try{const url=new URL(raw,window.location.origin);return (raw.startsWith("/")&&!raw.startsWith("//")&&!raw.includes("\\"))||["http:","https:"].includes(url.protocol)}catch{return false}}
function pasteStructuredBlogContent(event:ClipboardEvent<HTMLTextAreaElement>,current:string,onChange:(value:unknown)=>void){
  const html=event.clipboardData.getData("text/html");
  if(!html)return;
  const documentValue=new DOMParser().parseFromString(html,"text/html");
  const elements=Array.from(documentValue.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote"));
  const structured=elements.filter(element=>!element.parentElement?.closest("p,li,blockquote")).map(element=>{const text=(element.textContent||"").replace(/\s+/g," ").trim();if(!text)return "";if(/^H[1-6]$/.test(element.tagName))return `### ${text}`;if(element.tagName==="LI")return `- ${text}`;return text}).filter(Boolean).join("\n\n");
  if(!structured)return;
  event.preventDefault();
  const input=event.currentTarget;
  onChange(`${current.slice(0,input.selectionStart)}${structured}${current.slice(input.selectionEnd)}`);
}
function resolveProductLink(raw:string,products:Option[]){
  const value=raw.trim();
  const internalSlug=value.match(/(?:^|\/)product\/([^/?#]+)/i)?.[1];
  if(internalSlug){const decoded=decodeURIComponent(internalSlug).toLowerCase();return products.find(product=>product.slug?.toLowerCase()===decoded)}
  const target=comparableProductUrl(value);
  return products.find(product=>[product.affiliateUrl,...(product.affiliateLinks||[]).map(link=>link.url)].filter((url):url is string=>Boolean(url)).some(url=>comparableProductUrl(url)===target));
}
function icon(module:string){return ({Overview:"⌂","SEO Audit":"✓","Contact Messages":"✉",Subscribers:"@",Products:"◇",Categories:"▦",Stores:"▣",Brands:"◎",Deals:"%",Banners:"▤","Homepage Sections":"▥",Blog:"✎",Authors:"◉","Buying Guides":"▧",Comparisons:"⇄","Trust Pages":"§",Navigation:"☷",Footer:"▬","Affiliate Links":"↗","Users / Admins":"♙",Settings:"⚙"} as Record<string,string>)[module]||"◇"}
