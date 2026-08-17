import "dotenv/config";
import { PrismaClient, SectionType } from "@prisma/client";
const prisma=new PrismaClient();

const stores=[
  {name:"Northstar Market",slug:"northstar-market",color:"#ff5a0a",logo:"https://placehold.co/220x70/ffffff/071225?text=Northstar"},
  {name:"Everyday Goods",slug:"everyday-goods",color:"#1767ce",logo:"https://placehold.co/220x70/ffffff/1767ce?text=Everyday+Goods"},
  {name:"Home Foundry",slug:"home-foundry",color:"#cf3b30",logo:"https://placehold.co/220x70/ffffff/cf3b30?text=Home+Foundry"},
  {name:"Tech Harbor",slug:"tech-harbor",color:"#12a278",logo:"https://placehold.co/220x70/ffffff/12a278?text=Tech+Harbor"},
];
const categories=["Electronics","Home","Kitchen","Beauty","Fashion","Kids & Toys","Sports","Automotive"].map((name,i)=>({name,slug:name.toLowerCase().replace(/ & /g,"-").replace(/ /g,"-"),icon:["◉","▱","▣","✦","◇","★","◆","▰"][i],sortOrder:i}));
const productNames=["Wireless Noise-Canceling Headphones","Digital Air Fryer","Everyday Smart Watch","Cordless Stick Vacuum","Compact Robot Cleaner","Enameled Dutch Oven","Automatic Espresso Maker","Portable 4K Monitor"];
const createdStores=[];for(const store of stores)createdStores.push(await prisma.store.upsert({where:{slug:store.slug},update:store,create:store}));
const createdCategories=[];for(const category of categories)createdCategories.push(await prisma.category.upsert({where:{slug:category.slug},update:category,create:category}));
const createdProducts=[];for(let i=0;i<productNames.length;i++){const title=productNames[i];const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,"-");createdProducts.push(await prisma.product.upsert({where:{slug},update:{},create:{title,slug,shortDescription:"A well-reviewed everyday pick selected for value.",currentPrice:49.99+i*21,oldPrice:79.99+i*28,discountPercent:20+i,status:"ACTIVE",featured:true,rating:4.5,reviewCount:1210+i*933,affiliateUrl:"https://example.com/demo-affiliate-link",ctaLabel:"View Deal",categoryId:createdCategories[i%createdCategories.length].id,storeId:createdStores[i%createdStores.length].id,images:{create:{url:`https://images.unsplash.com/photo-${[1505740420928,1616348436168,1523275335684,1558317374,1581579185,1584285576,1495474472287,1527443224154][i]}?auto=format&fit=crop&w=600&q=80`,sortOrder:0}}}}))}

await prisma.siteSettings.upsert({where:{id:"global"},update:{},create:{id:"global",websiteName:"Bargain MOM",searchPlaceholder:"Search products, brands or categories...",headerCtaLabel:"Today’s Deals",headerCtaUrl:"/deals",footerDescription:"Your destination for worthwhile finds, thoughtful picks, and offers from trusted online stores.",newsletterTitle:"Get the good deals",newsletterText:"A short, useful roundup delivered to your inbox.",copyright:"© Bargain MOM. All rights reserved."}});
for(const [i,item] of [
  ["Home","/"],["Deals","/deals"],["Categories","/categories"],["Stores","/stores"],["Blog","/blog"],["About","/about"],
].entries())await prisma.navigationItem.upsert({where:{id:`demo-nav-${i}`},update:{label:item[0],url:item[1],sortOrder:i,active:true},create:{id:`demo-nav-${i}`,label:item[0],url:item[1],sortOrder:i,active:true}});

const sectionData:{id:string;type:SectionType;title?:string;subtitle?:string;sortOrder:number;config?:object;ctaText?:string;ctaUrl?:string;background?:string}[]=[
  {id:"demo-hero",type:"HERO",title:"Big Deals. Smart Shopping.",subtitle:"We search trusted online stores for worthwhile offers, so finding your next great buy feels effortless.",sortOrder:0,ctaText:"Search Deals",config:{eyebrow:"Handpicked offers, updated regularly",searchPlaceholder:"What are you looking for?",benefits:["Top-rated products","Best prices","Trusted stores","Secure redirects"]}},
  {id:"demo-stores",type:"STORE_LOGOS",title:"Deals from top stores",subtitle:"Shop trusted partners",sortOrder:1},
  {id:"demo-featured",type:"FEATURED_PRODUCTS",title:"Featured Deals",sortOrder:2,ctaText:"View all deals",ctaUrl:"/deals"},
  {id:"demo-categories",type:"CATEGORY_GRID",title:"Shop by Category",sortOrder:3,ctaText:"View all categories",ctaUrl:"/categories"},
  {id:"demo-top-store",type:"STORE_PRODUCTS",title:"Top Deals by Store",sortOrder:5,ctaText:"View all stores",ctaUrl:"/stores"},
  {id:"demo-trust",type:"TRUST_FEATURES",sortOrder:6,config:{items:[{icon:"◇",title:"Best Prices",description:"Worthwhile offers in one place"},{icon:"◆",title:"Trusted Stores",description:"Established retail partners"},{icon:"↗",title:"Secure Redirects",description:"Clear, protected outbound links"},{icon:"♥",title:"Curated Deals",description:"Thoughtfully selected finds"}]}},
  {id:"demo-blog",type:"BLOG",title:"Latest from the Blog",sortOrder:7,ctaText:"View all posts",ctaUrl:"/blog"},
];
for(const section of sectionData)await prisma.homepageSection.upsert({where:{id:section.id},update:section,create:section});
for(const [i,store] of createdStores.entries()){await prisma.homepageSectionStore.upsert({where:{sectionId_storeId:{sectionId:"demo-stores",storeId:store.id}},update:{sortOrder:i},create:{sectionId:"demo-stores",storeId:store.id,sortOrder:i}});await prisma.homepageSectionStore.upsert({where:{sectionId_storeId:{sectionId:"demo-top-store",storeId:store.id}},update:{sortOrder:i},create:{sectionId:"demo-top-store",storeId:store.id,sortOrder:i}})}
for(const [i,category] of createdCategories.entries())await prisma.homepageSectionCategory.upsert({where:{sectionId_categoryId:{sectionId:"demo-categories",categoryId:category.id}},update:{sortOrder:i},create:{sectionId:"demo-categories",categoryId:category.id,sortOrder:i}});
for(const [i,product] of createdProducts.entries()){for(const sectionId of ["demo-featured","demo-top-store"])await prisma.homepageSectionProduct.upsert({where:{sectionId_productId:{sectionId,productId:product.id}},update:{sortOrder:i},create:{sectionId,productId:product.id,sortOrder:i}})}

const blogCategory=await prisma.blogCategory.upsert({where:{slug:"shopping-guides"},update:{},create:{name:"Shopping Guides",slug:"shopping-guides"}});
for(let i=0;i<4;i++){const title=["How to Compare Deals Before You Buy","A Practical Guide to Smarter Online Shopping","Small Kitchen Upgrades Worth Considering","Seasonal Shopping Without the Stress"][i];const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,"-");await prisma.blogPost.upsert({where:{slug},update:{},create:{title,slug,excerpt:"Straightforward advice for making more confident buying decisions.",content:"Demo editorial content. Replace this article from the admin dashboard.",coverImage:`https://images.unsplash.com/photo-${[1556742049,1472851294608,1556911220,1507525428034][i]}?auto=format&fit=crop&w=900&q=80`,author:"Editorial Team",tags:["shopping"],status:"ACTIVE",publishedAt:new Date(Date.now()-i*86400000*3),readingTime:5+i,categoryId:blogCategory.id}})}

console.log("Optional demo storefront content created. Remove demo-* records or reset the database to clear it.");
await prisma.$disconnect();
